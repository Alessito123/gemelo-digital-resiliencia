import { analyzeDataset } from './engine';
import type { NumericDataset } from './datasets';

self.onmessage = (event: MessageEvent<{ dataset: NumericDataset; seed: number }>) => {
  try { self.postMessage({ ok: true, report: analyzeDataset(event.data.dataset, event.data.seed) }); }
  catch (error) { self.postMessage({ ok: false, error: error instanceof Error ? error.message : 'No se pudo completar el análisis.' }); }
};
