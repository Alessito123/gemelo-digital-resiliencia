import { GaussianComponent, NumericDataset, randomFromSeed, validateValues } from './datasets';

export interface ModelFit {
  k: number; n: number; components: GaussianComponent[]; logLikelihood: number; aic: number; bic: number;
  iterations: number; converged: boolean; reliable: boolean; warnings: string[]; testMeanLogLikelihood?: number;
}
export interface AnalysisReport {
  engine: string; seed: number; summary: ReturnType<typeof describe>;
  models: ModelFit[]; selectedK: number | null; skipped: string[];
  split: { kind: 'none' | 'temporal' | 'random'; training: number[]; test: number[] };
  histogram: { x: number; density: number; count: number; width: number }[];
  qq: { theoretical: number; observed: number }[];
}
export function quantile(sorted: number[], p: number): number {
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  return sorted[lo] + (sorted[Math.ceil(index)] - sorted[lo]) * (index - lo);
}
export function describe(values: number[]) {
  validateValues(values);
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const mean = values.reduce((s, x) => s + x, 0) / n;
  const m2 = values.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const sd = Math.sqrt(m2);
  return { n, mean, sd: n > 1 ? Math.sqrt(m2 * n / (n - 1)) : 0, min: sorted[0], max: sorted[n - 1],
    median: quantile(sorted, .5), q1: quantile(sorted, .25), q3: quantile(sorted, .75),
    skewness: sd ? values.reduce((s, x) => s + ((x - mean) / sd) ** 3, 0) / n : null,
    excessKurtosis: sd ? values.reduce((s, x) => s + ((x - mean) / sd) ** 4, 0) / n - 3 : null };
}

const LOG_2PI = Math.log(2 * Math.PI);
function logTerms(x: number, components: GaussianComponent[]): number[] {
  return components.map(c => Math.log(c.weight) - Math.log(c.sd) - .5 * LOG_2PI - .5 * ((x - c.mean) / c.sd) ** 2);
}
function logSum(terms: number[]): number {
  const max = Math.max(...terms);
  return max + Math.log(terms.reduce((s, t) => s + Math.exp(t - max), 0));
}
export function logDensity(x: number, components: GaussianComponent[]): number { return logSum(logTerms(x, components)); }
export function density(x: number, components: GaussianComponent[]): number { return Math.exp(logDensity(x, components)); }
export function responsibilities(x: number, components: GaussianComponent[]): number[] {
  const terms = logTerms(x, components), total = logSum(terms);
  return terms.map(t => Math.exp(t - total));
}

export function fitGaussianMixture(values: number[], k: number, seed = 42): ModelFit {
  validateValues(values);
  if (![1, 2, 3].includes(k)) throw new Error('Solo se admiten 1–3 componentes.');
  if (values.length < Math.max(20, k * 10)) throw new Error(`Se requieren al menos ${Math.max(20, k * 10)} valores para ${k} componente(s).`);
  const random = randomFromSeed(seed);
  const n = values.length;
  const center = values.reduce((s, x) => s + x, 0) / n;
  const scale = Math.sqrt(values.reduce((s, x) => s + (x - center) ** 2, 0) / n);
  if (scale <= Math.max(1, Math.abs(center)) * 1e-12) throw new Error('La muestra es constante o su variación es demasiado pequeña para un ajuste estable.');
  const xs = values.map(x => (x - center) / scale);
  const sorted = [...xs].sort((a, b) => a - b);
  let best: ModelFit | undefined;
  for (let start = 0; start < (k === 1 ? 1 : 5); start++) {
    let cs: GaussianComponent[] = Array.from({ length: k }, (_, j) => ({ weight: 1 / k,
      mean: k === 1 ? 0 : start === 0 ? quantile(sorted, (j + .5) / k) : sorted[Math.floor(random() * n)], sd: k === 1 ? 1 : .7 }));
    let ll = xs.reduce((s, x) => s + logDensity(x, cs), 0), converged = k === 1, iterations = 0;
    for (; !converged && iterations < 250; iterations++) {
      const rs = xs.map(x => responsibilities(x, cs));
      const next = cs.map((old, j) => {
        const mass = rs.reduce((s, row) => s + row[j], 0);
        if (mass < 1e-8) return { ...old, weight: 1e-10 };
        const mean = xs.reduce((s, x, i) => s + rs[i][j] * x, 0) / mass;
        const variance = xs.reduce((s, x, i) => s + rs[i][j] * (x - mean) ** 2, 0) / mass;
        return { weight: mass / n, mean, sd: Math.sqrt(Math.max(1e-4, variance)) };
      });
      const totalWeight = next.reduce((s, c) => s + c.weight, 0);
      next.forEach(c => { c.weight /= totalWeight; });
      const nextLl = xs.reduce((s, x) => s + logDensity(x, next), 0);
      converged = Math.abs(nextLl - ll) < 1e-7 * (1 + Math.abs(ll));
      cs = next; ll = nextLl;
    }
    const warnings: string[] = [];
    if (!converged) warnings.push('Se alcanzó el límite de iteraciones sin convergencia.');
    if (cs.some(c => c.sd <= .01001)) warnings.push('Una varianza alcanzó el límite de regularización; posible componente degenerado.');
    if (cs.some(c => c.weight * n < 3)) warnings.push('Algún componente tiene menos de tres registros efectivos.');
    if (cs.some((c, i) => cs.some((other, j) => j > i && Math.abs(c.mean - other.mean) < .05 * Math.min(c.sd, other.sd) && Math.abs(c.sd - other.sd) < .05 * Math.min(c.sd, other.sd)))) {
      warnings.push('Hay componentes prácticamente idénticos; la mezcla no identifica grupos distintos.');
    }
    const components = cs.map(c => ({ weight: c.weight, mean: center + c.mean * scale, sd: c.sd * scale })).sort((a, b) => a.mean - b.mean);
    const logLikelihood = ll - n * Math.log(scale);
    const parameters = 3 * k - 1;
    const fit: ModelFit = { k, n, components, logLikelihood, aic: 2 * parameters - 2 * logLikelihood,
      bic: parameters * Math.log(n) - 2 * logLikelihood, iterations, converged, reliable: !warnings.length, warnings };
    // Prefer usable fits over singular or unconverged high-likelihood solutions.
    if (!best || (fit.reliable && !best.reliable) || (fit.reliable === best.reliable && fit.logLikelihood > best.logLikelihood)) best = fit;
  }
  return best!;
}

