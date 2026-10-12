import {
  PublicDataArea,
  PublicDataCalibration,
  PublicDataSnapshot,
  PublicDataSourceId,
} from '../../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const boundedNumber = (value: unknown, min: number, max: number): number | undefined => {
  const parsed = finiteNumber(value);
  return parsed === undefined || parsed < min || parsed > max ? undefined : parsed;
};

const round = (value: number, precision = 2): number => Number(value.toFixed(precision));
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function isPublicDataSnapshot(value: unknown): value is PublicDataSnapshot {
  return isRecord(value)
    && (value.sourceId === 'osm' || value.sourceId === 'usgs-earthquakes' || value.sourceId === 'nasa-power')
    && typeof value.sourceName === 'string'
    && isRecord(value.area)
    && isRecord(value.metrics)
    && Array.isArray(value.records)
    && isRecord(value.provenance)
    && typeof value.provenance.retrievedAt === 'string'
    && Array.isArray(value.limitations);
}

function tagMetric(input: unknown, key: string): number {
  if (!isRecord(input) || !Array.isArray(input.elements)) return 0;
  for (const element of input.elements) {
    if (!isRecord(element) || !isRecord(element.tags)) continue;
    const count = boundedNumber(element.tags[key], 0, 5_000_000);
    if (count !== undefined) return Math.round(count);
  }
  return 0;
}

export function normalizeOverpass(raw: unknown, area: PublicDataArea, retrievedAt: string): PublicDataSnapshot {
  const metadata = isRecord(raw) && isRecord(raw.osm3s) ? raw.osm3s : {};
  const dataTimestamp = typeof metadata.timestamp_osm_base === 'string' ? metadata.timestamp_osm_base : undefined;
  return {
    sourceId: 'osm',
    sourceName: 'OpenStreetMap / Overpass',
    area,
    metrics: {
      buildingCount: tagMetric(raw, 'buildingCount'),
      roadCount: tagMetric(raw, 'roadCount'),
      healthFacilityCount: tagMetric(raw, 'healthFacilityCount'),
      assemblyPointCount: tagMetric(raw, 'assemblyPointCount'),
    },
    records: [],
    provenance: {
      publisher: 'OpenStreetMap contributors',
      dataset: 'OpenStreetMap infrastructure extract',
      license: 'ODbL-1.0',
      sourceUrl: 'https://overpass-api.de/api/interpreter',
      retrievedAt,
      dataTimestamp,
      evidenceKind: 'crowdsourced-map',
    },
    limitations: [
      'Los conteos reflejan cobertura colaborativa y no certifican informalidad ni estado operativo.',
      'La ventana de estudio es aproximada y debe sustituirse por un polígono validado localmente.',
    ],
  };
}

export function normalizeUsgsEarthquakes(raw: unknown, area: PublicDataArea, retrievedAt: string): PublicDataSnapshot {
  const features = isRecord(raw) && Array.isArray(raw.features) ? raw.features : [];
  const records = features.flatMap((feature, index) => {
    if (!isRecord(feature) || !isRecord(feature.properties) || !isRecord(feature.geometry) || !Array.isArray(feature.geometry.coordinates)) return [];
    const longitude = boundedNumber(feature.geometry.coordinates[0], -180, 180);
    const latitude = boundedNumber(feature.geometry.coordinates[1], -90, 90);
    const magnitude = boundedNumber(feature.properties.mag, -2, 10);
    const time = boundedNumber(feature.properties.time, 0, 9_999_999_999_999);
    if (longitude === undefined || latitude === undefined || magnitude === undefined || time === undefined) return [];
    const label = typeof feature.properties.place === 'string' ? feature.properties.place.slice(0, 180) : 'Evento sísmico';
    const id = typeof feature.id === 'string' ? feature.id.slice(0, 100) : `usgs-${index}`;
    return [{ id, label, observedAt: new Date(time).toISOString(), latitude, longitude, value: magnitude, unit: 'Mw' }];
  }).slice(0, 50);
  const magnitudes = records.flatMap((record) => record.value === undefined ? [] : [record.value]);
  return {
    sourceId: 'usgs-earthquakes',
    sourceName: 'USGS Earthquake Catalog',
    area,
    metrics: {
      eventCount: records.length,
      maxMagnitude: magnitudes.length ? round(Math.max(...magnitudes), 1) : 0,
      meanMagnitude: magnitudes.length ? round(magnitudes.reduce((sum, value) => sum + value, 0) / magnitudes.length, 2) : 0,
    },
    records,
    provenance: {
      publisher: 'U.S. Geological Survey',
      dataset: 'USGS Earthquake Catalog — FDSN Event Web Service',
      license: 'Public domain (U.S. Government work)',
      sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/',
      retrievedAt,
      evidenceKind: 'instrumental-catalogue',
    },
    limitations: [
      'La consulta usa un radio regional; no representa amenaza sísmica probabilística del sitio.',
      'El conteo muestra como máximo los 50 eventos más recientes que cumplen los filtros de la consulta.',
      'La ausencia de eventos en el período consultado no implica ausencia de riesgo.',
    ],
  };
}

