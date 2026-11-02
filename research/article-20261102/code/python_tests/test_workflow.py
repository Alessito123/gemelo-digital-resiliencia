import unittest

from pydantic import ValidationError

from python_engine.models import (
    EvidenceDataset,
    Observation,
    SimulationConfig,
    WorkflowInput,
)
from python_engine.workflow import run_workflow


class LangGraphWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = SimulationConfig(
            settlement_id="medellin-comuna13",
            scenario_id="landslide",
            seed=202609,
            hazard_intensity=8,
            warning_lead_time_min=60,
            steps=20,
        )

    def test_complete_workflow_is_deterministic_and_traceable(self) -> None:
        first = run_workflow(WorkflowInput(config=self.config))
        second = run_workflow(WorkflowInput(config=self.config))

        self.assertEqual(first, second)
        self.assertEqual(first.engine_version, "python-langgraph-1")
        self.assertTrue(first.execution_id.startswith("py-run-"))
        self.assertEqual(first.validation.status, "illustrative")
        self.assertIsNotNone(first.protocol)
        self.assertEqual(
            [entry.node for entry in first.trace],
            [
                "resolve-context",
                "simulate",
                "mark-illustrative",
                "analyze",
                "build-protocol",
                "finalize",
            ],
        )

    def test_observed_evidence_uses_validation_branch(self) -> None:
        dataset = EvidenceDataset(
            title="Registro municipal",
            source="Defensa Civil",
            observed_at="2025-04-02",
            license="CC-BY-4.0",
            evidence_level="observed",
            observations=(
                Observation(time_min=180, evacuation_rate_pct=82, structural_damage_pct=55),
            ),
        )
        result = run_workflow(WorkflowInput(config=self.config, dataset=dataset))

        self.assertEqual(result.validation.status, "validated-against-observation")
        self.assertGreater(result.validation.compared_metrics, 0)
        self.assertIn("validate-evidence", [entry.node for entry in result.trace])

    def test_protocol_can_be_skipped(self) -> None:
        result = run_workflow(WorkflowInput(config=self.config, include_protocol=False))

        self.assertIsNone(result.protocol)
        self.assertIn("skip-protocol", [entry.node for entry in result.trace])

    def test_observation_requires_at_least_one_measured_metric(self) -> None:
        with self.assertRaises(ValidationError):
            Observation(time_min=180)


if __name__ == "__main__":
    unittest.main()
