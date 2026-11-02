import {
  AgentHousehold,
  CommunitySurveyAggregate,
  DisasterScenario,
  FragilityPoint,
  PublicDataCalibration,
  SettlementPreset,
  SimulationHistoryPoint,
  SimulationMetrics,
} from '../../types';

export interface SimulationConfig {
  seed: number;
  hazardIntensity: number;
  warningLeadTimeMin: number;
  enableMutualAid: boolean;
  enableMultiScaleFeedback: boolean;
}

export interface SimulationState {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  currentStep: number;
  timeElapsedMin: number;
  metrics: SimulationMetrics;
  history: SimulationHistoryPoint[];
  fragilityPoints: FragilityPoint[];
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function calibrateSettlement(source: SettlementPreset, survey: CommunitySurveyAggregate): SettlementPreset {
  const settlement = clone(source);
  settlement.socialCapitalIndex = Number(clamp(survey.mutualAidPct, 0, 100).toFixed(0)) / 100;
  settlement.institutionalTrustScore = Number(clamp(survey.institutionalTrustPct, 0, 100).toFixed(0)) / 100;
  const warnedCount = Math.round(settlement.households.length * clamp(survey.warningAccessPct, 0, 100) / 100);
  const constrainedCount = Math.round(settlement.households.length * clamp(survey.mobilityConstraintPct, 0, 100) / 100);
  settlement.households = settlement.households.map((household, index) => ({
    ...household,
    earlyWarningAccess: index < warnedCount,
    warningChannel: index < warnedCount ? household.warningChannel === 'none' ? 'radio' : household.warningChannel : 'none',
    mobilityScore: index < constrainedCount ? Math.min(household.mobilityScore, 0.55) : household.mobilityScore,
    socialTrustScore: Number(clamp((household.socialTrustScore * 0.4 + settlement.socialCapitalIndex * 0.6) * 100, 0, 100).toFixed(0)) / 100,
    riskPerception: Number(clamp((household.riskPerception * 0.5 + survey.priorDisasterExperiencePct / 200) * 100, 0, 100).toFixed(0)) / 100,
  }));
  return settlement;
}

export function calibrateSettlementWithPublicData(
  source: SettlementPreset,
  calibration: PublicDataCalibration,
): SettlementPreset {
  const settlement = clone(source);
  settlement.publicDataCalibration = clone(calibration);
  return settlement;
}

function deterministicUnit(seed: number, step: number, key: string): number {
  let hash = (seed ^ (step * 2654435761)) >>> 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619) >>> 0;
  }
  hash += 0x6d2b79f5;
  hash = Math.imul(hash ^ (hash >>> 15), hash | 1);
  hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61);
  return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
}

function resetSettlement(source: SettlementPreset): SettlementPreset {
  const settlement = clone(source);
  settlement.households = settlement.households.map((household) => ({
    ...household,
    currentX: household.x,
    currentY: household.y,
    state: 'normal',
    health: 'intact',
    currentStepStateDuration: 0,
    evacuatedAtMin: undefined,
  }));
  settlement.meetingPoints = settlement.meetingPoints.map((point) => ({ ...point, currentOccupancy: 0 }));
  settlement.macroShelters = settlement.macroShelters.map((shelter) => ({ ...shelter, currentOccupancy: 0 }));
  settlement.bottlenecks = settlement.bottlenecks.map((point) => ({ ...point, congestionFactor: 0, blockedByDebris: false }));
  return settlement;
}

function emptyMetrics(settlement: SettlementPreset, multiScale: boolean): SimulationMetrics {
  return {
    currentStep: 0, timeElapsedMin: 0, totalAgents: settlement.households.length,
    normalCount: settlement.households.length, alertedCount: 0, evacuatingCount: 0,
    helpingCount: 0, safeCount: 0, trappedCount: 0, injuredCount: 0,
    evacuationRatePct: 0, avgEvacuationTimeMin: 0, estimatedStructuralDamagePct: 0,
    systemResilienceIndex: 100, bottlenecksActiveCount: 0,
    institutionalResponseProgressPct: 0, mutualAidInteractionsCount: 0,
    affectedHouseholds: 0, affectedPeople: 0, displacedPeople: 0,
    estimatedEconomicLossUsd: 0, estimatedRecoveryTimeHours: 0,
    shelterOccupancyPct: 0, communityAlertCoveragePct: 0,
    multiScaleFeedbackActive: multiScale, uncertaintyPct: 35,
    publicDataSourcesCount: settlement.publicDataCalibration?.sourceIds.length ?? 0,
  };
}

