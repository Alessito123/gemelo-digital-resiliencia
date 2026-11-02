import { useEffect, useRef, useState } from 'react';
import { datasetFromSnapshot, parseNumericDataset, type NumericDataset } from '../../modules/statistics/datasets';
import type { PublicDataSnapshot } from '../../types';
import { DistributionGenerator } from './DistributionGenerator';

export function DatasetControls({ settlementId, settlementName, onDataset, disabled }: {
  settlementId: string; settlementName: string; onDataset: (data: NumericDataset) => void; disabled: boolean;
}) {
  const [mode, setMode] = useState('synthetic');
  const [source, setSource] = useState('usgs-earthquakes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => {
    return () => { requestId.current++; request.current?.abort(); };
  }, [settlementId]);
  useEffect(() => { setLoading(false); setError(''); }, [settlementId]);

  async function loadPublic() {
    const id = ++requestId.current;
    const controller = new AbortController();
    request.current?.abort(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/public-data/snapshots/${source}?settlementId=${encodeURIComponent(settlementId)}`, { signal: controller.signal });
      const body = await response.json();
      if (!response.ok || body.success !== true) throw new Error(typeof body.error?.message === 'string' ? body.error.message : 'La fuente no está disponible.');
      const dataset = datasetFromSnapshot(body.data as PublicDataSnapshot);
      if (id === requestId.current) onDataset(dataset);
    } catch (e) {
      if (id === requestId.current) setError(controller.signal.aborted ? 'La consulta excedió el tiempo disponible. Puedes reintentar.' : e instanceof Error ? e.message : 'No se pudo consultar la fuente.');
    } finally { clearTimeout(timeout); if (id === requestId.current) setLoading(false); }
  }

  return <div className="stats-source-controls" aria-busy={loading}>
    <div className="stats-section-label"><span>01</span><div><strong>Elige el origen de la variable</strong><small>La procedencia se conserva junto con cada resultado.</small></div></div>
    <label className="stats-mode">Origen del dataset<select value={mode} disabled={disabled || loading} onChange={e => { setMode(e.target.value); setError(''); }}>
      <option value="synthetic">Generador: normal / mezclas</option>
      <option value="public">Datos públicos</option><option value="import">Importar archivo</option>
    </select></label>
    {mode === 'synthetic' && <DistributionGenerator onDataset={onDataset} disabled={disabled} />}
    {mode === 'public' && <div className="stats-controls">
      <div className="stats-form-grid">
        <label>Fuente pública<select value={source} disabled={disabled || loading} onChange={e => setSource(e.target.value)}>
          <option value="usgs-earthquakes">USGS · magnitud sísmica (Mw)</option>
          <option value="nasa-power">NASA POWER · precipitación (mm/día)</option>
        </select></label>
        <div><p className="stats-note">Área de consulta</p><strong>{settlementName}</strong></div>
      </div>
      <p className="stats-note">Se analizan registros individuales: hasta 50 sismos o 31 días de lluvia. Los conteos agregados de OpenStreetMap siguen disponibles en «Datos». Ninguna fuente se presume normal.</p>
      <button type="button" className="btn-secondary" disabled={disabled || loading} onClick={loadPublic}>{loading ? 'Consultando fuente…' : 'Consultar y cargar datos'}</button>
    </div>}
    {mode === 'import' && <div className="stats-controls">
      <label>Archivo numérico (JSON o CSV, máximo 1 MB)<input type="file" accept=".json,.csv,.txt" disabled={disabled || loading} onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        setError('');
        if (file.size > 1000000) { setError('El archivo supera 1 MB.'); return; }
        const id = ++requestId.current;
        setLoading(true);
        try { const data = parseNumericDataset(await file.text(), file.name); if (id === requestId.current) onDataset(data); }
        catch (e) { if (id === requestId.current) setError(e instanceof Error ? e.message : 'Archivo inválido.'); }
        finally { if (id === requestId.current) setLoading(false); }
      }} /></label>
      <p className="stats-note">CSV: una columna numérica, punto decimal y cabecera opcional «value». JSON: lista de números o dataset exportado por este laboratorio. No se combinan columnas con unidades distintas.</p>
    </div>}
    {loading && <p role="status">Cargando dataset…</p>}
    {error && <p role="alert" className="stats-error">{error} El dataset activo se conserva.</p>}
  </div>;
}
