import { ChangeEvent, useRef, useState } from 'react';
import { FileJson, ShieldCheck, Upload } from 'lucide-react';
import { ResearchDataset } from '../../types';
import { parseResearchDataset } from '../../modules/data/dataIntegration';

interface Props { onDataset: (dataset: ResearchDataset) => void }

export function DatasetImporter({ onDataset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('JSON, máximo 1 MB. La procedencia es obligatoria.');
  const [hasError, setHasError] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000 || !file.name.toLowerCase().endsWith('.json')) {
      setHasError(true);
      setMessage('Usa un archivo .json de hasta 1 MB.');
      return;
    }
    const result = parseResearchDataset(await file.text());
    if ('errors' in result) {
      setHasError(true);
      setMessage(result.errors[0] ?? 'No se pudo validar el archivo.');
      return;
    }
    onDataset(result.dataset);
    setHasError(false);
    setMessage(`${result.dataset.observations.length} observaciones importadas desde ${result.dataset.metadata.source}.`);
    event.target.value = '';
  };

  return (
    <article className="evidence-card">
      <div className="evidence-card__icon" aria-hidden="true"><FileJson /></div>
      <div className="min-w-0">
        <p className="eyebrow">Entrada verificable</p>
        <h3>Importar observaciones</h3>
        <p>Compara la simulación con una serie creada por el municipio, una ONG o tu equipo de investigación.</p>
        <input ref={inputRef} className="sr-only" id="research-dataset" name="researchDataset" type="file" accept="application/json,.json" onChange={handleFile} />
        <button className="evidence-button" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" /> Seleccionar dataset</button>
        <p className={hasError ? 'field-message field-message--error' : 'field-message'} aria-live="polite"><ShieldCheck aria-hidden="true" /> {message}</p>
      </div>
    </article>
  );
}
