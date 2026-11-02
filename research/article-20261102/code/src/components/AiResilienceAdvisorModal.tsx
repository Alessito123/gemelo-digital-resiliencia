import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Users, 
  Download, 
  Loader2, 
  FileText,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { FragilityPoint, SettlementPreset, DisasterScenario, SimulationMetrics } from '../types';
import { AiAnalysis, GeneratedProtocol, getApiErrorMessage, isAiAnalysis, isGeneratedProtocol } from '../modules/ai/contracts';
import confetti from 'canvas-confetti';
import { useModalDialog } from '../hooks/useModalDialog';
import { useLanguage } from '../context/LanguageContext';
import { EngineWorkflowPanel } from './EngineWorkflowPanel';

interface AiResilienceAdvisorModalProps {
  isOpen: boolean;
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  fragilityPoints: FragilityPoint[];
  seed: number;
  hazardIntensity: number;
  warningLeadTimeMin: number;
  enableMutualAid: boolean;
  enableMultiScaleFeedback: boolean;
  initialMode?: 'engine' | 'diagnostic' | 'protocol';
  onClose: () => void;
}

export const AiResilienceAdvisorModal: React.FC<AiResilienceAdvisorModalProps> = ({
  isOpen,
  settlement,
  scenario,
  metrics,
  fragilityPoints,
  seed,
  hazardIntensity,
  warningLeadTimeMin,
  enableMutualAid,
  enableMultiScaleFeedback,
  initialMode = 'engine',
  onClose,
}) => {
  const { dialogRef, onKeyDown } = useModalDialog(isOpen, onClose);
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysis | null>(null);
  const [mode, setMode] = useState<'engine' | 'diagnostic' | 'protocol'>(initialMode);
  const [protocolResult, setProtocolResult] = useState<GeneratedProtocol | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleRunAiAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          metrics,
          settlement: {
            name: settlement.name,
            density: settlement.densityHabHa,
            socialCapitalIndex: settlement.socialCapitalIndex,
            slope: settlement.avgSlopeDeg,
          },
          fragilityPoints,
        }),
      });

      const data: unknown = await res.json();
      if (typeof data === 'object' && data !== null && 'success' in data && data.success === true && 'analysis' in data && isAiAnalysis(data.analysis)) {
        setAnalysisResult(data.analysis);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } else {
        setErrorMsg(getApiErrorMessage(data, 'La respuesta de análisis no fue válida.'));
      }
    } catch {
      setErrorMsg('No se pudo conectar con el servidor. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAiProtocol = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType: scenario.name,
          hazardLevel: `${metrics.currentStep > 5 ? 'Crítico / Activo' : 'En Fase de Alistamiento'}`,
          settlementProfile: {
            name: settlement.name,
            totalPopulation: settlement.totalPopulation,
            avgSlope: settlement.avgSlopeDeg,
            socialCapital: settlement.socialCapitalIndex,
          },
        }),
      });

      const data: unknown = await res.json();
      if (typeof data === 'object' && data !== null && 'success' in data && data.success === true && 'protocol' in data && isGeneratedProtocol(data.protocol)) {
        setProtocolResult(data.protocol);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } else {
        setErrorMsg(getApiErrorMessage(data, 'La respuesta del protocolo no fue válida.'));
      }
    } catch {
      setErrorMsg('No se pudo conectar con el servidor. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div 
        ref={dialogRef} 
        onKeyDown={onKeyDown} 
        tabIndex={-1} 
        role="dialog" 
        aria-modal="true" 
        aria-label="Análisis de resiliencia asistido" 
        className="modal-surface w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-100"
      >
        {/* Modal Header */}
        <div className="p-4 lg:p-5 border-b border-white/10 flex items-center justify-between bg-[#12141D] dark:bg-[#12141D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F27D26]/20 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26] shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50 uppercase tracking-wider">
                  LangGraph Engine
                </span>
                <span className="text-xs text-gray-400 font-mono">Sur Global · Resiliencia Multi-Escala</span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight mt-0.5 m-0">
                {language === 'es' ? 'Motor de Resiliencia y Decisión' : 'Resilience & Decision Engine'}
              </h2>
            </div>
          </div>
          <button
            type="button" 
            aria-label="Cerrar modal"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-5 py-3 bg-[#0B0C11] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMode('engine')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'engine'
                ? 'bg-cyan-300 text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white bg-[#181B26] border border-white/10'
            }`}
          >
            {language === 'es' ? 'Motor completo' : 'Full engine'}
          </button>
          <button
            type="button"
            onClick={() => setMode('diagnostic')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'diagnostic' 
                ? 'bg-[#F27D26] text-black shadow-md' 
                : 'text-gray-400 hover:text-white bg-[#181B26] border border-white/10'
            }`}
          >
            {language === 'es' ? 'Diagnóstico de Resiliencia' : 'Resilience Diagnostic'}
          </button>
          <button
            type="button"
            onClick={() => setMode('protocol')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'protocol' 
                ? 'bg-[#F27D26] text-black shadow-md' 
                : 'text-gray-400 hover:text-white bg-[#181B26] border border-white/10'
            }`}
          >
            {language === 'es' ? 'Protocolo Operativo de Alerta' : 'Operational EWS Protocol'}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-[#0F1117]">
          {/* Current Simulation Context Bar */}
          <div className="p-3.5 rounded-xl bg-[#181B26] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-gray-300">
            <div>
              <span className="text-gray-500 uppercase text-[10px] font-mono">Contexto:</span>{' '}
              <strong className="text-white">{settlement.name}</strong> ·{' '}
              <strong className="text-[#F27D26]">{scenario.name}</strong>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>T+ {metrics.timeElapsedMin.toFixed(1)}m</span>
              <span>Evacuación: <strong className="text-emerald-400">{metrics.evacuationRatePct}%</strong></span>
              <span>Resiliencia R(t): <strong className="text-[#F27D26]">{metrics.systemResilienceIndex} pts</strong></span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'engine' && (
            <EngineWorkflowPanel
              settlementId={settlement.id}
              scenarioId={scenario.id}
              seed={seed}
              hazardIntensity={hazardIntensity}
              warningLeadTimeMin={warningLeadTimeMin}
              enableMutualAid={enableMutualAid}
              enableMultiScaleFeedback={enableMultiScaleFeedback}
              publicDataCalibration={settlement.publicDataCalibration}
              language={language}
            />
          )}

          {/* DIAGNOSTIC MODE */}
          {mode === 'diagnostic' && (
            <div className="space-y-4">
              {!analysisResult && !isLoading && (
                <div className="p-8 text-center bg-[#181B26] rounded-xl border border-white/10 space-y-3">
                  <Sparkles className="w-10 h-10 text-[#F27D26] mx-auto animate-pulse" />
                  <h3 className="font-extrabold text-white text-sm m-0">
                    {language === 'es' ? 'Generar Diagnóstico Científico con IA' : 'Generate Scientific AI Diagnostic'}
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto text-xs leading-relaxed">
                    {language === 'es' 
                      ? 'El modelo procesa las métricas multi-escala, topografía, cuellos de botella y niveles de daño para emitir directivas adaptadas.'
                      : 'The model analyzes multi-scale metrics, topography DEM, bottlenecks and damage levels to issue tailored directives.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleRunAiAnalysis}
                    className="btn-primary !px-6 !py-2.5 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'es' ? 'Ejecutar Diagnóstico IA' : 'Run AI Diagnostic'}</span>
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="p-12 text-center bg-[#181B26] rounded-xl border border-white/10 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#F27D26] animate-spin mx-auto" />
                  <div className="font-bold text-white text-xs">
                    {language === 'es' ? 'Procesando dinámica multi-escala y formulando directivas…' : 'Processing multi-scale dynamics and synthesizing directives…'}
                  </div>
                  <p className="text-gray-500 font-mono text-[11px]">Consultando Gemini 3.7 Flash Engine</p>
                </div>
              )}

              {analysisResult && !isLoading && (
                <div className="space-y-3">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-[#181B26] border border-[#F27D26]/40 space-y-1.5 shadow-lg">
                    <h4 className="font-bold text-[#F27D26] uppercase tracking-wider text-[11px] flex items-center gap-1.5 m-0 font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      {language === 'es' ? 'Resumen Ejecutivo de Resiliencia' : 'Executive Resilience Summary'}
                    </h4>
                    <p className="text-gray-200 leading-relaxed text-xs m-0">
                      {analysisResult.executiveSummary}
                    </p>
                  </div>

                  {/* Critical Risks & Immediate Directives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#181B26] border border-white/10 space-y-2">
                      <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 m-0 font-mono">
                        <AlertTriangle className="w-4 h-4" />
                        {language === 'es' ? 'Riesgos Críticos Emergentes' : 'Emerging Critical Risks'}
                      </h4>
                      <ul className="space-y-1.5 text-gray-300 m-0 pl-0 list-none">
                        {analysisResult.criticalRisks?.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-rose-400 font-mono font-bold">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#181B26] border border-white/10 space-y-2">
                      <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 m-0 font-mono">
                        <ShieldAlert className="w-4 h-4" />
                        {language === 'es' ? 'Directivas Inmediatas para Brigadas' : 'Immediate Directives for Brigades'}
                      </h4>
                      <ul className="space-y-1.5 text-gray-300 m-0 pl-0 list-none">
                        {analysisResult.immediateDirectives?.map((dir: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-emerald-400 font-mono font-bold">{i + 1}.</span>
                            <span>{dir}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Institutional Coordination */}
                  <div className="p-4 rounded-xl bg-[#181B26] border border-white/10 space-y-1">
                    <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 m-0 font-mono">
                      <Building2 className="w-4 h-4" />
                      {language === 'es' ? 'Coordinación Institucional (Defensa Civil / Alcaldía)' : 'Institutional Coordination'}
                    </h4>
                    <p className="text-gray-300 text-xs leading-relaxed m-0">
                      {analysisResult.institutionalCoordination}
                    </p>
                  </div>

                  {/* Theoretical Alignment */}
                  <div className="p-3 rounded-xl bg-[#181B26] border border-white/10 text-[11px] text-gray-400 font-mono">
                    <strong className="text-gray-300">Alineación Teórica: </strong>
                    {analysisResult.theoreticalAlignment}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROTOCOL MODE */}
          {mode === 'protocol' && (
            <div className="space-y-4">
              {!protocolResult && !isLoading && (
                <div className="p-8 text-center bg-[#181B26] rounded-xl border border-white/10 space-y-3">
                  <FileText className="w-10 h-10 text-[#F27D26] mx-auto" />
                  <h3 className="font-extrabold text-white text-sm m-0">
                    {language === 'es' ? 'Formular Protocolo Operativo Formal' : 'Formulate Operational EWS Protocol'}
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto text-xs leading-relaxed">
                    {language === 'es'
                      ? 'Genera una guía de acción anticipatoria detallada con umbrales físicos y checklists para líderes comunitarios.'
                      : 'Generates an anticipatory action guideline with physical thresholds and checklists for community leaders.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateAiProtocol}
                    className="btn-primary !px-6 !py-2.5 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'es' ? 'Sintetizar Protocolo' : 'Synthesize Protocol'}</span>
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="p-12 text-center bg-[#181B26] rounded-xl border border-white/10 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#F27D26] animate-spin mx-auto" />
                  <div className="font-bold text-white text-xs">
                    {language === 'es' ? 'Estructurando protocolo de alerta temprana y acción anticipatoria…' : 'Structuring early warning and anticipatory action protocol…'}
                  </div>
                </div>
              )}

              {protocolResult && !isLoading && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#181B26] border border-[#F27D26]/50 space-y-1">
                    <h3 className="font-bold text-white text-sm m-0">
                      {protocolResult.title}
                    </h3>
                    <div className="text-[11px] text-[#F27D26] font-mono">
                      Tiempo de Anticipación Objetivo: {protocolResult.leadTime}
                    </div>
                  </div>

                  {/* Protocol Levels */}
                  <div className="space-y-2">
                    {protocolResult.levels?.map((lvl: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-[#181B26] rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-extrabold text-[#F27D26] text-xs uppercase tracking-wider">
                            {lvl.level}
                          </span>
                          <p className="text-gray-400 text-[11px] mt-0.5 font-mono m-0">
                            Umbral: <strong className="text-gray-200">{lvl.threshold}</strong>
                          </p>
                        </div>
                        <div className="sm:text-right max-w-sm text-gray-300 text-[11px]">
                          {lvl.action}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Community Checklist */}
                  {protocolResult.communityChecklist && (
                    <div className="p-4 bg-[#181B26] rounded-xl border border-white/10">
                      <h4 className="font-bold text-gray-200 text-xs mb-2 flex items-center gap-1.5 font-mono m-0">
                        <CheckCircle2 className="w-4 h-4 text-[#F27D26]" />
                        {language === 'es' ? 'Checklist Operativo de Terreno:' : 'Field Operational Checklist:'}
                      </h4>
                      <ul className="space-y-1.5 text-gray-300 text-[11px] m-0 pl-0 list-none mt-2">
                        {protocolResult.communityChecklist.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#F27D26] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#12141D] border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={mode === 'diagnostic' ? handleRunAiAnalysis : handleGenerateAiProtocol}
            disabled={isLoading}
            className={`btn-secondary ${mode === 'engine' ? 'invisible pointer-events-none' : ''}`}
            aria-hidden={mode === 'engine'}
            tabIndex={mode === 'engine' ? -1 : 0}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'es' ? 'Actualizar' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary !px-5 !py-2"
          >
            {language === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
