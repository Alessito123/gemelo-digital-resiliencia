import React from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Sliders, 
  Clock, 
  CloudRain, 
  Activity, 
  Mountain, 
  Flame, 
  Shield, 
  HeartHandshake, 
  Network,
  ChevronDown,
  Gauge
} from 'lucide-react';
import { SettlementPreset, DisasterScenario, SimulationMetrics, ScenarioType } from '../types';
import { SETTLEMENT_PRESETS } from '../data/settlementPresets';
import { DISASTER_SCENARIOS } from '../data/disasterScenarios';
import { useLanguage } from '../context/LanguageContext';

interface SimulationControlsProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  isPlaying: boolean;
  simulationSpeed: number;
  hazardIntensity: number;
  warningLeadTimeMin: number;
  enableMutualAid: boolean;
  enableMultiScaleFeedback: boolean;
  onTogglePlay: () => void;
  onStepSimulation: () => void;
  onResetSimulation: () => void;
  onSelectSettlement: (id: string) => void;
  onSelectScenario: (id: string) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeIntensity: (val: number) => void;
  onChangeLeadTime: (val: number) => void;
  onToggleMutualAid: (val: boolean) => void;
  onToggleMultiScale: (val: boolean) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  settlement,
  scenario,
  metrics,
  isPlaying,
  simulationSpeed,
  hazardIntensity,
  warningLeadTimeMin,
  enableMutualAid,
  enableMultiScaleFeedback,
  onTogglePlay,
  onStepSimulation,
  onResetSimulation,
  onSelectSettlement,
  onSelectScenario,
  onChangeSpeed,
  onChangeIntensity,
  onChangeLeadTime,
  onToggleMutualAid,
  onToggleMultiScale,
}) => {
  const { language, t } = useLanguage();

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Top Selectors Row: Settlement Preset & Disaster Scenario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* City Case Study Selector */}
        <div className="space-y-1.5">
          <label htmlFor="settlement-select" className="text-[11px] uppercase font-mono font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
            {t.ctrlSettlement}:
          </label>
          <div className="relative">
            <select
              id="settlement-select"
              name="settlement"
              autoComplete="off"
              value={settlement.id}
              onChange={(e) => onSelectSettlement(e.target.value)}
              className="w-full bg-black/20 dark:bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-semibold appearance-none cursor-pointer focus:border-[#F27D26] transition-all pr-9 hover:border-white/20 shadow-inner"
            >
              {SETTLEMENT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-[#151821] text-white">
                  {preset.name} ({preset.city}, {preset.country}) — {preset.densityHabHa} hab/ha
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Disaster Scenario Selector */}
        <div className="space-y-1.5">
          <label htmlFor="scenario-select" className="text-[11px] uppercase font-mono font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t.ctrlScenario}:
          </label>
          <div className="relative">
            <select
              id="scenario-select"
              name="scenario"
              autoComplete="off"
              value={scenario.id}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="w-full bg-black/20 dark:bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#F27D26] font-bold appearance-none cursor-pointer focus:border-[#F27D26] transition-all pr-9 hover:border-white/20 shadow-inner"
            >
              {DISASTER_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-[#151821] text-white">
                  {sc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Primary Playback Deck */}
      <div className="glass-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Buttons: Play, Step, Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`btn-primary !px-5 !py-2.5 shadow-lg cursor-pointer ${
              isPlaying
                ? '!bg-amber-500 hover:!bg-amber-400 !text-black !shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : ''
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t.ctrlPause}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.ctrlPlay}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepSimulation}
            disabled={isPlaying}
            className="btn-secondary !py-2.5 disabled:opacity-40"
            title="Avanzar 1 paso (+2.5 min)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>{t.ctrlStep}</span>
          </button>

          <button
            type="button"
            aria-label="Reiniciar simulación"
            onClick={onResetSimulation}
            className="btn-secondary !p-2.5"
            title="Reiniciar a condiciones iniciales"
          >
            <RotateCcw className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/20 border border-white/5">
          <span className="text-[10px] uppercase font-mono font-bold text-gray-400 px-2">{t.ctrlSpeed}:</span>
          {[1, 2, 5].map((spd) => (
            <button
              type="button"
              aria-pressed={simulationSpeed === spd}
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                simulationSpeed === spd
                  ? 'bg-[#F27D26] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Simulation Ticker Telemetry */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/30 border border-white/10">
          <Clock className="w-4 h-4 text-[#F27D26] animate-pulse" />
          <div>
            <div className="text-xs font-mono font-extrabold text-white">
              T + {metrics.timeElapsedMin.toFixed(1)} min
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              Paso {metrics.currentStep} · {isPlaying ? 'En ejecución' : 'Detenido'}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Steering Sliders & Micro Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        {/* Intensity Slider */}
        <div className="glass-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#F27D26]" />
              {t.ctrlIntensity}:
            </span>
            <span className="font-mono font-extrabold text-[#F27D26] px-2 py-0.5 rounded bg-[#F27D26]/10">
              {hazardIntensity} / 10
            </span>
          </div>
          <input
            id="hazard-intensity"
            aria-label="Intensidad de amenaza"
            type="range"
            min="1"
            max="10"
            step="1"
            value={hazardIntensity}
            onChange={(e) => onChangeIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>Leve (1)</span>
            <span>Extremo (10)</span>
          </div>
        </div>

        {/* Warning Lead Time Slider */}
        <div className="glass-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {t.ctrlLeadTime}:
            </span>
            <span className="font-mono font-extrabold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10">
              {warningLeadTimeMin} min
            </span>
          </div>
          <input
            id="warning-lead-time"
            aria-label="Minutos de alerta temprana"
            type="range"
            min="0"
            max="120"
            step="15"
            value={warningLeadTimeMin}
            onChange={(e) => onChangeLeadTime(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>Súbita (0m)</span>
            <span>Anticipada (120m)</span>
          </div>
        </div>

        {/* Mutual Aid Switch */}
        <div className="glass-card p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F27D26]/15 flex items-center justify-center text-[#F27D26]">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-gray-200 text-xs">{t.ctrlMutualAid}</div>
              <div className="text-[10px] text-gray-400">Solidaridad vecinal micro</div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableMutualAid}
            onClick={() => onToggleMutualAid(!enableMutualAid)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              enableMutualAid ? 'bg-[#F27D26]' : 'bg-gray-700'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                enableMutualAid ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Multi-Scale Feedback Switch */}
        <div className="glass-card p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-gray-200 text-xs">{t.ctrlMultiScale}</div>
              <div className="text-[10px] text-gray-400">Micro ↔ Meso ↔ Macro</div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableMultiScaleFeedback}
            onClick={() => onToggleMultiScale(!enableMultiScaleFeedback)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              enableMultiScaleFeedback ? 'bg-purple-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                enableMultiScaleFeedback ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
