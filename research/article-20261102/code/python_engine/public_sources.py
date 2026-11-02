"""Consultas públicas acotadas para los territorios del gemelo."""
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import json
import math
import time

import requests

CENTERS = {
    "medellin-comuna13": (6.25, -75.62),
    "lima-sjl": (-11.96, -76.99),
    "cartagena-cienaga": (10.37, -75.48),
    "lapaz-cotahuma": (-16.52, -68.15),
}
SOURCES = {
    "usgs": "https://earthquake.usgs.gov/fdsnws/event/1/query",
    "nasa": "https://power.larc.nasa.gov/api/temporal/daily/point",
    "osm": "https://overpass-api.de/api/interpreter",
}


def _fetch(source, parameters):
    with requests.get(SOURCES[source], params=parameters, timeout=(5, 25),
                      headers={"Accept": "application/json", "User-Agent": "ResilienceResearch/2.0"},
                      stream=True, allow_redirects=False) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Respuesta externa inesperada")
        chunks = bytearray()
        for chunk in response.iter_content(16384):
            chunks.extend(chunk)
            if len(chunks) > 1_500_000:
                raise ValueError("Respuesta externa demasiado grande")
    result = json.loads(chunks)
    if not isinstance(result, dict):
        raise ValueError("Esquema externo inválido")
    return result


def _finite(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError("La fuente devolvió un número inválido")
    return float(value)


@lru_cache(maxsize=24)
def _snapshot(source, settlement, time_bucket):
    latitude, longitude = CENTERS[settlement]
    now = datetime.now(timezone.utc)
    if source == "usgs":
        params = dict(format="geojson", latitude=latitude, longitude=longitude, maxradiuskm=150,
                      starttime=(now - timedelta(days=3653)).date().isoformat(),
                      endtime=now.date().isoformat(), minmagnitude=3, limit=50, orderby="time")
        data = _fetch(source, params)
        records = []
        for event in data["features"]:
            properties, coords = event["properties"], event["geometry"]["coordinates"]
            if properties["mag"] is None:
                continue
            records.append({"event": str(event["id"])[:100], "magnitude": _finite(properties["mag"]),
                            "depth_km": _finite(coords[2]), "lat": _finite(coords[1]),
                            "lon": _finite(coords[0]), "time_ms": _finite(properties["time"])})
        license_label = "USGS · datos federales de EE. UU.; revisar condiciones de contribuyentes"
        limitation = "Hasta 50 eventos Mw ≥ 3, radio 150 km, últimos diez años. Muestra truncada: no estima frecuencia ni predice sismos."
    elif source == "nasa":
        end = now - timedelta(days=5)
        params = dict(parameters="PRECTOTCORR", community="AG", latitude=latitude, longitude=longitude,
                      start=(end - timedelta(days=29)).strftime("%Y%m%d"),
                      end=end.strftime("%Y%m%d"), format="JSON")
        data = _fetch(source, params)
        records = [{"date": date, "precipitation_mm_day": _finite(value)}
                   for date, value in data["properties"]["parameter"]["PRECTOTCORR"].items()
                   if value is not None and value != -999]
        license_label = "NASA POWER · datos abiertos; citar NASA POWER"
        limitation = "Producto meteorológico de grilla, no pluviómetro local. Ventana de 30 días con rezago de cinco; faltantes excluidos."
    else:
        bbox = f"{latitude-.02:.5f},{longitude-.02:.5f},{latitude+.02:.5f},{longitude+.02:.5f}"
        query = f'[out:json][timeout:15];way[building]({bbox});out count;'
        data = _fetch(source, {"data": query})
        records = [{"mapped_buildings": int(data["elements"][0]["tags"]["ways"])}]
        license_label = "© OpenStreetMap contributors · ODbL"
        limitation = "Edificios cartografiados en ventana aproximada; no identifica informalidad, ocupación ni calidad estructural."
    return {"source": SOURCES[source], "license": license_label, "retrieved_at": now.isoformat(),
            "settlement": settlement, "center": {"lat": latitude, "lon": longitude},
            "records": records, "limitations": limitation,
            "use": "Contexto observado. No se usa como etiqueta de resiliencia ni modifica automáticamente el modelo entrenado."}


def public_snapshot(source, settlement):
    if source not in SOURCES or settlement not in CENTERS:
        raise ValueError("Fuente o territorio desconocido")
    return _snapshot(source, settlement, int(time.time() // 1800))
