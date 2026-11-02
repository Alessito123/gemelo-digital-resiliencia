import React, { lazy, Suspense } from 'react';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Building, 
  HeartHandshake, 
  Activity,
  Heart,
  DollarSign,
  AlertOctagon
} from 'lucide-react';
import { SimulationMetrics, SettlementPreset } from '../types';
import { ResilienceTimePoint } from '../hooks/useDigitalTwinSimulation';
import { useLanguage } from '../context/LanguageContext';

const ResilienceChart = lazy(() => import('./ResilienceChart').then((module) => ({ default: module.ResilienceChart })));

interface MetricsDashboardProps {
  metrics: SimulationMetrics;
  settlement: SettlementPreset;
  resilienceHistory: ResilienceTimePoint[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  settlement,
  resilienceHistory,
}) => {
  const { language, t } = useLanguage();
  const compactNumber = new Intl.NumberFormat(language === 'es' ? 'es-419' : 'en-US', { 
    notation: 'compact', 
    maximumFractionDigits: 1 
  });

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F27D26]/20 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white dark:text-gray-100 tracking-tight m-0">
              {t.metricsTitle}
            </h2>
            <p className="text-[11px] text-gray-400 m-0">
              {language === 'es' ? 'Curvas de evacuación y resiliencia temporal en tiempo real' : 'Real-time evacuation curves & temporal resilience index'}
            </p>
          </div>
        </div>
        <span className="text-[10px] text-[#F27D26] font-mono font-bold px-2 py-0.5 rounded bg-[#F27D26]/10 border border-[#F27D26]/20 hidden sm:inline-block">
          Bruneau $R(t)$ Model
        </span>
      </div>

      {/* Impact Ribbon Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-black/30 border border-white/5 font-mono">
        <div className="p-2">
          <span className="text-[9px] uppercase text-gray-400 block font-bold">{language === 'es' ? 'Personas Afectadas' : 'Affected People'}</span>
          <strong className="text-sm sm:text-base text-white block mt-0.5">{compactNumber.format(metrics.affectedPeople)}</strong>
        </div>
        <div className="p-2">
          <span className="text-[9px] uppercase text-gray-400 block font-bold">{language === 'es' ? 'Desplazamiento Est.' : 'Displaced Est.'}</span>
          <strong className="text-sm sm:text-base text-amber-400 block mt-0.5">{compactNumber.format(metrics.displacedPeople)}</strong>
        </div>
        <div className="p-2">
          <span className="text-[9px] uppercase text-gray-400 block font-bold">{language === 'es' ? 'Pérdida Económica' : 'Economic Loss'}</span>
          <strong className="text-sm sm:text-base text-rose-400 block mt-0.5">US$ {compactNumber.format(metrics.estimatedEconomicLossUsd)}</strong>
        </div>
        <div className="p-2">
          <span className="text-[9px] uppercase text-gray-400 block font-bold">{language === 'es' ? 'Recuperación Est.' : 'Est. Recovery'}</span>
          <strong className="text-sm sm:text-base text-sky-400 block mt-0.5">{compactNumber.format(metrics.estimatedRecoveryTimeHours)} h</strong>
        </div>
        <div className="p-2">
          <span className="text-[9px] uppercase text-gray-400 block font-bold">{language === 'es' ? 'Cobertura Alerta' : 'Alert Reach'}</span>
          <strong className="text-sm sm:text-base text-emerald-400 block mt-0.5">{metrics.communityAlertCoveragePct}%</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Evacuation Rate */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsEvacuated}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {metrics.evacuationRatePct}%
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              {metrics.safeCount} / {metrics.totalAgents} {t.householdsCount}
            </div>
          </div>
        </div>

        {/* Avg Evacuation Time */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsEvacSpeed}</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-sky-400">
              {metrics.avgEvacuationTimeMin} <span className="text-xs font-normal text-gray-400">min</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              hacia Punto Seguro
            </div>
          </div>
        </div>

        {/* System Resilience Index */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsResilienceIndex}</span>
            <Activity className="w-3.5 h-3.5 text-[#F27D26]" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-[#F27D26]">
              {metrics.systemResilienceIndex} <span className="text-xs font-normal text-gray-400">/100</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              Capacidad Adaptativa
            </div>
          </div>
        </div>

        {/* Trapped / At Risk */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsTrapped}</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-rose-400">
              {metrics.trappedCount}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              Hogares Bloqueados
            </div>
          </div>
        </div>

        {/* Injured Count */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsInjured}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-amber-400">
              {metrics.injuredCount}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              Atención Prioritaria
            </div>
          </div>
        </div>

        {/* Structural Damage */}
        <div className="glass-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-mono font-bold">
            <span>{t.metricsStructuralDamage}</span>
            <Building className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold font-mono text-violet-400">
              {metrics.estimatedStructuralDamagePct}%
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              Pérdida Física Est.
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Resilience Curve (Bruneau Triangle) */}
      <div className="pt-2">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-gray-500">Cargando visualizador gráfico…</div>}>
          <ResilienceChart history={resilienceHistory} />
        </Suspense>
      </div>
    </div>
  );
};
