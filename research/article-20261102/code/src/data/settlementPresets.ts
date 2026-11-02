import { SettlementPreset, AgentHousehold, MeetingPoint, MacroShelter, BottleneckPoint } from '../types';

function generateRealisticHouseholds(
  count: number,
  baseElevation: number,
  elevationRange: number,
  baseSlope: number,
  seedCity: string
): AgentHousehold[] {
  const households: AgentHousehold[] = [];
  const materials: AgentHousehold['roofMaterial'][] = [
    'corrugated_metal',
    'corrugated_metal',
    'cardboard_plastic',
    'unreinforced_masonry',
    'reinforced_concrete',
  ];
  const warningChannels: AgentHousehold['warningChannel'][] = [
    'whatsapp',
    'siren',
    'word_of_mouth',
    'radio',
    'none',
  ];

  for (let i = 1; i <= count; i++) {
    // Spatial layout with organic informal settlement clustering
    const cluster = i % 4;
    let x = 0;
    let y = 0;

    if (cluster === 0) {
      x = 15 + (Math.sin(i * 1.7) * 12 + (i % 7) * 4);
      y = 15 + (Math.cos(i * 1.3) * 12 + (i % 6) * 3);
    } else if (cluster === 1) {
      x = 55 + (Math.sin(i * 2.1) * 15 + (i % 8) * 3.5);
      y = 20 + (Math.cos(i * 1.5) * 14 + (i % 5) * 4);
    } else if (cluster === 2) {
      x = 25 + (Math.sin(i * 1.9) * 14 + (i % 7) * 4.5);
      y = 60 + (Math.cos(i * 2.3) * 16 + (i % 6) * 4);
    } else {
      x = 65 + (Math.sin(i * 2.7) * 16 + (i % 8) * 3.5);
      y = 65 + (Math.cos(i * 1.8) * 15 + (i % 5) * 4.5);
    }

    // Clamp coordinates
    x = Math.max(8, Math.min(92, Math.round(x)));
    y = Math.max(10, Math.min(90, Math.round(y)));

    // Height increases towards top/left in hillsides
    const elevation = Math.round(baseElevation + (100 - y) * (elevationRange / 100) + (x * 0.2));
    const slope = Math.min(45, Math.max(5, Math.round(baseSlope + ((100 - y) / 100) * 15 + (i % 5))));
    const roofMaterial = materials[i % materials.length];
    
    // Structural vulnerability is higher for precarious materials and high slopes
    let structuralVulnerability = roofMaterial === 'cardboard_plastic' ? 0.92 :
      roofMaterial === 'corrugated_metal' ? 0.72 :
      roofMaterial === 'unreinforced_masonry' ? 0.48 : 0.22;
    structuralVulnerability = Math.min(0.98, structuralVulnerability + (slope > 30 ? 0.15 : 0));

    const residentsCount = 3 + (i % 5);
    const hasElderlyResident = i % 3 === 0;
    const hasDisabledResident = i % 7 === 0;
    const vulnerableCount = (hasElderlyResident ? 1 : 0) + (hasDisabledResident ? 1 : 0) + (i % 2 === 0 ? 1 : 0);

    const mobilityScore = hasDisabledResident ? 0.35 : (hasElderlyResident ? 0.55 : 0.90 - (vulnerableCount * 0.1));
    const riskPerception = Math.min(0.95, Math.max(0.2, 0.45 + (i % 6) * 0.08));
    const warningChannel = warningChannels[i % warningChannels.length];
    const earlyWarningAccess = warningChannel !== 'none';
    const isLeader = i === 3 || i === 18 || i === 32 || i === 44;

    households.push({
      id: `hh-${seedCity.substring(0, 3).toLowerCase()}-${i}`,
      name: `Hogar ${i} - ${isLeader ? '★ Líder Comunitario' : `Sector ${cluster + 1}`}`,
      x,
      y,
      currentX: x,
      currentY: y,
      elevationM: elevation,
      slopeAngleDeg: slope,
      roofMaterial,
      structuralVulnerability: parseFloat(structuralVulnerability.toFixed(2)),
      residentsCount,
      vulnerableCount,
      hasDisabledResident,
      hasElderlyResident,
      riskPerception: parseFloat(riskPerception.toFixed(2)),
      earlyWarningAccess,
      warningChannel,
      mobilityScore: parseFloat(mobilityScore.toFixed(2)),
      socialTrustScore: parseFloat((0.65 + (i % 4) * 0.08).toFixed(2)),
      socialTies: [], // will be linked next
      state: 'normal',
      health: 'intact',
      currentStepStateDuration: 0,
      assignedMeetingPointId: cluster % 2 === 0 ? 'mp-1' : 'mp-2',
      isLeader,
    });
  }

  // Generate mutual aid network links based on spatial proximity (< 20 units)
  households.forEach((h1) => {
    const nearby = households
      .filter((h2) => h2.id !== h1.id)
      .map((h2) => ({
        id: h2.id,
        dist: Math.hypot(h1.x - h2.x, h1.y - h2.y),
      }))
      .filter((item) => item.dist < 22)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map((item) => item.id);

    h1.socialTies = nearby;
  });

  return households;
}

