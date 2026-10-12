import { SETTLEMENT_PRESETS } from '../data/settlementPresets';
import { normalizeNasaPower, normalizeOverpass, normalizeUsgsEarthquakes } from '../modules/publicData/publicData';
import { PublicDataSnapshot, PublicDataSourceId, SettlementPreset } from '../types';

export interface PublicDataSourceDescriptor {
  id: PublicDataSourceId;
  name: string;
  publisher: string;
  purpose: string;
  cadence: string;
  isSyncAvailable: true;
}

export const PUBLIC_DATA_SOURCES: PublicDataSourceDescriptor[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap / Overpass',
    publisher: 'OpenStreetMap contributors',
    purpose: 'Edificios, vías, salud y puntos de encuentro cartografiados',
    cadence: 'Mapa colaborativo continuamente actualizado',
    isSyncAvailable: true,
  },
  {
    id: 'usgs-earthquakes',
    name: 'USGS Earthquake Catalog',
    publisher: 'U.S. Geological Survey',
    purpose: 'Contexto sísmico regional de los últimos 10 años',
    cadence: 'Catálogo instrumental actualizado',
    isSyncAvailable: true,
  },
  {
    id: 'nasa-power',
    name: 'NASA POWER',
    publisher: 'NASA Langley Research Center',
    purpose: 'Precipitación diaria corregida y elevación del punto de modelo',
    cadence: 'Ventana reciente de 30 días con rezago prudente',
    isSyncAvailable: true,
  },
];

const LIVE_SOURCE_IDS = new Set<PublicDataSourceId>(PUBLIC_DATA_SOURCES.map((source) => source.id));
const ALLOWED_ORIGINS = new Set([
  'https://overpass-api.de',
  'https://earthquake.usgs.gov',
  'https://power.larc.nasa.gov',
]);
const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 18_000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 32;

interface CacheEntry {
  expiresAt: number;
  snapshot: PublicDataSnapshot;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<PublicDataSnapshot>>();

export class PublicDataGatewayError extends Error {
  constructor(
    public readonly code: 'SOURCE_NOT_FOUND' | 'SETTLEMENT_NOT_FOUND' | 'UPSTREAM_TIMEOUT' | 'UPSTREAM_ERROR' | 'INVALID_UPSTREAM_DATA',
    message: string,
  ) {
    super(message);
    this.name = 'PublicDataGatewayError';
  }
}

export function isPublicDataSourceId(value: unknown): value is PublicDataSourceId {
  return typeof value === 'string' && LIVE_SOURCE_IDS.has(value as PublicDataSourceId);
}

export function findSettlementForPublicData(settlementId: unknown): SettlementPreset | undefined {
  if (typeof settlementId !== 'string' || settlementId.length > 80) return undefined;
  return SETTLEMENT_PRESETS.find((settlement) => settlement.id === settlementId);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function shiftUtcDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

async function fetchJson(url: URL): Promise<unknown> {
  if (url.protocol !== 'https:' || !ALLOWED_ORIGINS.has(url.origin)) {
    throw new PublicDataGatewayError('UPSTREAM_ERROR', 'Destino externo no autorizado.');
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ResilienceDigitalTwin/1.0 (public research data)',
      },
    });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new PublicDataGatewayError(timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', timeout ? 'La fuente pública agotó el tiempo de espera.' : 'No se pudo contactar la fuente pública.');
  }
  if (!response.ok) throw new PublicDataGatewayError('UPSTREAM_ERROR', `La fuente pública respondió HTTP ${response.status}.`);
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new PublicDataGatewayError('INVALID_UPSTREAM_DATA', 'La respuesta externa excede el límite permitido.');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new PublicDataGatewayError('INVALID_UPSTREAM_DATA', 'La respuesta externa excede el límite permitido.');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PublicDataGatewayError('INVALID_UPSTREAM_DATA', 'La fuente pública devolvió datos no válidos.');
  }
}

function overpassUrl(settlement: SettlementPreset): URL {
  const { south, west, north, east } = settlement.publicDataArea.bounds;
  const bbox = `${south},${west},${north},${east}`;
  const query = `[out:json][timeout:12];way[building](${bbox});make stats buildingCount=count(ways);out;way[highway](${bbox});make stats roadCount=count(ways);out;(nwr[amenity=hospital](${bbox});nwr[amenity=clinic](${bbox}););make stats healthFacilityCount=count(nodes)+count(ways)+count(relations);out;(nwr[emergency=assembly_point](${bbox});nwr[amenity=shelter](${bbox}););make stats assemblyPointCount=count(nodes)+count(ways)+count(relations);out;`;
  const url = new URL('https://overpass-api.de/api/interpreter');
  url.searchParams.set('data', query);
  return url;
}

function usgsUrl(settlement: SettlementPreset, now: Date): URL {
  const { latitude, longitude } = settlement.publicDataArea.center;
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  url.search = new URLSearchParams({
    format: 'geojson',
    latitude: String(latitude),
    longitude: String(longitude),
    maxradiuskm: '150',
    starttime: shiftUtcDays(now, -3653).toISOString().slice(0, 10),
    endtime: now.toISOString().slice(0, 10),
    minmagnitude: '3',
    limit: '50',
    orderby: 'time',
  }).toString();
  return url;
}

function nasaPowerUrl(settlement: SettlementPreset, now: Date): URL {
  const { latitude, longitude } = settlement.publicDataArea.center;
  const end = shiftUtcDays(now, -5);
  const start = shiftUtcDays(end, -29);
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search = new URLSearchParams({
    parameters: 'PRECTOTCORR',
    community: 'AG',
    longitude: String(longitude),
    latitude: String(latitude),
    start: formatDate(start),
    end: formatDate(end),
    format: 'JSON',
    'time-standard': 'UTC',
  }).toString();
  return url;
}

async function loadSnapshot(sourceId: PublicDataSourceId, settlement: SettlementPreset, now: Date): Promise<PublicDataSnapshot> {
  const retrievedAt = now.toISOString();
  if (sourceId === 'osm') return normalizeOverpass(await fetchJson(overpassUrl(settlement)), settlement.publicDataArea, retrievedAt);
  if (sourceId === 'usgs-earthquakes') return normalizeUsgsEarthquakes(await fetchJson(usgsUrl(settlement, now)), settlement.publicDataArea, retrievedAt);
  return normalizeNasaPower(await fetchJson(nasaPowerUrl(settlement, now)), settlement.publicDataArea, retrievedAt);
}

function pruneCache(nowMs: number): void {
  for (const [key, entry] of cache) if (entry.expiresAt <= nowMs) cache.delete(key);
  while (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
}

export async function getPublicDataSnapshot(sourceId: PublicDataSourceId, settlement: SettlementPreset): Promise<PublicDataSnapshot> {
  const key = `${sourceId}:${settlement.id}`;
  const nowMs = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > nowMs) return cached.snapshot;
  const current = inFlight.get(key);
  if (current) return current;
  pruneCache(nowMs);
  const request = loadSnapshot(sourceId, settlement, new Date(nowMs))
    .then((snapshot) => {
      pruneCache(Date.now());
      cache.set(key, { snapshot, expiresAt: Date.now() + CACHE_TTL_MS });
      return snapshot;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
