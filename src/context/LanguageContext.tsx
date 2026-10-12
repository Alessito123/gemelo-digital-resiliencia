import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  householdsCount: string;
  meetingPointsCount: string;
  statusLive: string;
  statusReady: string;
  btnAnalyzeScenario: string;
  btnProtocols: string;
  btnData: string;
  btnMethodology: string;
  btnReports: string;
  btnChatAssistant: string;
  toggleThemeDark: string;
  toggleThemeLight: string;
  langSwitch: string;

  // Hero Experience Intro
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroStatHouseholds: string;
  heroStatBottlenecks: string;
  heroStatLeadTime: string;
  heroResilienceScore: string;
  heroResilienceStatus: string;
  heroScaleMicro: string;
  heroScaleMicroDesc: string;
  heroScaleMeso: string;
  heroScaleMesoDesc: string;
  heroScaleMacro: string;
  heroScaleMacroDesc: string;
  heroScientificFramework: string;

  // Navigation rail
  navTerritory: string;
  navDecisions: string;
  navResults: string;
  navFragility: string;
  navProtocols: string;
  navEvidence: string;

  // Canvas / 3D
  viewMode2D: string;
  viewMode3D: string;
  layerTopography: string;
  layerRoofs: string;
  layerSocialNetwork: string;
  layerBottlenecks: string;
  layerMeetingPoints: string;
  layerHazardWave: string;
  camReset: string;
  camTopDown: string;
  camPerspective: string;
  selectedAgentInfo: string;
  clickToInspect: string;
  legendSafeZone: string;
  legendBottleneck: string;

  // Controls
  ctrlSettlement: string;
  ctrlScenario: string;
  ctrlSpeed: string;
  ctrlIntensity: string;
  ctrlLeadTime: string;
  ctrlMutualAid: string;
  ctrlMultiScale: string;
  ctrlSeed: string;
  ctrlPlay: string;
  ctrlPause: string;
  ctrlStep: string;
  ctrlReset: string;

  // Metrics
  metricsTitle: string;
  metricsResilienceIndex: string;
  metricsEvacuated: string;
  metricsStructuralDamage: string;
  metricsActiveAgents: string;
  metricsSafe: string;
  metricsTrapped: string;
  metricsInjured: string;
  metricsEvacSpeed: string;
  metricsTimeElapsed: string;

  // Fragility & Protocols
  fragilityTitle: string;
  fragilitySubtitle: string;
  protocolsTitle: string;
  protocolsLeadTime: string;
  protocolsChecklist: string;

  // Chatbot
  chatTitle: string;
  chatSubtitle: string;
  chatPlaceholder: string;
  chatSend: string;
  chatThinking: string;
  chatSuggestedQuestions: string;
  chatDisclaimer: string;

  // Reports
  reportsTitle: string;
  reportsSubtitle: string;
  reportsDownloadWord: string;
  reportsDownloadWordDesc: string;
  reportsDownloadPdf: string;
  reportsDownloadPdfDesc: string;
  reportsDownloadExcel: string;
  reportsDownloadExcelDesc: string;
  reportsGenerating: string;
  reportsClose: string;
}

