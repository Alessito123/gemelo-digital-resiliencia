export type RoofMaterial = 
  | 'corrugated_metal' 
  | 'cardboard_plastic' 
  | 'unreinforced_masonry' 
  | 'reinforced_concrete';

export type AgentState = 
  | 'normal' 
  | 'alerted' 
  | 'preparing' 
  | 'evacuating' 
  | 'helping_others' 
  | 'safe' 
  | 'trapped' 
  | 'injured';

export interface AgentHousehold {
  id: string;
  name: string;
  x: number; // 0-100 relative coord
  y: number; // 0-100 relative coord
  elevationM: number; // Elevation in meters
  slopeAngleDeg: number; // Slope angle (0 - 45 deg)
  roofMaterial: RoofMaterial;
  structuralVulnerability: number; // 0 (sturdy) to 1 (precarious)
  residentsCount: number;
  vulnerableCount: number; // elderly, children, disabled
  hasDisabledResident: boolean;
  hasElderlyResident: boolean;
  
  // Micro-scale behavioral parameters
  riskPerception: number; // 0 to 1
  earlyWarningAccess: boolean;
  warningChannel: 'siren' | 'whatsapp' | 'radio' | 'word_of_mouth' | 'none';
  mobilityScore: number; // 0 to 1 (1 = fast, 0.2 = slow due to dependents/disability)
  socialTrustScore: number; // 0 to 1 (community cohesion)
  socialTies: string[]; // neighbor household IDs in mutual support network
  
  // Simulation State
  state: AgentState;
  health: 'intact' | 'minor_injury' | 'critical' | 'rescued';
  currentStepStateDuration: number;
  evacuatedAtMin?: number;
  assignedMeetingPointId: string;
  currentX: number;
  currentY: number;
  isLeader: boolean; // Community emergency leader / brigadist
}

export interface MeetingPoint {
  id: string;
  name: string;
  type: 'community_center' | 'sports_field' | 'church' | 'school' | 'open_plaza';
  x: number;
  y: number;
  elevationM: number;
  capacity: number;
  currentOccupancy: number;
  isSafeFromHazard: boolean;
}

export interface MacroShelter {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  currentOccupancy: number;
  accessTimeMin: number;
  servicesAvailable: string[];
}

export interface BottleneckPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  severity: 'critical' | 'moderate' | 'low';
  cause: string;
  congestionFactor: number; // 0 to 1
  blockedByDebris: boolean;
}

export interface SettlementPreset {
  id: string;
  name: string;
  city: string;
  country: string;
  hazardSpecialty: 'landslide' | 'earthquake' | 'flood' | 'compound';
  description: string;
  totalPopulation: number;
  areaHa: number;
  avgSlopeDeg: number;
  maxElevationM: number;
  minElevationM: number;
  densityHabHa: number;
  socialCapitalIndex: number; // 0 to 1
  institutionalTrustScore: number; // 0 to 1
  civilDefenseResponseTimeMin: number;
  publicDataArea: PublicDataArea;
  publicDataCalibration?: PublicDataCalibration;
  meetingPoints: MeetingPoint[];
  macroShelters: MacroShelter[];
  bottlenecks: BottleneckPoint[];
  households: AgentHousehold[];
}

export type ScenarioType = 'base' | 'flood' | 'earthquake' | 'landslide' | 'compound';

export interface DisasterScenario {
  id: ScenarioType;
  name: string;
  type: ScenarioType;
  description: string;
  cityExample: string;
  criticalThreshold: string;
  parameters: {
    intensityScale: number; // 1 to 10
    precipitation24hMm?: number;
    earthquakeMw?: number;
    epicenterDistanceKm?: number;
    slopeSaturationPct?: number;
    tsunamiWaveHeightM?: number;
    infrastructureFailurePct?: number;
    warningLeadTimeMin: number;
    institutionalMobilizationDelayMin: number;
  };
  narrativePhases: {
    trigger: string;
    amplification: string;
    response: string;
  };
}