export const SETTLEMENT_PRESETS: SettlementPreset[] = [
  {
    id: 'medellin-comuna13',
    name: 'Medellín - Comuna 13 (Laderas de Alto Riesgo)',
    city: 'Medellín',
    country: 'Colombia',
    hazardSpecialty: 'landslide',
    description: 'Asentamiento de alta pendiente en ladera andina occidental. Caracterizado por alta densidad poblacional, caminos peatonales empinados (escaleras angostas) y fuerte tejido asociativo comunitario.',
    totalPopulation: 24500,
    areaHa: 48,
    avgSlopeDeg: 34,
    maxElevationM: 1850,
    minElevationM: 1520,
    densityHabHa: 510,
    socialCapitalIndex: 0.88,
    institutionalTrustScore: 0.62,
    civilDefenseResponseTimeMin: 38,
    publicDataArea: {
      settlementId: 'medellin-comuna13',
      label: 'Ventana aproximada de estudio — Comuna 13',
      center: { latitude: 6.25, longitude: -75.62 },
      bounds: { south: 6.23, west: -75.64, north: 6.27, east: -75.60 },
    },
    meetingPoints: [
      {
        id: 'mp-1',
        name: 'Cancha Polideportiva El Salado',
        type: 'sports_field',
        x: 32,
        y: 84,
        elevationM: 1540,
        capacity: 800,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
      {
        id: 'mp-2',
        name: 'Plaza del Centro Comunitario Las Independencias',
        type: 'community_center',
        x: 78,
        y: 78,
        elevationM: 1590,
        capacity: 650,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
    ],
    macroShelters: [
      {
        id: 'shelter-1',
        name: 'Coliseo Mayor San Javier (Nivel Ciudad)',
        x: 48,
        y: 96,
        capacity: 2500,
        currentOccupancy: 0,
        accessTimeMin: 25,
        servicesAvailable: ['Atención Médica Triaje', 'Alimentación Caliente', 'Soporte Psicosocial', 'Registro Cruz Roja'],
      },
    ],
    bottlenecks: [
      {
        id: 'bn-1',
        name: 'Escalinata Angosta Sector La Torre (1.1m ancho)',
        x: 44,
        y: 48,
        radius: 12,
        severity: 'critical',
        cause: 'Pasaje peatonal empinado sin pasamanos, saturación inmediata ante evacuación en estampida.',
        congestionFactor: 0.85,
        blockedByDebris: false,
      },
      {
        id: 'bn-2',
        name: 'Cruce del Puente Peatonal Quebrada La Iguaná',
        x: 62,
        y: 56,
        radius: 10,
        severity: 'moderate',
        cause: 'Estructura tubular con restricción de flujo y riesgo de socavación hídrica.',
        congestionFactor: 0.65,
        blockedByDebris: false,
      },
    ],
    households: generateRealisticHouseholds(48, 1530, 290, 32, 'MED'),
  },
  {
    id: 'lima-sjl',
    name: 'Lima - San Juan de Lurigancho / Lomas Altas',
    city: 'Lima',
    country: 'Perú',
    hazardSpecialty: 'earthquake',
    description: 'Población asentada en pircas y laderas desérticas de material suelto sin confinamiento. Vulnerabilidad sísmica severa y riesgo de flujos de detritos (huaicos) con baja cobertura de agua potable.',
    totalPopulation: 42000,
    areaHa: 82,
    avgSlopeDeg: 28,
    maxElevationM: 680,
    minElevationM: 280,
    densityHabHa: 512,
    socialCapitalIndex: 0.76,
    institutionalTrustScore: 0.44,
    civilDefenseResponseTimeMin: 55,
    publicDataArea: {
      settlementId: 'lima-sjl',
      label: 'Ventana aproximada de estudio — laderas de SJL',
      center: { latitude: -11.96, longitude: -76.99 },
      bounds: { south: -11.99, west: -77.02, north: -11.93, east: -76.96 },
    },
    meetingPoints: [
      {
        id: 'mp-1',
        name: 'Losa Deportiva Los Olivos de Pro',
        type: 'sports_field',
        x: 28,
        y: 82,
        elevationM: 310,
        capacity: 1100,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
      {
        id: 'mp-2',
        name: 'Parroquia Santa Rosa de Lima (Explanada)',
        type: 'church',
        x: 74,
        y: 80,
        elevationM: 340,
        capacity: 750,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
    ],
    macroShelters: [
      {
        id: 'shelter-1',
        name: 'Estadio Municipal San Juan de Lurigancho',
        x: 50,
        y: 97,
        capacity: 4000,
        currentOccupancy: 0,
        accessTimeMin: 45,
        servicesAvailable: ['Hospital de Campaña INDECI', 'Distribución de Agua Cisterna', 'Albergue de Carpas'],
      },
    ],
    bottlenecks: [
      {
        id: 'bn-1',
        name: 'Pircas Inestables Pasaje Los Álamos',
        x: 52,
        y: 44,
        radius: 14,
        severity: 'critical',
        cause: 'Muros secos de contención artesanal que colapsan ante sacudida sísmica bloqueando la vía de escape.',
        congestionFactor: 0.90,
        blockedByDebris: false,
      },
    ],
    households: generateRealisticHouseholds(52, 300, 340, 27, 'LIM'),
  },
  {
    id: 'cartagena-mandela',
    name: 'Cartagena - Ciénaga de la Virgen / Nelson Mandela',
    city: 'Cartagena',
    country: 'Colombia',
    hazardSpecialty: 'flood',
    description: 'Asentamiento en planicie litoral baja y bordes de ciénaga. Alta susceptibilidad a inundaciones por lluvias torrenciales (convección tropical) y mareas vivas, combinadas con canales taponados por residuos.',
    totalPopulation: 31000,
    areaHa: 65,
    avgSlopeDeg: 6,
    maxElevationM: 24,
    minElevationM: 2,
    densityHabHa: 476,
    socialCapitalIndex: 0.81,
    institutionalTrustScore: 0.49,
    civilDefenseResponseTimeMin: 44,
    publicDataArea: {
      settlementId: 'cartagena-mandela',
      label: 'Ventana aproximada de estudio — Nelson Mandela',
      center: { latitude: 10.37, longitude: -75.48 },
      bounds: { south: 10.34, west: -75.51, north: 10.40, east: -75.45 },
    },
    meetingPoints: [
      {
        id: 'mp-1',
        name: 'Institución Educativa Nelson Mandela',
        type: 'school',
        x: 35,
        y: 25,
        elevationM: 18,
        capacity: 950,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
      {
        id: 'mp-2',
        name: 'Cancha Las Brisas (Cota Alta)',
        type: 'sports_field',
        x: 76,
        y: 28,
        elevationM: 19,
        capacity: 800,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
    ],
    macroShelters: [
      {
        id: 'shelter-1',
        name: 'Coliseo de Combate y Gimnasia (Vía Perimetral)',
        x: 50,
        y: 8,
        capacity: 3200,
        currentOccupancy: 0,
        accessTimeMin: 30,
        servicesAvailable: ['Potabilización Rápida', 'Vacunación Leptospirosis/Dengue', 'Alimentos Secos'],
      },
    ],
    bottlenecks: [
      {
        id: 'bn-1',
        name: 'Vía Caño San Martín (Zona Anegada)',
        x: 48,
        y: 65,
        radius: 15,
        severity: 'critical',
        cause: 'Calzada sin pavimentar que se convierte en lodazal intransitable al acumularse >100mm de agua.',
        congestionFactor: 0.88,
        blockedByDebris: false,
      },
    ],
    households: generateRealisticHouseholds(46, 3, 20, 5, 'CTG'),
  },
  {
    id: 'lapaz-laderas',
    name: 'La Paz - Laderas Altas / Valle de Cotahuma',
    city: 'La Paz',
    country: 'Bolivia',
    hazardSpecialty: 'landslide',
    description: 'Topografía andina de pendientes extremas (>38°) con estratos geológicos arcillosos y filtraciones subterráneas de agua. Vulnerabilidad crítica a deslizamientos rotacionales masivos.',
    totalPopulation: 19500,
    areaHa: 40,
    avgSlopeDeg: 38,
    maxElevationM: 3950,
    minElevationM: 3550,
    densityHabHa: 488,
    socialCapitalIndex: 0.90,
    institutionalTrustScore: 0.58,
    civilDefenseResponseTimeMin: 42,
    publicDataArea: {
      settlementId: 'lapaz-laderas',
      label: 'Ventana aproximada de estudio — Cotahuma',
      center: { latitude: -16.52, longitude: -68.15 },
      bounds: { south: -16.55, west: -68.18, north: -16.49, east: -68.12 },
    },
    meetingPoints: [
      {
        id: 'mp-1',
        name: 'Estación Teleférico Mirador (Plaza Segura)',
        type: 'open_plaza',
        x: 30,
        y: 88,
        elevationM: 3580,
        capacity: 1200,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
      {
        id: 'mp-2',
        name: 'Sede Social Junta Vecinal San Pedro Alto',
        type: 'community_center',
        x: 76,
        y: 82,
        elevationM: 3620,
        capacity: 600,
        currentOccupancy: 0,
        isSafeFromHazard: true,
      },
    ],
    macroShelters: [
      {
        id: 'shelter-1',
        name: 'Centro de Alto Rendimiento Deportivo La Paz',
        x: 52,
        y: 98,
        capacity: 2200,
        currentOccupancy: 0,
        accessTimeMin: 35,
        servicesAvailable: ['Atención Médica Altura', 'Refugio Térmico', 'Cocina Comunitaria'],
      },
    ],
    bottlenecks: [
      {
        id: 'bn-1',
        name: 'Gradas de Piedra Las Nieves (Pendiente 42°)',
        x: 50,
        y: 48,
        radius: 12,
        severity: 'critical',
        cause: 'Escalones empinados húmedos resbaladizos con riesgo de caída masiva.',
        congestionFactor: 0.92,
        blockedByDebris: false,
      },
    ],
    households: generateRealisticHouseholds(48, 3560, 360, 36, 'LPZ'),
  },
];
