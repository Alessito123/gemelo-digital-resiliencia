"""Conditional uncertainty for a fixed predictor and held-out spatial cells."""
from __future__ import annotations

import numpy as np


def cluster_bootstrap_metrics(observed, predicted, groups, *, seed=202609,
                              n_resamples=10000, confidence_level=.95):
    """Percentile intervals resampling cells, retaining all rows of each draw.

    Does not refit or reselect models. With few cells these intervals are an
    exploratory sensitivity analysis, not evidence of operational validity.
    """
    actual = np.asarray(observed, dtype=float)
    forecast = np.asarray(predicted, dtype=float)
    labels = np.asarray(groups, dtype=str)
    if (actual.ndim != 1 or forecast.shape != actual.shape or labels.shape != actual.shape
            or len(actual) < 2 or not np.isfinite(actual).all()
            or not np.isfinite(forecast).all()):
        raise ValueError("Expected aligned finite one-dimensional observations, predictions and cells")
    if (isinstance(n_resamples, bool) or not isinstance(n_resamples, (int, np.integer))
            or not 100 <= n_resamples <= 100000 or not 0 < confidence_level < 1):
        raise ValueError("Use 100–100000 resamples and a confidence level between zero and one")
    unique = np.unique(labels)
    if len(unique) < 2:
        raise ValueError("At least two held-out spatial cells are required")
    # Sufficient statistics preserve repeated cells and unequal cell sizes.
    totals = []
    for label in unique:
        y, p = actual[labels == label], forecast[labels == label]
        totals.append([len(y), np.abs(y-p).sum(), ((y-p)**2).sum(), y.sum(), (y*y).sum()])
    totals = np.asarray(totals, dtype=float)
    draws = np.random.default_rng(seed).integers(0, len(unique), (n_resamples, len(unique)))
    n, absolute, squared, sum_y, sum_y2 = totals[draws].sum(axis=1).T
    variance_total = np.maximum(0., sum_y2 - sum_y**2/n)
    r2 = np.full(n_resamples, np.nan)
    valid = variance_total > np.finfo(float).eps * np.maximum(1., sum_y2)
    r2[valid] = 1. - squared[valid]/variance_total[valid]
    samples = {"mae_ha": absolute/n, "rmse_ha": np.sqrt(squared/n), "r2": r2}
    point_sst = ((actual-actual.mean())**2).sum()
    points = {"mae_ha": np.abs(actual-forecast).mean(),
              "rmse_ha": np.sqrt(((actual-forecast)**2).mean()),
              "r2": 1.-((actual-forecast)**2).sum()/point_sst if point_sst > 0 else None}
    tail = (1.-confidence_level)/2
    intervals = {}
    for name, values in samples.items():
        finite = values[np.isfinite(values)]
        bounds = np.quantile(finite, [tail, 1.-tail]) if len(finite) else [None, None]
        intervals[name] = {"estimate": float(points[name]) if points[name] is not None else None,
                           "lower": float(bounds[0]) if bounds[0] is not None else None,
                           "upper": float(bounds[1]) if bounds[1] is not None else None,
                           "valid_resamples": int(len(finite))}
    return {"method": "spatial_cell_percentile_bootstrap", "confidence_level": confidence_level,
            "n_resamples": int(n_resamples), "seed": int(seed), "n_rows": len(actual),
            "n_groups": len(unique), "metrics": intervals,
            "limitations": ["Conditional on fixed held-out predictions; no model refitting or selection uncertainty.",
                            "Few spatial cells: exploratory intervals; nominal coverage is not guaranteed.",
                            "R2 resamples with zero outcome variance are excluded and counted."]}


def evaluation_scope(test_metrics):
    negative = test_metrics["r2"] < 0
    return {"scope": "historical_burned_area_module_only", "scene_3d_evaluated": False,
            "operational_validation": False, "worse_than_test_mean_squared_error": bool(negative),
            "message": ("El R² negativo indica mayor error cuadrático que predecir la media de prueba. "
                        "No se acredita uso operacional ni validación del gemelo 3D." if negative else
                        "El desempeño en este dataset no acredita uso operacional ni validación del gemelo 3D.")}
