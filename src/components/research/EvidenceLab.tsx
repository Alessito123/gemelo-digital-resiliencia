import { useMemo, useState } from 'react';
import { BadgeCheck, Beaker, CircleDashed, DatabaseZap, Fingerprint, Scale } from 'lucide-react';
import { CommunitySurveyAggregate, ResearchDataset, SimulationMetrics } from '../../types';
import { ILLUSTRATIVE_DATASET } from '../../modules/data/dataIntegration';
import { validateSimulation } from '../../modules/validation/validationLab';
import { CommunitySurveyCard } from './CommunitySurveyCard';
import { DatasetImporter } from './DatasetImporter';

interface Props {
  metrics: SimulationMetrics;
  seed: number;
  onSeedChange: (seed: number) => void;
  onApplySurvey: (survey: CommunitySurveyAggregate) => void;
}

const number = new Intl.NumberFormat('es-419', { maximumFractionDigits: 1 });

export function EvidenceLab({ metrics, seed, onSeedChange, onApplySurvey }: Props) {
  const [dataset, setDataset] = useState<ResearchDataset>(ILLUSTRATIVE_DATASET);
  const report = useMemo(() => validateSimulation(metrics, dataset), [metrics, dataset]);
  const isObserved = dataset.metadata.evidenceLevel === 'observed';

  return (
    <section className="evidence-lab" aria-labelledby="evidence-title">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Trazabilidad científica</p>
          <h2 id="evidence-title">Laboratorio de evidencia</h2>
          <p>Distingue lo observado, lo calibrado y lo sintético antes de interpretar un resultado.</p>
        </div>
        <span className={isObserved ? 'evidence-status evidence-status--observed' : 'evidence-status'}>
          {isObserved ? <BadgeCheck aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}
          {isObserved ? 'Comparación observada' : 'Flujo ilustrativo'}
        </span>
      </header>

      <div className="evidence-summary">
        <div><Fingerprint aria-hidden="true" /><span>Semilla reproducible<strong>{number.format(seed)}</strong></span></div>
        <div><DatabaseZap aria-hidden="true" /><span>Fuente activa<strong>{dataset.metadata.source}</strong></span></div>
        <div><Scale aria-hidden="true" /><span>Ajuste normalizado<strong>{report.normalizedFitScore}/100</strong></span></div>
        <div><Beaker aria-hidden="true" /><span>Incertidumbre del modelo<strong>±{metrics.uncertaintyPct}%</strong></span></div>
      </div>

      <div className="seed-control">
        <label htmlFor="simulation-seed">Semilla del experimento</label>
        <input id="simulation-seed" name="simulationSeed" type="number" min="1" max="2147483647" value={seed} onChange={(event) => onSeedChange(Number(event.target.value))} />
        <p>Cambiarla reinicia el experimento. Mantenerla permite replicar exactamente una ejecución.</p>
      </div>

      <div className="evidence-grid">
        <DatasetImporter onDataset={setDataset} />
        <article className="evidence-card validation-card">
          <div className="evidence-card__icon" aria-hidden="true"><Scale /></div>
          <div className="min-w-0">
            <p className="eyebrow">Resultado de comparación</p>
            <h3>{report.status === 'validated-against-observation' ? 'Validado contra observaciones' : 'Evaluación ilustrativa'}</h3>
            <dl>
              <div><dt>Métricas comparadas</dt><dd>{report.comparedMetrics}</dd></div>
              <div><dt>Error absoluto medio</dt><dd>{number.format(report.meanAbsoluteError)}</dd></div>
              <div><dt>Fecha de la fuente</dt><dd>{dataset.metadata.observedAt}</dd></div>
              <div><dt>Licencia</dt><dd>{dataset.metadata.license}</dd></div>
            </dl>
            <ul>{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </div>
        </article>
        <CommunitySurveyCard onApply={onApplySurvey} />
      </div>
    </section>
  );
}
