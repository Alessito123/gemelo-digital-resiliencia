import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSimulation } from '../src/modules/validation/validationLab';

test('does not claim validation from synthetic evidence', () => {
  const report = validateSimulation(
    { evacuationRatePct: 60, estimatedStructuralDamagePct: 20, affectedPeople: 300 },
    { metadata: { title: 'Demo', source: 'Local', observedAt: '2026-01-01', license: 'MIT', evidenceLevel: 'synthetic' }, observations: [{ timeMin: 30, evacuationRatePct: 55, structuralDamagePct: 22, affectedPeople: 290 }] },
  );
  assert.equal(report.status, 'illustrative');
  assert.ok(report.meanAbsoluteError >= 0);
});

test('observed evidence produces a traceable validation report', () => {
  const report = validateSimulation(
    { evacuationRatePct: 60, estimatedStructuralDamagePct: 20, affectedPeople: 300 },
    { metadata: { title: 'Evento observado', source: 'Municipio', observedAt: '2025-01-01', license: 'CC-BY-4.0', evidenceLevel: 'observed' }, observations: [{ timeMin: 30, evacuationRatePct: 58, structuralDamagePct: 21, affectedPeople: 305 }] },
  );
  assert.equal(report.status, 'validated-against-observation');
  assert.equal(report.comparedMetrics, 3);
});
