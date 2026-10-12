export interface AiAnalysis {
  executiveSummary: string;
  criticalRisks: string[];
  immediateDirectives: string[];
  institutionalCoordination: string;
  theoreticalAlignment: string;
}

export interface ProtocolLevel {
  level: string;
  threshold: string;
  action: string;
}

export interface GeneratedProtocol {
  title: string;
  leadTime: string;
  levels: ProtocolLevel[];
  communityChecklist: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isShortString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 4_000;
const isStringList = (value: unknown, max = 12): value is string[] => Array.isArray(value) && value.length <= max && value.every(isShortString);

export function isAiAnalysis(value: unknown): value is AiAnalysis {
  return isRecord(value) && isShortString(value.executiveSummary) && isStringList(value.criticalRisks) && isStringList(value.immediateDirectives) && isShortString(value.institutionalCoordination) && isShortString(value.theoreticalAlignment);
}

export function isGeneratedProtocol(value: unknown): value is GeneratedProtocol {
  return isRecord(value) && isShortString(value.title) && isShortString(value.leadTime) && isStringList(value.communityChecklist) && Array.isArray(value.levels) && value.levels.length <= 8 && value.levels.every((level) => isRecord(level) && isShortString(level.level) && isShortString(level.threshold) && isShortString(level.action));
}

export function getApiErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;
  if (typeof value.error === 'string') return value.error;
  if (isRecord(value.error) && typeof value.error.message === 'string') return value.error.message;
  return fallback;
}
