import { ResearchDataset, SimulationMetrics, ValidationReport } from '../../types';

type ComparableMetrics = Pick<SimulationMetrics, 'evacuationRatePct' | 'estimatedStructuralDamagePct' | 'affectedPeople'>;

export function validateSimulation(metrics: ComparableMetrics, dataset: ResearchDataset): ValidationReport {
  const reference = dataset.observations.at(-1);
  if (!reference) {
    return { status: 'not-evaluated', comparedMetrics: 0, meanAbsoluteError: 0, normalizedFitScore: 0, sourceLabel: dataset.metadata.source, limitations: ['No existen observaciones comparables.'] };
  }
  const pairs: Array<[number, number, number]> = [];
  if (reference.evacuationRatePct !== undefined) pairs.push([metrics.evacuationRatePct, reference.evacuationRatePct, 100]);
  if (reference.structuralDamagePct !== undefined) pairs.push([metrics.estimatedStructuralDamagePct, reference.structuralDamagePct, 100]);
  if (reference.affectedPeople !== undefined) pairs.push([metrics.affectedPeople, reference.affectedPeople, Math.max(1, reference.affectedPeople)]);
  if (pairs.length === 0) {
    return { status: 'not-evaluated', comparedMetrics: 0, meanAbsoluteError: 0, normalizedFitScore: 0, sourceLabel: dataset.metadata.source, limitations: ['El dataset no contiene métricas compatibles.'] };
  }
  const absoluteErrors = pairs.map(([simulated, observed]) => Math.abs(simulated - observed));
  const normalizedErrors = pairs.map(([simulated, observed, scale]) => Math.abs(simulated - observed) / scale);
  const meanAbsoluteError = absoluteErrors.reduce((sum, value) => sum + value, 0) / absoluteErrors.length;
  const normalizedFitScore = Math.max(0, Math.round((1 - normalizedErrors.reduce((sum, value) => sum + value, 0) / normalizedErrors.length) * 100));
  const isObserved = dataset.metadata.evidenceLevel === 'observed';
  return {
    status: isObserved ? 'validated-against-observation' : 'illustrative',
    comparedMetrics: pairs.length,
    meanAbsoluteError: Number(meanAbsoluteError.toFixed(2)),
    normalizedFitScore,
    sourceLabel: dataset.metadata.source,
    limitations: isObserved
      ? ['La comparación no sustituye calibración cruzada ni análisis de sensibilidad.', 'La calidad depende de cobertura y resolución de la fuente.']
      : ['La evidencia es sintética; el resultado solo verifica el flujo técnico.', 'Importa observaciones reales para evaluar validez externa.'],
  };
}
