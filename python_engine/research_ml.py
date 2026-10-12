"""CRISP-DM: selección anidada 5x5 y prueba espacial reservada."""
from __future__ import annotations

from itertools import combinations
import platform
from importlib.metadata import version

import numpy as np
import pandas as pd
from scipy.stats import friedmanchisquare, shapiro, wilcoxon
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .research_data import CATEGORICAL, FEATURES, NUMERIC, TARGET, five_folds, load_dataset, split_dataset


def candidates(seed: int):
    return {
        "Base mediana": (DummyRegressor(strategy="median"), {}),
        "Ridge": (Ridge(), {"model__alpha": [0.1, 1.0, 10.0]}),
        "Random Forest": (RandomForestRegressor(n_estimators=60, random_state=seed, n_jobs=1),
                          {"model__max_depth": [4, None], "model__min_samples_leaf": [2, 8]}),
        "Gradient Boosting": (GradientBoostingRegressor(n_estimators=60, random_state=seed, loss="absolute_error"),
                              {"model__learning_rate": [.03, .1], "model__max_depth": [1, 2]}),
    }


def make_search(estimator, grid, folds):
    numeric = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
    categorical = Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])
    preprocessing = ColumnTransformer([("numeric", numeric, NUMERIC), ("categorical", categorical, CATEGORICAL)])
    pipeline = Pipeline([("prepare", preprocessing), ("model", estimator)])
    return GridSearchCV(pipeline, grid, cv=folds, scoring="neg_mean_absolute_error",
                        n_jobs=1, error_score="raise", return_train_score=True)


def statistical_tests(fold_scores: dict) -> dict:
    names = list(fold_scores)
    arrays = [np.asarray(fold_scores[name]) for name in names]
    if all(np.array_equal(arrays[0], array) for array in arrays[1:]):
        statistic, pvalue = 0., 1.
    else:
        test = friedmanchisquare(*arrays)
        statistic, pvalue = float(test.statistic), float(test.pvalue)
    pairs = []
    for left, right in combinations(names, 2):
        difference = np.asarray(fold_scores[left]) - np.asarray(fold_scores[right])
        p = 1. if np.allclose(difference, 0) else float(wilcoxon(difference, method="auto").pvalue)
        pairs.append({"left": left, "right": right, "p_raw": p, "mean_mae_difference": float(difference.mean())})
    ordered = sorted(pairs, key=lambda item: item["p_raw"])
    previous = 0.
    for index, pair in enumerate(ordered):
        previous = max(previous, min(1., (len(ordered) - index) * pair["p_raw"]))
        pair["p_holm"] = previous
        pair["significant_at_005"] = previous < .05
    return {
        "friedman": {"statistic": statistic, "p_value": pvalue},
        "wilcoxon_holm": pairs,
        "interpretation": "Exploratorio: cinco folds comparten entrenamiento; los p-valores no prueban superioridad general. Holm corrige las seis comparaciones. No significancia no implica equivalencia.",
    }


def train_experiment(seed: int = 202609, progress=None):
    notify = progress or (lambda fraction, message: None)
    notify(.01, "Descargando y verificando dataset observado")
    frame, metadata = load_dataset()
    development, test, groups = split_dataset(frame, seed)
    X = frame.iloc[development][FEATURES].reset_index(drop=True)
    y = np.log1p(frame.iloc[development][TARGET].to_numpy())
    train_groups = groups.iloc[development].reset_index(drop=True)
    folds = five_folds(X, train_groups)
    rows, searches, scores = [], [], {}
    models = candidates(seed)
    for model_index, (name, (estimator, grid)) in enumerate(models.items()):
        scores[name] = []
        for fold_index, (fit, validation) in enumerate(folds):
            notify(.05 + .8 * (model_index * 5 + fold_index) / 20,
                   f"{name}: fold externo {fold_index + 1}/5 · ajuste interno 5 folds")
            inner = five_folds(X.iloc[fit], train_groups.iloc[fit])
            search = make_search(estimator, grid, inner)
            search.fit(X.iloc[fit], y[fit])
            prediction = search.predict(X.iloc[validation])
            mae = float(mean_absolute_error(y[validation], prediction))
            scores[name].append(mae)
            rows.append({"model": name, "fold": fold_index + 1, "mae_log": mae,
                         "train_rows": len(fit), "validation_rows": len(validation),
                         "best_params": search.best_params_})
            searches.extend({"model": name, "outer_fold": fold_index + 1, "params": params,
                             "mean_inner_mae_log": float(-score), "std_inner_mae_log": float(std)}
                            for params, score, std in zip(search.cv_results_["params"],
                                                          search.cv_results_["mean_test_score"],
                                                          search.cv_results_["std_test_score"]))
    ranking = sorted([{"model": name, "mean_mae_log": float(np.mean(values)),
                       "std_mae_log": float(np.std(values, ddof=1))}
                      for name, values in scores.items()], key=lambda row: row["mean_mae_log"])
    winner = ranking[0]["model"]
    notify(.88, f"Reajustando {winner} sobre desarrollo y evaluando prueba reservada")
    estimator, grid = models[winner]
    final_search = make_search(estimator, grid, folds).fit(X, y)
    X_test = frame.iloc[test][FEATURES]
    observed = frame.iloc[test][TARGET].to_numpy()
    predicted_log = final_search.predict(X_test)
    predicted = np.maximum(0., np.expm1(predicted_log))
    residuals = np.log1p(observed) - predicted_log
    normality = shapiro(residuals)
    report = {
        "seed": seed, "metadata": metadata,
        "protocol": {"outer_folds": 5, "inner_folds": 5, "grouping": "Celda espacial X/Y",
                     "selection_metric": "MAE de log1p(area); menor es mejor",
                     "development_rows": len(development), "test_rows": len(test),
                     "test_used_for_selection": False,
                     "preprocessing": "Imputación, escalado y one-hot dentro de cada fold"},
        "ranking": ranking, "fold_results": rows, "hyperparameter_search": searches,
        "winner": winner, "best_params": final_search.best_params_,
        "test_metrics": {"mae_log": float(mean_absolute_error(np.log1p(observed), predicted_log)),
                         "mae_ha": float(mean_absolute_error(observed, predicted)),
                         "rmse_ha": float(np.sqrt(mean_squared_error(observed, predicted))),
                         "r2": float(r2_score(observed, predicted))},
        "statistics": statistical_tests(scores),
        "residual_shapiro": {"statistic": float(normality.statistic), "p_value": float(normality.pvalue),
                             "interpretation": "Diagnóstico de normalidad de residuos log; no mide calidad predictiva."},
        "test_predictions": [{"row": int(row), "observed_ha": float(actual), "predicted_ha": float(pred)}
                             for row, actual, pred in zip(test, observed, predicted)],
        "versions": {name: version(name) for name in ["scikit-learn", "scipy", "pandas", "numpy"]},
        "python_version": platform.python_version(),
        "limitations": [
            metadata["limitation"],
            "El mejor modelo es el de menor MAE externo de esta ejecución, no un ganador universal.",
            "La dependencia entre folds y el tamaño muestral limitan la inferencia estadística.",
            "División espacial: no es una validación prospectiva temporal.",
            "La transformación logarítmica prioriza errores relativos; no minimiza necesariamente RMSE en hectáreas.",
            "Las estimaciones del gemelo poblacional siguen siendo sintéticas y no se calibran automáticamente con incendios.",
        ],
    }
    notify(1., "Experimento completado")
    return report, final_search.best_estimator_
