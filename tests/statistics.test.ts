import test from 'node:test';
import assert from 'node:assert/strict';
import { datasetFromSnapshot, generateDataset, parseNumericDataset, valuesCsv } from '../src/modules/statistics/datasets';
import { analyzeDataset, describe, fitGaussianMixture, normalQuantile, responsibilities } from '../src/modules/statistics/engine';
import { runResilienceCrispDm } from '../src/modules/crispdm/resilienceEngine';
import { SETTLEMENT_PRESETS } from '../src/data/settlementPresets';
import { DISASTER_SCENARIOS } from '../src/data/disasterScenarios';

const normal = () => generateDataset(2000, 123, [{ weight: 1, mean: 12, sd: 3 }]);
const mixture = () => generateDataset(1600, 81, [{ weight: .4, mean: -5, sd: .7 }, { weight: .6, mean: 5, sd: 1 }]);

test('generator is reproducible, conserves truth, normalizes weights and recovers normal moments', () => {
  assert.deepEqual(normal(), normal());
  const stats = describe(normal().records.map(r => r.value));
  assert.ok(Math.abs(stats.mean - 12) < .2);
  assert.ok(Math.abs(stats.sd - 3) < .2);
  assert.equal(normal().origin, 'synthetic');
  const data = generateDataset(20, 2, [{ weight: 2, mean: 0, sd: 1 }, { weight: 3, mean: 2, sd: 1 }]);
  assert.equal(data.generator!.components[0].weight, .4);
});

test('generator rejects invalid size, seeds, deviations and weights', () => {
  for (const count of [0, 19, 5001, NaN, 50.5]) assert.throws(() => generateDataset(count, 42, [{ weight: 1, mean: 0, sd: 1 }]));
  assert.throws(() => generateDataset(20, 0, [{ weight: 1, mean: 0, sd: 1 }]));
  assert.throws(() => generateDataset(20, 1, [{ weight: 0, mean: 0, sd: 1 }]));
  assert.throws(() => generateDataset(20, 1, [{ weight: 1, mean: 0, sd: 0 }]));
});

test('normal maximum likelihood and information criteria match known equations', () => {
  const values = Array.from({ length: 20 }, (_, i) => i % 2 ? 1 : -1);
  const model = fitGaussianMixture(values, 1);
  assert.equal(model.components[0].mean, 0);
  assert.equal(model.components[0].sd, 1);
  assert.ok(Math.abs(model.logLikelihood - (-10 * Math.log(2 * Math.PI) - 10)) < 1e-10);
  assert.equal(model.aic, 4 - 2 * model.logLikelihood);
  assert.equal(model.bic, 2 * Math.log(20) - 2 * model.logLikelihood);
});

test('EM recovers separated components, weights and normalized posterior responsibilities', () => {
  const fit = fitGaussianMixture(mixture().records.map(r => r.value), 2, 81);
  assert.ok(fit.converged && fit.reliable);
  assert.ok(Math.abs(fit.components[0].mean + 5) < .2);
  assert.ok(Math.abs(fit.components[1].mean - 5) < .2);
  assert.ok(Math.abs(fit.components[0].weight - .4) < .05);
  assert.ok(Math.abs(fit.components[0].sd - .7) < .15);
  assert.ok(Math.abs(responsibilities(0, fit.components).reduce((a, b) => a + b) - 1) < 1e-12);
  assert.ok(responsibilities(-5, fit.components)[0] > .99);
});

test('three separated modes can be recovered', () => {
  const data = generateDataset(2000, 84, [-8, 0, 8].map(mean => ({ mean, sd: .5, weight: 1 })));
  const fit = fitGaussianMixture(data.records.map(r => r.value), 3);
  assert.ok(fit.reliable);
  fit.components.forEach((c, i) => assert.ok(Math.abs(c.mean - [-8, 0, 8][i]) < .15));
});

test('analysis selects two separated modes, preserves input and reserves disjoint evaluation data', () => {
  const data = mixture(), before = JSON.stringify(data);
  const report = analyzeDataset(data, 42);
  assert.equal(report.selectedK, 2);
  assert.equal(report.split.kind, 'random');
  assert.equal(report.split.test.length, 320);
  const training = new Set(report.split.training);
  assert.ok(report.split.test.every(i => !training.has(i)));
  assert.equal(new Set([...report.split.training, ...report.split.test]).size, 1600);
  assert.ok(report.models.every(m => Number.isFinite(m.testMeanLogLikelihood)));
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(report, analyzeDataset(data, 42));
  assert.ok(Math.abs(report.histogram.reduce((s, b) => s + b.density * b.width, 0) - 1) < 1e-12);
});

