import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, CloudDownload, DatabaseZap, ExternalLink, LoaderCircle, MapPinned, ShieldCheck } from 'lucide-react';
import { buildPublicDataCalibration, isPublicDataSnapshot } from '../../modules/publicData/publicData';
import { PublicDataCalibration, PublicDataSnapshot, PublicDataSourceId, SettlementPreset } from '../../types';

interface SourceDescriptor {
  id: PublicDataSourceId;
  name: string;
  publisher: string;
  purpose: string;
  cadence: string;
  isSyncAvailable: true;
}

interface PublicDataConsoleProps {
  settlement: SettlementPreset;
  onApply: (calibration: PublicDataCalibration) => void;
}

const METRIC_LABELS: Record<string, string> = {
  buildingCount: 'Edificios mapeados',
  roadCount: 'Vías mapeadas',
  healthFacilityCount: 'Centros de salud',
  assemblyPointCount: 'Puntos de encuentro',
  eventCount: 'Eventos mostrados',
  maxMagnitude: 'Magnitud máxima',
  meanMagnitude: 'Magnitud media',
  observedDays: 'Días disponibles',
  precipitationTotalMm: 'Lluvia acumulada',
  precipitationMaxDailyMm: 'Máximo diario',
  precipitationMeanDailyMm: 'Media diaria',
  modelElevationM: 'Elevación modelo',
};

function metricValue(key: string, value: number): string {
  if (key.toLowerCase().includes('precipitation')) return `${value.toLocaleString('es-PE', { maximumFractionDigits: 2 })} mm`;
  if (key === 'modelElevationM') return `${value.toLocaleString('es-PE')} m`;
  if (key.toLowerCase().includes('magnitude')) return value.toFixed(1);
  return value.toLocaleString('es-PE', { maximumFractionDigits: 2 });
}

function metricEntries(snapshot: PublicDataSnapshot): Array<[string, number]> {
  return Object.entries(snapshot.metrics).filter((entry): entry is [string, number] => typeof entry[1] === 'number');
}

