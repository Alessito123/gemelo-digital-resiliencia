"""Contratos validados del motor Python."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


ScenarioId = Literal["base", "flood", "earthquake", "landslide", "compound"]
EvidenceLevel = Literal["observed", "calibrated", "synthetic"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class SimulationConfig(StrictModel):
    settlement_id: str = Field(min_length=1, max_length=100)
    scenario_id: ScenarioId
    seed: int = Field(default=202609, ge=1, le=2_147_483_647)
    hazard_intensity: float = Field(default=8.0, ge=1.0, le=10.0)
    warning_lead_time_min: float = Field(default=60.0, ge=0.0, le=1_440.0)
    enable_mutual_aid: bool = True
    enable_multi_scale_feedback: bool = True
    steps: int = Field(default=20, ge=1, le=60)


class SimulationMetrics(StrictModel):
    total_households: int
    affected_people: int
    displaced_people: int
    safe_households: int
    trapped_households: int
    injured_households: int
    evacuation_rate_pct: float
    avg_evacuation_time_min: float
    structural_damage_pct: float
    resilience_index: float
    institutional_response_pct: float
    shelter_occupancy_pct: float
    economic_loss_usd: float
    recovery_time_hours: float
    alert_coverage_pct: float
    mutual_aid_interactions: int
    active_bottlenecks: int
    uncertainty_pct: float


class HistoryPoint(StrictModel):
    step: int
    time_min: float
    evacuation_rate_pct: float
    resilience_index: float
    safe_households: int
    trapped_households: int
    institutional_response_pct: float
    household_states: tuple[Literal["exposed", "safe", "trapped", "injured"], ...] = ()


class FragilityPoint(StrictModel):
    title: str
    category: Literal["mobility", "warning", "morphology", "institutional"]
    risk_score: int = Field(ge=1, le=100)
    affected_households: int = Field(ge=0)
    mechanism: str
    mitigation: str


class SimulationResult(StrictModel):
    settlement_id: str
    settlement_name: str
    city: str
    country: str
    scenario_id: ScenarioId
    scenario_name: str
    config: SimulationConfig
    metrics: SimulationMetrics
    history: tuple[HistoryPoint, ...]
    fragility_points: tuple[FragilityPoint, ...]


class Observation(StrictModel):
    time_min: float = Field(ge=0, le=100_000)
    evacuation_rate_pct: float | None = Field(default=None, ge=0, le=100)
    structural_damage_pct: float | None = Field(default=None, ge=0, le=100)
    affected_people: float | None = Field(default=None, ge=0, le=100_000_000)

    @model_validator(mode="after")
    def require_measurement(self):
        if all(value is None for value in (self.evacuation_rate_pct, self.structural_damage_pct, self.affected_people)):
            raise ValueError("La observación necesita al menos una métrica medida")
        return self

    @field_validator("affected_people")
    @classmethod
    def affected_people_must_be_finite(cls, value: float | None) -> float | None:
        if value is not None and value != value:
            raise ValueError("affected_people debe ser finito")
        return value


class EvidenceDataset(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    source: str = Field(min_length=1, max_length=200)
    observed_at: str = Field(min_length=1, max_length=100)
    license: str = Field(min_length=1, max_length=100)
    evidence_level: EvidenceLevel
    observations: tuple[Observation, ...] = Field(min_length=1, max_length=5_000)


class WorkflowInput(StrictModel):
    config: SimulationConfig
    dataset: EvidenceDataset | None = None
    include_protocol: bool = True


class ValidationReport(StrictModel):
    status: Literal["illustrative", "validated-against-observation"]
    compared_metrics: int
    mean_absolute_error: float
    normalized_fit_score: float
    source_label: str
    limitations: tuple[str, ...]


class AnalysisResult(StrictModel):
    executive_summary: str
    critical_risks: tuple[str, ...]
    immediate_actions: tuple[str, ...]
    institutional_coordination: str
    theoretical_alignment: str


class ProtocolLevel(StrictModel):
    level: Literal["VERDE", "AMARILLO", "NARANJA", "ROJA"]
    threshold: str
    action: str


class ProtocolResult(StrictModel):
    title: str
    lead_time: str
    levels: tuple[ProtocolLevel, ...]
    checklist: tuple[str, ...]


class TraceEntry(StrictModel):
    sequence: int
    node: str
    status: Literal["completed", "skipped"] = "completed"
    summary: str


class WorkflowResult(StrictModel):
    execution_id: str
    engine_version: Literal["python-langgraph-1"] = "python-langgraph-1"
    simulation: SimulationResult
    validation: ValidationReport
    analysis: AnalysisResult
    protocol: ProtocolResult | None
    trace: tuple[TraceEntry, ...]
    limitations: tuple[str, ...]