export function createSimulation(
  sourceSettlement: SettlementPreset,
  sourceScenario: DisasterScenario,
  config: SimulationConfig,
): SimulationState {
  const settlement = resetSettlement(sourceSettlement);
  return {
    settlement,
    scenario: clone(sourceScenario),
    currentStep: 0,
    timeElapsedMin: 0,
    metrics: emptyMetrics(settlement, config.enableMultiScaleFeedback),
    history: [{ timeMin: 0, evacuationRate: 0, systemResilience: 100, safeCount: 0, trappedCount: 0, evacuatingCount: 0 }],
    fragilityPoints: deriveFragilityPoints(settlement, emptyMetrics(settlement, config.enableMultiScaleFeedback)),
  };
}

function localRisk(agent: AgentHousehold, settlement: SettlementPreset, scenario: DisasterScenario, step: number, intensity: number): number {
  const progress = Math.min(1, step / 14);
  const calibration = settlement.publicDataCalibration;
  const rainfallAmplifier = 1 + Math.min(0.3, (calibration?.recentMaxDailyPrecipitationMm ?? 0) / 400);
  const seismicAmplifier = 0.95 + (calibration?.earthquakeHistoryIndex ?? 0.25) * 0.2;
  if (scenario.id === 'landslide') return clamp(((agent.slopeAngleDeg / 45) * 0.55 + progress * intensity * 0.55) * rainfallAmplifier, 0, 1);
  if (scenario.id === 'flood') {
    const range = Math.max(1, settlement.maxElevationM - settlement.minElevationM);
    const lowGround = 1 - ((agent.elevationM - settlement.minElevationM) / range);
    return clamp((lowGround * 0.62 + progress * intensity * 0.48) * rainfallAmplifier, 0, 1);
  }
  if (scenario.id === 'earthquake') return clamp((agent.structuralVulnerability * 0.82 * intensity + progress * 0.2) * seismicAmplifier, 0, 1);
  if (scenario.id === 'compound') {
    const range = Math.max(1, settlement.maxElevationM - settlement.minElevationM);
    const tsunamiExposure = 1 - ((agent.elevationM - settlement.minElevationM) / range);
    return clamp((agent.structuralVulnerability * 0.44 * seismicAmplifier + tsunamiExposure * 0.4 + progress * intensity * 0.35) * rainfallAmplifier, 0, 1);
  }
  return 0;
}

function countResidents(households: AgentHousehold[]): number {
  return households.reduce((sum, household) => sum + household.residentsCount, 0);
}

