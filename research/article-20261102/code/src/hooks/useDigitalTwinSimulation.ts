import { useCallback, useEffect, useMemo, useState } from 'react';
import { DISASTER_SCENARIOS } from '../data/disasterScenarios';
import { SETTLEMENT_PRESETS } from '../data/settlementPresets';
import { CommunitySurveyAggregate, PublicDataCalibration, SettlementPreset, SimulationHistoryPoint } from '../types';
import { advanceSimulation, calibrateSettlement, calibrateSettlementWithPublicData, createSimulation, SimulationConfig } from '../modules/simulation/simulationEngine';

export type ResilienceTimePoint = SimulationHistoryPoint;

export function useDigitalTwinSimulation() {
  const [selectedSettlementId, setSelectedSettlementId] = useState('medellin-comuna13');
  const [selectedScenarioId, setSelectedScenarioId] = useState('landslide');
  const [hazardIntensity, setHazardIntensity] = useState(8);
  const [warningLeadTimeMin, setWarningLeadTimeMin] = useState(60);
  const [enableMutualAid, setEnableMutualAid] = useState(true);
  const [enableMultiScaleFeedback, setEnableMultiScaleFeedback] = useState(true);
  const [seed, setSeedValue] = useState(202609);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const initialSettlement = SETTLEMENT_PRESETS.find((item) => item.id === selectedSettlementId) ?? SETTLEMENT_PRESETS[0];
  const initialScenario = DISASTER_SCENARIOS.find((item) => item.id === selectedScenarioId) ?? DISASTER_SCENARIOS[0];
  const initialConfig: SimulationConfig = {
    seed, hazardIntensity, warningLeadTimeMin, enableMutualAid, enableMultiScaleFeedback,
  };
  const [simulation, setSimulation] = useState(() => createSimulation(initialSettlement, initialScenario, initialConfig));

  const config = useMemo<SimulationConfig>(() => ({
    seed, hazardIntensity, warningLeadTimeMin, enableMutualAid, enableMultiScaleFeedback,
  }), [seed, hazardIntensity, warningLeadTimeMin, enableMutualAid, enableMultiScaleFeedback]);

  const resetWith = useCallback((
    settlementId = selectedSettlementId,
    scenarioId = selectedScenarioId,
    nextSeed = seed,
    calibratedSettlement?: SettlementPreset,
  ) => {
    const baseSettlement = SETTLEMENT_PRESETS.find((item) => item.id === settlementId) ?? SETTLEMENT_PRESETS[0];
    const settlement = calibratedSettlement?.id === settlementId ? calibratedSettlement : baseSettlement;
    const scenario = DISASTER_SCENARIOS.find((item) => item.id === scenarioId) ?? DISASTER_SCENARIOS[0];
    const nextConfig = {
      seed: nextSeed,
      hazardIntensity: scenario.parameters.intensityScale,
      warningLeadTimeMin: scenario.parameters.warningLeadTimeMin,
      enableMutualAid,
      enableMultiScaleFeedback,
    };
    setHazardIntensity(nextConfig.hazardIntensity);
    setWarningLeadTimeMin(nextConfig.warningLeadTimeMin);
    setSimulation(createSimulation(settlement, scenario, nextConfig));
    setSelectedAgentId(null);
    setIsPlaying(false);
  }, [selectedSettlementId, selectedScenarioId, seed, enableMutualAid, enableMultiScaleFeedback]);

  const resetSimulation = useCallback(() => {
    resetWith(selectedSettlementId, selectedScenarioId, seed, simulation.settlement);
  }, [resetWith, selectedSettlementId, selectedScenarioId, seed, simulation.settlement]);
  const handleSelectSettlement = useCallback((id: string) => {
    setSelectedSettlementId(id);
    resetWith(id, selectedScenarioId);
  }, [resetWith, selectedScenarioId]);
  const handleSelectScenario = useCallback((id: string) => {
    setSelectedScenarioId(id);
    resetWith(selectedSettlementId, id, seed, simulation.settlement);
  }, [resetWith, selectedSettlementId, seed, simulation.settlement]);
  const setSeed = useCallback((value: number) => {
    const safeSeed = Math.max(1, Math.min(2_147_483_647, Math.round(value)));
    setSeedValue(safeSeed);
    resetWith(selectedSettlementId, selectedScenarioId, safeSeed, simulation.settlement);
  }, [resetWith, selectedSettlementId, selectedScenarioId, simulation.settlement]);
  const stepSimulation = useCallback(() => setSimulation((current) => advanceSimulation(current, config)), [config]);
  const applyCommunitySurvey = useCallback((survey: CommunitySurveyAggregate) => {
    setSimulation((current) => createSimulation(calibrateSettlement(current.settlement, survey), current.scenario, config));
    setIsPlaying(false);
  }, [config]);
  const applyPublicDataCalibration = useCallback((calibration: PublicDataCalibration) => {
    setSimulation((current) => createSimulation(calibrateSettlementWithPublicData(current.settlement, calibration), current.scenario, config));
    setIsPlaying(false);
  }, [config]);
  const togglePlay = useCallback(() => {
    if (simulation.scenario.id !== 'base') setIsPlaying((current) => !current);
  }, [simulation.scenario.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = window.setInterval(stepSimulation, Math.max(150, Math.round(900 / simulationSpeed)));
    return () => window.clearInterval(intervalId);
  }, [isPlaying, simulationSpeed, stepSimulation]);

  useEffect(() => {
    if (simulation.metrics.currentStep > 25 || (simulation.metrics.safeCount + simulation.metrics.trappedCount === simulation.metrics.totalAgents && simulation.metrics.totalAgents > 0)) setIsPlaying(false);
  }, [simulation.metrics]);

  return {
    settlement: simulation.settlement,
    scenario: simulation.scenario,
    metrics: simulation.metrics,
    resilienceHistory: simulation.history,
    fragilityPoints: simulation.fragilityPoints,
    seed,
    isPlaying,
    simulationSpeed,
    hazardIntensity,
    warningLeadTimeMin,
    enableMutualAid,
    enableMultiScaleFeedback,
    selectedAgentId,
    togglePlay,
    stepSimulation,
    resetSimulation,
    handleSelectSettlement,
    handleSelectScenario,
    setSimulationSpeed,
    setHazardIntensity,
    setWarningLeadTimeMin,
    setEnableMutualAid,
    setEnableMultiScaleFeedback,
    setSelectedAgentId,
    setSeed,
    applyCommunitySurvey,
    applyPublicDataCalibration,
  };
}
