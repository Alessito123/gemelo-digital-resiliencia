import { z } from 'zod';
import { AiAnalysis, GeneratedProtocol } from '../ai/contracts';
import {
  CommunitySurveyAggregate,
  DisasterScenario,
  FragilityPoint,
  PublicDataCalibration,
  ResearchDataset,
  SettlementPreset,
  SimulationHistoryPoint,
  SimulationMetrics,
  ValidationReport,
} from '../../types';

const finiteNumber = z.number().finite();
const percentage = finiteNumber.min(0).max(100);

const CommunitySurveySchema = z.object({
  responseCount: z.number().int().min(1).max(1_000_000),
  warningAccessPct: percentage,
  institutionalTrustPct: percentage,
  mutualAidPct: percentage,
  mobilityConstraintPct: percentage,
  priorDisasterExperiencePct: percentage,
}).strict();

const PublicDataCalibrationSchema = z.object({
  sourceIds: z.array(z.enum(['osm', 'usgs-earthquakes', 'nasa-power'])).max(3),
  appliedAt: z.string().datetime(),
  roadAccessibilityIndex: finiteNumber.min(0).max(1).optional(),
  recentMaxDailyPrecipitationMm: finiteNumber.min(0).max(2_000).optional(),
  terrainElevationM: finiteNumber.min(-500).max(9_000).optional(),
  earthquakeHistoryIndex: finiteNumber.min(0).max(1).optional(),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(20),
}).strict();

const ResearchDatasetSchema = z.object({
  metadata: z.object({
    title: z.string().trim().min(1).max(200),
    source: z.string().trim().min(1).max(200),
    observedAt: z.string().trim().min(1).max(200),
    license: z.string().trim().min(1).max(100),
    evidenceLevel: z.enum(['observed', 'calibrated', 'synthetic']),
  }).strict(),
  observations: z.array(z.object({
    timeMin: finiteNumber.min(0).max(100_000),
    evacuationRatePct: percentage.optional(),
    structuralDamagePct: percentage.optional(),
    affectedPeople: finiteNumber.min(0).max(100_000_000).optional(),
    displacedPeople: finiteNumber.min(0).max(100_000_000).optional(),
    economicLossUsd: finiteNumber.min(0).max(1_000_000_000_000).optional(),
  }).strict()).min(1).max(5_000),
}).strict();

export const EngineRunInputSchema = z.object({
  settlementId: z.string().trim().min(1).max(100),
  scenarioId: z.enum(['base', 'flood', 'earthquake', 'landslide', 'compound']),
  config: z.object({
    seed: z.number().int().min(1).max(2_147_483_647).default(202609),
    hazardIntensity: finiteNumber.min(1).max(10).default(8),
    warningLeadTimeMin: finiteNumber.min(0).max(1_440).default(60),
    enableMutualAid: z.boolean().default(true),
    enableMultiScaleFeedback: z.boolean().default(true),
    steps: z.number().int().min(1).max(60).default(20),
  }).strict().default({
    seed: 202609,
    hazardIntensity: 8,
    warningLeadTimeMin: 60,
    enableMutualAid: true,
    enableMultiScaleFeedback: true,
    steps: 20,
  }),
  communitySurvey: CommunitySurveySchema.optional(),
  publicDataCalibration: PublicDataCalibrationSchema.optional(),
  dataset: ResearchDatasetSchema.optional(),
  language: z.enum(['es', 'en']).default('es'),
  includeProtocol: z.boolean().default(true),
}).strict();

export type EngineRunInput = z.infer<typeof EngineRunInputSchema>;

export type EngineNodeName =
  | 'resolve-context'
  | 'calibrate'
  | 'simulate'
  | 'validate-evidence'
  | 'mark-illustrative'
  | 'analyze'
  | 'build-protocol'
  | 'skip-protocol'
  | 'finalize';

export interface EngineTraceEntry {
  sequence: number;
  node: EngineNodeName;
  status: 'completed' | 'skipped';
  summary: string;
}

export interface EngineAdvisorContext {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  fragilityPoints: FragilityPoint[];
  validation: ValidationReport;
  language: 'es' | 'en';
}

export interface EngineAdvisor {
  readonly source: string;
  analyze(context: EngineAdvisorContext): Promise<AiAnalysis>;
  generateProtocol(context: EngineAdvisorContext): Promise<GeneratedProtocol>;
}

export interface EngineRunResult {
  executionId: string;
  engineVersion: 'langgraph-1';
  analysisSource: string;
  input: EngineRunInput;
  simulation: {
    settlement: Pick<SettlementPreset, 'id' | 'name' | 'city' | 'country'>;
    scenario: Pick<DisasterScenario, 'id' | 'name' | 'type'>;
    metrics: SimulationMetrics;
    history: SimulationHistoryPoint[];
    fragilityPoints: FragilityPoint[];
  };
  validation: ValidationReport;
  analysis: AiAnalysis;
  protocol: GeneratedProtocol | null;
  trace: EngineTraceEntry[];
  warnings: string[];
  limitations: string[];
}

export interface EngineWorkflowDependencies {
  advisor?: EngineAdvisor;
}

export class EngineInputError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly details: unknown;

  constructor(details: unknown) {
    super('La solicitud del motor no es válida.');
    this.name = 'EngineInputError';
    this.details = details;
  }
}

export type EngineResolvedContext = {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  survey?: CommunitySurveyAggregate;
  publicDataCalibration?: PublicDataCalibration;
  dataset?: ResearchDataset;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function isEngineRunResult(value: unknown): value is EngineRunResult {
  if (!isRecord(value) || value.engineVersion !== 'langgraph-1' || typeof value.executionId !== 'string') return false;
  if (!isRecord(value.simulation) || !isRecord(value.simulation.metrics)) return false;
  if (!isRecord(value.validation) || !isRecord(value.analysis)) return false;
  if (!Array.isArray(value.trace) || !Array.isArray(value.warnings) || !Array.isArray(value.limitations)) return false;
  return value.trace.every((entry) => isRecord(entry) && typeof entry.node === 'string' && typeof entry.summary === 'string');
}

