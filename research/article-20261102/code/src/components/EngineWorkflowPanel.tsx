import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  CircleDashed,
  Database,
  GitBranch,
  Loader2,
  Play,
  Radar,
  RotateCcw,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PublicDataCalibration, ScenarioType } from '../types';
import { EngineRunInput, EngineRunResult } from '../modules/engine/contracts';
import { runEngine } from '../modules/engine/client';

interface EngineWorkflowPanelProps {
  settlementId: string;
  scenarioId: ScenarioType;
  seed: number;
  hazardIntensity: number;
  warningLeadTimeMin: number;
  enableMutualAid: boolean;
  enableMultiScaleFeedback: boolean;
  publicDataCalibration?: PublicDataCalibration;
  language: 'es' | 'en';
}

const plannedNodes = [
  ['01', 'Contexto', 'resolve-context'],
  ['02', 'Calibración', 'calibrate'],
  ['03', 'Simulación', 'simulate'],
  ['04', 'Evidencia', 'validate-evidence'],
  ['05', 'Diagnóstico', 'analyze'],
  ['06', 'Protocolo', 'build-protocol'],
  ['07', 'Resultado', 'finalize'],
] as const;

export function EngineWorkflowPanel(props: EngineWorkflowPanelProps) {
  const [result, setResult] = useState<EngineRunResult | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const execute = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setError('');
    try {
      const input: EngineRunInput = {
        settlementId: props.settlementId,
        scenarioId: props.scenarioId,
        config: {
          seed: props.seed,
          hazardIntensity: props.hazardIntensity,
          warningLeadTimeMin: props.warningLeadTimeMin,
          enableMutualAid: props.enableMutualAid,
          enableMultiScaleFeedback: props.enableMultiScaleFeedback,
          steps: 20,
        },
        publicDataCalibration: props.publicDataCalibration,
        language: props.language,
        includeProtocol: true,
      };
      setResult(await runEngine(input, controller.signal));
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar el motor.');
    } finally {
      if (controllerRef.current === controller) setRunning(false);
    }
  };

  const completedNodes = new Set(result?.trace.map((entry) => entry.node) ?? []);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#0a1116] shadow-[0_24px_80px_rgba(0,0,0,.38)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(125,211,252,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.05)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-cyan-300">
              <GitBranch className="h-3.5 w-3.5" />
              LangGraph · motor operativo v1
            </div>
            <h3 className="m-0 text-xl font-black tracking-tight text-white sm:text-2xl">
              Sala de orquestación
            </h3>
            <p className="mb-0 mt-2 max-w-lg text-xs leading-relaxed text-slate-400">
              Ejecuta el ciclo completo en servidor: calibra el territorio, simula las tres escalas, contrasta evidencia y construye una respuesta auditable.
            </p>
          </div>
          <button
            type="button"
            onClick={execute}
            disabled={running}
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-cyan-300 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-[.14em] text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : result ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            {running ? 'Orquestando…' : result ? 'Reejecutar motor' : 'Ejecutar motor'}
          </button>
        </div>
      </div>

      <div className="relative p-4 sm:p-6">
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Semilla', props.seed.toString(), Radar],
            ['Intensidad', `${props.hazardIntensity}/10`, Activity],
            ['Anticipación', `${props.warningLeadTimeMin} min`, Route],
            ['Evidencia', props.publicDataCalibration ? `${props.publicDataCalibration.sourceIds.length} fuentes` : 'Base', Database],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-xl border border-white/8 bg-white/[.035] p-3">
              <Icon className="mb-2 h-4 w-4 text-cyan-300" />
              <div className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-500">{String(label)}</div>
              <div className="mt-1 text-sm font-bold text-slate-100">{String(value)}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto pb-2" aria-label="Grafo de ejecución del motor">
          <div className="flex min-w-[720px] items-center gap-1">
            {plannedNodes.map(([number, label, node], index) => {
              const completed = completedNodes.has(node) || (node === 'validate-evidence' && completedNodes.has('mark-illustrative'));
              return (
                <React.Fragment key={node}>
                  <div className={`min-w-[84px] flex-1 rounded-xl border px-3 py-3 transition ${completed ? 'border-emerald-300/30 bg-emerald-300/[.07]' : 'border-white/10 bg-black/20'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-slate-500">{number}</span>
                      {completed ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <CircleDashed className={`h-3.5 w-3.5 text-slate-600 ${running ? 'animate-pulse' : ''}`} />}
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-slate-200">{label}</div>
                  </div>
                  {index < plannedNodes.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-xs text-rose-100">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" />
            {error}
          </div>
        )}

        {!result && !running && !error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-white/15 bg-black/15 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <p className="m-0 text-xs leading-relaxed text-slate-400">
              La ejecución es reproducible con la misma semilla. Si no hay una clave externa configurada, el grafo utiliza el asesor heurístico local y permanece completamente funcional.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4" aria-live="polite">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Resiliencia', `${result.simulation.metrics.systemResilienceIndex}/100`, 'text-cyan-200'],
                ['Evacuación', `${result.simulation.metrics.evacuationRatePct}%`, 'text-emerald-300'],
                ['Daño estructural', `${result.simulation.metrics.estimatedStructuralDamagePct}%`, 'text-amber-300'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-[#101b22] p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-500">{label}</div>
                  <div className={`mt-2 text-2xl font-black tracking-tight ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
              <div className="rounded-xl border border-white/10 bg-[#0d171d] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="m-0 font-mono text-[10px] font-black uppercase tracking-[.18em] text-slate-300">Bitácora del grafo</h4>
                  <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[9px] text-slate-500">{result.executionId}</span>
                </div>
                <ol className="m-0 space-y-2 p-0">
                  {result.trace.map((entry) => (
                    <li key={`${entry.sequence}-${entry.node}`} className="flex gap-3 text-[11px]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 font-mono text-[9px] text-emerald-300">{entry.sequence}</span>
                      <div>
                        <div className="font-bold text-slate-200">{entry.node}</div>
                        <div className="mt-0.5 text-slate-500">{entry.summary}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.045] p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <h4 className="m-0 font-mono text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Síntesis del motor</h4>
                    <span className="ml-auto rounded-full border border-cyan-200/20 bg-black/20 px-2 py-1 font-mono text-[9px] text-cyan-200">{result.analysisSource}</span>
                  </div>
                  <p className="m-0 text-xs leading-relaxed text-slate-200">{result.analysis.executiveSummary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="font-mono text-[9px] uppercase tracking-[.16em] text-rose-300">Riesgos prioritarios</div>
                    <ul className="mb-0 mt-3 space-y-2 pl-4 text-[11px] leading-relaxed text-slate-300">
                      {result.analysis.criticalRisks.map((risk) => <li key={risk}>{risk}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="font-mono text-[9px] uppercase tracking-[.16em] text-emerald-300">Acciones inmediatas</div>
                    <ul className="mb-0 mt-3 space-y-2 pl-4 text-[11px] leading-relaxed text-slate-300">
                      {result.analysis.immediateDirectives.map((directive) => <li key={directive}>{directive}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {result.protocol && (
              <div className="rounded-xl border border-amber-300/15 bg-[#11191b] p-4 sm:p-5">
                <div className="flex flex-col gap-2 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="font-mono text-[9px] font-black uppercase tracking-[.18em] text-amber-300">Protocolo generado por el grafo</div>
                    <h4 className="mb-0 mt-1 text-sm font-black text-slate-100">{result.protocol.title}</h4>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200/20 bg-amber-300/[.06] px-3 py-1.5 font-mono text-[9px] text-amber-200">
                    Anticipación · {result.protocol.leadTime}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {result.protocol.levels.map((level, index) => (
                    <article key={`${level.level}-${index}`} className="rounded-lg border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-300' : index === 1 ? 'bg-yellow-300' : index === 2 ? 'bg-orange-300' : 'bg-rose-400'}`} />
                        <h5 className="m-0 font-mono text-[10px] font-black uppercase tracking-[.12em] text-slate-200">{level.level}</h5>
                      </div>
                      <div className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">Umbral</div>
                      <p className="mb-0 mt-1 text-[11px] font-semibold leading-relaxed text-slate-200">{level.threshold}</p>
                      <p className="mb-0 mt-2 text-[10px] leading-relaxed text-slate-400">{level.action}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] p-3 font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">
              <span className="text-slate-300">Evidencia: {result.validation.status}</span>
              <span aria-hidden="true">·</span>
              <span>Ajuste: {result.validation.normalizedFitScore}/100</span>
              <span aria-hidden="true">·</span>
              <span>{result.engineVersion}</span>
              <span className="ml-auto normal-case tracking-normal text-amber-200/80">No constituye una alerta oficial</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
