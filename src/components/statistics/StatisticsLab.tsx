import { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Download } from 'lucide-react';
import { generateDataset, valuesCsv, type NumericDataset } from '../../modules/statistics/datasets';
import { responsibilities, type AnalysisReport } from '../../modules/statistics/engine';
import { DatasetControls } from './DatasetControls';
import { AnalysisResults } from './AnalysisResults';
import { ResilienceCrispDmPanel } from './ResilienceCrispDmPanel';
import type { DisasterScenario, SettlementPreset, SimulationMetrics } from '../../types';
import './statistics.css';

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function StatisticsLab({ settlementId, settlementName, settlement, scenario, metrics }: { settlementId: string; settlementName: string; settlement: SettlementPreset; scenario: DisasterScenario; metrics: SimulationMetrics }) {
  const [dataset, setDataset] = useState<NumericDataset>(() => generateDataset(600, 42, [{ mean: -3, sd: 1, weight: .5 }, { mean: 3, sd: 1, weight: .5 }]));
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [seed, setSeed] = useState(42);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('Muestra sintética de demostración lista.');
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanup = () => { worker.current?.terminate(); worker.current = null; if (timer.current) clearTimeout(timer.current); };
  useEffect(() => () => cleanup(), []);

  function replaceDataset(data: NumericDataset) {
    cleanup(); setBusy(false); setDataset(data); setReport(null); setError('');
    setAnnouncement(`Dataset cargado: ${data.title}, ${data.records.length} registros.`);
  }
  function run() {
    if (!Number.isInteger(seed) || seed < 1 || seed > 2147483647) { setError('Usa una semilla entera entre 1 y 2147483647.'); return; }
    cleanup(); setError(''); setReport(null); setBusy(true); setAnnouncement('Ajustando modelos en este equipo…');
    try {
      const current = new Worker(new URL('../../modules/statistics/analysis.worker.ts', import.meta.url), { type: 'module' });
      worker.current = current;
      const fail = (message: string) => { if (worker.current !== current) return; cleanup(); setBusy(false); setError(message); setAnnouncement('El análisis no se completó.'); };
      current.onmessage = event => {
        if (worker.current !== current) return;
        if (!event.data.ok) { fail(event.data.error); return; }
        setReport(event.data.report); setBusy(false); cleanup(); setAnnouncement('Análisis terminado. Los resultados están disponibles debajo.');
      };
      current.onerror = () => fail('No se pudo ejecutar el motor local. Recarga la página e inténtalo de nuevo.');
      timer.current = setTimeout(() => fail('El ajuste superó 45 segundos. Reduce el tamaño de muestra y reintenta.'), 45000);
      current.postMessage({ dataset, seed });
    } catch { cleanup(); setBusy(false); setError('El navegador no pudo iniciar el motor local.'); }
  }
  const exportReport = () => {
    const model = report?.models.find(m => m.k === report.selectedK);
    const posterior = model ? dataset.records.map(r => ({ id: r.id, probabilities: responsibilities(r.value, model.components) })) : undefined;
    download('laboratorio-ia.json', JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), dataset, analysis: report, posterior,
      posteriorNote: 'Probabilidades de pertenencia al modelo seleccionado, en orden ascendente de media. No son probabilidades de riesgo.' }, null, 2), 'application/json');
  };

  return <div className="statistics-lab">
    <header className="stats-heading">
      <div className="stats-title-block"><p className="eyebrow">Módulo 06 · Datos · distribuciones · evidencia</p><h2 id="stats-title"><BrainCircuit aria-hidden="true" /> Laboratorio IA y análisis avanzado</h2><p>Convierte una serie numérica en una explicación visual: elige la fuente, ajusta modelos y revisa sus límites.</p></div>
      <div className="stats-engine-badge"><span className="stats-engine-dot" aria-hidden="true" />Motor local <small>sin API key</small></div>
    </header>
    <ol className="stats-workflow" aria-label="Flujo de trabajo del laboratorio">
      <li className="is-current"><span>01</span><div><strong>Elige los datos</strong><small>Fuente pública, archivo o muestra sintética</small></div></li>
      <li><span>02</span><div><strong>Ajusta modelos</strong><small>Normal y mezclas gaussianas</small></div></li>
      <li><span>03</span><div><strong>Interpreta</strong><small>BIC, gráficos y limitaciones</small></div></li>
    </ol>
    <DatasetControls settlementId={settlementId} settlementName={settlementName} onDataset={replaceDataset} disabled={busy} />
    <article className="stats-active" aria-label="Dataset activo">
      <div><p className="eyebrow">Dataset activo</p><h3>{dataset.title}</h3><p>{dataset.variable} · {dataset.unit} · {dataset.records.length} registros</p></div>
      <span className="stats-badge">{dataset.origin === 'synthetic' ? 'Sintético' : dataset.origin === 'public' ? 'Fuente pública' : 'Importado · origen declarado'}</span>
      <dl><div><dt>Fuente</dt><dd>{dataset.source}</dd></div><div><dt>Licencia</dt><dd>{dataset.license}</dd></div>{dataset.area && <div><dt>Área de los datos</dt><dd>{dataset.area}</dd></div>}{dataset.retrievedAt && <div><dt>Consulta</dt><dd>{dataset.retrievedAt}</dd></div>}</dl>
      {dataset.sourceUrl && <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">Consultar documentación de la fuente</a>}
      <ul className="stats-note">{dataset.limitations.map((text, i) => <li key={i}>{text}</li>)}</ul>
      {dataset.records.some(r => r.value < 0) && dataset.origin === 'synthetic' && <p className="stats-note">Esta variable de demostración admite negativos. No representa directamente lluvia, población ni otra magnitud restringida a valores positivos.</p>}
      {dataset.origin === 'public' && <p className="stats-note">Los datos públicos pueden ser discretos, truncados o incluir muchos ceros. Las mezclas gaussianas no corrigen esas limitaciones y no deben interpretarse como modelos de amenaza.</p>}
    </article>
    <div className="stats-actions">
      <div className="stats-actions-copy"><span className="stats-step-label">Paso 02</span><strong>Entrena y compara</strong><small>La semilla fija hace replicable cada resultado.</small></div>
      <label>Semilla del ajuste<input type="number" value={Number.isNaN(seed) ? '' : seed} min="1" max="2147483647" step="1" disabled={busy} onChange={e => setSeed(e.target.valueAsNumber)} /></label>
      <button type="button" className="btn-primary" disabled={busy} onClick={run}><BrainCircuit size={17} aria-hidden="true" />{busy ? 'Ajustando modelos…' : 'Ajustar y comparar modelos'}</button>
      {busy && <button type="button" className="btn-secondary" onClick={() => { cleanup(); setBusy(false); setAnnouncement('Análisis cancelado. Puedes volver a ejecutarlo.'); }}>Cancelar</button>}
      <button type="button" className="btn-secondary" disabled={busy} onClick={exportReport}><Download size={16} aria-hidden="true" />Exportar JSON {report ? 'con análisis' : 'del dataset'}</button>
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => download('valores.csv', valuesCsv(dataset), 'text/csv;charset=utf-8')}>CSV de valores</button>
    </div>
    <p className="stats-note">JSON incluye procedencia, configuración y resultados disponibles. CSV contiene una columna de valores. Cambiar la semilla se aplica en la próxima ejecución; el resultado conserva la semilla con la que se calculó.</p>
    <p role="status" aria-live="polite" className="stats-status">{announcement}</p>
    {error && <p role="alert" className="stats-error">{error}</p>}
    {report && <AnalysisResults report={report} dataset={dataset} />}
    <ResilienceCrispDmPanel settlement={settlement} scenario={scenario} metrics={metrics} seed={seed} />
  </div>;
}
