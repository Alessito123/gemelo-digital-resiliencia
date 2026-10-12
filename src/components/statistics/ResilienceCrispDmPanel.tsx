import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import type { DisasterScenario, SettlementPreset, SimulationMetrics } from '../../types';
import { runResilienceCrispDm, type CrispDmReport } from '../../modules/crispdm/resilienceEngine';

interface Props {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  seed: number;
}

const format = (value: number) => value.toLocaleString('es-PE', { maximumFractionDigits: 2 });
function downloadReport(report: CrispDmReport): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'reporte-crispdm-resiliencia.json'; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function ResilienceCrispDmPanel({ settlement, scenario, metrics, seed }: Props) {
  const [refresh, setRefresh] = useState(0);
  const [threshold, setThreshold] = useState(.7);
  const report = useMemo<CrispDmReport | null>(() => {
    try { return runResilienceCrispDm(settlement, scenario, metrics, seed + refresh, threshold); } catch { return null; }
  }, [metrics, refresh, scenario, seed, settlement, threshold]);

  return (
    <section className="crispdm-panel" aria-labelledby="crispdm-title">
      <header className="crispdm-heading">
        <div>
          <p className="eyebrow">Motor aplicado al gemelo digital</p>
          <h3 id="crispdm-title"><ShieldCheck aria-hidden="true" /> CRISP-DM · Riesgo de evacuación</h3>
          <p>Entrena comparadores locales con los hogares y el escenario activo. La salida es exploratoria y trazable, no una alerta oficial.</p>
        </div>
        <div className="crispdm-controls">
          <label>Umbral de prioridad <input type="number" min=".5" max=".95" step=".05" value={threshold} onChange={(event) => setThreshold(event.target.valueAsNumber || .7)} /></label>
          <button type="button" className="btn-secondary" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={14} aria-hidden="true" /> Repetir</button>
          {report && <button type="button" className="btn-secondary" onClick={() => downloadReport(report)}>Exportar JSON</button>}
        </div>
      </header>
      {!report ? <p className="stats-error" role="alert">El motor necesita al menos 12 hogares para separar ajuste, validación y prueba.</p> : <>
        <ol className="crispdm-phases" aria-label="Fases CRISP-DM">
          {report.phases.map(phase => <li key={phase.id} className={phase.status === 'warning' ? 'is-warning' : 'is-complete'}><span>{phase.status === 'complete' ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}</span><strong>{phase.name}</strong><small>{phase.summary}</small></li>)}
        </ol>
        <div className="crispdm-overview">
          <div><span>Dataset</span><strong>{report.dataset.total} hogares</strong><small>{report.dataset.positives} casos priorizados · {Math.round(report.dataset.prevalence * 100)}% prevalencia</small></div>
          <div><span>Partición</span><strong>70 / 15 / 15</strong><small>{report.dataset.train} ajuste · {report.dataset.validation} validación · {report.dataset.test} prueba</small></div>
          <div><span>Modelo seleccionado</span><strong>{report.selectedModel}</strong><small>Umbral {Math.round(report.threshold * 100)}% · semilla {report.seed}</small></div>
          <div><span>Drift descriptivo</span><strong className={report.drift.status === 'watch' ? 'is-warning' : ''}>{report.drift.status === 'watch' ? 'Revisar' : 'Estable'}</strong><small>Desplazamiento {format(report.drift.standardizedMeanShift)}</small></div>
        </div>
        <div className="crispdm-results-grid">
          <div className="crispdm-card">
            <div className="crispdm-card-title"><Activity size={15} aria-hidden="true" /><h4>Comparación de modelos</h4></div>
            <div className="crispdm-model-list">{report.models.map(model => <article key={model.name} className={model.name === report.selectedModel ? 'is-selected' : ''}><div><strong>{model.name}</strong><small>{model.explanation}</small></div><dl><div><dt>ROC-AUC</dt><dd>{format(model.metrics.rocAuc)}</dd></div><div><dt>Recall</dt><dd>{format(model.metrics.recall)}</dd></div><div><dt>Brier</dt><dd>{format(model.metrics.brier)}</dd></div></dl></article>)}</div>
          </div>
          <div className="crispdm-card">
            <div className="crispdm-card-title"><ShieldCheck size={15} aria-hidden="true" /><h4>Validación responsable</h4></div>
            <dl className="crispdm-stat-list"><div><dt>ROC-AUC bootstrap 90%</dt><dd>{format(report.validation.bootstrapRocAuc.low)}–{format(report.validation.bootstrapRocAuc.high)}</dd></div><div><dt>Brecha de selección</dt><dd>{report.fairness.selectionRateGap === null ? 'n/d' : format(report.fairness.selectionRateGap)}</dd></div><div><dt>Brecha de recall</dt><dd>{report.fairness.recallGap === null ? 'n/d' : format(report.fairness.recallGap)}</dd></div><div><dt>Feature dominante</dt><dd>{report.featureImportance[0]?.label ?? 'n/d'}</dd></div><div><dt>DeLong aproximado</dt><dd>{report.validation.delongPApprox === null ? 'n/d' : format(report.validation.delongPApprox)}</dd></div><div><dt>McNemar aproximado</dt><dd>{report.validation.mcnemarPApprox === null ? 'n/d' : format(report.validation.mcnemarPApprox)}</dd></div></dl>
            <p className="stats-note">{report.fairness.note} {report.drift.note}</p>
          </div>
        </div>
        <div className="crispdm-footer-note"><span><AlertTriangle size={14} aria-hidden="true" />{report.limitations[0]}</span><span>{report.individual ? `Hogar de muestra: ${report.individual.id} · riesgo ${Math.round(report.individual.probability * 100)}% · ${report.individual.level}` : 'Sin predicción individual disponible.'}</span></div>
      </>}
    </section>
  );
}
