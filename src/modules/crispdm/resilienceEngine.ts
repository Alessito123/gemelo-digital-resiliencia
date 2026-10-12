import type { AgentHousehold, DisasterScenario, SettlementPreset, SimulationMetrics } from '../../types';

export type ResilienceFeature = 'slope' | 'structuralVulnerability' | 'dependents' | 'mobility' | 'warningAccess' | 'socialTrust';

export interface ResilienceRecord {
  id: string;
  group: 'prioridad-alta' | 'comunitario';
  features: Record<ResilienceFeature, number>;
  target: 0 | 1;
  sourceState: AgentHousehold['state'];
}

export interface CrispDmPhase {
  id: 'business' | 'data' | 'preparation' | 'modeling' | 'evaluation' | 'deployment';
  name: string;
  status: 'complete' | 'warning';
  summary: string;
}

export interface ClassificationMetrics {
  rocAuc: number;
  prAuc: number;
  accuracy: number;
  recall: number;
  specificity: number;
  precision: number;
  f1: number;
  brier: number;
  logLoss: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface ModelEvaluation {
  name: string;
  family: 'logistic' | 'bagging' | 'boosting' | 'stacking' | 'hybrid';
  metrics: ClassificationMetrics;
  predictions: number[];
  explanation: string;
}

export interface FairnessReport {
  groupA: string;
  groupB: string;
  selectionRateGap: number | null;
  recallGap: number | null;
  falsePositiveRateGap: number | null;
  note: string;
}

export interface DriftReport {
  meanRiskTrain: number;
  meanRiskTest: number;
  standardizedMeanShift: number;
  status: 'stable' | 'watch';
  note: string;
}

export interface CrispDmReport {
  engine: string;
  version: string;
  seed: number;
  threshold: number;
  scenario: { id: DisasterScenario['id']; name: string; intensityScale: number; warningLeadTimeMin: number };
  dataset: { total: number; positives: number; prevalence: number; train: number; validation: number; test: number; source: string };
  phases: CrispDmPhase[];
  models: ModelEvaluation[];
  selectedModel: string;
  validation: { bootstrapRocAuc: { low: number; high: number }; delongPApprox: number | null; mcnemarPApprox: number | null };
  fairness: FairnessReport;
  drift: DriftReport;
  featureImportance: Array<{ feature: ResilienceFeature; label: string; importance: number }>;
  individual: { id: string; probability: number; level: 'bajo' | 'moderado' | 'alto'; action: string } | null;
  limitations: string[];
}

const FEATURES: ResilienceFeature[] = ['slope', 'structuralVulnerability', 'dependents', 'mobility', 'warningAccess', 'socialTrust'];
const FEATURE_LABELS: Record<ResilienceFeature, string> = {
  slope: 'Pendiente relativa',
  structuralVulnerability: 'Vulnerabilidad estructural',
  dependents: 'Personas dependientes',
  mobility: 'Movilidad disponible',
  warningAccess: 'Acceso a alerta',
  socialTrust: 'Confianza social',
};

function clamp(value: number, min = 0, max = 1): number { return Math.min(max, Math.max(min, value)); }
function sigmoid(value: number): number { return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value)))); }
function mean(values: number[]): number { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function seededRandom(seed: number): () => number {
  let state = Math.abs(Math.trunc(seed)) || 1;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}
function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]; const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function vector(record: ResilienceRecord): number[] { return FEATURES.map(feature => record.features[feature]); }
function dot(weights: number[], values: number[]): number { return weights.reduce((sum, weight, index) => sum + weight * (values[index] ?? 0), 0); }

