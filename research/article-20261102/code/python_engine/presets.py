"""Presets compactos y transparentes usados por el motor Python."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Settlement:
    id: str
    name: str
    city: str
    country: str
    households: int
    population: int
    slope_deg: float
    density_hab_ha: float
    social_capital: float
    institutional_trust: float
    response_time_min: float
    bottlenecks: int
    shelter_capacity: int


@dataclass(frozen=True)
class Scenario:
    id: str
    name: str
    severity: float
    duration_min: float
    damage_factor: float
    threshold: str


SETTLEMENTS = {
    "medellin-comuna13": Settlement(
        "medellin-comuna13", "Comuna 13 · Laderas de Alto Riesgo", "Medellín",
        "Colombia", 48, 216, 28.0, 510.0, 0.78, 0.52, 42.0, 2, 160,
    ),
    "lima-sjl": Settlement(
        "lima-sjl", "San Juan de Lurigancho · Lomas Altas", "Lima",
        "Perú", 52, 234, 31.0, 512.0, 0.64, 0.43, 55.0, 3, 180,
    ),
    "cartagena-cienaga": Settlement(
        "cartagena-cienaga", "Ciénaga de la Virgen · Nelson Mandela", "Cartagena",
        "Colombia", 50, 225, 4.0, 476.0, 0.72, 0.48, 46.0, 3, 190,
    ),
    "lapaz-cotahuma": Settlement(
        "lapaz-cotahuma", "Valle de Cotahuma · Laderas Altas", "La Paz",
        "Bolivia", 46, 207, 34.0, 488.0, 0.69, 0.46, 58.0, 3, 150,
    ),
}


SCENARIOS = {
    "base": Scenario("base", "Condiciones normales", 0.15, 180.0, 0.04, "Monitoreo ordinario"),
    "flood": Scenario("flood", "Inundación urbana extrema · 200 mm/24 h", 0.82, 240.0, 0.82, "Lluvia > 120 mm/24 h"),
    "earthquake": Scenario("earthquake", "Terremoto mayor · Mw 7.5 a 30 km", 0.92, 120.0, 0.95, "Sismo Mw ≥ 7.0"),
    "landslide": Scenario("landslide", "Deslizamiento en ladera · 150 mm/72 h", 0.86, 180.0, 0.88, "Saturación del suelo > 80%"),
    "compound": Scenario("compound", "Evento compuesto · sismo, tsunami y falla crítica", 1.0, 300.0, 1.15, "Amenazas encadenadas confirmadas"),
}


def get_settlement(settlement_id: str) -> Settlement:
    try:
        return SETTLEMENTS[settlement_id]
    except KeyError as error:
        raise ValueError("El asentamiento solicitado no existe") from error


def get_scenario(scenario_id: str) -> Scenario:
    try:
        return SCENARIOS[scenario_id]
    except KeyError as error:
        raise ValueError("El escenario solicitado no existe") from error
