"""Asesor científico local, acotado y sin credenciales."""

from __future__ import annotations

from .models import (
    AnalysisResult,
    ProtocolLevel,
    ProtocolResult,
    SimulationResult,
    ValidationReport,
)
from .presets import get_scenario


def build_analysis(simulation: SimulationResult, validation: ValidationReport) -> AnalysisResult:
    metrics = simulation.metrics
    fragilities = simulation.fragility_points[:3]
    return AnalysisResult(
        executive_summary=(
            f"{simulation.settlement_name} fue evaluado ante {simulation.scenario_name}. "
            f"La evacuación simulada alcanza {metrics.evacuation_rate_pct:.1f}% y la "
            f"resiliencia del sistema es {metrics.resilience_index:.1f}/100."
        ),
        critical_risks=tuple(
            f"{point.title}: {point.mechanism}" for point in fragilities
        ),
        immediate_actions=tuple(point.mitigation for point in fragilities),
        institutional_coordination=(
            f"Priorizar {metrics.active_bottlenecks} cuellos de botella activos, coordinar "
            f"apoyo para {metrics.trapped_households} hogares atrapados y verificar una "
            f"ocupación de albergues estimada en {metrics.shelter_occupancy_pct:.1f}%."
        ),
        theoretical_alignment=(
            "El resultado vincula vulnerabilidad del hogar, capital social barrial y "
            f"respuesta institucional. Estado de evidencia: {validation.status}."
        ),
    )


def build_protocol(simulation: SimulationResult) -> ProtocolResult:
    scenario = get_scenario(simulation.scenario_id)
    thresholds = {
        "flood": ("< 30 mm/24 h", "30–70 mm/24 h", "70–120 mm/24 h", "> 120 mm/24 h"),
        "earthquake": ("Sismicidad de fondo", "Movimiento percibido", "Daño localizado", "Sismo Mw ≥ 7.0"),
        "landslide": ("Saturación < 40%", "Saturación 40–60%", "Saturación 60–80%", "Saturación > 80%"),
        "compound": ("Monitoreo multiamenaza", "Primera amenaza", "Amenazas encadenadas", "Falla crítica compuesta"),
        "base": ("Operación normal", "Anomalía menor", "Alistamiento", "Activación extraordinaria"),
    }[simulation.scenario_id]
    actions = (
        "Monitorear fuentes oficiales y actualizar canales comunitarios.",
        "Alistar brigadas, rutas, comunicaciones y puntos de encuentro.",
        "Evacuar preventivamente hogares con movilidad prioritaria.",
        "Ejecutar evacuación general y coordinación con Defensa Civil.",
    )
    names = ("VERDE", "AMARILLO", "NARANJA", "ROJA")
    return ProtocolResult(
        title=f"Protocolo de acción anticipatoria · {scenario.name}",
        lead_time=f"{simulation.config.warning_lead_time_min:.0f} minutos antes del impacto estimado",
        levels=tuple(
            ProtocolLevel(level=name, threshold=thresholds[index], action=actions[index])
            for index, name in enumerate(names)
        ),
        checklist=(
            "Confirmar recepción de la alerta hogar por hogar.",
            "Asignar acompañantes a personas con movilidad reducida.",
            "Registrar bloqueos, ocupación de refugios y necesidades de rescate.",
        ),
    )