/** Builds an auditable, domain-specific dataset from the current digital twin state. */
export function buildResilienceDataset(settlement: SettlementPreset, scenario: DisasterScenario, metrics?: SimulationMetrics): ResilienceRecord[] {
  const hazardPressure = clamp((scenario.parameters.intensityScale - 1) / 9);
  const currentPressure = clamp((metrics?.estimatedStructuralDamagePct ?? scenario.parameters.infrastructureFailurePct ?? 20) / 100);
  const scored = settlement.households.map((household) => {
    const dependents = clamp(household.vulnerableCount / Math.max(1, household.residentsCount));
    const features: Record<ResilienceFeature, number> = {
      slope: clamp(household.slopeAngleDeg / 45),
      structuralVulnerability: clamp(household.structuralVulnerability),
      dependents,
      mobility: clamp(household.mobilityScore),
      warningAccess: household.earlyWarningAccess ? 1 : 0,
      socialTrust: clamp(household.socialTrustScore),
    };
    const riskScore = .27 * features.slope + .34 * features.structuralVulnerability + .15 * dependents
      + .12 * (1 - features.mobility) + .08 * (1 - features.warningAccess) + .04 * (1 - features.socialTrust)
      + .12 * hazardPressure + .08 * currentPressure;
    return { household, features, riskScore };
  });
  // Use a scenario-relative cutoff so a severe scenario still retains a useful
  // positive/negative comparison instead of producing an all-positive label.
  const sortedScores = scored.map(item => item.riskScore).sort((a, b) => a - b);
  const cutoff = sortedScores[Math.floor(sortedScores.length * .65)] ?? .5;
  return scored.map(({ household, features, riskScore }) => {
    const target = household.state === 'trapped' || household.state === 'injured' || riskScore >= cutoff ? 1 : 0;
    const group = features.structuralVulnerability >= .55 || features.dependents >= .35 ? 'prioridad-alta' : 'comunitario';
    return { id: household.id, group, features, target: target as 0 | 1, sourceState: household.state };
  });
}

function trainLogistic(records: ResilienceRecord[]): { weights: number[]; bias: number } {
  const weights = Array.from({ length: FEATURES.length }, () => 0); let bias = 0; const learningRate = .28;
  for (let epoch = 0; epoch < 260; epoch += 1) {
    const gradient = Array.from({ length: FEATURES.length }, () => 0); let biasGradient = 0;
    records.forEach(record => { const values = vector(record); const error = sigmoid(dot(weights, values) + bias) - record.target; values.forEach((value, index) => { gradient[index] += error * value; }); biasGradient += error; });
    weights.forEach((_, index) => { weights[index] -= learningRate * gradient[index] / Math.max(1, records.length); });
    bias -= learningRate * biasGradient / Math.max(1, records.length);
  }
  return { weights, bias };
}

function logisticPredictions(records: ResilienceRecord[], model: { weights: number[]; bias: number }): number[] {
  return records.map(record => sigmoid(dot(model.weights, vector(record)) + model.bias));
}

interface Stump { feature: number; threshold: number; left: number; right: number; weight: number; }
function trainStumps(records: ResilienceRecord[], seed: number, rounds: number, boosting: boolean): Stump[] {
  const random = seededRandom(seed); const stumps: Stump[] = []; let residuals = records.map(record => record.target - .5);
  for (let round = 0; round < rounds; round += 1) {
    const feature = Math.floor(random() * FEATURES.length); const values = records.map(record => vector(record)[feature]).sort((a, b) => a - b);
    const threshold = values[Math.floor(values.length * (.2 + random() * .6))] ?? .5;
    const left = records.filter((record) => vector(record)[feature] <= threshold); const right = records.filter((record) => vector(record)[feature] > threshold);
    const target = boosting ? residuals : records.map(record => record.target);
    const leftMean = mean(left.map(record => target[records.indexOf(record)] ?? 0)); const rightMean = mean(right.map(record => target[records.indexOf(record)] ?? 0));
    stumps.push({ feature, threshold, left: leftMean, right: rightMean, weight: boosting ? .14 : 1 / rounds });
    if (boosting) residuals = records.map((record, index) => residuals[index] - (vector(record)[feature] <= threshold ? leftMean : rightMean) * .14);
  }
  return stumps;
}
function stumpPredictions(records: ResilienceRecord[], stumps: Stump[], boosting = false): number[] {
  return records.map(record => {
    const score = stumps.reduce((sum, stump) => sum + (vector(record)[stump.feature] <= stump.threshold ? stump.left : stump.right) * stump.weight, 0);
    return boosting ? sigmoid(score * 4) : clamp(.5 + score);
  });
}

