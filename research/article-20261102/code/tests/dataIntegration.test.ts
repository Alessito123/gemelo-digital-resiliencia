import assert from 'node:assert/strict';
import test from 'node:test';
import { parseResearchDataset } from '../src/modules/data/dataIntegration';

test('accepts bounded observations with explicit provenance', () => {
  const result = parseResearchDataset(JSON.stringify({
    metadata: { title: 'Registro municipal', source: 'Defensa Civil', observedAt: '2025-04-02', license: 'CC-BY-4.0', evidenceLevel: 'observed' },
    observations: [{ timeMin: 30, evacuationRatePct: 42, structuralDamagePct: 18, affectedPeople: 320 }],
  }));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.dataset.observations[0].evacuationRatePct, 42);
});

test('rejects observations without provenance and out-of-range percentages', () => {
  const result = parseResearchDataset(JSON.stringify({ observations: [{ timeMin: 1, evacuationRatePct: 140 }] }));
  assert.equal(result.ok, false);
});

