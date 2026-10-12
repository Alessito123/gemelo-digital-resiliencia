import unittest

from pydantic import ValidationError

from python_engine.models import SimulationConfig
from python_engine.simulation import run_simulation


class SimulationEngineTests(unittest.TestCase):
    def test_same_seed_and_configuration_are_reproducible(self) -> None:
        config = SimulationConfig(
            settlement_id="medellin-comuna13",
            scenario_id="landslide",
            seed=202609,
            hazard_intensity=8.0,
            warning_lead_time_min=60,
            enable_mutual_aid=True,
            enable_multi_scale_feedback=True,
            steps=20,
        )

        first = run_simulation(config)
        second = run_simulation(config)

        self.assertEqual(first, second)
        self.assertEqual(first.metrics.total_households, 48)
        self.assertGreater(first.metrics.evacuation_rate_pct, 0)
        self.assertEqual(len(first.history), 21)
        self.assertGreaterEqual(len(first.fragility_points), 2)

    def test_configuration_rejects_unbounded_values(self) -> None:
        with self.assertRaises(ValidationError):
            SimulationConfig(
                settlement_id="medellin-comuna13",
                scenario_id="landslide",
                seed=0,
                hazard_intensity=12,
                warning_lead_time_min=2000,
                steps=500,
            )

    def test_mutual_aid_changes_the_outcome(self) -> None:
        shared = dict(
            settlement_id="lima-sjl",
            scenario_id="earthquake",
            seed=42,
            hazard_intensity=8.5,
            warning_lead_time_min=25,
            enable_multi_scale_feedback=True,
            steps=18,
        )

        enabled = run_simulation(SimulationConfig(**shared, enable_mutual_aid=True))
        disabled = run_simulation(SimulationConfig(**shared, enable_mutual_aid=False))

        self.assertNotEqual(enabled.metrics, disabled.metrics)
        self.assertGreaterEqual(
            enabled.metrics.evacuation_rate_pct,
            disabled.metrics.evacuation_rate_pct,
        )


if __name__ == "__main__":
    unittest.main()