export const PublicDataConsole: React.FC<PublicDataConsoleProps> = ({ settlement, onApply }) => {
  const [sources, setSources] = useState<SourceDescriptor[]>([]);
  const [snapshots, setSnapshots] = useState<Partial<Record<PublicDataSourceId, PublicDataSnapshot>>>({});
  const [loading, setLoading] = useState<Partial<Record<PublicDataSourceId, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<PublicDataSourceId, string>>>({});
  const [catalogError, setCatalogError] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setSnapshots({});
    setErrors({});
    setIsApplied(false);
    fetch('/api/public-data/sources', { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo de conectores.');
        const body: unknown = await response.json();
        if (typeof body !== 'object' || body === null || !('data' in body) || !Array.isArray(body.data)) throw new Error('El catálogo respondió con un formato inesperado.');
        const valid = body.data.filter((item): item is SourceDescriptor => {
          if (typeof item !== 'object' || item === null) return false;
          const candidate = item as Partial<SourceDescriptor>;
          return (candidate.id === 'osm' || candidate.id === 'usgs-earthquakes' || candidate.id === 'nasa-power')
            && typeof candidate.name === 'string'
            && typeof candidate.publisher === 'string'
            && typeof candidate.purpose === 'string';
        });
        setSources(valid);
        setCatalogError(valid.length ? '' : 'No hay conectores disponibles.');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setCatalogError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo de conectores.');
      });
    return () => controller.abort();
  }, [settlement.id]);

  const synchronized = useMemo(() => Object.values(snapshots).filter(isPublicDataSnapshot), [snapshots]);
  const isSyncingAny = Object.values(loading).some(Boolean);

  const syncSource = async (sourceId: PublicDataSourceId): Promise<void> => {
    setLoading((current) => ({ ...current, [sourceId]: true }));
    setErrors((current) => ({ ...current, [sourceId]: undefined }));
    setIsApplied(false);
    try {
      const query = new URLSearchParams({ settlementId: settlement.id });
      const response = await fetch(`/api/public-data/snapshots/${sourceId}?${query}`, { headers: { Accept: 'application/json' } });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== 'object' || body === null || !('data' in body) || !isPublicDataSnapshot(body.data)) {
        const message = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'object' && body.error !== null && 'message' in body.error && typeof body.error.message === 'string'
          ? body.error.message
          : 'La fuente no devolvió un snapshot válido.';
        throw new Error(message);
      }
      setSnapshots((current) => ({ ...current, [sourceId]: body.data }));
    } catch (error) {
      setErrors((current) => ({ ...current, [sourceId]: error instanceof Error ? error.message : 'No se pudo sincronizar esta fuente.' }));
    } finally {
      setLoading((current) => ({ ...current, [sourceId]: false }));
    }
  };

  const applyCalibration = () => {
    if (!synchronized.length) return;
    onApply(buildPublicDataCalibration(synchronized));
    setIsApplied(true);
  };

  return (
    <section className="public-data-console" aria-labelledby="public-data-title">
      <div className="public-data-console__heading">
        <div>
          <p className="eyebrow">Conectores operativos</p>
          <h3 id="public-data-title">Datos públicos que sí alimentan el modelo</h3>
          <p>Consulta endpoints oficiales desde el servidor, conserva procedencia y aplica solo multiplicadores acotados.</p>
        </div>
        <div className="public-data-area" title="Área aproximada; requiere validación local">
          <MapPinned aria-hidden="true" />
          <span><strong>{settlement.city}</strong>{settlement.publicDataArea.label}</span>
        </div>
      </div>

      {catalogError ? (
        <div className="public-data-message public-data-message--error" role="alert"><AlertTriangle aria-hidden="true" /> {catalogError}</div>
      ) : (
        <div className="public-source-grid" aria-live="polite">
          {sources.map((source) => {
            const snapshot = snapshots[source.id];
            const sourceError = errors[source.id];
            const isLoading = loading[source.id];
            return (
              <article key={source.id} className={`public-source-card ${snapshot ? 'public-source-card--ready' : ''}`}>
                <div className="public-source-card__top">
                  <div className="public-source-icon"><DatabaseZap aria-hidden="true" /></div>
                  <div>
                    <h4>{source.name}</h4>
                    <p>{source.publisher}</p>
                  </div>
                  <span className={snapshot ? 'source-state source-state--ready' : 'source-state'}>
                    {snapshot ? <><Check aria-hidden="true" /> Sincronizado</> : 'Disponible'}
                  </span>
                </div>
                <p className="public-source-purpose">{source.purpose}</p>
                {snapshot ? (
                  <>
                    <dl className="public-source-metrics">
                      {metricEntries(snapshot).slice(0, 4).map(([key, value]) => (
                        <div key={key}><dt>{METRIC_LABELS[key] ?? key}</dt><dd>{metricValue(key, value)}</dd></div>
                      ))}
                    </dl>
                    <p className="public-source-freshness">Consulta: {new Date(snapshot.provenance.retrievedAt).toLocaleString('es-PE')} · {snapshot.provenance.evidenceKind}</p>
                    <a href={snapshot.provenance.sourceUrl} target="_blank" rel="noreferrer" className="public-source-link">Procedencia y método <ExternalLink aria-hidden="true" /></a>
                  </>
                ) : <p className="public-source-cadence">{source.cadence}</p>}
                {sourceError && <p className="public-source-error" role="alert"><AlertTriangle aria-hidden="true" /> {sourceError}</p>}
                <button type="button" className="public-sync-button" onClick={() => void syncSource(source.id)} disabled={isLoading}>
                  {isLoading ? <><LoaderCircle className="spin" aria-hidden="true" /> Consultando…</> : <><CloudDownload aria-hidden="true" /> {snapshot ? 'Actualizar' : 'Sincronizar'}</>}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="public-calibration-bar">
        <div><ShieldCheck aria-hidden="true" /><span><strong>{synchronized.length} de {sources.length} fuentes listas</strong>La calibración queda etiquetada y reduce incertidumbre; no convierte la simulación en una alerta oficial.</span></div>
        <div className="public-calibration-actions">
          <button type="button" className="public-secondary-button" onClick={() => void Promise.all(sources.map((source) => syncSource(source.id)))} disabled={!sources.length || isSyncingAny}>Sincronizar todas</button>
          <button type="button" className="public-apply-button" onClick={applyCalibration} disabled={!synchronized.length || isSyncingAny}>{isApplied ? <><Check aria-hidden="true" /> Aplicado al gemelo</> : 'Aplicar calibración'}</button>
        </div>
      </div>
    </section>
  );
};
