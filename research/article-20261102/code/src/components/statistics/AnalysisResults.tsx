import { useState } from 'react';
import { type AnalysisReport } from '../../modules/statistics/engine';
import type { NumericDataset } from '../../modules/statistics/datasets';
import { StatisticalCharts } from './StatisticalCharts';

const format = (x: number | null | undefined) => x == null || !Number.isFinite(x) ? 'No disponible' : new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(x);

export function AnalysisResults({ report, dataset }: { report: AnalysisReport; dataset: NumericDataset }) {
  const [viewK, setViewK] = useState(report.selectedK ?? report.models[0]?.k ?? 1);
  const model = report.models.find(m => m.k === viewK);
  const selected = report.models.find(m => m.k === report.selectedK);
  return <div className="stats-results">
    <div className="stats-result-heading">
      <div><p className="eyebrow">Aprendizaje no supervisado · cálculo local</p><h3>{selected ? `BIC favorece ${selected.k === 1 ? 'una normal' : `una mezcla de ${selected.k} componentes`}` : 'No hay un modelo estable seleccionable'}</h3></div>
      <span className="stats-badge">{report.split.training.length} ajuste / {report.split.test.length} evaluación</span>
    </div>
    <p className="stats-note">{selected ? `Es el menor BIC entre los ajustes estables probados en la misma muestra. No demuestra que existan ${selected.k} grupos reales ni confirma normalidad.` : 'Consulta los avisos y revisa el tamaño y la variabilidad de los datos.'}</p>
    <dl className="stats-summary">
      {([['Registros', report.summary.n], ['Media', report.summary.mean], ['Mediana', report.summary.median], ['Desviación muestral', report.summary.sd], ['Asimetría', report.summary.skewness], ['Exceso de curtosis', report.summary.excessKurtosis]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{format(value)}</dd></div>)}
    </dl>
    <p className="stats-note">Media, mediana y desviación en {dataset.unit}. Asimetría y curtosis son momentos descriptivos adimensionales. Q1: {format(report.summary.q1)} · Q3: {format(report.summary.q3)} · Rango: {format(report.summary.min)} a {format(report.summary.max)} {dataset.unit}.</p>
    {report.models.length > 0 && <>
      <div className="stats-table-scroll" tabIndex={0} role="region" aria-label="Comparación de modelos, desplazable horizontalmente">
        <table><caption>Comparación de modelos sobre {report.split.training.length} registros de ajuste</caption>
          <thead><tr><th scope="col">Modelo</th><th scope="col">AIC ↓</th><th scope="col">BIC ↓</th><th scope="col">Δ BIC*</th><th scope="col">Log-densidad en prueba ↑</th><th scope="col">Estado</th></tr></thead>
          <tbody>{report.models.map(m => <tr key={m.k} data-selected={m.k === report.selectedK}>
            <th scope="row">{m.k === 1 ? 'Normal' : `Mezcla ${m.k}`}{m.k === report.selectedK ? ' · menor BIC estable' : ''}</th>
            <td>{format(m.aic)}</td><td>{format(m.bic)}</td><td>{m.reliable && selected ? format(m.bic - selected.bic) : '—'}</td>
            <td>{format(m.testMeanLogLikelihood)}</td><td>{m.reliable ? 'Estable' : 'Revisar avisos'} · {m.iterations} iter.</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="stats-note">↓ Menor es mejor; ↑ mayor es mejor. *Δ BIC respecto al mejor ajuste estable. La normal se calcula directamente (0 iteraciones). AIC/BIC comparan ajustes, no porcentajes de precisión.</p>
      <p className="stats-note">{report.split.kind === 'none' ? 'Sin evaluación reservada: se requieren al menos 80 registros. Toda la muestra se usó para ajustar.' : `Evaluación reservada: 20% de los registros, con división ${report.split.kind === 'temporal' ? 'cronológica (fechas más recientes para prueba)' : 'aleatoria reproducible'}. Ningún registro de prueba se usó en el ajuste o la selección por BIC. La log-densidad media en prueba depende de la unidad y solo es comparable para esta variable.`}</p>
      <label className="stats-mode">Modelo a inspeccionar<select value={viewK} onChange={e => setViewK(Number(e.target.value))}>
        {report.models.map(m => <option key={m.k} value={m.k}>{m.k === 1 ? 'Normal' : `Mezcla de ${m.k} normales`}{m.reliable ? '' : ' (con avisos)'}</option>)}
      </select></label>
    </>}
    <StatisticalCharts report={report} unit={dataset.unit} selectedK={viewK} />
    {model && <div className="stats-table-scroll" tabIndex={0} role="region" aria-label="Parámetros aprendidos">
      <table><caption>Parámetros aprendidos · {viewK} componente(s) · {model.converged ? 'convergió' : 'sin convergencia'}</caption>
        <thead><tr><th scope="col">Componente</th><th scope="col">Peso</th><th scope="col">Media μ ({dataset.unit})</th><th scope="col">Desviación σ ({dataset.unit})</th><th scope="col">Registros efectivos</th></tr></thead>
        <tbody>{model.components.map((c, i) => <tr key={i}><th scope="row">{i + 1}</th><td>{format(c.weight * 100)}%</td><td>{format(c.mean)}</td><td>{format(c.sd)}</td><td>{format(c.weight * model.n)}</td></tr>)}</tbody>
      </table>
    </div>}
    {dataset.generator && <details><summary>Parámetros originales de la muestra sintética</summary><p className="stats-note">Semilla generadora: {dataset.generator.seed}. Compáralos con los parámetros aprendidos; los componentes están ordenados por su media en el ajuste.</p>
      <ul>{dataset.generator.components.map((c, i) => <li key={i}>Componente {i + 1}: μ = {format(c.mean)}, σ = {format(c.sd)}, peso = {format(c.weight * 100)}%.</li>)}</ul>
    </details>}
    {(report.skipped.length > 0 || report.models.some(m => m.warnings.length)) && <div className="stats-warnings" role="status"><strong>Avisos del ajuste</strong><ul>
      {report.skipped.map(s => <li key={s}>{s}</li>)}
      {report.models.flatMap(m => m.warnings.map(w => <li key={`${m.k}-${w}`}>{m.k} componente(s): {w}</li>))}
    </ul></div>}
    <details><summary>Valores de los gráficos y método</summary>
      <p className="stats-note">{report.engine}. Semilla de ajuste: {report.seed}. AIC = 2p − 2ℓ; BIC = p·ln(n) − 2ℓ, con p = 3k − 1. No se calculan p-valores de normalidad.</p>
      <div className="stats-table-scroll" tabIndex={0} role="region" aria-label="Datos del histograma"><table><caption>Histograma numérico</caption><thead><tr><th>Centro ({dataset.unit})</th><th>Ancho</th><th>Registros</th><th>Densidad</th></tr></thead><tbody>{report.histogram.map((b, i) => <tr key={i}><td>{format(b.x)}</td><td>{format(b.width)}</td><td>{b.count}</td><td>{format(b.density)}</td></tr>)}</tbody></table></div>
      <div className="stats-table-scroll" tabIndex={0} role="region" aria-label="Datos del gráfico Q–Q"><table><caption>Cuantiles Q–Q ({dataset.unit})</caption><thead><tr><th>Normal teórico</th><th>Observado</th></tr></thead><tbody>{report.qq.map((p, i) => <tr key={i}><td>{format(p.theoretical)}</td><td>{format(p.observed)}</td></tr>)}</tbody></table></div>
    </details>
  </div>;
}