export function advanceSimulation(previous: SimulationState, config: SimulationConfig): SimulationState {
  if (previous.scenario.id === 'base') return previous;
  const settlement = clone(previous.settlement);
  const step = previous.currentStep + 1;
  const timeMin = step * 2.5;
  const intensity = clamp(config.hazardIntensity, 1, 10) / 10;
  const households = settlement.households;
  const stateById = new Map(households.map((household) => [household.id, household]));
  const totalResidents = countResidents(households);
  const previouslyMobilized = previous.metrics.evacuationRatePct >= 20;
  const communityMacroSignal = config.enableMultiScaleFeedback && previouslyMobilized;
  const institutionalDelay = Math.max(5, settlement.civilDefenseResponseTimeMin + previous.scenario.parameters.institutionalMobilizationDelayMin * 0.25 - (communityMacroSignal ? 15 : 0));
  const institutionalActive = timeMin >= institutionalDelay;
  let mutualAidCount = 0;

  settlement.bottlenecks.forEach((bottleneck) => {
    const nearby = households.filter((agent) => ['evacuating', 'helping_others'].includes(agent.state) && Math.hypot(agent.currentX - bottleneck.x, agent.currentY - bottleneck.y) <= bottleneck.radius * 1.8).length;
    bottleneck.congestionFactor = config.enableMultiScaleFeedback ? clamp(nearby / 8, 0, 1) : 0.25;
    const debrisRisk = previous.scenario.id === 'earthquake' || previous.scenario.id === 'compound';
    if (debrisRisk && step >= 2 && deterministicUnit(config.seed, step, bottleneck.id) < intensity * 0.72) bottleneck.blockedByDebris = true;
    if (institutionalActive && config.enableMultiScaleFeedback && deterministicUnit(config.seed + 17, step, bottleneck.id) > 0.35) bottleneck.blockedByDebris = false;
  });

  households.forEach((agent) => {
    if (agent.state === 'safe' || agent.state === 'trapped') return;
    const target = settlement.meetingPoints.find((point) => point.id === agent.assignedMeetingPointId) ?? settlement.meetingPoints[0];
    if (!target) return;
    const risk = localRisk(agent, settlement, previous.scenario, step, intensity);
    const alertedNeighbors = agent.socialTies
      .map((id) => stateById.get(id))
      .filter((neighbor) => neighbor && ['alerted', 'preparing', 'evacuating', 'safe'].includes(neighbor.state)).length;
    if (agent.state === 'normal') {
      const receivedWarning = agent.earlyWarningAccess && timeMin >= Math.max(0, 30 - config.warningLeadTimeMin);
      const socialSignal = config.enableMultiScaleFeedback && alertedNeighbors > 0 && agent.socialTrustScore >= 0.5;
      const leaderSignal = households.some((candidate) => candidate.isLeader && candidate.state !== 'normal' && Math.hypot(candidate.x - agent.x, candidate.y - agent.y) < 24);
      if (receivedWarning || socialSignal || leaderSignal || agent.isLeader || step > 3) agent.state = 'alerted';
      return;
    }
    if (agent.state === 'alerted') { agent.state = 'preparing'; return; }
    if (agent.state === 'preparing') {
      const vulnerableNeighbor = config.enableMutualAid
        ? agent.socialTies.map((id) => stateById.get(id)).find((neighbor) => neighbor && (neighbor.hasDisabledResident || neighbor.hasElderlyResident) && !['safe', 'evacuating'].includes(neighbor.state))
        : undefined;
      if (vulnerableNeighbor && (agent.isLeader || agent.socialTrustScore > 0.7)) {
        agent.state = 'helping_others';
        vulnerableNeighbor.mobilityScore = Math.min(0.95, vulnerableNeighbor.mobilityScore + 0.4);
        vulnerableNeighbor.state = 'evacuating';
        mutualAidCount += 1;
      } else agent.state = 'evacuating';
      return;
    }
    if (risk > 0.86 && agent.structuralVulnerability > 0.72 && step > 7 && deterministicUnit(config.seed, step, agent.id) < risk * 0.35) {
      agent.state = 'trapped';
      agent.health = 'critical';
      return;
    }
    const dx = target.x - agent.currentX;
    const dy = target.y - agent.currentY;
    const distance = Math.hypot(dx, dy);
    if (distance < 4.5) {
      agent.state = 'safe';
      agent.currentX = target.x;
      agent.currentY = target.y;
      agent.evacuatedAtMin = timeMin;
      target.currentOccupancy = Math.min(target.capacity, target.currentOccupancy + agent.residentsCount);
      return;
    }
    const accessibility = settlement.publicDataCalibration?.roadAccessibilityIndex;
    const accessibilityMultiplier = accessibility === undefined ? 1 : 0.82 + accessibility * 0.36;
    let speed = 4.2 * agent.mobilityScore * accessibilityMultiplier;
    settlement.bottlenecks.forEach((bottleneck) => {
      if (Math.hypot(agent.currentX - bottleneck.x, agent.currentY - bottleneck.y) <= bottleneck.radius) {
        speed *= bottleneck.blockedByDebris ? 0.18 : 1 - bottleneck.congestionFactor * 0.55;
      }
    });
    if (config.enableMultiScaleFeedback && communityMacroSignal) speed *= 1.12;
    const fraction = Math.min(1, speed / Math.max(1, distance));
    agent.currentX += dx * fraction;
    agent.currentY += dy * fraction;
  });

  if (institutionalActive) {
    households.forEach((agent) => {
      if (agent.state === 'trapped' && deterministicUnit(config.seed + 101, step, agent.id) > (config.enableMultiScaleFeedback ? 0.48 : 0.66)) {
        agent.state = 'safe';
        agent.health = 'rescued';
        agent.evacuatedAtMin = timeMin;
      }
    });
  }

  const safeHouseholds = households.filter((agent) => agent.state === 'safe');
  const safeResidents = countResidents(safeHouseholds);
  const shelterCapacity = settlement.macroShelters.reduce((sum, shelter) => sum + shelter.capacity, 0);
  if (institutionalActive && settlement.macroShelters[0]) settlement.macroShelters[0].currentOccupancy = Math.min(settlement.macroShelters[0].capacity, safeResidents);
  const safe = safeHouseholds.length;
  const trapped = households.filter((agent) => agent.state === 'trapped').length;
  const evacuating = households.filter((agent) => agent.state === 'evacuating').length;
  const helping = households.filter((agent) => agent.state === 'helping_others').length;
  const normal = households.filter((agent) => agent.state === 'normal').length;
  const alerted = households.filter((agent) => agent.state === 'alerted' || agent.state === 'preparing').length;
  const evacuated = households.filter((agent) => agent.evacuatedAtMin !== undefined);
  const evacuationRatePct = Math.round((safe / Math.max(1, households.length)) * 100);
  const avgEvacuationTimeMin = evacuated.length ? Math.round(evacuated.reduce((sum, agent) => sum + (agent.evacuatedAtMin ?? 0), 0) / evacuated.length) : 0;
  const averageVulnerability = households.reduce((sum, agent) => sum + agent.structuralVulnerability, 0) / Math.max(1, households.length);
  const scenarioMultiplier = previous.scenario.id === 'compound' ? 1.28 : previous.scenario.id === 'earthquake' ? 1.12 : 1;
  const structuralDamagePct = Math.round(clamp(intensity * averageVulnerability * 62 * scenarioMultiplier + step * 1.1, 0, 95));
  const damagedHouseholds = Math.round(households.length * structuralDamagePct / 100);
  const criticalHouseholds = new Set(households.filter((agent) => agent.state === 'trapped' || agent.health !== 'intact').map((agent) => agent.id));
  const affectedHouseholds = Math.min(households.length, damagedHouseholds + criticalHouseholds.size);
  const affectedPeople = Math.min(totalResidents, Math.round(totalResidents * affectedHouseholds / Math.max(1, households.length)));
  const displacedPeople = Math.round(affectedPeople * clamp((structuralDamagePct - 20) / 80, 0, 0.75));
  const estimatedEconomicLossUsd = Math.round(affectedHouseholds * (4500 + structuralDamagePct * 210) * (previous.scenario.id === 'compound' ? 1.35 : 1));
  const estimatedRecoveryTimeHours = Math.round(clamp(24 + structuralDamagePct * 3.2 + displacedPeople * 0.08 - settlement.socialCapitalIndex * 30 - (institutionalActive ? 18 : 0), 12, 720));
  const alertCoverage = Math.round(households.filter((agent) => agent.earlyWarningAccess || (config.enableMultiScaleFeedback && agent.socialTies.length > 0)).length / Math.max(1, households.length) * 100);
  const activeBottlenecks = settlement.bottlenecks.filter((point) => point.blockedByDebris || point.congestionFactor > 0.55).length;
  const resilience = Math.round(clamp(100 - structuralDamagePct * 0.45 - displacedPeople / Math.max(1, totalResidents) * 35 + evacuationRatePct * 0.3 + settlement.socialCapitalIndex * 12 + (institutionalActive ? 10 : 0), 8, 100));
  const metrics: SimulationMetrics = {
    currentStep: step, timeElapsedMin: timeMin, totalAgents: households.length,
    normalCount: normal, alertedCount: alerted, evacuatingCount: evacuating,
    helpingCount: helping, safeCount: safe, trappedCount: trapped,
    injuredCount: households.filter((agent) => agent.health === 'critical' || agent.health === 'minor_injury').length,
    evacuationRatePct, avgEvacuationTimeMin, estimatedStructuralDamagePct: structuralDamagePct,
    systemResilienceIndex: resilience, bottlenecksActiveCount: activeBottlenecks,
    institutionalResponseProgressPct: institutionalActive ? Math.round(clamp((timeMin - institutionalDelay) / 30 * 100)) : 0,
    mutualAidInteractionsCount: previous.metrics.mutualAidInteractionsCount + mutualAidCount,
    affectedHouseholds, affectedPeople, displacedPeople, estimatedEconomicLossUsd,
    estimatedRecoveryTimeHours, shelterOccupancyPct: Math.round(clamp(safeResidents / Math.max(1, shelterCapacity) * 100)),
    communityAlertCoveragePct: alertCoverage, multiScaleFeedbackActive: config.enableMultiScaleFeedback,
    uncertaintyPct: Math.round(clamp(38 - step * 0.45 - (config.enableMultiScaleFeedback ? 4 : 0) - (settlement.publicDataCalibration?.sourceIds.length ?? 0) * 2, 14, 45)),
    publicDataSourcesCount: settlement.publicDataCalibration?.sourceIds.length ?? 0,
  };
  const state: SimulationState = {
    settlement, scenario: previous.scenario, currentStep: step, timeElapsedMin: timeMin, metrics,
    history: [...previous.history, { timeMin, evacuationRate: evacuationRatePct, systemResilience: resilience, safeCount: safe, trappedCount: trapped, evacuatingCount: evacuating }],
    fragilityPoints: [],
  };
  state.fragilityPoints = deriveFragilityPoints(settlement, metrics);
  return state;
}

