import unittest

import numpy as np
from python_engine.research_uncertainty import cluster_bootstrap_metrics, evaluation_scope
from python_engine.research_ml import statistical_tests
from python_engine.research_data import split_dataset, partition_manifest
from python_tests.test_research import sample_frame


class UncertaintyTests(unittest.TestCase):
    def test_constant_error_and_perfect_predictions_have_known_intervals(self):
        y = np.arange(12., dtype=float)
        groups = np.repeat(["a", "b", "c"], 4)
        result = cluster_bootstrap_metrics(y, y+2., groups, n_resamples=300)
        for metric in ["mae_ha", "rmse_ha"]:
            self.assertEqual(result["metrics"][metric]["lower"], 2.)
            self.assertEqual(result["metrics"][metric]["upper"], 2.)
        perfect = cluster_bootstrap_metrics(y, y, groups, n_resamples=300)
        self.assertEqual(perfect["metrics"]["r2"]["lower"], 1.)

    def test_cluster_bootstrap_matches_explicit_row_expansion(self):
        y, p = np.array([0., 2., 8., 9., 15.]), np.array([1., 1., 9., 10., 8.])
        groups = np.array(["a", "a", "b", "c", "c"])
        result = cluster_bootstrap_metrics(y, p, groups, seed=7, n_resamples=100)
        values = []
        for draw in np.random.default_rng(7).integers(0, 3, (100, 3)):
            indices = np.concatenate([np.flatnonzero(groups == label) for label in np.array(["a", "b", "c"])[draw]])
            values.append(np.mean(np.abs(y[indices]-p[indices])))
        np.testing.assert_allclose([result["metrics"]["mae_ha"]["lower"], result["metrics"]["mae_ha"]["upper"]], np.quantile(values, [.025, .975]))
        self.assertEqual(result, cluster_bootstrap_metrics(y, p, groups, seed=7, n_resamples=100))

    def test_undefined_r2_is_json_safe_and_counted(self):
        result = cluster_bootstrap_metrics([1., 1., 1.], [0., 0., 0.], ["a", "b", "b"], n_resamples=100)
        self.assertIsNone(result["metrics"]["r2"]["lower"])
        self.assertEqual(result["metrics"]["r2"]["valid_resamples"], 0)

    def test_rejects_unaligned_nonfinite_and_single_cell(self):
        for a, p, g in [([1., 2.], [1.], ["a", "b"]), ([1., np.nan], [1., 2.], ["a", "b"]),
                        ([1., 2.], [1., 2.], ["a", "a"])]:
            with self.assertRaises(ValueError):
                cluster_bootstrap_metrics(a, p, g)

    def test_manifest_is_exhaustive_and_rejects_leaked_cell(self):
        frame = sample_frame()
        development, test, groups = split_dataset(frame, 42)
        manifest = partition_manifest(frame, development, test, groups)
        self.assertEqual(sum(c["rows"] for c in manifest["cells"]), len(frame))
        self.assertIsNone(manifest["metric_cell_size"])
        leaked = groups.copy(); leaked.iloc[test[0]] = groups.iloc[development[0]]
        with self.assertRaises(ValueError):
            partition_manifest(frame, development, test, leaked)

    def test_scope_and_statistical_resolution_do_not_claim_validation(self):
        self.assertTrue(evaluation_scope({"r2": -.1})["worse_than_test_mean_squared_error"])
        self.assertFalse(evaluation_scope({"r2": .9})["operational_validation"])
        stats = statistical_tests({name: [1., 2., 3., 4., 5.] for name in ["a", "b", "c", "d"]})
        self.assertEqual(stats["inference_limits"]["minimum_two_sided_exact_wilcoxon_p_no_zeros"], .0625)
        self.assertFalse(stats["inference_limits"]["power_estimated"])
