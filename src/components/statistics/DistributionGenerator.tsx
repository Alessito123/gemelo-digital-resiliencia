import { useState } from 'react';
import { generateDataset, type GaussianComponent, type NumericDataset } from '../../modules/statistics/datasets';

export function DistributionGenerator({ onDataset, disabled }: { onDataset: (data: NumericDataset) => void; disabled: boolean }) {
  const [count, setCount] = useState(600);
  const [seed, setSeed] = useState(42);
  const [k, setK] = useState(2);
  const [components, setComponents] = useState<GaussianComponent[]>([
    { weight: .5, mean: -3, sd: 1 }, { weight: .5, mean: 3, sd: 1 }, { weight: .3, mean: 8, sd: 1.5 },
  ]);
  const [error, setError] = useState('');
  const change = (i: number, key: keyof GaussianComponent, value: number) => setComponents(old => old.map((c, j) => i === j ? { ...c, [key]: value } : c));
  return <form className="stats-controls" onSubmit={event => {
    event.preventDefault();
    try { onDataset(generateDataset(count, seed, components.slice(0, k))); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Revisa los parámetros.'); }
  }}>
    <div className="stats-form-grid">
      <label>Distribución<select value={k} onChange={e => setK(Number(e.target.value))} disabled={disabled}>
        <option value="1">Normal</option><option value="2">Mezcla de 2 normales</option><option value="3">Mezcla de 3 normales</option>
      </select></label>
      <label>Tamaño de muestra<input type="number" min="20" max="5000" step="1" required value={count} onChange={e => setCount(e.target.valueAsNumber)} disabled={disabled} /></label>
      <label>Semilla de generación<input type="number" min="1" max="2147483647" step="1" required value={seed} onChange={e => setSeed(e.target.valueAsNumber)} disabled={disabled} /></label>
    </div>
    <div className="stats-components">
      {components.slice(0, k).map((c, i) => <fieldset key={i} disabled={disabled}>
        <legend>Componente {i + 1}</legend>
        <label>Media μ<input type="number" min="-1000000" max="1000000" step="any" required value={c.mean} onChange={e => change(i, 'mean', e.target.valueAsNumber)} /></label>
        <label>Desviación σ<input type="number" min="0.001" max="1000000" step="any" required value={c.sd} onChange={e => change(i, 'sd', e.target.valueAsNumber)} /></label>
        <label>Peso relativo<input type="number" min="0.000001" max="1000000" step="any" required value={c.weight} onChange={e => change(i, 'weight', e.target.valueAsNumber)} /></label>
      </fieldset>)}
    </div>
    <p className="stats-note">Los pesos se normalizan automáticamente. Una misma semilla y parámetros producen los mismos datos. La muestra generada se conserva hasta que pulses «Generar muestra».</p>
    <button className="btn-secondary" type="submit" disabled={disabled}>Generar muestra</button>
    {error && <p role="alert" className="stats-error">{error}</p>}
  </form>;
}