export function runSimulation(initial: SimulationState, config: SimulationConfig, steps: number): SimulationState {
  let state = initial;
  for (let index = 0; index < Math.max(0, Math.min(200, steps)); index += 1) state = advanceSimulation(state, config);
  return state;
}

export function deriveFragilityPoints(settlement: SettlementPreset, metrics: SimulationMetrics): FragilityPoint[] {
  const points: FragilityPoint[] = [];
  const worstBottleneck = [...settlement.bottlenecks].sort((a, b) => Number(b.blockedByDebris) - Number(a.blockedByDebris) || b.congestionFactor - a.congestionFactor)[0];
  if (worstBottleneck) points.push({ id: `dynamic-${worstBottleneck.id}`, title: worstBottleneck.name, category: 'morphology', locationDesc: worstBottleneck.cause, riskScore: Math.round(clamp(45 + worstBottleneck.congestionFactor * 40 + (worstBottleneck.blockedByDebris ? 15 : 0))), affectedHouseholds: Math.max(1, Math.round(metrics.affectedHouseholds * 0.35)), amplificationMechanism: worstBottleneck.blockedByDebris ? 'El bloqueo reduce la capacidad de salida y retrasa la respuesta institucional.' : 'La concentración de flujos aumenta demoras y riesgo de caída.', recommendedMitigation: 'Despejar, señalizar y habilitar una ruta alternativa accesible.', priority: worstBottleneck.blockedByDebris ? 'Crítica' : 'Alta' });
  const vulnerable = settlement.households.filter((agent) => agent.hasDisabledResident || agent.hasElderlyResident);
  if (vulnerable.length) points.push({ id: 'dynamic-mobility', title: 'Hogares con movilidad prioritaria', category: 'mobility', locationDesc: `${vulnerable.length} hogares requieren acompañamiento`, riskScore: Math.round(clamp(52 + vulnerable.length / settlement.households.length * 100)), affectedHouseholds: vulnerable.length, amplificationMechanism: 'La evacuación tarda más cuando faltan acompañantes, información accesible o rutas sin barreras.', recommendedMitigation: 'Asignar binomios de apoyo y confirmar recepción de alerta hogar por hogar.', priority: vulnerable.length > settlement.households.length * 0.2 ? 'Crítica' : 'Alta' });
  const withoutWarning = settlement.households.filter((agent) => !agent.earlyWarningAccess);
  if (withoutWarning.length) points.push({ id: 'dynamic-warning', title: 'Brecha de acceso a la alerta', category: 'social_network', locationDesc: `${withoutWarning.length} hogares dependen de comunicación vecinal`, riskScore: Math.round(clamp(40 + withoutWarning.length / settlement.households.length * 100)), affectedHouseholds: withoutWarning.length, amplificationMechanism: 'Una alerta tardía reduce el tiempo disponible para preparar dependientes y evacuar.', recommendedMitigation: 'Combinar sirena, radio, mensajería y recorrido de líderes con confirmación.', priority: withoutWarning.length > settlement.households.length * 0.3 ? 'Crítica' : 'Alta' });
  if (metrics.shelterOccupancyPct > 80) points.push({ id: 'dynamic-shelter', title: 'Capacidad de albergue bajo presión', category: 'infrastructure', locationDesc: `Ocupación estimada ${metrics.shelterOccupancyPct}%`, riskScore: Math.round(clamp(metrics.shelterOccupancyPct)), affectedHouseholds: metrics.affectedHouseholds, amplificationMechanism: 'La saturación desplaza familias hacia refugios no planificados.', recommendedMitigation: 'Prehabilitar capacidad secundaria con agua, salud y accesibilidad.', priority: metrics.shelterOccupancyPct > 95 ? 'Crítica' : 'Alta' });
  return points.sort((a, b) => b.riskScore - a.riskScore);
}