const translationsES: Translations = {
  appTitle: 'Gemelo de Resiliencia Comunitaria',
  appSubtitle: 'Laboratorio de Resiliencia Urbana y Simulación Multi-Escala',
  householdsCount: 'hogares',
  meetingPointsCount: 'puntos de encuentro',
  statusLive: 'Simulación en curso',
  statusReady: 'Lista para explorar',
  btnAnalyzeScenario: 'Analizar Escenario',
  btnProtocols: 'Protocolos',
  btnData: 'Datos',
  btnMethodology: 'Metodología',
  btnReports: 'Reportes (DOCX/PDF/XLSX)',
  btnChatAssistant: 'Asistente IA',
  toggleThemeDark: 'Modo Oscuro',
  toggleThemeLight: 'Modo Claro',
  langSwitch: 'Idioma',

  heroEyebrow: 'Gemelo Digital de Resiliencia',
  heroTitle: 'Simulación Multi-Escala para Asentamientos Informales',
  heroLead: 'Modelado dinámico de evacuación, capital social y respuesta institucional acoplada bajo escenarios multiamenaza en el Sur Global.',
  heroStatHouseholds: 'Hogares Modelados',
  heroStatBottlenecks: 'Puntos Críticos',
  heroStatLeadTime: 'Ventana de Alerta',
  heroResilienceScore: 'Índice de Resiliencia',
  heroResilienceStatus: 'Capacidad Adaptativa Barrial',
  heroScaleMicro: 'Micro (Hogares)',
  heroScaleMicroDesc: 'Percepción, movilidad y ayuda mutua',
  heroScaleMeso: 'Meso (Comunidad)',
  heroScaleMesoDesc: 'Escalinatas, pasajes y puntos seguros',
  heroScaleMacro: 'Macro (Institucional)',
  heroScaleMacroDesc: 'Defensa Civil, alerta y albergues',
  heroScientificFramework: 'Marco Científico: Resiliencia Socio-Ecológica (Holling/Bruneau) + Dinámica de Agentes.',

  navTerritory: '01 / TERRITORIO',
  navDecisions: '02 / DECISIONES',
  navResults: '03 / RESULTADOS',
  navFragility: '04 / FRAGILIDAD',
  navProtocols: '05 / ACCIÓN ANTICIPADA',
  navEvidence: '06 / LABORATORIO DE EVIDENCIA',

  viewMode2D: 'Plano 2D',
  viewMode3D: 'Gemelo 3D WebGL',
  layerTopography: 'Topografía / DEM',
  layerRoofs: 'Materiales de Techo',
  layerSocialNetwork: 'Redes de Apoyo Mutuo',
  layerBottlenecks: 'Cuellos de Botella',
  layerMeetingPoints: 'Puntos Seguros',
  layerHazardWave: 'Onda de Amenaza',
  camReset: 'Reset Cámara',
  camTopDown: 'Cenital',
  camPerspective: 'Perspectiva 3D',
  selectedAgentInfo: 'Inspección de Hogar',
  clickToInspect: 'Haz clic en un hogar o punto para inspeccionar detalles.',
  legendSafeZone: 'Punto de Encuentro Seguro',
  legendBottleneck: 'Cuello de Botella Crítico',

  ctrlSettlement: 'Asentamiento Territorial',
  ctrlScenario: 'Escenario de Amenaza',
  ctrlSpeed: 'Velocidad de Simulación',
  ctrlIntensity: 'Intensidad de Amenaza',
  ctrlLeadTime: 'Ventana de Alerta Temprana',
  ctrlMutualAid: 'Redes de Apoyo Mutuo',
  ctrlMultiScale: 'Acoplamiento Multi-Escala',
  ctrlSeed: 'Semilla Aleatoria (RNG)',
  ctrlPlay: 'Iniciar Simulación',
  ctrlPause: 'Pausar',
  ctrlStep: 'Paso a Paso',
  ctrlReset: 'Reiniciar',

  metricsTitle: 'Panel de Métricas Dinámicas',
  metricsResilienceIndex: 'Índice de Resiliencia',
  metricsEvacuated: 'Tasa de Evacuación',
  metricsStructuralDamage: 'Daño Físico Estimado',
  metricsActiveAgents: 'Total de Hogares',
  metricsSafe: 'A Salvo',
  metricsTrapped: 'En Peligro / Atrapados',
  metricsInjured: 'Lesionados',
  metricsEvacSpeed: 'Tiempo Promedio de Evacuación',
  metricsTimeElapsed: 'Tiempo Transcurrido',

  fragilityTitle: 'Puntos Críticos de Fragilidad',
  fragilitySubtitle: 'Vulnerabilidades espaciales y cuellos de botella identificados en la red barrial.',
  protocolsTitle: 'Protocolos de Acción Anticipatoria y Alerta Temprana',
  protocolsLeadTime: 'Ventana de Alerta Sugerida',
  protocolsChecklist: 'Lista de Verificación Comunitaria',

  chatTitle: 'Asistente IA de Resiliencia',
  chatSubtitle: 'Gemini 3.7 Flash & Motor Heurístico Científico',
  chatPlaceholder: 'Escribe tu consulta sobre la simulación, cuellos de botella o protocolos...',
  chatSend: 'Enviar',
  chatThinking: 'Analizando dinámica territorial...',
  chatSuggestedQuestions: 'Consultas Rápidas Sugeridas',
  chatDisclaimer: 'Respuestas contextualizadas en tiempo real con el estado activo de la simulación.',

  reportsTitle: 'Centro de Exportación de Reportes',
  reportsSubtitle: 'Descarga informes técnicos, directivas operativas y datasets estructurados en múltiples formatos.',
  reportsDownloadWord: 'Informe Técnico en Word (.docx)',
  reportsDownloadWordDesc: 'Documento formal completo con portada institucional, perfil territorial, tabla de fragilidades y directivas anticipatorias.',
  reportsDownloadPdf: 'Reporte Ejecutivo en PDF (.pdf)',
  reportsDownloadPdfDesc: 'Ficha ejecutiva con cuadrícula de indicadores clave, gráficos de resiliencia y protocolos de evacuación listos para imprimir.',
  reportsDownloadExcel: 'Libro de Datos en Excel (.xlsx)',
  reportsDownloadExcelDesc: 'Libro con 4 pestañas: Resumen de Simulación, Censo de Hogares y Agentes, Cuellos de Botella e Historial Temporal.',
  reportsGenerating: 'Generando archivo...',
  reportsClose: 'Cerrar',
};

