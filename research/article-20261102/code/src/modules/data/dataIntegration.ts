import { DisasterObservation, EvidenceLevel, ResearchDataset } from '../../types';

export type DatasetParseResult =
  | { ok: true; dataset: ResearchDataset }
  | { ok: false; errors: string[] };

const EVIDENCE_LEVELS = new Set<EvidenceLevel>(['observed', 'calibrated', 'synthetic']);
const MAX_OBSERVATIONS = 5_000;
const MAX_TEXT_LENGTH = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function validPercent(value: unknown): value is number {
  return value === undefined || (isFiniteNumber(value) && value >= 0 && value <= 100);
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned.length > 0 && cleaned.length <= MAX_TEXT_LENGTH ? cleaned : null;
}

function parseObservation(value: unknown, index: number, errors: string[]): DisasterObservation | null {
  if (!isRecord(value) || !isFiniteNumber(value.timeMin) || value.timeMin < 0) {
    errors.push(`Observación ${index + 1}: timeMin debe ser un número no negativo.`);
    return null;
  }
  if (!validPercent(value.evacuationRatePct) || !validPercent(value.structuralDamagePct)) {
    errors.push(`Observación ${index + 1}: los porcentajes deben estar entre 0 y 100.`);
    return null;
  }
  for (const field of ['affectedPeople', 'displacedPeople', 'economicLossUsd'] as const) {
    if (value[field] !== undefined && (!isFiniteNumber(value[field]) || value[field] < 0)) {
      errors.push(`Observación ${index + 1}: ${field} debe ser no negativo.`);
      return null;
    }
  }
  return {
    timeMin: value.timeMin,
    evacuationRatePct: value.evacuationRatePct as number | undefined,
    structuralDamagePct: value.structuralDamagePct as number | undefined,
    affectedPeople: value.affectedPeople as number | undefined,
    displacedPeople: value.displacedPeople as number | undefined,
    economicLossUsd: value.economicLossUsd as number | undefined,
  };
}

export function parseResearchDataset(raw: string): DatasetParseResult {
  if (raw.length > 1_000_000) return { ok: false, errors: ['El archivo supera el límite de 1 MB.'] };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, errors: ['El archivo no contiene JSON válido.'] }; }
  if (!isRecord(parsed) || !isRecord(parsed.metadata) || !Array.isArray(parsed.observations)) {
    return { ok: false, errors: ['Se requieren metadata y observations.'] };
  }
  const title = cleanText(parsed.metadata.title);
  const source = cleanText(parsed.metadata.source);
  const observedAt = cleanText(parsed.metadata.observedAt);
  const license = cleanText(parsed.metadata.license);
  const evidenceLevel = parsed.metadata.evidenceLevel;
  const errors: string[] = [];
  if (!title || !source || !observedAt || !license || typeof evidenceLevel !== 'string' || !EVIDENCE_LEVELS.has(evidenceLevel as EvidenceLevel)) {
    errors.push('La procedencia requiere título, fuente, fecha, licencia y nivel de evidencia válido.');
  }
  if (parsed.observations.length === 0 || parsed.observations.length > MAX_OBSERVATIONS) {
    errors.push(`El dataset debe contener entre 1 y ${MAX_OBSERVATIONS} observaciones.`);
  }
  const observations = parsed.observations
    .slice(0, MAX_OBSERVATIONS)
    .map((value, index) => parseObservation(value, index, errors))
    .filter((value): value is DisasterObservation => value !== null)
    .sort((a, b) => a.timeMin - b.timeMin);
  if (errors.length > 0 || !title || !source || !observedAt || !license || typeof evidenceLevel !== 'string') return { ok: false, errors };
  return { ok: true, dataset: { metadata: { title, source, observedAt, license, evidenceLevel: evidenceLevel as EvidenceLevel }, observations } };
}

export const ILLUSTRATIVE_DATASET: ResearchDataset = {
  metadata: { title: 'Serie demostrativa para probar el flujo', source: 'Motor sintético local', observedAt: '2026-01-01', license: 'CC0-1.0', evidenceLevel: 'synthetic' },
  observations: [
    { timeMin: 15, evacuationRatePct: 18, structuralDamagePct: 20, affectedPeople: 620 },
    { timeMin: 30, evacuationRatePct: 46, structuralDamagePct: 34, affectedPeople: 510 },
    { timeMin: 45, evacuationRatePct: 72, structuralDamagePct: 42, affectedPeople: 340 },
  ],
};

