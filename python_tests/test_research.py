import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from sklearn.dummy import DummyRegressor

from python_api import app
from python_engine.research_data import FEATURES, five_folds, split_dataset, validate_frame
from python_engine.research_ml import make_search, statistical_tests


def sample_frame():
    rows = []
    for index in range(120):
        row = dict(X=index % 9 + 1, Y=(index // 9) % 9 + 1, month="aug", day="mon",
                   FFMC=80., DMC=40., DC=100., ISI=4., temp=25., RH=40., wind=4., rain=0.,
                   area=float(index % 13))
        rows.append(row)
    return pd.DataFrame(rows)


class ResearchTests(unittest.TestCase):
    def test_spatial_holdout_and_nested_folds_do_not_overlap(self):
        frame = sample_frame()
        development, test, groups = split_dataset(frame, 42)
        self.assertFalse(set(groups.iloc[development]) & set(groups.iloc[test]))
        X = frame.iloc[development][FEATURES].reset_index(drop=True)
        g = groups.iloc[development].reset_index(drop=True)
        outer = five_folds(X, g)
        self.assertEqual(len(outer), 5)
        validation_rows = []
        for fit, validation in outer:
            self.assertFalse(set(g.iloc[fit]) & set(g.iloc[validation]))
            validation_rows.extend(validation)
            inner = five_folds(X.iloc[fit], g.iloc[fit])
            self.assertEqual(len(inner), 5)
            for a, b in inner:
                local = g.iloc[fit]
                self.assertFalse(set(local.iloc[a]) & set(local.iloc[b]))
        self.assertEqual(sorted(validation_rows), list(range(len(X))))

    def test_preprocessing_and_search_fit_only_training_data(self):
        frame = sample_frame()
        groups = frame.X.astype(str) + "_" + frame.Y.astype(str)
        search = make_search(DummyRegressor(strategy="median"), {}, five_folds(frame[FEATURES], groups))
        search.fit(frame[FEATURES], np.log1p(frame.area))
        self.assertEqual(search.n_splits_, 5)
        prediction = search.predict(frame[FEATURES].head(2))
        self.assertEqual(len(prediction), 2)
        self.assertTrue(np.isfinite(prediction).all())

    def test_dataset_rejects_nonfinite_and_wrong_schema(self):
        frame = sample_frame()
        validate_frame(frame)
        frame.loc[0, "temp"] = np.inf
        with self.assertRaises(ValueError):
            validate_frame(frame)
        with self.assertRaises(ValueError):
            validate_frame(frame.drop(columns="area"))

    def test_equal_models_are_not_reported_significant(self):
        stats = statistical_tests({name: [1., 2., 3., 4., 5.] for name in ["a", "b", "c", "d"]})
        self.assertEqual(stats["friedman"]["p_value"], 1.)
        self.assertEqual(len(stats["wilcoxon_holm"]), 6)
        self.assertTrue(all(not pair["significant_at_005"] for pair in stats["wilcoxon_holm"]))

    def test_api_contracts_errors_and_simulation(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").status_code, 200)
            self.assertEqual(client.post("/api/ml/runs", json={"seed": -1}).status_code, 422)
            self.assertEqual(client.get("/api/ml/runs/unknown").status_code, 404)
            result = client.post("/api/simulation/runs", json={
                "config": {"settlement_id": "lima-sjl", "scenario_id": "earthquake", "seed": 42}
            })
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["engine_version"], "python-langgraph-1")
            with patch("python_api.explore_dataset", side_effect=ValueError("bad source")):
                self.assertEqual(client.get("/api/ml/dataset").status_code, 503)


if __name__ == "__main__":
    unittest.main()
