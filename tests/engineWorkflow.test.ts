import assert from 'node:assert/strict';
import test from 'node:test';
import { runResilienceWorkflow } from '../src/modules/engine/resilienceWorkflow';
import { EngineAdvisor } from '../src/modules/engine/contracts';

const baseInput = {
  settlementId: 'medellin-comuna13',
  scenarioId: 'compound' as const,
  config: {
    seed: 77,
    hazardIntensity: 9,
    warningLeadTimeMin: 45,
    enableMutualAid: true,
    enableMultiScaleFeedback: true,
    steps: 14,
  },
  language: 'es' as const,
  includeProtocol: true,
};

test('LangGraph workflow executes a complete deterministic run without credentials', async () => {
  const first = await runResilienceWorkflow(baseInput);
  const second = await runResilienceWorkflow(baseInput);

  assert.deepEqual(first, second);
  assert.equal(first.engineVersion, 'langgraph-1');
  assert.match(first.executionId, /^run-[a-f0-9]{8}$/);
  assert.equal(first.analysisSource, 'heuristic-engine');
  assert.equal(first.validation.status, 'illustrative');
  assert.ok(first.simulation.metrics.affectedPeople >= 0);
  assert.ok(first.simulation.fragilityPoints.length > 0);
  assert.ok(first.protocol);
  assert.deepEqual(first.trace.map((entry) => entry.node), [
    'resolve-context',
    'calibrate',
    'simulate',
    'mark-illustrative',
    'analyze',
    'build-protocol',
    'finalize',
  ]);
});

test('observed evidence follows the validation branch and preserves provenance', async () => {
  const result = await runResilienceWorkflow({
    ...baseInput,
    dataset: {
      metadata: {
        title: 'Observaciones históricas de prueba',
        source: 'Archivo municipal verificado',
        observedAt: '2024-12-01',
        license: 'CC-BY-4.0',
        evidenceLevel: 'observed' as const,
      },
      observations: [
        { timeMin: 35, evacuationRatePct: 62, structuralDamagePct: 48, affectedPeople: 310 },
      ],
    },
  });

  assert.equal(result.validation.status, 'validated-against-observation');
  assert.equal(result.validation.sourceLabel, 'Archivo municipal verificado');
  assert.ok(result.trace.some((entry) => entry.node === 'validate-evidence'));
  assert.ok(!result.trace.some((entry) => entry.node === 'mark-illustrative'));
});

test('protocol branch can be skipped explicitly', async () => {
  const result = await runResilienceWorkflow({ ...baseInput, includeProtocol: false });

  assert.equal(result.protocol, null);
  assert.ok(result.trace.some((entry) => entry.node === 'skip-protocol' && entry.status === 'skipped'));
});

test('failed external advisor degrades to the bounded local advisor', async () => {
  const failingAdvisor: EngineAdvisor = {
    source: 'test-external-advisor',
    async analyze() { throw new Error('provider unavailable'); },
    async generateProtocol() { throw new Error('provider unavailable'); },
  };

  const result = await runResilienceWorkflow(baseInput, { advisor: failingAdvisor });

  assert.equal(result.analysisSource, 'heuristic-engine');
  assert.ok(result.warnings.includes('ADVISOR_FALLBACK'));
  assert.ok(result.analysis.criticalRisks.length > 0);
  assert.ok(result.protocol);
});

test('invalid workflow input is rejected before graph execution', async () => {
  await assert.rejects(
    () => runResilienceWorkflow({ ...baseInput, config: { ...baseInput.config, steps: 500 } }),
    /La solicitud del motor no es válida/,
  );
});