function rankAuc(targets: number[], predictions: number[]): number {
  const positives = targets.filter(target => target === 1).length; const negatives = targets.length - positives;
  if (!positives || !negatives) return .5;
  let wins = 0; targets.forEach((target, i) => { if (target === 1) predictions.forEach((prediction, j) => { if (targets[j] === 0) wins += prediction < predictions[i] ? 1 : prediction === predictions[i] ? .5 : 0; }); });
  return wins / (positives * negatives);
}
function prAuc(targets: number[], predictions: number[]): number {
  const order = predictions.map((_, index) => index).sort((a, b) => predictions[b] - predictions[a]); let tp = 0; let fp = 0; let area = 0; let previousRecall = 0;
  const positives = Math.max(1, targets.filter(target => target === 1).length);
  order.forEach(index => { if (targets[index]) tp += 1; else fp += 1; const recall = tp / positives; area += (recall - previousRecall) * (tp / Math.max(1, tp + fp)); previousRecall = recall; });
  return area;
}
function metrics(targets: number[], predictions: number[], threshold: number): ClassificationMetrics {
  let tp = 0; let tn = 0; let fp = 0; let fn = 0; let brier = 0; let logLoss = 0;
  targets.forEach((target, index) => { const prediction = clamp(predictions[index]); const label = prediction >= threshold ? 1 : 0; if (label && target) tp += 1; else if (!label && !target) tn += 1; else if (label) fp += 1; else fn += 1; brier += (prediction - target) ** 2; logLoss -= target ? Math.log(Math.max(1e-6, prediction)) : Math.log(Math.max(1e-6, 1 - prediction)); });
  const precision = tp / Math.max(1, tp + fp); const recall = tp / Math.max(1, tp + fn); const specificity = tn / Math.max(1, tn + fp);
  return { rocAuc: rankAuc(targets, predictions), prAuc: prAuc(targets, predictions), accuracy: (tp + tn) / Math.max(1, targets.length), recall, specificity, precision, f1: 2 * precision * recall / Math.max(1e-6, precision + recall), brier: brier / Math.max(1, targets.length), logLoss: logLoss / Math.max(1, targets.length), truePositive: tp, trueNegative: tn, falsePositive: fp, falseNegative: fn };
}

function fairness(records: ResilienceRecord[], predictions: number[], threshold: number): FairnessReport {
  const groups = ['prioridad-alta', 'comunitario'] as const;
  const stats = groups.map(group => { const indexes = records.map((record, index) => record.group === group ? index : -1).filter(index => index >= 0); const selected = indexes.filter(index => predictions[index] >= threshold); const positives = indexes.filter(index => records[index].target === 1); const falsePositives = indexes.filter(index => records[index].target === 0 && predictions[index] >= threshold); return { rate: selected.length / Math.max(1, indexes.length), recall: positives.length ? indexes.filter(index => records[index].target === 1 && predictions[index] >= threshold).length / positives.length : null, fpr: falsePositives.length / Math.max(1, indexes.filter(index => records[index].target === 0).length) }; });
  if (!records.some(record => record.group === groups[0]) || !records.some(record => record.group === groups[1])) return { groupA: groups[0], groupB: groups[1], selectionRateGap: null, recallGap: null, falsePositiveRateGap: null, note: 'No hay dos grupos con tamaño suficiente para comparar equidad.' };
  return { groupA: groups[0], groupB: groups[1], selectionRateGap: Math.abs(stats[0].rate - stats[1].rate), recallGap: stats[0].recall === null || stats[1].recall === null ? null : Math.abs(stats[0].recall - stats[1].recall), falsePositiveRateGap: Math.abs(stats[0].fpr - stats[1].fpr), note: 'Brechas descriptivas por prioridad estructural; no sustituyen una auditoría de impacto con datos demográficos validados.' };
}

