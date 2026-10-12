import { AiAnalysis, GeneratedProtocol } from '../ai/contracts';
import { EngineAdvisor, EngineAdvisorContext } from './contracts';

const scenarioThresholds: Record<string, [string, string, string, string]> = {
  flood: ['< 30 mm/24 h', '30-70 mm/24 h', '70-120 mm/24 h', '> 120 mm/24 h'],
  landslide: ['Saturación < 40%', 'Saturación 40-60%', 'Saturación 60-80%', 'Saturación > 80%'],
  earthquake: ['Sismicidad de fondo', 'Movimiento percibido', 'Daño localizado', 'Sismo destructivo'],
  compound: ['Monitoreo multiamenaza', 'Primera amenaza confirmada', 'Amenazas encadenadas', 'Falla crítica compuesta'],
  base: ['Operación normal', 'Anomalía menor', 'Alistamiento preventivo', 'Activación extraordinaria'],
};

function topRisks(context: EngineAdvisorContext): string[] {
  const risks = context.fragilityPoints.slice(0, 3).map((point) =>
    `${point.title}: ${point.amplificationMechanism}`,
  );
  return risks.length > 0 ? risks : ['No se identificaron fragilidades dinámicas críticas en esta ejecución.'];
}

function topDirectives(context: EngineAdvisorContext): string[] {
  const directives = context.fragilityPoints.slice(0, 3).map((point) => point.recommendedMitigation);
  return directives.length > 0 ? directives : ['Mantener monitoreo comunitario e institucional del escenario.'];
}

export const localEngineAdvisor: EngineAdvisor = {
  source: 'heuristic-engine',
  async analyze(context): Promise<AiAnalysis> {
    const { metrics, settlement, scenario, validation, language } = context;
    if (language === 'en') {
      return {
        executiveSummary: `${settlement.name} was assessed under ${scenario.name}. The simulated evacuation rate is ${metrics.evacuationRatePct}% and system resilience is ${metrics.systemResilienceIndex}/100.`,
        criticalRisks: topRisks(context),
        immediateDirectives: topDirectives(context),
        institutionalCoordination: `Prioritize ${metrics.bottlenecksActiveCount} active bottlenecks, verify shelter occupancy (${metrics.shelterOccupancyPct}%), and coordinate support for trapped households.`,
        theoreticalAlignment: `The result links household vulnerability, community support and institutional response. Evidence status: ${validation.status}.`,
      };
    }
    return {
      executiveSummary: `${settlement.name} fue evaluado ante ${scenario.name}. La evacuación simulada alcanza ${metrics.evacuationRatePct}% y la resiliencia del sistema es ${metrics.systemResilienceIndex}/100.`,
      criticalRisks: topRisks(context),
      immediateDirectives: topDirectives(context),
      institutionalCoordination: `Priorizar ${metrics.bottlenecksActiveCount} cuellos de botella activos, verificar la ocupación de albergues (${metrics.shelterOccupancyPct}%) y coordinar apoyo para hogares atrapados.`,
      theoreticalAlignment: `El resultado integra vulnerabilidad del hogar, apoyo comunitario y respuesta institucional. Estado de evidencia: ${validation.status}.`,
    };
  },
  async generateProtocol(context): Promise<GeneratedProtocol> {
    const thresholds = scenarioThresholds[context.scenario.type] ?? scenarioThresholds.base;
    const levels = ['VERDE', 'AMARILLO', 'NARANJA', 'ROJA'];
    const actions = [
      'Mantener vigilancia y actualizar canales comunitarios.',
      'Alistar brigadas, rutas, comunicaciones y puntos de encuentro.',
      'Evacuar preventivamente hogares con movilidad prioritaria y despejar rutas.',
      'Ejecutar evacuación general, rescate y coordinación con Defensa Civil.',
    ];
    return {
      title: `Protocolo de acción anticipatoria - ${context.scenario.name}`,
      leadTime: `${context.scenario.parameters.warningLeadTimeMin} minutos antes del impacto estimado`,
      levels: levels.map((level, index) => ({ level, threshold: thresholds[index], action: actions[index] })),
      communityChecklist: [
        'Confirmar la recepción de la alerta hogar por hogar.',
        'Asignar acompañantes a personas con movilidad reducida.',
        'Registrar bloqueos, ocupación de refugios y necesidades de rescate.',
      ],
    };
  },
};

