export interface ResearchEvaluationDimension {
  dimension: string;
  rating: number; // 1-5
  stars: string;
  justification: string;
}

export interface ResearchPhase {
  phase: string;
  title: string;
  months: string;
  steps: {
    num: number;
    title: string;
    description: string;
  }[];
}

export const RESEARCH_FRAMEWORK = {
  tentativeTitle: 'Gemelo Digital Poblacional para Evaluación de Resiliencia ante Desastres Naturales en Asentamientos Informales: Arquitectura Multi-escala para Ciudades del Sur Global',
  evaluationScale: [
    {
      dimension: 'Novedad Científica',
      rating: 5,
      stars: '★★★★★',
      justification: 'Primer gemelo digital poblacional multi-escala anidado (individuo-barrio-ciudad) adaptado a la morfología y tejido social de asentamientos informales.',
    },
    {
      dimension: 'Probabilidad de Aceptación',
      rating: 3,
      stars: '★★★☆☆',
      justification: 'Tema de nicho computacional; requiere validar la viabilidad con revisores empíricos, pero la disponibilidad de datasets satelitales abiertos y la urgencia climática favorecen la publicación.',
    },
    {
      dimension: 'Impacto Social',
      rating: 5,
      stars: '★★★★★',
      justification: 'Más de 1.100 millones de personas habitan en asentamientos informales y barrios marginales; fortalecer la resiliencia comunitaria contribuye directamente al ODS 11.',
    },
  ] as ResearchEvaluationDimension[],
  
  knowledgeGap: `Los modelos convencionales de resiliencia urbana ante desastres (Davis, 1987; Wisner et al., 2004) se han centrado históricamente en infraestructura física formal o en análisis estadísticos agregados post-desastre. 
La propuesta parte de que persiste una brecha de modelos operativos que articulen de manera simultánea; esta afirmación deberá contrastarse mediante una revisión sistemática:
1. Características físicas hiperlocales de asentamientos informales (materiales precarios, pendientes empinadas, alta densidad sin planificación vial).
2. Redes sociales de apoyo mutuo y capital social barrial (organizaciones de base, líderes comunitarios).
3. Capacidad de respuesta institucional y tiempos de acceso de servicios de socorro.
4. Vulnerabilidad socioeconómica y demográfica (discapacidad, adultos mayores, jefatura femenina de hogar).

Esta ausencia limita severamente la planificación proactiva, transformando las alertas tempranas en respuestas tardías y reactivas en el Sur Global.`,

  generalObjective: 'Desarrollar un gemelo digital multi-escala que simule la resiliencia de asentamientos informales ante desastres naturales (inundaciones, terremotos, deslizamientos), integrando variables físicas, sociales e institucionales para ciudades del Sur Global.',

  specificObjectives: [
    'Construir una arquitectura de gemelo digital con tres escalas anidadas: individuo/hogar (micro), barrio/comunidad (meso), y sistema urbano (macro).',
    'Integrar datos de morfología urbana (satelital Planet/Sentinel), redes sociales (encuestas BRACED) y capacidad institucional (índices de gobernanza y tiempos de socorro).',
    'Simular escenarios de desastre con diferente magnitud y evaluar tiempos de respuesta, flujos de evacuación y recuperación sistémica.',
    'Identificar "puntos de fragilidad crítica" (cuellos de botella peatonales, clusters de vulnerabilidad motriz) que amplifiquen el impacto del desastre.',
    'Proponer protocolos de alerta temprana y acción anticipatoria basados en umbrales del gemelo digital para gobiernos locales y brigadas comunitarias.',
  ],

  phases: [
    {
      phase: 'Fase 1',
      title: 'Arquitectura Multi-escala (ML-ABM)',
      months: 'Meses 1-5',
      steps: [
        {
          num: 1,
          title: 'Nivel Micro (Individuo / Hogar)',
          description: 'Modelar decisiones de evacuación basadas en percepción de riesgo, acceso a información, capacidad motriz (discapacidad, edad, dependientes) y lazos vecinales.',
        },
        {
          num: 2,
          title: 'Nivel Meso (Barrio / Comunidad)',
          description: 'Modelar flujos de evacuación por callejones, gradas y puentes peatonales, puntos de encuentro seguros y redes de solidaridad (comités de emergencia, líderes).',
        },
        {
          num: 3,
          title: 'Nivel Macro (Ciudad / Sistema Urbano)',
          description: 'Modelar capacidad de respuesta institucional (bomberos, hospitales, albergues de contingencia), tiempos de acceso por vías perimetrales y asignación de recursos.',
        },
        {
          num: 4,
          title: 'Integración Multi-Nivel (ML-ABM)',
          description: 'Desarrollar un framework de modelado basado en agentes multinivel donde las escalas se retroalimentan con protocolos de información bidireccional.',
        },
      ],
    },
    {
      phase: 'Fase 2',
      title: 'Integración de Datos Abiertos y Satelitales',
      months: 'Meses 6-9',
      steps: [
        {
          num: 5,
          title: 'Mapeo de Asentamientos Informales',
          description: 'Utilizar GHSL-SMOD (JRC) y datos vectoriales de OpenStreetMap para delimitar los polígonos informales y morfología vial.',
        },
        {
          num: 6,
          title: 'Caracterización Física y Espectral',
          description: 'Extraer de Planet Labs y Sentinel-2 indicadores de densidad construida (NDBI), tipología de cubiertas (chapa/cartón/concreto), acceso a vías y pendientes DEM (SRTM/ALOS).',
        },
        {
          num: 7,
          title: 'Encuestas de Resiliencia Comunitaria',
          description: 'Diseñar y aplicar encuestas estandarizadas (metodología BRACED) para cuantificar capital social, confianza institucional y memoria de desastres previos.',
        },
        {
          num: 8,
          title: 'Calibración con Registros Históricos',
          description: 'Importar catálogos de EM-DAT y DesInventar para calibrar la frecuencia, umbrales de precipitación e intensidad destructiva.',
        },
      ],
    },
    {
      phase: 'Fase 3',
      title: 'Simulación de Escenarios y Estrés de Resiliencia',
      months: 'Meses 10-14',
      steps: [
        {
          num: 9,
          title: 'Escenario Base',
          description: 'Condiciones de operación normal sin perturbación climática ni geológica.',
        },
        {
          num: 10,
          title: 'Escenario A: Inundación Urbana',
          description: 'Lluvia extrema de 200mm en 24h en ciudades costeras/riberas (Lima, Cartagena, Recife).',
        },
        {
          num: 11,
          title: 'Escenario B: Terremoto',
          description: 'Sismo de magnitud Mw 7.5 con epicentro a 30km de la ciudad y colapso de pircas.',
        },
        {
          num: 12,
          title: 'Escenario C: Deslizamiento en Ladera',
          description: 'Precipitación sostenida de 150mm en 72h en laderas andinas (Medellín, La Paz, Quito).',
        },
        {
          num: 13,
          title: 'Escenario D: Evento Compuesto Multiamenaza',
          description: 'Sismo + lluvia torrencial + fractura de infraestructura crítica de acueducto.',
        },
        {
          num: 14,
          title: 'Extracción de Métricas de Salida',
          description: 'Tasa de afectados, tiempos de evacuación, daño estructural acumulado, tiempo de recuperación y curvas de resiliencia R(t).',
        },
      ],
    },
    {
      phase: 'Fase 4',
      title: 'Validación Participativa y Protocolos Operativos',
      months: 'Meses 15-20',
      steps: [
        {
          num: 15,
          title: 'Validación con Casos Históricos Reales',
          description: 'Comparar trayectorias del gemelo digital con eventos reales documentados (México 2017, São Paulo 2023, Mocoa 2017).',
        },
        {
          num: 16,
          title: 'Validación Participativa Comunitaria',
          description: 'Talleres con Defensa Civil, comités de barrio y ONGs para calibrar heurísticas y umbrales de pánico.',
        },
        {
          num: 17,
          title: 'Desarrollo de Protocolos de Alerta Temprana',
          description: 'Diseñar guías operativas de acción anticipatoria basadas en umbrales físicos del gemelo digital.',
        },
        {
          num: 18,
          title: 'Publicación de Código y Datos Abiertos',
          description: 'Liberación de arquitectura de código abierto, gemelo digital reproducible y manuales de réplica.',
        },
      ],
    },
  ] as ResearchPhase[],

  journalTarget: {
    name: 'International Journal of Disaster Risk Reduction (IJDRR)',
    publisher: 'Elsevier',
    quartile: 'Q1',
    impactFactor: '4.5 (consulta editorial 2026; verificar nuevamente antes del envío)',
    thematicArea: 'Reducción del riesgo de desastres, resiliencia urbana, gestión de emergencias y modelado computacional.',
    justification: 'Es una revista especializada en reducción de riesgo de desastres con enfoque interdisciplinario y publica trabajos que conectan tecnología, dinámicas comunitarias y gobernanza. El ajuste editorial debe verificarse nuevamente antes del envío.',
  },

  theoreticalContribution: 'Propone el concepto de "Resiliencia Digital Poblacional" como extensión operativa de la resiliencia socio-ecológica (Holling, 1973; Folke, 2006) y permite evaluar la hipótesis de que el capital social actúa como amortiguador parcial ante déficits físicos.',

  practicalContribution: 'Proporciona un prototipo de simulación y planificación sustentado en datos abiertos y ciencia participativa, orientado a reducir barreras de costo sin reemplazar sensores, estudios de campo ni sistemas oficiales.',
};
