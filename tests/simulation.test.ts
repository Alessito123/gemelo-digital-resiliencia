import assert from 'node:assert/strict';
import test from 'node:test';
import { SETTLEMENT_PRESETS } from '../src/data/settlementPresets';
import { DISASTER_SCENARIOS } from '../src/data/disasterScenarios';
import { calibrateSettlement, createSimulation, runSimulation } from '../src/modules/simulation/simulationEngine';

const settlement = SETTLEMENT_PRESETS[0];
const scenario = DISASTER_SCENARIOS.find((item) => item.id === 'compound')!;

test('same seed and configuration produce identical research results', () => {
  const config = { seed: 202609, hazardIntensity: 8, warningLeadTimeMin: 45, enableMutualAid: true, enableMultiScaleFeedback: true };
  const first = runSimulation(createSimulation(settlement, scenario, config), config, 18);
  const second = runSimulation(createSimulation(settlement, scenario, config), config, 18);
  assert.deepEqual(first.metrics, second.metrics);
  assert.deepEqual(first.settlement.households, second.settlement.households);
});

test('multi-scale feedback produces an observable system outcome', () => {
  const base = { seed: 91, hazardIntensity: 9, warningLeadTimeMin: 30, enableMutualAid: true };
  const coupledConfig = { ...base, enableMultiScaleFeedback: true };
  const isolatedConfig = { ...base, enableMultiScaleFeedback: false };
  const coupled = runSimulation(createSimulation(settlement, scenario, coupledConfig), coupledConfig, 20);
  const isolated = runSimulation(createSimulation(settlement, scenario, isolatedConfig), isolatedConfig, 20);
  assert.notDeepEqual(coupled.metrics, isolated.metrics);
  assert.equal(coupled.metrics.multiScaleFeedbackActive, true);
  assert.equal(isolated.metrics.multiScaleFeedbackActive, false);
});

test('compound scenario reports tsunami and complete impact metrics', () => {
  const config = { seed: 7, hazardIntensity: 10, warningLeadTimeMin: 15, enableMutualAid: true, enableMultiScaleFeedback: true };
  const result = runSimulation(createSimulation(settlement, scenario, config), config, 16);
  assert.ok((scenario.parameters.tsunamiWaveHeightM ?? 0) > 0);
  assert.ok(result.metrics.affectedPeople >= 0);
  assert.ok(result.metrics.estimatedEconomicLossUsd >= 0);
  assert.ok(result.metrics.estimatedRecoveryTimeHours >= 0);
  assert.ok(result.metrics.displacedPeople >= 0);
  assert.ok(result.fragilityPoints.length > 0);
});

test('aggregated community evidence calibrates social and warning parameters without PII', () => {
  const calibrated = calibrateSettlement(settlement, {
    responseCount: 120, warningAccessPct: 80, institutionalTrustPct: 55,
    mutualAidPct: 76, mobilityConstraintPct: 22, priorDisasterExperiencePct: 64,
  });
  assert.equal(calibrated.institutionalTrustScore, 0.55);
  assert.equal(calibrated.socialCapitalIndex, 0.76);
  assert.equal(calibrated.households.filter((item) => item.earlyWarningAccess).length, Math.round(calibrated.households.length * 0.8));
});