export function normalizeNasaPower(raw: unknown, area: PublicDataArea, retrievedAt: string): PublicDataSnapshot {
  const properties = isRecord(raw) && isRecord(raw.properties) ? raw.properties : {};
  const parameter = isRecord(properties.parameter) && isRecord(properties.parameter.PRECTOTCORR)
    ? properties.parameter.PRECTOTCORR
    : {};
  const header = isRecord(properties.header) ? properties.header : {};
  const fillValue = finiteNumber(header.fill_value) ?? -999;
  const values = Object.entries(parameter).flatMap(([date, rawValue]) => {
    const value = boundedNumber(rawValue, -10_000, 10_000);
    return value === undefined || value === fillValue || value < 0 ? [] : [{ date, value }];
  });
  const coordinates = isRecord(raw) && isRecord(raw.geometry) && Array.isArray(raw.geometry.coordinates) ? raw.geometry.coordinates : [];
  const elevation = boundedNumber(coordinates[2], -500, 9_000);
  const total = round(values.reduce((sum, item) => sum + item.value, 0));
  const max = values.length ? round(Math.max(...values.map((item) => item.value))) : 0;
  const records = values.slice(-31).map((item) => ({
    id: `power-${item.date}`,
    label: `Precipitación diaria ${item.date}`,
    observedAt: /^\d{8}$/.test(item.date) ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}T00:00:00.000Z` : undefined,
    value: round(item.value),
    unit: 'mm/día',
  }));
  return {
    sourceId: 'nasa-power',
    sourceName: 'NASA POWER',
    area,
    metrics: {
      observedDays: values.length,
      precipitationTotalMm: total,
      precipitationMaxDailyMm: max,
      precipitationMeanDailyMm: values.length ? round(total / values.length) : 0,
      ...(elevation === undefined ? {} : { modelElevationM: round(elevation) }),
    },
    records,
    provenance: {
      publisher: 'NASA Langley Research Center',
      dataset: 'POWER Daily API — PRECTOTCORR',
      license: 'NASA open data; verify attribution requirements',
      sourceUrl: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',
      retrievedAt,
      dataTimestamp: typeof header.end === 'string' ? header.end : undefined,
      evidenceKind: 'satellite-model',
    },
    limitations: [
      'POWER combina observaciones satelitales y modelos; no reemplaza una estación meteorológica local.',
      'La resolución de meteorología es regional y puede suavizar extremos barriales.',
    ],
  };
}

export function buildPublicDataCalibration(snapshots: PublicDataSnapshot[]): PublicDataCalibration {
  const unique = new Map<PublicDataSourceId, PublicDataSnapshot>();
  snapshots.forEach((snapshot) => unique.set(snapshot.sourceId, snapshot));
  const osm = unique.get('osm');
  const power = unique.get('nasa-power');
  const usgs = unique.get('usgs-earthquakes');
  const buildings = osm?.metrics.buildingCount ?? 0;
  const roads = osm?.metrics.roadCount ?? 0;
  const maxMagnitude = usgs?.metrics.maxMagnitude ?? 0;
  const eventCount = usgs?.metrics.eventCount ?? 0;
  const assumptions = [
    'La calibración modifica multiplicadores acotados; no reemplaza validación de campo ni análisis de amenaza oficial.',
    'Las ventanas espaciales son aproximadas y deben revisarse con comunidad y gobierno local.',
  ];
  if (osm) assumptions.push('La accesibilidad se aproxima mediante la razón de vías cartografiadas por edificio.');
  if (power) assumptions.push('La lluvia reciente se usa como señal contextual, no como pronóstico ni alerta temprana.');
  if (usgs) assumptions.push('El historial regional USGS contextualiza sensibilidad sísmica; no estima período de retorno.');
  return {
    sourceIds: [...unique.keys()],
    appliedAt: [...unique.values()].map((snapshot) => snapshot.provenance.retrievedAt).sort().at(-1) ?? new Date(0).toISOString(),
    ...(osm ? { roadAccessibilityIndex: round(clamp01((roads / Math.max(1, buildings)) * 2), 3) } : {}),
    ...(power ? { recentMaxDailyPrecipitationMm: round(power.metrics.precipitationMaxDailyMm ?? 0) } : {}),
    ...(power && power.metrics.modelElevationM !== undefined ? { terrainElevationM: round(power.metrics.modelElevationM) } : {}),
    ...(usgs ? { earthquakeHistoryIndex: round(clamp01((maxMagnitude / 8) * 0.75 + Math.min(0.25, eventCount / 200)), 3) } : {}),
    assumptions,
  };
}
