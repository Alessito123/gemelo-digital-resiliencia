"""Extend a saved experiment from its real source file without retraining."""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
from importlib.metadata import version
from pathlib import Path

import numpy as np
import pandas as pd

from python_engine.research_data import validate_frame, split_dataset, partition_manifest
from python_engine.research_ml import statistical_tests
from python_engine.research_uncertainty import cluster_bootstrap_metrics, evaluation_scope


def audit_report(dataset, report_path, output):
    raw = dataset.read_bytes()
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if hashlib.sha256(raw).hexdigest() != report["metadata"]["sha256"]:
        raise ValueError("Dataset hash differs from the original training artifact")
    frame = validate_frame(pd.read_csv(dataset)).drop_duplicates().reset_index(drop=True)
    development, test, groups = split_dataset(frame, report["seed"])
    predictions = report["test_predictions"]
    rows = [p["row"] for p in predictions]
    if len(rows) != len(set(rows)) or set(rows) != set(map(int, test)):
        raise ValueError("Saved predictions do not match the reproduced held-out partition")
    actual = np.array([p["observed_ha"] for p in predictions])
    np.testing.assert_allclose(actual, frame.iloc[rows].area, rtol=0, atol=1e-12)
    forecast = np.array([p["predicted_ha"] for p in predictions])
    uncertainty = cluster_bootstrap_metrics(actual, forecast, groups.iloc[rows], seed=report["seed"])
    for metric, interval in uncertainty["metrics"].items():
        np.testing.assert_allclose(interval["estimate"], report["test_metrics"][metric], rtol=0, atol=1e-10)
    fold_scores = {}
    for row in report["fold_results"]:
        fold_scores.setdefault(row["model"], []).append(row["mae_log"])
    stats = statistical_tests(fold_scores)
    np.testing.assert_allclose(stats["friedman"]["p_value"], report["statistics"]["friedman"]["p_value"])
    report["statistics"] = stats
    report["partition_manifest"] = partition_manifest(frame, development, test, groups)
    report["test_uncertainty"] = uncertainty
    report["evaluation_scope"] = evaluation_scope(report["test_metrics"])
    for p in predictions:
        row = p["row"]
        p.update(X=int(frame.iloc[row].X), Y=int(frame.iloc[row].Y), group=str(groups.iloc[row]))
    report["revision_audit"] = {"method": "saved_predictions_no_retraining", "schema_version": 2,
        "source_report_sha256": hashlib.sha256(report_path.read_bytes()).hexdigest(),
        "python_version": platform.python_version(),
        "versions": {name: version(name) for name in ["numpy", "pandas", "scikit-learn", "scipy"]}}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    result = audit_report(args.dataset, args.report, args.out)
    print(json.dumps(result["test_uncertainty"], ensure_ascii=False, indent=2))
