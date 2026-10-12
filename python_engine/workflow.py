"""Workflow LangGraph del motor Python."""

from __future__ import annotations

import hashlib
import json
from typing import NotRequired, TypedDict

from langgraph.graph import END, START, StateGraph

from .advisor import build_analysis, build_protocol
from .models import (
    AnalysisResult,
    ProtocolResult,
    SimulationResult,
    TraceEntry,
    ValidationReport,
    WorkflowInput,
    WorkflowResult,
)
from .presets import get_scenario, get_settlement
from .simulation import run_simulation


class WorkflowState(TypedDict):
    input: WorkflowInput
    trace: list[TraceEntry]
    simulation: NotRequired[SimulationResult]
    validation: NotRequired[ValidationReport]
    analysis: NotRequired[AnalysisResult]
    protocol: NotRequired[ProtocolResult | None]


def _trace(state: WorkflowState, node: str, summary: str, status: str = "completed") -> list[TraceEntry]:
    return [*state["trace"], TraceEntry(
        sequence=len(state["trace"]) + 1,
        node=node,
        status=status,
        summary=summary,
    )]


def _resolve_context(state: WorkflowState) -> dict:
    settlement = get_settlement(state["input"].config.settlement_id)
    scenario = get_scenario(state["input"].config.scenario_id)
    return {"trace": _trace(state, "resolve-context", f"{settlement.name} · {scenario.name}")}


def _simulate(state: WorkflowState) -> dict:
    simulation = run_simulation(state["input"].config)
    return {
        "simulation": simulation,
        "trace": _trace(
            state,
            "simulate",
            f"{simulation.config.steps} pasos · R(t) {simulation.metrics.resilience_index:.1f}/100",
        ),
    }


def _route_evidence(state: WorkflowState) -> str:
    dataset = state["input"].dataset
    return "validate-evidence" if dataset and dataset.evidence_level == "observed" else "mark-illustrative"


def _validate_evidence(state: WorkflowState) -> dict:
    dataset = state["input"].dataset
    simulation = state["simulation"]
    if dataset is None:
        raise RuntimeError("DATASET_REQUIRED")
    observation = dataset.observations[-1]
    errors: list[float] = []
    if observation.evacuation_rate_pct is not None:
        errors.append(abs(simulation.metrics.evacuation_rate_pct - observation.evacuation_rate_pct))
    if observation.structural_damage_pct is not None:
        errors.append(abs(simulation.metrics.structural_damage_pct - observation.structural_damage_pct))
    if observation.affected_people is not None:
        denominator = max(1.0, observation.affected_people)
        errors.append(min(100.0, abs(simulation.metrics.affected_people - observation.affected_people) / denominator * 100))
    mae = sum(errors) / len(errors) if errors else 0.0
    report = ValidationReport(
        status="validated-against-observation",
        compared_metrics=len(errors),
        mean_absolute_error=round(mae, 2),
        normalized_fit_score=round(max(0.0, 100.0 - mae), 2),
        source_label=f"{dataset.source} · {dataset.title}",
        limitations=(
            "La comparación técnica no sustituye validación externa ni revisión participativa.",
        ),
    )
    return {
        "validation": report,
        "trace": _trace(state, "validate-evidence", f"{len(errors)} métricas · ajuste {report.normalized_fit_score:.1f}/100"),
    }


def _mark_illustrative(state: WorkflowState) -> dict:
    dataset = state["input"].dataset
    source = dataset.source if dataset else "Sin dataset observado"
    report = ValidationReport(
        status="illustrative",
        compared_metrics=0,
        mean_absolute_error=0.0,
        normalized_fit_score=0.0,
        source_label=source,
        limitations=(
            "La ejecución no se comparó con observaciones reales compatibles.",
            "Los resultados son estimaciones de planificación, no una alerta oficial.",
        ),
    )
    return {
        "validation": report,
        "trace": _trace(state, "mark-illustrative", "Sin evidencia observada compatible"),
    }


def _analyze(state: WorkflowState) -> dict:
    analysis = build_analysis(state["simulation"], state["validation"])
    return {
        "analysis": analysis,
        "trace": _trace(state, "analyze", "Diagnóstico heurístico local"),
    }


def _route_protocol(state: WorkflowState) -> str:
    return "build-protocol" if state["input"].include_protocol else "skip-protocol"


def _build_protocol(state: WorkflowState) -> dict:
    return {
        "protocol": build_protocol(state["simulation"]),
        "trace": _trace(state, "build-protocol", "Protocolo local de cuatro niveles"),
    }


def _skip_protocol(state: WorkflowState) -> dict:
    return {
        "protocol": None,
        "trace": _trace(state, "skip-protocol", "Omitido por configuración", "skipped"),
    }


def _finalize(state: WorkflowState) -> dict:
    return {"trace": _trace(state, "finalize", "Resultado consolidado y trazable")}


def _build_graph():
    builder = StateGraph(WorkflowState)
    builder.add_node("resolve-context", _resolve_context)
    builder.add_node("simulate", _simulate)
    builder.add_node("validate-evidence", _validate_evidence)
    builder.add_node("mark-illustrative", _mark_illustrative)
    builder.add_node("analyze", _analyze)
    builder.add_node("build-protocol", _build_protocol)
    builder.add_node("skip-protocol", _skip_protocol)
    builder.add_node("finalize", _finalize)
    builder.add_edge(START, "resolve-context")
    builder.add_edge("resolve-context", "simulate")
    builder.add_conditional_edges("simulate", _route_evidence)
    builder.add_edge("validate-evidence", "analyze")
    builder.add_edge("mark-illustrative", "analyze")
    builder.add_conditional_edges("analyze", _route_protocol)
    builder.add_edge("build-protocol", "finalize")
    builder.add_edge("skip-protocol", "finalize")
    builder.add_edge("finalize", END)
    return builder.compile()


WORKFLOW_GRAPH = _build_graph()


def run_workflow(input_data: WorkflowInput | dict) -> WorkflowResult:
    """Valida la entrada, ejecuta LangGraph y devuelve un resultado inmutable."""
    workflow_input = WorkflowInput.model_validate(input_data)
    state = WORKFLOW_GRAPH.invoke({"input": workflow_input, "trace": []})
    canonical = json.dumps(workflow_input.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    execution_id = f"py-run-{hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:10]}"
    validation = state["validation"]
    return WorkflowResult(
        execution_id=execution_id,
        simulation=state["simulation"],
        validation=validation,
        analysis=state["analysis"],
        protocol=state["protocol"],
        trace=tuple(state["trace"]),
        limitations=(
            *validation.limitations,
            "El gemelo apoya investigación y planificación; no constituye una alerta oficial.",
        ),
    )