test('dated datasets use chronological holdout independent of input order', () => {
  const data = generateDataset(100, 18, [{ weight: 1, mean: 0, sd: 1 }]);
  data.records.forEach((r, i) => { r.observedAt = new Date(Date.UTC(2020, 0, i + 1)).toISOString(); });
  data.records.reverse();
  const report = analyzeDataset(data, 42);
  const lastTrain = Math.max(...report.split.training.map(i => Date.parse(data.records[i].observedAt!)));
  const firstTest = Math.min(...report.split.test.map(i => Date.parse(data.records[i].observedAt!)));
  assert.equal(report.split.kind, 'temporal');
  assert.ok(firstTest > lastTrain);
});

test('constant, small and non-finite samples do not produce misleading fits', () => {
  assert.throws(() => fitGaussianMixture(Array(20).fill(5), 1), /constante/);
  assert.throws(() => fitGaussianMixture([1, 2, 3], 1), /20/);
  assert.throws(() => fitGaussianMixture([...Array(20).fill(1), Infinity], 2));
  const data = parseNumericDataset(JSON.stringify(Array(20).fill(2)), 'constant.json');
  const report = analyzeDataset(data, 42);
  assert.equal(report.selectedK, null);
  assert.equal(report.models.length, 0);
  assert.equal(report.summary.skewness, null);
  assert.equal(report.split.kind, 'none');
});

test('standardization handles offset measurements and extreme outliers', () => {
  const offset = normal().records.map(r => r.value + 1e8);
  assert.ok(fitGaussianMixture(offset, 2).components.every(c => Number.isFinite(c.sd) && c.sd > 0));
  const values = [...normal().records.slice(0, 99).map(r => r.value), 1e8];
  const fit = fitGaussianMixture(values, 2);
  assert.ok(Number.isFinite(fit.logLikelihood));
  assert.equal(fit.reliable, false);
});

test('normal quantiles cover both tails and center', () => {
  assert.ok(Math.abs(normalQuantile(.975) - 1.9599639845) < 1e-7);
  assert.ok(Math.abs(normalQuantile(.001) + 3.090232306) < 1e-7);
  assert.equal(normalQuantile(.5), 0);
  assert.throws(() => normalQuantile(1));
});

test('CSV and JSON import round trips, rejects expressions, mixed columns and forged public origin', () => {
  const data = normal();
  assert.deepEqual(parseNumericDataset(valuesCsv(data), 'values.csv').records.map(r => r.value), data.records.map(r => r.value));
  const imported = parseNumericDataset(JSON.stringify({ ...data, origin: 'public' }), 'sample.json');
  assert.equal(imported.origin, 'imported');
  assert.equal(imported.source, data.source);
  assert.throws(() => parseNumericDataset('value\n=1+2', 'x.csv'));
  assert.throws(() => parseNumericDataset('value,other\n1,2', 'x.csv'));
  assert.throws(() => parseNumericDataset('[null]', 'x.json'));
  assert.throws(() => parseNumericDataset('9'.repeat(1000001), 'x.csv'));
});

test('public snapshots retain numeric unit, area and source and reject mixed units', () => {
  const snapshot = { sourceId: 'usgs-earthquakes', sourceName: 'USGS', records: [{ id: 'a', value: 4.2, unit: 'Mw' }],
    provenance: { publisher: 'USGS', license: 'Public domain', sourceUrl: 'https://earthquake.usgs.gov/', retrievedAt: '2026-09-05' },
    area: { label: 'Lima' }, limitations: ['Catálogo limitado'] };
  const data = datasetFromSnapshot(snapshot as any);
  assert.equal(data.unit, 'Mw'); assert.equal(data.origin, 'public'); assert.equal(data.area, 'Lima');
  assert.equal(data.records[0].value, 4.2);
  assert.throws(() => datasetFromSnapshot({ ...snapshot, records: [{ id: 'b', value: 3, unit: 'mm' }] } as any));
});

test('CRISP-DM de resiliencia es reproducible, separa la prueba y conserva límites operativos', () => {
  const settlement = SETTLEMENT_PRESETS[0];
  const scenario = DISASTER_SCENARIOS.find(item => item.id === 'landslide') ?? DISASTER_SCENARIOS[0];
  const report = runResilienceCrispDm(settlement, scenario, undefined, 77);
  assert.equal(report.phases.length, 6);
  assert.equal(report.models.length, 5);
  assert.equal(report.dataset.train + report.dataset.validation + report.dataset.test, report.dataset.total);
  assert.ok(report.models.every(model => model.metrics.rocAuc >= 0 && model.metrics.rocAuc <= 1));
  assert.ok(report.validation.bootstrapRocAuc.low <= report.validation.bootstrapRocAuc.high);
  assert.deepEqual(report, runResilienceCrispDm(settlement, scenario, undefined, 77));
  assert.ok(report.limitations.length >= 3);
});