export interface SimulationMetrics {
  currentStep: number;
  timeElapsedMin: number;
  totalAgents: number;
  normalCount: number;
  alertedCount: number;
  evacuatingCount: number;
  helpingCount: number;
  safeCount: number;
  trappedCount: number;
  injuredCount: number;
  evacuationRatePct: number;
  avgEvacuationTimeMin: number;
  estimatedStructuralDamagePct: number;
  systemResilienceIndex: number; // 0 to 100
  bottlenecksActiveCount: number;
  institutionalResponseProgressPct: number;
  mutualAidInteractionsCount: number;
  affectedHouseholds: number;
  affectedPeople: number;
  displacedPeople: number;
  estimatedEconomicLossUsd: number;
  estimatedRecoveryTimeHours: number;
  shelterOccupancyPct: number;
  communityAlertCoveragePct: number;
  multiScaleFeedbackActive: boolean;
  uncertaintyPct: number;
  publicDataSourcesCount: number;
}

export interface SimulationHistoryPoint {
  timeMin: number;
  evacuationRate: number;
  systemResilience: number;
  safeCount: number;
  trappedCount: number;
  evacuatingCount: number;
}

export type EvidenceLevel = 'observed' | 'calibrated' | 'synthetic';

export type PublicDataSourceId = 'osm' | 'usgs-earthquakes' | 'nasa-power';

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

export interface GeographicBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface PublicDataArea {
  settlementId: string;
  label: string;
  center: GeographicPoint;
  bounds: GeographicBounds;
}

export interface PublicDataProvenance {
  publisher: string;
  dataset: string;
  license: string;
  sourceUrl: string;
  retrievedAt: string;
  dataTimestamp?: string;
  evidenceKind: 'crowdsourced-map' | 'instrumental-catalogue' | 'satellite-model';
}

export interface PublicDataRecord {
  id: string;
  label: string;
  observedAt?: string;
  latitude?: number;
  longitude?: number;
  value?: number;
  unit?: string;
}

export interface PublicDataSnapshot {
  sourceId: PublicDataSourceId;
  sourceName: string;
  area: PublicDataArea;
  metrics: Record<string, number>;
  records: PublicDataRecord[];
  provenance: PublicDataProvenance;
  limitations: string[];
}

export interface PublicDataCalibration {
  sourceIds: PublicDataSourceId[];
  appliedAt: string;
  roadAccessibilityIndex?: number;
  recentMaxDailyPrecipitationMm?: number;
  terrainElevationM?: number;
  earthquakeHistoryIndex?: number;
  assumptions: string[];
}

export interface DatasetProvenance {
  title: string;
  source: string;
  observedAt: string;
  license: string;
  evidenceLevel: EvidenceLevel;
}

export interface DisasterObservation {
  timeMin: number;
  evacuationRatePct?: number;
  structuralDamagePct?: number;
  affectedPeople?: number;
  displacedPeople?: number;
  economicLossUsd?: number;
}

export interface ResearchDataset {
  metadata: DatasetProvenance;
  observations: DisasterObservation[];
}

export interface ValidationReport {
  status: 'not-evaluated' | 'illustrative' | 'validated-against-observation';
  comparedMetrics: number;
  meanAbsoluteError: number;
  normalizedFitScore: number;
  sourceLabel: string;
  limitations: string[];
}

export interface CommunitySurveyAggregate {
  responseCount: number;
  warningAccessPct: number;
  institutionalTrustPct: number;
  mutualAidPct: number;
  mobilityConstraintPct: number;
  priorDisasterExperiencePct: number;
}

export interface FragilityPoint {
  id: string;
  title: string;
  category: 'morphology' | 'social_network' | 'mobility' | 'infrastructure';
  locationDesc: string;
  riskScore: number; // 1 to 100
  affectedHouseholds: number;
  amplificationMechanism: string;
  recommendedMitigation: string;
  priority: 'Alta' | 'Media' | 'Crítica';
}

export interface EarlyWarningThreshold {
  level: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJA';
  color: string;
  hazardCondition: string;
  communityAction: string;
  institutionalAction: string;
  leadTimeHours: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  source: string;
  keyVariables: string;
  coverage: string;
  category: 'satellite' | 'social' | 'historical' | 'topography';
  link: string;
  resolution: string;
  integration?: 'live' | 'manual-import' | 'credentialed';
  license?: string;
  integrationNote?: string;
}
