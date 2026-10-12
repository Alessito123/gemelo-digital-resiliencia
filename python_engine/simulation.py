"""Simulación poblacional determinista micro–meso–macro."""

from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass

from .models import (
    FragilityPoint,
    HistoryPoint,
    SimulationConfig,
    SimulationMetrics,
    SimulationResult,
)
from .presets import get_scenario, get_settlement


@dataclass
class HouseholdState:
    residents: int
    vulnerability: float
    mobility: float
    risk_perception: float
    warning_access: float
    social_trust: float
    safe: bool = False
    trapped: bool = False
    injured: bool = False
    evacuation_min: float | None = None


def _round(value: float, digits: int = 1) -> float:
    return round(max(0.0, value), digits)


def _households(config: SimulationConfig, count: int, population: int) -> list[HouseholdState]:
    digest = hashlib.sha256(config.settlement_id.encode("utf-8")).digest()
    preset_seed = int.from_bytes(digest[:4], "big")
    rng = random.Random(preset_seed)
    base_residents = max(1, population // count)
    generated: list[HouseholdState] = []
    for _ in range(count):
        generated.append(HouseholdState(
            residents=max(1, base_residents + rng.choice([-2, -1, 0, 0, 1, 2])),
            vulnerability=rng.uniform(0.30, 0.92),
            mobility=rng.uniform(0.34, 0.96),
            risk_perception=rng.uniform(0.38, 0.94),
            warning_access=1.0 if rng.random() < 0.76 else 0.28,
            social_trust=rng.uniform(0.45, 0.95),
        ))
    return generated


def _fragilities(
    households: list[HouseholdState],
    config: SimulationConfig,
    bottlenecks: int,
) -> tuple[FragilityPoint, ...]:
    mobility_count = sum(item.mobility < 0.52 for item in households)
    warning_count = sum(item.warning_access < 0.5 for item in households)
    points = [
        FragilityPoint(
            title="Hogares con movilidad prioritaria",
            category="mobility",
            risk_score=min(100, 54 + mobility_count * 3),
            affected_households=mobility_count,
            mechanism="Las restricciones de movilidad retrasan la salida y elevan la exposición.",
            mitigation="Asignar binomios de apoyo y rutas accesibles antes de la alerta roja.",
        ),
        FragilityPoint(
            title="Brecha de acceso a la alerta",
            category="warning",
            risk_score=min(100, 46 + warning_count * 3),
            affected_households=warning_count,
            mechanism="La alerta tardía reduce el tiempo para preparar dependientes y evacuar.",
            mitigation="Combinar sirena, radio, mensajería y recorrido de líderes.",
        ),
        FragilityPoint(
            title="Cuellos de botella barriales",
            category="morphology",
            risk_score=min(100, int(38 + bottlenecks * 12 + config.hazard_intensity * 2)),
            affected_households=min(len(households), bottlenecks * 8),
            mechanism="La concentración de flujos aumenta demoras y riesgo de caída.",
            mitigation="Despejar, señalizar y habilitar rutas peatonales alternativas.",
        ),
    ]
    return tuple(sorted(points, key=lambda item: item.risk_score, reverse=True))


def run_simulation(config: SimulationConfig | dict) -> SimulationResult:
    """Ejecuta una simulación acotada; la misma entrada produce la misma salida."""
    validated = SimulationConfig.model_validate(config)
    settlement = get_settlement(validated.settlement_id)
    scenario = get_scenario(validated.scenario_id)
    households = _households(validated, settlement.households, settlement.population)
    rng = random.Random(validated.seed)
    history: list[HistoryPoint] = []
    mutual_aid_interactions = 0
    active_bottlenecks = settlement.bottlenecks
    intensity = validated.hazard_intensity / 10.0
    alert_quality = min(1.0, validated.warning_lead_time_min / 120.0)

    def snapshot(step: int, institutional: float) -> None:
        safe = sum(item.safe for item in households)
        trapped = sum(item.trapped for item in households)
        damage = intensity * scenario.damage_factor * (step / validated.steps) ** 1.18 * 72
        social_buffer = settlement.social_capital * (9 if validated.enable_mutual_aid else 2)
        resilience = max(0.0, min(100.0, 100 - damage + safe / len(households) * 18 + social_buffer + institutional * 0.08))
        history.append(HistoryPoint(
            step=step,
            time_min=_round(scenario.duration_min * step / validated.steps),
            evacuation_rate_pct=_round(safe / len(households) * 100),
            resilience_index=_round(resilience),
            safe_households=safe,
            trapped_households=trapped,
            institutional_response_pct=_round(institutional),
            household_states=tuple(
                "safe" if item.safe else "injured" if item.injured else "trapped" if item.trapped else "exposed"
                for item in households
            ),
        ))

    snapshot(0, 0.0)
    for step in range(1, validated.steps + 1):
        progress = step / validated.steps
        elapsed_min = scenario.duration_min * progress
        delay = settlement.response_time_min * (1.0 - settlement.institutional_trust * 0.28)
        institutional = max(0.0, min(100.0, (elapsed_min - delay) / max(30.0, scenario.duration_min - delay) * 115))
        if validated.enable_multi_scale_feedback:
            institutional = min(100.0, institutional + settlement.social_capital * progress * 12)
            active_bottlenecks = max(0, settlement.bottlenecks - int(institutional / 45))

        for household in households:
            if household.safe or household.trapped:
                continue
            community_bonus = 0.0
            if validated.enable_mutual_aid and household.social_trust > 0.58:
                community_bonus = 0.16 * settlement.social_capital
                if rng.random() < 0.12 + progress * 0.08:
                    mutual_aid_interactions += 1
            readiness = (
                household.risk_perception * 0.22
                + household.mobility * 0.22
                + household.warning_access * (0.13 + alert_quality * 0.16)
                + settlement.social_capital * 0.12
                + community_bonus
                + institutional / 100 * 0.10
            )
            congestion = active_bottlenecks * 0.035
            evacuation_chance = max(0.0, min(0.88, readiness * (0.17 + progress * 0.27) - congestion))
            if rng.random() < evacuation_chance:
                household.safe = True
                household.evacuation_min = elapsed_min
                continue
            hazard_pressure = intensity * scenario.severity * progress ** 1.35
            trap_chance = max(0.0, hazard_pressure * household.vulnerability * 0.075 - alert_quality * 0.018)
            if progress > 0.34 and rng.random() < trap_chance:
                household.trapped = True
                household.injured = rng.random() < household.vulnerability * hazard_pressure * 0.42
        snapshot(step, institutional)

    final = history[-1]
    safe = final.safe_households
    trapped = final.trapped_households
    injured = sum(item.injured for item in households)
    affected = [item for item in households if item.trapped or item.injured or not item.safe]
    affected_people = sum(item.residents for item in affected)
    displaced_people = round(sum(item.residents for item in households) * min(0.92, scenario.damage_factor * intensity * 0.48))
    evacuation_times = [item.evacuation_min for item in households if item.evacuation_min is not None]
    structural_damage = min(100.0, scenario.damage_factor * intensity * (52 + settlement.slope_deg * 0.6))
    economic_loss = affected_people * (1_850 + settlement.density_hab_ha * 3.2) * (0.45 + structural_damage / 100)
    metrics = SimulationMetrics(
        total_households=len(households),
        affected_people=affected_people,
        displaced_people=displaced_people,
        safe_households=safe,
        trapped_households=trapped,
        injured_households=injured,
        evacuation_rate_pct=final.evacuation_rate_pct,
        avg_evacuation_time_min=_round(sum(evacuation_times) / len(evacuation_times) if evacuation_times else 0.0),
        structural_damage_pct=_round(structural_damage),
        resilience_index=final.resilience_index,
        institutional_response_pct=final.institutional_response_pct,
        shelter_occupancy_pct=_round(displaced_people / max(1, settlement.shelter_capacity) * 100),
        economic_loss_usd=_round(economic_loss, 0),
        recovery_time_hours=_round(24 + structural_damage * 5.2 + trapped * 3.5),
        alert_coverage_pct=_round(min(100.0, 54 + alert_quality * 35 + settlement.social_capital * 12)),
        mutual_aid_interactions=mutual_aid_interactions,
        active_bottlenecks=active_bottlenecks,
        uncertainty_pct=_round(32 - alert_quality * 8 - settlement.institutional_trust * 5),
    )
    return SimulationResult(
        settlement_id=settlement.id,
        settlement_name=settlement.name,
        city=settlement.city,
        country=settlement.country,
        scenario_id=validated.scenario_id,
        scenario_name=scenario.name,
        config=validated,
        metrics=metrics,
        history=tuple(history),
        fragility_points=_fragilities(households, validated, settlement.bottlenecks),
    )