const translationsEN: Translations = {
  appTitle: 'Community Resilience Digital Twin',
  appSubtitle: 'Urban Resilience Lab & Multi-Scale Agent Simulation',
  householdsCount: 'households',
  meetingPointsCount: 'safe meeting points',
  statusLive: 'Simulation Running',
  statusReady: 'Ready to Explore',
  btnAnalyzeScenario: 'Analyze Scenario',
  btnProtocols: 'Protocols',
  btnData: 'Data Hub',
  btnMethodology: 'Methodology',
  btnReports: 'Reports (DOCX/PDF/XLSX)',
  btnChatAssistant: 'AI Assistant',
  toggleThemeDark: 'Dark Mode',
  toggleThemeLight: 'Light Mode',
  langSwitch: 'Language',

  heroEyebrow: 'Resilience Digital Twin',
  heroTitle: 'Multi-Scale Simulation for Informal Settlements',
  heroLead: 'Dynamic agent-based modeling of evacuation, mutual aid networks, and coupled institutional response under multi-hazard events in the Global South.',
  heroStatHouseholds: 'Modeled Households',
  heroStatBottlenecks: 'Critical Chokepoints',
  heroStatLeadTime: 'Warning Lead Time',
  heroResilienceScore: 'Resilience Score',
  heroResilienceStatus: 'Community Adaptive Capacity',
  heroScaleMicro: 'Micro (Households)',
  heroScaleMicroDesc: 'Risk perception, mobility & mutual support',
  heroScaleMeso: 'Meso (Community)',
  heroScaleMesoDesc: 'Staircases, corridors & safe zones',
  heroScaleMacro: 'Macro (Institutional)',
  heroScaleMacroDesc: 'Civil Defense, alerts & shelters',
  heroScientificFramework: 'Scientific Foundation: Socio-Ecological Resilience (Holling/Bruneau) + Agent Dynamics.',

  navTerritory: '01 / TERRITORY',
  navDecisions: '02 / DECISIONS',
  navResults: '03 / RESULTS',
  navFragility: '04 / FRAGILITY',
  navProtocols: '05 / EARLY ACTION',
  navEvidence: '06 / EVIDENCE LAB',

  viewMode2D: '2D Cartography',
  viewMode3D: '3D WebGL Twin',
  layerTopography: 'Topography / DEM',
  layerRoofs: 'Roof Materials',
  layerSocialNetwork: 'Mutual Aid Network',
  layerBottlenecks: 'Chokepoints',
  layerMeetingPoints: 'Safe Zones',
  layerHazardWave: 'Hazard Wave',
  camReset: 'Reset Camera',
  camTopDown: 'Top-Down View',
  camPerspective: '3D Perspective',
  selectedAgentInfo: 'Household Inspection',
  clickToInspect: 'Click on a household or meeting point to inspect details.',
  legendSafeZone: 'Safe Meeting Point',
  legendBottleneck: 'Critical Bottleneck',

  ctrlSettlement: 'Settlement Preset',
  ctrlScenario: 'Disaster Scenario',
  ctrlSpeed: 'Simulation Speed',
  ctrlIntensity: 'Hazard Intensity',
  ctrlLeadTime: 'Early Warning Lead Time',
  ctrlMutualAid: 'Mutual Support Networks',
  ctrlMultiScale: 'Multi-Scale Feedback Loop',
  ctrlSeed: 'Random Seed (RNG)',
  ctrlPlay: 'Run Simulation',
  ctrlPause: 'Pause',
  ctrlStep: 'Step Forward',
  ctrlReset: 'Reset',

  metricsTitle: 'Dynamic Metrics Dashboard',
  metricsResilienceIndex: 'System Resilience Index',
  metricsEvacuated: 'Evacuation Rate',
  metricsStructuralDamage: 'Estimated Physical Damage',
  metricsActiveAgents: 'Total Households',
  metricsSafe: 'Secured Safe',
  metricsTrapped: 'Trapped / In Danger',
  metricsInjured: 'Injured',
  metricsEvacSpeed: 'Avg. Evacuation Time',
  metricsTimeElapsed: 'Elapsed Time',

  fragilityTitle: 'Critical Fragility Points',
  fragilitySubtitle: 'Spatial vulnerabilities and physical chokepoints identified in the neighborhood network.',
  protocolsTitle: 'Early Warning & Anticipatory Action Protocols',
  protocolsLeadTime: 'Target Lead Time',
  protocolsChecklist: 'Community Readiness Checklist',

  chatTitle: 'Resilience AI Assistant',
  chatSubtitle: 'Gemini 3.7 Flash & Scientific Heuristic Engine',
  chatPlaceholder: 'Ask about evacuation flow, bottlenecks, or protocols...',
  chatSend: 'Send',
  chatThinking: 'Analyzing spatial dynamics...',
  chatSuggestedQuestions: 'Suggested Quick Prompts',
  chatDisclaimer: 'Real-time contextual answers powered by active simulation state.',

  reportsTitle: 'Report & Export Hub',
  reportsSubtitle: 'Download technical reports, operational directives, and structured datasets in multiple formats.',
  reportsDownloadWord: 'Word Technical Report (.docx)',
  reportsDownloadWordDesc: 'Comprehensive formal document with executive summary, territorial profile, fragility matrix, and anticipatory directives.',
  reportsDownloadPdf: 'Executive PDF Summary (.pdf)',
  reportsDownloadPdfDesc: 'Print-ready executive briefing with key resilience metrics, impact tables, and emergency protocols.',
  reportsDownloadExcel: 'Excel Data Workbook (.xlsx)',
  reportsDownloadExcelDesc: 'Multi-sheet workbook: Simulation Summary, Household Census & Vulnerability, Bottleneck Registry, and Time Series History.',
  reportsGenerating: 'Generating file...',
  reportsClose: 'Close',
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    if (saved === 'es' || saved === 'en') return saved;
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => (language === 'es' ? translationsES : translationsEN), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
