import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { DISASTER_SCENARIOS } from '../../data/disasterScenarios';
import { SETTLEMENT_PRESETS } from '../../data/settlementPresets';
import { AiAnalysis, GeneratedProtocol, isAiAnalysis, isGeneratedProtocol } from '../ai/contracts';
import {
  calibrateSettlement,
  calibrateSettlementWithPublicData,
  createSimulation,
  runSimulation,
  SimulationConfig,
  SimulationState,
} from '../simulation/simulationEngine';
import { validateSimulation } from '../validation/validationLab';
import { ValidationReport } from '../../types';
import {
  EngineInputError,
  EngineNodeName,
  EngineRunInput,
  EngineRunInputSchema,
  EngineRunResult,
  EngineTraceEntry,
  EngineWorkflowDependencies,
} from './contracts';
import { localEngineAdvisor } from './localAdvisor';

const GraphState = Annotation.Root({
  input: Annotation<EngineRunInput>,
  simulationConfig: Annotation<SimulationConfig | undefined>,
  simulation: Annotation<SimulationState | undefined>,
  validation: Annotation<ValidationReport | undefined>,
  analysis: Annotation<AiAnalysis | undefined>,
  protocol: Annotation<GeneratedProtocol | null | undefined>,
  analysisSource: Annotation<string | undefined>,
  warnings: Annotation<string[]>({ reducer: (left, right) => [...left, ...right], default: () => [] }),
  trace: Annotation<EngineTraceEntry[]>({ reducer: (left, right) => [...left, ...right], default: () => [] }),
});

type WorkflowState = typeof GraphState.State;

function trace(state: WorkflowState, node: EngineNodeName, summary: string, status: EngineTraceEntry['status'] = 'completed'): EngineTraceEntry {
  return { sequence: state.trace.length + 1, node, status, summary };
}