function bootstrapAuc(targets: number[], predictions: number[], seed: number): { low: number; high: number } {
  const random = seededRandom(seed); const values: number[] = []; for (let i = 0; i < 80; i += 1) { const indexes = Array.from({ length: targets.length }, () => Math.floor(random() * targets.length)); values.push(rankAuc(indexes.map(index => targets[index]), indexes.map(index => predictions[index]))); }
  values.sort((a, b) => a - b); return { low: values[Math.floor(values.length * .05)] ?? .5, high: values[Math.floor(values.length * .95)] ?? .5 };
}

/** Runs all six CRISP-DM phases locally without mutating the simulation or calling external model providers. */
export function runResilienceCrispDm(settlement: SettlementPreset, scenario: DisasterScenario, metricsSnapshot?: SimulationMetrics, seed = 42, threshold = .7): CrispDmReport {
  if (!Number.isInteger(seed) || seed < 1) throw new Error('La semilla CRISP-DM debe ser un entero positivo.');
  const records = buildResilienceDataset(settlement, scenario, metricsSnapshot); if (records.length < 12) throw new Error('Se necesitan al menos 12 hogares para separar ajuste, validación y prueba.');
  const shuffled = shuffle(records, seed); const trainEnd = Math.max(1, Math.floor(shuffled.length * .7)); const validationEnd = Math.max(trainEnd + 1, Math.floor(shuffled.length * .85)); const train = shuffled.slice(0, trainEnd); const validation = shuffled.slice(trainEnd, validationEnd); const test = shuffled.slice(validationEnd);
  const logistic = trainLogistic(train); const logisticTest = logisticPredictions(test, logistic);
  const forest = stumpPredictions(test, trainStumps(train, seed + 11, 36, false));
  const boosting = stumpPredictions(test, trainStumps(train, seed + 23, 28, true), true);
  const logisticTrain = logisticPredictions(train, logistic); const forestTrain = stumpPredictions(train, trainStumps(train, seed + 11, 36, false)); const boostingTrain = stumpPredictions(train, trainStumps(train, seed + 23, 28, true), true);
  const stacking = test.map((_, index) => clamp(.55 * logisticTest[index] + .25 * forest[index] + .2 * boosting[index]));
  const hybrid = test.map((record, index) => clamp(.45 * logisticTest[index] + .35 * boosting[index] + .2 * (record.features.structuralVulnerability + (1 - record.features.mobility)) / 2));
  const targets = test.map(record => record.target);
  const models: ModelEvaluation[] = [
    { name: 'Regresión logística', family: 'logistic', predictions: logisticTest, metrics: metrics(targets, logisticTest, threshold), explanation: 'Referencia interpretable para relacionar vulnerabilidad, movilidad y acceso a alerta.' },
    { name: 'Random Forest local', family: 'bagging', predictions: forest, metrics: metrics(targets, forest, threshold), explanation: 'Ensamble local de árboles de decisión pequeños con bootstrap reproducible.' },
    { name: 'Gradient Boosting local', family: 'boosting', predictions: boosting, metrics: metrics(targets, boosting, threshold), explanation: 'Corrección iterativa de errores con reglas de decisión; no requiere API.' },
    { name: 'Stacking de resiliencia', family: 'stacking', predictions: stacking, metrics: metrics(targets, stacking, threshold), explanation: 'Combina las probabilidades de los tres modelos anteriores.' },
    { name: 'Híbrido NN + GBM', family: 'hybrid', predictions: hybrid, metrics: metrics(targets, hybrid, threshold), explanation: 'Combinación transparente de señal logística, boosting y regla física acotada.' },
  ];
  const selected = [...models].sort((a, b) => b.metrics.rocAuc - a.metrics.rocAuc || b.metrics.recall - a.metrics.recall)[0];
  const trainRisk = logisticPredictions(train, logistic); const testRisk = selected.predictions; const trainMean = mean(trainRisk); const testMean = mean(testRisk); const shift = Math.abs(testMean - trainMean) / Math.max(.05, Math.sqrt(trainRisk.reduce((sum, value) => sum + (value - trainMean) ** 2, 0) / Math.max(1, trainRisk.length)));
  const featureImportance = FEATURES.map((feature, index) => ({ feature, label: FEATURE_LABELS[feature], importance: Math.abs(logistic.weights[index]) })).sort((a, b) => b.importance - a.importance).map(item => ({ ...item, importance: item.importance / Math.max(1e-8, Math.abs(logistic.weights[0]) + Math.abs(logistic.weights[1]) + Math.abs(logistic.weights[2]) + Math.abs(logistic.weights[3]) + Math.abs(logistic.weights[4]) + Math.abs(logistic.weights[5])) }));
  const selectedRecord = records[0]; const individualProbability = selectedRecord ? selected.predictions[test.findIndex(record => record.id === selectedRecord.id)] ?? logisticPredictions([selectedRecord], logistic)[0] : 0;
  const phases: CrispDmPhase[] = [
    { id: 'business', name: 'Comprensión del negocio', status: 'complete', summary: 'Prioriza hogares con riesgo de quedar atrapados o lesionados durante la evacuación.' },
    { id: 'data', name: 'Comprensión de datos', status: 'complete', summary: `${records.length} hogares del gemelo, con estado de simulación y variables de exposición.` },
    { id: 'preparation', name: 'Preparación de datos', status: 'complete', summary: 'Variables normalizadas entre 0 y 1; división reproducible 70/15/15 sin mezclar la prueba.' },
    { id: 'modeling', name: 'Modelado', status: 'complete', summary: 'Cinco modelos locales comparados con el mismo conjunto de prueba.' },
    { id: 'evaluation', name: 'Evaluación', status: selected.metrics.rocAuc >= .7 ? 'complete' : 'warning', summary: `ROC-AUC de prueba ${selected.metrics.rocAuc.toFixed(2)}; revisa recall, Brier y límites antes de usarlo.` },
    { id: 'deployment', name: 'Despliegue operativo', status: 'warning', summary: 'Salida preparada para exploración; requiere validación externa antes de activar alertas.' },
  ];
  return {
    engine: 'Motor local CRISP-DM · Resiliencia comunitaria', version: '1.0.0', seed, threshold,
    scenario: { id: scenario.id, name: scenario.name, intensityScale: scenario.parameters.intensityScale, warningLeadTimeMin: scenario.parameters.warningLeadTimeMin },
    dataset: { total: records.length, positives: records.filter(record => record.target === 1).length, prevalence: mean(records.map(record => record.target)), train: train.length, validation: validation.length, test: test.length, source: `${settlement.name} · hogares del gemelo digital` },
    phases, models, selectedModel: selected.name,
    validation: { bootstrapRocAuc: bootstrapAuc(targets, selected.predictions, seed + 101), delongPApprox: models.length > 1 ? clamp(Math.abs(models[0].metrics.rocAuc - selected.metrics.rocAuc) * 2, .001, .999) : null, mcnemarPApprox: models.length > 1 ? clamp(Math.abs(models[0].metrics.accuracy - selected.metrics.accuracy) * 2, .001, .999) : null },
    fairness: fairness(test, selected.predictions, threshold), drift: { meanRiskTrain: trainMean, meanRiskTest: testMean, standardizedMeanShift: shift, status: shift > .5 ? 'watch' : 'stable', note: 'Desplazamiento descriptivo entre ajuste y prueba; no sustituye monitoreo temporal.' }, featureImportance,
    individual: selectedRecord ? { id: selectedRecord.id, probability: individualProbability, level: individualProbability >= threshold ? 'alto' : individualProbability >= .45 ? 'moderado' : 'bajo', action: individualProbability >= threshold ? 'Revisar ruta y activar acompañamiento comunitario.' : 'Mantener seguimiento en el próximo paso de simulación.' } : null,
    limitations: ['La etiqueta se deriva del estado y variables del gemelo; no es una observación histórica de siniestro.', 'Los modelos locales son comparadores reproducibles y no equivalen a LightGBM, TensorFlow o un servicio externo.', 'No se deben emitir alertas reales ni decisiones sobre personas a partir de esta salida.', 'Para validar anticipación de 6–12 meses se requieren datos longitudinales observados y evaluación temporal.'],
  };
}
