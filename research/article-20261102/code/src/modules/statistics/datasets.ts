import type { PublicDataSnapshot } from '../../types';

export interface GaussianComponent { weight: number; mean: number; sd: number }
export interface NumericRecord { value: number; id: string; observedAt?: string }
export interface NumericDataset {
  title: string;
  variable: string;
  unit: string;
  origin: 'synthetic' | 'public' | 'imported';
  source: string;
  license: string;
  retrievedAt?: string;
  sourceUrl?: string;
  area?: string;
  limitations: string[];
  records: NumericRecord[];
  generator?: { seed: number; components: GaussianComponent[] };
}
export const MAX_SAMPLES = 5000;
const validValue = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1e9;
const object = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function randomFromSeed(seed: number): () => number {
  if (!Number.isInteger(seed) || seed < 1 || seed > 2147483647) throw new Error('La semilla debe ser un entero entre 1 y 2147483647.');
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function validateValues(values: number[]): void {
  if (!values.length || values.length > MAX_SAMPLES) throw new Error(`Se requieren entre 1 y ${MAX_SAMPLES} valores.`);
  if (!values.every(validValue)) throw new Error('Cada valor debe ser finito y estar entre −1.000.000.000 y 1.000.000.000.');
}

export function generateDataset(count: number, seed: number, components: GaussianComponent[]): NumericDataset {
  if (!Number.isInteger(count) || count < 20 || count > MAX_SAMPLES) throw new Error(`El tamaño debe ser un entero entre 20 y ${MAX_SAMPLES}.`);
  if (components.length < 1 || components.length > 3 || components.some(c => !validValue(c.mean) || Math.abs(c.mean) > 1e6 || !Number.isFinite(c.sd) || c.sd < 0.001 || c.sd > 1e6 || !Number.isFinite(c.weight) || c.weight <= 0 || c.weight > 1e6)) {
    throw new Error('Usa 1–3 componentes, medias entre ±1.000.000, desviaciones entre 0,001 y 1.000.000 y pesos positivos hasta 1.000.000.');
  }
  const total = components.reduce((s, c) => s + c.weight, 0);
  const normalized = components.map(c => ({ ...c, weight: c.weight / total }));
  const random = randomFromSeed(seed);
  const records = Array.from({ length: count }, (_, i) => {
    const choice = random();
    let sum = 0;
    const c = normalized.find(c => { sum += c.weight; return choice < sum; }) ?? normalized.at(-1)!;
    const z = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    return { id: `sample-${i + 1}`, value: c.mean + c.sd * z };
  });
  return {
    title: normalized.length === 1 ? 'Muestra normal' : `Mezcla de ${normalized.length} normales`,
    variable: 'Variable de demostración', unit: 'u', origin: 'synthetic', source: 'Generador local Box–Muller', license: 'CC0-1.0',
    limitations: ['Datos sintéticos con parámetros conocidos; no representan mediciones de un desastre.'],
    generator: { seed, components: normalized }, records,
  };
}

export function datasetFromSnapshot(snapshot: PublicDataSnapshot): NumericDataset {
  if (!object(snapshot) || !Array.isArray(snapshot.records) || !object(snapshot.provenance) || !object(snapshot.area)) throw new Error('La fuente devolvió un dataset inválido.');
  if (!['usgs-earthquakes', 'nasa-power'].includes(snapshot.sourceId)) throw new Error('Esta fuente no ofrece una serie numérica compatible. Usa USGS o NASA POWER.');
  const unit = snapshot.sourceId === 'usgs-earthquakes' ? 'Mw' : 'mm/día';
  const records = snapshot.records.filter(r => r.value !== undefined).map(r => {
    if (r.unit !== unit || !validValue(r.value)) throw new Error('La fuente contiene valores o unidades incompatibles.');
    return { id: r.id, value: r.value, observedAt: r.observedAt };
  });
  validateValues(records.map(r => r.value));
  return {
    title: snapshot.sourceName, variable: snapshot.sourceId === 'usgs-earthquakes' ? 'Magnitud sísmica' : 'Precipitación diaria',
    unit, origin: 'public', source: snapshot.provenance.publisher, sourceUrl: snapshot.provenance.sourceUrl,
    license: snapshot.provenance.license, retrievedAt: snapshot.provenance.retrievedAt, area: snapshot.area.label,
    limitations: [...snapshot.limitations, 'Serie acotada y posiblemente dependiente en el tiempo. Un ajuste gaussiano es exploratorio; no demuestra normalidad.'], records,
  };
}

export function parseNumericDataset(raw: string, filename: string): NumericDataset {
  if (raw.length > 1_000_000) throw new Error('El archivo supera 1 MB.');
  const base: NumericDataset = { title: filename.slice(0, 200), variable: 'Valor importado', unit: 'u', origin: 'imported', source: 'Archivo local del investigador', license: 'No declarada', limitations: ['Procedencia y unidades declaradas por el investigador, sin verificación externa.'], records: [] };
  if (filename.toLowerCase().endsWith('.json')) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error('JSON inválido.'); }
    // Reimport an exported report or a standalone dataset. Never trust a claimed public origin.
    if (object(parsed) && object(parsed.dataset)) parsed = parsed.dataset;
    const entries = Array.isArray(parsed) ? parsed : object(parsed) ? parsed.records : undefined;
    if (!Array.isArray(entries)) throw new Error('El JSON requiere una lista de números o un objeto con records: [{ value }].');
    if (entries.length > MAX_SAMPLES) throw new Error(`Máximo ${MAX_SAMPLES} registros.`);
    base.records = entries.map((entry, i) => {
      const value = object(entry) ? entry.value : entry;
      if (!validValue(value)) throw new Error(`Registro ${i + 1}: valor numérico inválido.`);
      const observedAt = object(entry) && typeof entry.observedAt === 'string' ? entry.observedAt : undefined;
      if (observedAt && !Number.isFinite(Date.parse(observedAt))) throw new Error(`Registro ${i + 1}: fecha inválida.`);
      return { id: `import-${i + 1}`, value, observedAt };
    });
    if (object(parsed)) {
      for (const key of ['title', 'variable', 'unit', 'source', 'license', 'area'] as const) {
        if (typeof parsed[key] === 'string' && parsed[key].trim()) base[key] = parsed[key].trim().slice(0, 200);
      }
      if (typeof parsed.sourceUrl === 'string' && /^https:\/\//i.test(parsed.sourceUrl)) base.sourceUrl = parsed.sourceUrl.slice(0, 1000);
      if (Array.isArray(parsed.limitations)) base.limitations.push(...parsed.limitations.filter((s): s is string => typeof s === 'string').slice(0, 10).map(s => s.slice(0, 500)));
    }
  } else {
    const lines = raw.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (/^(value|valor)$/i.test(lines[0] ?? '')) lines.shift();
    base.records = lines.map((line, i) => {
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(line)) throw new Error(`Fila ${i + 1}: usa una sola columna numérica y punto decimal; cabecera opcional «value».`);
      return { id: `import-${i + 1}`, value: Number(line) };
    });
  }
  validateValues(base.records.map(r => r.value));
  return base;
}

export function valuesCsv(dataset: NumericDataset): string {
  // Numeric-only CSV avoids formula injection and can be imported without loss of precision.
  validateValues(dataset.records.map(r => r.value));
  return 'value\r\n' + dataset.records.map(r => String(r.value)).join('\r\n');
}
