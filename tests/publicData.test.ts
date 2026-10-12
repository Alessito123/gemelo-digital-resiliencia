import assert from 'node:assert/strict';
import test from 'node:test';
import { SETTLEMENT_PRESETS } from '../src/data/settlementPresets';
import {
  buildPublicDataCalibration,
  normalizeNasaPower,
  normalizeOverpass,
  normalizeUsgsEarthquakes,
} from '../src/modules/publicData/publicData';
import { calibrateSettlementWithPublicData, createSimulation, runSimulation } from '../src/modules/simulation/simulationEngine';
import { DISASTER_SCENARIOS } from '../src/data/disasterScenarios';

const area = {
  settlementId: 'medellin-comuna13',
  label: 'Ventana de estudio Medellín',
  center: { latitude: 6.25, longitude: -75.62 },
  bounds: { south: 6.23, west: -75.64, north: 6.27, east: -75.60 },
};

test('normalizes bounded OSM infrastructure counts with explicit provenance', () => {
  const snapshot = normalizeOverpass({
    osm3s: { timestamp_osm_base: '2026-08-30T12:41:05Z', copyright: 'OpenStreetMap contributors, ODbL' },
    elements: [
      { type: 'stats', tags: { buildingCount: '11797' } },
      { type: 'stats', tags: { roadCount: '3817' } },
      { type: 'stats', tags: { healthFacilityCount: '7' } },
      { type: 'stats', tags: { assemblyPointCount: '4' } },
    ],
  }, area, '2026-08-30T12:45:00Z');

  assert.equal(snapshot.sourceId, 'osm');
  assert.equal(snapshot.metrics.buildingCount, 11797);
  assert.equal(snapshot.metrics.roadCount, 3817);
  assert.equal(snapshot.provenance.license, 'ODbL-1.0');
  assert.equal(snapshot.area.settlementId, area.settlementId);
});

test('normalizes USGS events and rejects malformed coordinates', () => {
  const snapshot = normalizeUsgsEarthquakes({
    type: 'FeatureCollection',
    features: [
      { id: 'us-1', properties: { mag: 4.9, place: '25 km WSW de Abriaquí', time: 1758485876883 }, geometry: { type: 'Point', coordinates: [-76.2637, 6.5236, 10] } },
      { id: 'bad', properties: { mag: 9, place: 'Dato inválido', time: 1 }, geometry: { type: 'Point', coordinates: ['x', 6, 10] } },
    ],
  }, area, '2026-08-30T12:45:00Z');

  assert.equal(snapshot.metrics.eventCount, 1);
  assert.equal(snapshot.metrics.maxMagnitude, 4.9);
  assert.equal(snapshot.records.length, 1);
  assert.ok(snapshot.limitations.some((item) => item.includes('50 eventos')));
});

test('normalizes NASA POWER precipitation and ignores fill values', () => {
  const snapshot = normalizeNasaPower({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-75.62, 6.25, 2074.31] },
    properties: {
      parameter: { PRECTOTCORR: { '20260801': 0.36, '20260802': 3.95, '20260803': -999, '20260804': 5.87 } },
      parameters: { PRECTOTCORR: { units: 'mm/day', longname: 'Precipitation Corrected' } },
      header: { sources: ['GEOSIT', 'MERRA2'], fill_value: -999, time_standard: 'UTC' },
    },
  }, area, '2026-08-30T12:45:00Z');

  assert.equal(snapshot.metrics.observedDays, 3);
  assert.equal(snapshot.metrics.precipitationTotalMm, 10.18);
  assert.equal(snapshot.metrics.precipitationMaxDailyMm, 5.87);
  assert.equal(snapshot.metrics.modelElevationM, 2074.31);
});

test('builds a transparent bounded calibration from synchronized sources', () => {
  const osm = normalizeOverpass({
    elements: [
      { tags: { buildingCount: '1000' } },
      { tags: { roadCount: '250' } },
      { tags: { healthFacilityCount: '5' } },
      { tags: { assemblyPointCount: '2' } },
    ],
  }, area, '2026-08-30T12:45:00Z');
  const power = normalizeNasaPower({
    geometry: { coordinates: [-75.62, 6.25, 1800] },
    properties: { parameter: { PRECTOTCORR: { '20260801': 20, '20260802': 40 } }, header: { fill_value: -999 } },
  }, area, '2026-08-30T12:45:00Z');

  const calibration = buildPublicDataCalibration([osm, power]);
  assert.deepEqual(calibration.sourceIds, ['osm', 'nasa-power']);
  assert.equal(calibration.roadAccessibilityIndex, 0.5);
  assert.equal(calibration.recentMaxDailyPrecipitationMm, 40);
  assert.equal(calibration.terrainElevationM, 1800);
  assert.ok(calibration.assumptions.length > 0);

  // Source presets remain synthetic and immutable when evidence is attached.
  assert.equal(SETTLEMENT_PRESETS[0].publicDataCalibration, undefined);
});

test('applies public evidence through the simulation seam without mutating the preset', () => {
  const calibration = {
    sourceIds: ['osm' as const, 'nasa-power' as const],
    appliedAt: '2026-08-30T12:45:00Z',
    roadAccessibilityIndex: 0.2,
    recentMaxDailyPrecipitationMm: 95,
    assumptions: ['Calibración de prueba'],
  };
  const calibrated = calibrateSettlementWithPublicData(SETTLEMENT_PRESETS[0], calibration);
  const scenario = DISASTER_SCENARIOS.find((item) => item.id === 'landslide')!;
  const config = { seed: 7, hazardIntensity: 8, warningLeadTimeMin: 45, enableMutualAid: true, enableMultiScaleFeedback: true };
  const result = runSimulation(createSimulation(calibrated, scenario, config), config, 12);

  assert.equal(result.metrics.publicDataSourcesCount, 2);
  assert.equal(calibrated.publicDataCalibration?.recentMaxDailyPrecipitationMm, 95);
  assert.equal(SETTLEMENT_PRESETS[0].publicDataCalibration, undefined);
});
