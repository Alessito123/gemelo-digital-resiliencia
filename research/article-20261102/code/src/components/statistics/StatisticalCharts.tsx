import { density, type AnalysisReport } from '../../modules/statistics/engine';

const fmt = (x: number) => new Intl.NumberFormat('es-PE', { maximumSignificantDigits: 3 }).format(x);
const W = 560, H = 260, L = 55, R = 15, T = 18, B = 45;
const xScale = (x: number, lo: number, hi: number) => L + (x - lo) / (hi - lo || 1) * (W - L - R);
const yScale = (x: number, lo: number, hi: number) => H - B - (x - lo) / (hi - lo || 1) * (H - B - T);

function Axes({ lo, hi, bottomLabel, yMax }: { lo: number; hi: number; bottomLabel: string; yMax: number }) {
  return <g className="stats-axis">
    <path d={`M${L},${T} V${H - B} H${W - R}`} />
    {[0, .25, .5, .75, 1].map(t => <g key={t}>
      <text x={xScale(lo + t * (hi - lo), lo, hi)} y={H - B + 18} textAnchor="middle">{fmt(lo + t * (hi - lo))}</text>
      <text x={L - 7} y={yScale(t * yMax, 0, yMax) + 4} textAnchor="end">{fmt(t * yMax)}</text>
    </g>)}
    <text x={W / 2} y={H - 5} textAnchor="middle">{bottomLabel}</text>
  </g>;
}

export function StatisticalCharts({ report, unit, selectedK }: { report: AnalysisReport; unit: string; selectedK: number }) {
  const model = report.models.find(m => m.k === selectedK);
  const bins = report.histogram;
  const lo = bins[0].x - bins[0].width / 2, hi = bins.at(-1)!.x + bins.at(-1)!.width / 2;
  const curve = model ? Array.from({ length: 180 }, (_, i) => {
    const x = lo + (hi - lo) * i / 179; return { x, y: density(x, model.components) };
  }) : [];
  const max = Math.max(...bins.map(b => b.density), ...curve.map(p => p.y)) * 1.15 || 1;
  const points = report.qq;
  const qlo = Math.min(...points.flatMap(p => [p.theoretical, p.observed]));
  const qhi = Math.max(...points.flatMap(p => [p.theoretical, p.observed]));
  return <div className="stats-charts">
    <figure>
      <h3>Distribución y ajuste</h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Histograma de densidad de ${report.summary.n} valores y ajuste de ${selectedK} componente(s). Eje horizontal: ${unit}; vertical: densidad.`}>
        <Axes lo={lo} hi={hi} bottomLabel={`Valor (${unit})`} yMax={max} />
        {bins.map((b, i) => <rect key={i} className="stats-bin" x={xScale(b.x - b.width / 2, lo, hi) + .5} y={yScale(b.density, 0, max)} width={Math.max(.5, xScale(b.x + b.width / 2, lo, hi) - xScale(b.x - b.width / 2, lo, hi) - 1)} height={H - B - yScale(b.density, 0, max)}>
          <title>{fmt(b.x - b.width / 2)} a {fmt(b.x + b.width / 2)}: {b.count} registros</title>
        </rect>)}
        {curve.length > 0 && <polyline className="stats-density" points={curve.map(p => `${xScale(p.x, lo, hi)},${yScale(p.y, 0, max)}`).join(' ')} />}
      </svg>
      <figcaption>Barras: densidad de toda la muestra. Línea: modelo ajustado con {model?.n ?? 0} registros. El área de las barras suma 1.</figcaption>
    </figure>
    <figure>
      <h3>Q–Q frente a una normal</h3>
      {points.length ? <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cuantiles observados frente a cuantiles de la normal ajustada. Ambos ejes en ${unit}. Desviaciones de la diagonal sugieren diferencias con la normal.`}>
        <g className="stats-axis">
          <path d={`M${L},${T} V${H - B} H${W - R}`} />
          {[0, .25, .5, .75, 1].map(t => { const v = qlo + (qhi - qlo) * t; return <g key={t}>
            <text x={xScale(v, qlo, qhi)} y={H - B + 18} textAnchor="middle">{fmt(v)}</text>
            <text x={L - 7} y={yScale(v, qlo, qhi) + 4} textAnchor="end">{fmt(v)}</text>
          </g>; })}
          <text x={W / 2} y={H - 5} textAnchor="middle">Cuantil normal teórico ({unit})</text>
        </g>
        <line className="stats-reference" x1={L} y1={H - B} x2={W - R} y2={T} />
        {points.map((p, i) => <circle key={i} className="stats-qq-point" cx={xScale(p.theoretical, qlo, qhi)} cy={yScale(p.observed, qlo, qhi)} r="2.8"><title>Teórico: {fmt(p.theoretical)}; observado: {fmt(p.observed)}</title></circle>)}
      </svg> : <p className="stats-note">Se necesita un ajuste normal válido para construir el Q–Q.</p>}
      <figcaption>Eje vertical: cuantil observado. La diagonal indica coincidencia con la normal; este gráfico no es una prueba formal de normalidad.</figcaption>
    </figure>
  </div>;
}
