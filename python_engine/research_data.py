"""Dataset observado con procedencia y separación espacial reproducible."""
from __future__ import annotations

import hashlib
import io
from functools import lru_cache

import numpy as np
import pandas as pd
import requests
from sklearn.model_selection import GroupKFold, GroupShuffleSplit

SOURCE = "https://archive.ics.uci.edu/static/public/162/data.csv"
NUMERIC = ["X", "Y", "FFMC", "DMC", "DC", "ISI", "temp", "RH", "wind", "rain"]
CATEGORICAL = ["month", "day"]
FEATURES = NUMERIC + CATEGORICAL
TARGET = "area"


def validate_frame(frame: pd.DataFrame) -> pd.DataFrame:
    if set(frame.columns) != set(FEATURES + [TARGET]) or not 100 <= len(frame) <= 5000:
        raise ValueError("Esquema o tamaño del dataset UCI inesperado")
    clean = frame[FEATURES + [TARGET]].copy()
    for column in NUMERIC + [TARGET]:
        clean[column] = pd.to_numeric(clean[column], errors="raise")
        if not np.isfinite(clean[column]).all():
            raise ValueError("El dataset contiene valores no finitos")
    if (clean[TARGET] < 0).any():
        raise ValueError("El área quemada no puede ser negativa")
    if not clean.month.isin("jan feb mar apr may jun jul aug sep oct nov dec".split()).all():
        raise ValueError("Categoría de mes desconocida")
    if not clean.day.isin("mon tue wed thu fri sat sun".split()).all():
        raise ValueError("Categoría de día desconocida")
    return clean


@lru_cache(maxsize=1)
def load_dataset() -> tuple[pd.DataFrame, dict]:
    with requests.get(SOURCE, timeout=(5, 30), stream=True, allow_redirects=False) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Respuesta UCI inesperada")
        payload = bytearray()
        for chunk in response.iter_content(16384):
            payload.extend(chunk)
            if len(payload) > 1_000_000:
                raise ValueError("El dataset supera 1 MB")
    raw = bytes(payload)
    frame = validate_frame(pd.read_csv(io.BytesIO(raw)))
    metadata = {
        "name": "UCI Forest Fires", "doi": "10.24432/C5D88D",
        "source": SOURCE, "license": "CC BY 4.0",
        "citation": "Cortez, P. & Morais, A. (2007). Forest Fires. UCI.",
        "evidence": "observed", "sha256": hashlib.sha256(raw).hexdigest(),
        "raw_rows": len(frame), "duplicates_removed": int(frame.duplicated().sum()),
        "target": "Área quemada (ha); entrenamiento y selección sobre log1p(area)",
        "limitation": "Incendios en Portugal: no representa hogares ni valida resiliencia de asentamientos informales.",
    }
    return frame.drop_duplicates().reset_index(drop=True), metadata


def split_dataset(frame: pd.DataFrame, seed: int):
    groups = frame.X.astype(str) + "_" + frame.Y.astype(str)
    development, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=seed).split(frame, groups=groups))
    return development, test, groups


def five_folds(features: pd.DataFrame, groups):
    if len(set(groups)) < 5:
        raise ValueError("Se necesitan al menos cinco grupos espaciales")
    return list(GroupKFold(n_splits=5).split(features, groups=groups))


def explore_dataset(seed: int = 202609) -> dict:
    frame, metadata = load_dataset()
    development, test, groups = split_dataset(frame, seed)
    train = frame.iloc[development]
    correlations = train[NUMERIC + [TARGET]].corr().fillna(0)
    return {
        "metadata": metadata, "rows": len(frame), "development_rows": len(train),
        "test_rows": len(test), "development_groups": int(groups.iloc[development].nunique()),
        "test_groups": int(groups.iloc[test].nunique()), "seed": seed,
        "eda_scope": "Solo desarrollo; prueba reservada sin explorar",
        "missing": train.isna().sum().to_dict(),
        "summary": train.describe().round(4).to_dict(),
        "correlations": correlations.round(4).to_dict(),
        "preview": train.head(30).to_dict(orient="records"),
        "target_values": train[TARGET].tolist(),
        "numeric_ranges": {c: {"min": float(train[c].min()), "max": float(train[c].max()), "median": float(train[c].median())} for c in NUMERIC},
    }