function stableExecutionId(input: EngineRunInput): string {
  const text = JSON.stringify(input);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `run-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function illustrativeReport(input: EngineRunInput): ValidationReport {
  return {
    status: 'illustrative',
    comparedMetrics: 0,
    meanAbsoluteError: 0,
    normalizedFitScore: 0,
    sourceLabel: input.dataset?.metadata.source ?? 'Sin dataset observado',
    limitations: [
      'La ejecución no se comparó con observaciones reales compatibles.',
      'Los resultados son estimaciones de planificación y no una alerta oficial.',
    ],
  };
}

export async function runResilienceWorkflow(
  rawInput: unknown,
  dependencies: EngineWorkflowDependencies = {},
): Promise<EngineRunResult> {
  const parsed = EngineRunInputSchema.safeParse(rawInput);
  if (!parsed.success) throw new EngineInputError(parsed.error.flatten());
  const input = parsed.data;
  const preferredAdvisor = dependencies.advisor ?? localEngineAdvisor;

  const resolveContext = async (state: WorkflowState) => {
    const sourceSettlement = SETTLEMENT_PRESETS.find((item) => item.id === state.input.settlementId);
    const scenario = DISASTER_SCENARIOS.find((item) => item.id === state.input.scenarioId);
    if (!sourceSettlement || !scenario) throw new EngineInputError({ settlementId: state.input.settlementId, scenarioId: state.input.scenarioId });
    const simulationConfig: SimulationConfig = {
      seed: state.input.config.seed,
      hazardIntensity: state.input.config.hazardIntensity,
      warningLeadTimeMin: state.input.config.warningLeadTimeMin,
      enableMutualAid: state.input.config.enableMutualAid,
      enableMultiScaleFeedback: state.input.config.enableMultiScaleFeedback,
    };
    const simulation = createSimulation(sourceSettlement, scenario, simulationConfig);
    return {
      simulationConfig,
      simulation,
      trace: [trace(state, 'resolve-context', `${sourceSettlement.name} · ${scenario.name}`)],
    };
  };

  const calibrate = async (state: WorkflowState) => {
    if (!state.simulation || !state.simulationConfig) throw new Error('ENGINE_STATE_INCOMPLETE');
    let settlement = state.simulation.settlement;
    if (state.input.communitySurvey) settlement = calibrateSettlement(settlement, state.input.communitySurvey);
    if (state.input.publicDataCalibration) settlement = calibrateSettlementWithPublicData(settlement, state.input.publicDataCalibration);
    return {
      simulation: createSimulation(settlement, state.simulation.scenario, state.simulationConfig),
      trace: [trace(state, 'calibrate', `${state.input.communitySurvey ? 'encuesta ' : ''}${state.input.publicDataCalibration ? 'datos públicos' : 'parámetros base'}`.trim())],
    };
  };

  const simulate = async (state: WorkflowState) => {
    if (!state.simulation || !state.simulationConfig) throw new Error('ENGINE_STATE_INCOMPLETE');
    const simulation = runSimulation(state.simulation, state.simulationConfig, state.input.config.steps);
    return {
      simulation,
      trace: [trace(state, 'simulate', `${simulation.currentStep} pasos · R(t) ${simulation.metrics.systemResilienceIndex}/100`)],
    };
  };

  const routeEvidence = (state: WorkflowState) => state.input.dataset ? 'validate-evidence' : 'mark-illustrative';

  const validateEvidence = async (state: WorkflowState) => {
    if (!state.simulation || !state.input.dataset) throw new Error('ENGINE_STATE_INCOMPLETE');
    const validation = validateSimulation(state.simulation.metrics, state.input.dataset);
    return {
      validation,
      trace: [trace(state, 'validate-evidence', `${validation.comparedMetrics} métricas · ajuste ${validation.normalizedFitScore}/100`)],
    };
  };

  const markIllustrative = async (state: WorkflowState) => ({
    validation: illustrativeReport(state.input),
    trace: [trace(state, 'mark-illustrative', 'Sin evidencia observada compatible')],
  });

  const analyze = async (state: WorkflowState) => {
    if (!state.simulation || !state.validation) throw new Error('ENGINE_STATE_INCOMPLETE');
    const context = {
      settlement: state.simulation.settlement,
      scenario: state.simulation.scenario,
      metrics: state.simulation.metrics,
      fragilityPoints: state.simulation.fragilityPoints,
      validation: state.validation,
      language: state.input.language,
    };
    try {
      const analysis = await preferredAdvisor.analyze(context);
      if (!isAiAnalysis(analysis)) throw new Error('INVALID_ADVISOR_OUTPUT');
      return {
        analysis,
        analysisSource: preferredAdvisor.source,
        trace: [trace(state, 'analyze', `Diagnóstico: ${preferredAdvisor.source}`)],
      };
    } catch {
      const analysis = await localEngineAdvisor.analyze(context);
      return {
        analysis,
        analysisSource: localEngineAdvisor.source,
        warnings: ['ADVISOR_FALLBACK'],
        trace: [trace(state, 'analyze', 'Diagnóstico local por fallback')],
      };
    }
  };

  const routeProtocol = (state: WorkflowState) => state.input.includeProtocol ? 'build-protocol' : 'skip-protocol';

  const buildProtocol = async (state: WorkflowState) => {
    if (!state.simulation || !state.validation) throw new Error('ENGINE_STATE_INCOMPLETE');
    const context = {
      settlement: state.simulation.settlement,
      scenario: state.simulation.scenario,
      metrics: state.simulation.metrics,
      fragilityPoints: state.simulation.fragilityPoints,
      validation: state.validation,
      language: state.input.language,
    };
    const advisor = state.analysisSource === preferredAdvisor.source ? preferredAdvisor : localEngineAdvisor;
    try {
      const protocol = await advisor.generateProtocol(context);
      if (!isGeneratedProtocol(protocol)) throw new Error('INVALID_ADVISOR_OUTPUT');
      return { protocol, trace: [trace(state, 'build-protocol', `Protocolo: ${advisor.source}`)] };
    } catch {
      const protocol = await localEngineAdvisor.generateProtocol(context);
      return {
        protocol,
        warnings: ['ADVISOR_FALLBACK'],
        trace: [trace(state, 'build-protocol', 'Protocolo local por fallback')],
      };
    }
  };

  const skipProtocol = async (state: WorkflowState) => ({
    protocol: null,
    trace: [trace(state, 'skip-protocol', 'Protocolo omitido por configuración', 'skipped')],
  });

  const finalize = async (state: WorkflowState) => ({
    trace: [trace(state, 'finalize', 'Resultado consolidado y trazable')],
  });

  const graph = new StateGraph(GraphState)
    .addNode('resolve-context', resolveContext)
    .addNode('calibrate', calibrate)
    .addNode('simulate', simulate)
    .addNode('validate-evidence', validateEvidence)
    .addNode('mark-illustrative', markIllustrative)
    .addNode('analyze', analyze)
    .addNode('build-protocol', buildProtocol)
    .addNode('skip-protocol', skipProtocol)
    .addNode('finalize', finalize)
    .addEdge(START, 'resolve-context')
    .addEdge('resolve-context', 'calibrate')
    .addEdge('calibrate', 'simulate')
    .addConditionalEdges('simulate', routeEvidence, ['validate-evidence', 'mark-illustrative'])
    .addEdge('validate-evidence', 'analyze')
    .addEdge('mark-illustrative', 'analyze')
    .addConditionalEdges('analyze', routeProtocol, ['build-protocol', 'skip-protocol'])
    .addEdge('build-protocol', 'finalize')
    .addEdge('skip-protocol', 'finalize')
    .addEdge('finalize', END)
    .compile();

  const state = await graph.invoke({ input });
  if (!state.simulation || !state.validation || !state.analysis || state.protocol === undefined || !state.analysisSource) {
    throw new Error('ENGINE_RUN_INCOMPLETE');
  }
  const warnings = [...new Set(state.warnings)];
  return {
    executionId: stableExecutionId(input),
    engineVersion: 'langgraph-1',
    analysisSource: state.analysisSource,
    input,
    simulation: {
      settlement: {
        id: state.simulation.settlement.id,
        name: state.simulation.settlement.name,
        city: state.simulation.settlement.city,
        country: state.simulation.settlement.country,
      },
      scenario: {
        id: state.simulation.scenario.id,
        name: state.simulation.scenario.name,
        type: state.simulation.scenario.type,
      },
      metrics: state.simulation.metrics,
      history: state.simulation.history,
      fragilityPoints: state.simulation.fragilityPoints,
    },
    validation: state.validation,
    analysis: state.analysis,
    protocol: state.protocol,
    trace: state.trace,
    warnings,
    limitations: [
      ...state.validation.limitations,
      'La salida apoya investigación y planificación; no constituye una alerta oficial.',
    ],
  };
}