// Acklam's inverse standard-normal CDF approximation (central + tail rational forms).
export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error('La probabilidad debe estar entre 0 y 1, sin extremos.');
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-.00778489400243029, -.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [.00778469570904146, .32246712907004, 2.445134137143, 3.75440866190742];
  if (p < .02425 || p > .97575) {
    const q = Math.sqrt(-2 * Math.log(p < .5 ? p : 1 - p));
    const value = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    return p < .5 ? value : -value;
  }
  const q = p - .5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function analyzeDataset(dataset: NumericDataset, seed: number): AnalysisReport {
  const values = dataset.records.map(r => r.value), summary = describe(values);
  const random = randomFromSeed(seed);
  const indices = values.map((_, i) => i);
  const temporal = dataset.records.every(r => r.observedAt && Number.isFinite(Date.parse(r.observedAt)));
  if (temporal) indices.sort((a, b) => Date.parse(dataset.records[a].observedAt!) - Date.parse(dataset.records[b].observedAt!));
  else for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
  const cut = values.length >= 80 ? Math.floor(values.length * .8) : values.length;
  const split: AnalysisReport['split'] = { kind: cut === values.length ? 'none' : temporal ? 'temporal' : 'random', training: indices.slice(0, cut), test: indices.slice(cut) };
  const training = split.training.map(i => values[i]), test = split.test.map(i => values[i]);
  const models: ModelFit[] = [], skipped: string[] = [];
  for (const k of [1, 2, 3]) {
    try {
      const model = fitGaussianMixture(training, k, seed);
      if (test.length) model.testMeanLogLikelihood = test.reduce((s, x) => s + logDensity(x, model.components), 0) / test.length;
      models.push(model);
    } catch (error) { skipped.push(`${k} componente(s): ${error instanceof Error ? error.message : 'Ajuste no disponible.'}`); }
  }
  const sorted = [...values].sort((a, b) => a - b);
  const spread = summary.max - summary.min;
  const bins = spread === 0 ? 1 : Math.min(40, Math.max(6, Math.ceil(Math.sqrt(values.length))));
  const width = spread === 0 ? 1 : spread / bins;
  const start = spread === 0 ? summary.min - .5 : summary.min;
  const histogram = Array.from({ length: bins }, (_, i) => ({ x: start + (i + .5) * width, density: 0, count: 0, width }));
  values.forEach(x => { histogram[Math.min(bins - 1, Math.max(0, Math.floor((x - start) / width)))].count++; });
  histogram.forEach(bin => { bin.density = bin.count / (values.length * width); });
  const normal = models.find(m => m.k === 1)?.components[0];
  const qq = normal ? Array.from({ length: Math.min(100, values.length) }, (_, i) => i) : [];
  // Fixed plotting positions exclude infinite tails; interpolate empirical quantiles.
  const qqPoints = qq.map((_, i) => { const p = (i + .5) / qq.length; return { theoretical: normal!.mean + normal!.sd * normalQuantile(p), observed: quantile(sorted, p) }; });
  const selected = models.filter(m => m.reliable).sort((a, b) => a.bic - b.bic)[0];
  return { engine: 'GMM-EM univariado v1; 5 inicios; varianza mínima estandarizada 0.0001; tolerancia 1e-7; máximo 250 iteraciones', seed, summary, models, selectedK: selected?.k ?? null, skipped, split, histogram, qq: qqPoints };
}
