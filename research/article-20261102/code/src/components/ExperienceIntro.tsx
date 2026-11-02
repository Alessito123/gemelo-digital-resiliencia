import { memo } from 'react';
import {
  ArrowRight,
  DatabaseZap,
  Home,
  Info,
  Landmark,
  MapPin,
  Radio,
  ShieldCheck,
  UsersRound,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { DisasterScenario, SettlementPreset, SimulationMetrics } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExperienceIntroProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
}

export const ExperienceIntro = memo(function ExperienceIntro({ settlement, scenario, metrics }: ExperienceIntroProps) {
  const { language, t } = useLanguage();
  const hasPublicEvidence = metrics.publicDataSourcesCount > 0;
  const numberFormat = new Intl.NumberFormat(language === 'es' ? 'es-419' : 'en-US');

  const journeyLinks = [
    { href: '#territorio', folio: '01', label: language === 'es' ? 'Territorio 3D' : '3D Twin' },
    { href: '#decisiones', folio: '02', label: language === 'es' ? 'Control de Simulación' : 'Simulation Deck' },
    { href: '#resultados', folio: '03', label: language === 'es' ? 'Panel de Métricas' : 'Resilience Analytics' },
    { href: '#evidencia', folio: '04', label: language === 'es' ? 'Evidencia de Datos' : 'Evidence Lab' },
    { href: '#accion', folio: '05', label: language === 'es' ? 'Acción y Protocolos' : 'Early Action' },
  ] as const;

  const scaleSteps = [
    { 
      label: language === 'es' ? 'Micro (Hogar)' : 'Micro (Household)', 
      detail: language === 'es' ? 'Movilidad, riesgo y apoyo vecinal' : 'Mobility, perception & mutual aid', 
      Icon: Home,
      color: 'text-sky-400'
    },
    { 
      label: language === 'es' ? 'Meso (Comunidad)' : 'Meso (Community)', 
      detail: language === 'es' ? 'Escalinatas, pasajes y puntos seguros' : 'Stairs, chokepoints & safe points', 
      Icon: UsersRound,
      color: 'text-[#F27D26]'
    },
    { 
      label: language === 'es' ? 'Macro (Ciudad)' : 'Macro (City)', 
      detail: language === 'es' ? 'Defensa Civil, alerta y albergues' : 'Civil Defense, alerts & shelters', 
      Icon: Landmark,
      color: 'text-emerald-400'
    },
  ] as const;

  return (
    <>
      <section className="hero-deck animate-rise" aria-labelledby="experience-title">
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="glow-pill text-[11px] font-mono">
              <MapPin className="w-3 h-3 text-[#F27D26]" /> {settlement.city}, {settlement.country}
            </span>
            <span className="glow-pill text-[11px] font-mono">
              <Radio className="w-3 h-3 text-cyan-400" /> {language === 'es' ? 'Multi-Escala ML-ABM' : 'Multi-Scale ABM Engine'}
            </span>
          </div>

          <div>
            <p className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#F27D26] m-0 mb-1">
              {t.heroEyebrow}
            </p>
            <h2 id="experience-title" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight m-0 leading-tight">
              {t.heroTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl mt-2 leading-relaxed">
              {t.heroLead}
            </p>
          </div>

          {/* Quick Stat Tiles */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 max-w-lg">
            <div className="glass-card p-3">
              <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block">{t.heroStatHouseholds}</span>
              <span className="text-lg sm:text-xl font-mono font-extrabold text-white dark:text-gray-100 block mt-0.5">
                {numberFormat.format(metrics.totalAgents)}
              </span>
            </div>

            <div className="glass-card p-3">
              <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block">{t.heroStatBottlenecks}</span>
              <span className="text-lg sm:text-xl font-mono font-extrabold text-rose-400 block mt-0.5">
                {settlement.bottlenecks.length}
              </span>
            </div>

            <div className="glass-card p-3">
              <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block">{t.heroStatLeadTime}</span>
              <span className="text-lg sm:text-xl font-mono font-extrabold text-amber-400 block mt-0.5">
                T-{scenario.parameters.warningLeadTimeMin}m
              </span>
            </div>
          </div>
        </div>

        {/* Resilience HUD Orb & Multi-Scale Flow */}
        <aside className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              {language === 'es' ? 'Capacidad Adaptativa Barrial' : 'Adaptive Capacity'}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {language === 'es' ? 'Simulación Activa' : 'Active Simulation'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Resilience Score Gauge */}
            <div className="relative w-24 h-24 rounded-full border-2 border-[#F27D26]/40 flex flex-col items-center justify-center bg-gradient-to-br from-[#F27D26]/20 to-transparent shadow-[0_0_24px_rgba(242,125,38,0.25)] flex-none">
              <span className="text-[9px] font-mono text-gray-400 uppercase">R(t)</span>
              <span className="text-3xl font-extrabold font-mono text-white leading-none">
                {metrics.systemResilienceIndex}
              </span>
              <span className="text-[9px] font-mono text-gray-400">/ 100</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Estado del Sistema</span>
              <h4 className="text-sm font-bold text-white dark:text-gray-100 m-0 mt-0.5">
                {scenario.id === 'base' ? (language === 'es' ? 'Estabilidad Comunitaria' : 'Community Stability') : (language === 'es' ? 'Respuesta a Multiamenaza' : 'Multi-Hazard Response')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {metrics.evacuationRatePct}% {language === 'es' ? 'de hogares evacuados con éxito' : 'of households safely evacuated'}.
              </p>
            </div>
          </div>

          {/* Connected Scales Chain */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            {scaleSteps.map(({ label, detail, Icon, color }, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-black/20 border border-white/5 text-center flex flex-col items-center">
                <Icon className={`w-4 h-4 ${color} mb-1`} />
                <span className="text-[10px] font-bold text-gray-200 block truncate w-full">{label}</span>
                <span className="text-[9px] text-gray-400 block line-clamp-1 mt-0.5">{detail}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 text-[10px] text-gray-400 border border-white/5">
            <Info className="w-4 h-4 text-[#F27D26] flex-none" />
            <span>{t.heroScientificFramework}</span>
          </div>
        </aside>
      </section>

      {/* Navigation Anchor Rail */}
      <nav className="nav-rail" aria-label="Ruta de exploración">
        <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 pl-1">
          <Layers className="w-3.5 h-3.5 text-[#F27D26]" />
          {language === 'es' ? 'Módulos del Gemelo' : 'Twin Modules'}:
        </span>
        
        <div className="nav-rail-links">
          {journeyLinks.map(({ href, folio, label }) => (
            <a key={href} href={href}>
              <span className="font-mono text-[#F27D26] text-[10px]">{folio}</span>
              <span>{label}</span>
            </a>
          ))}
        </div>

        {hasPublicEvidence && (
          <span className="glow-pill glow-pill--live text-[10px] font-mono hidden md:inline-flex">
            <DatabaseZap className="w-3 h-3 text-[#F27D26]" />
            <span>{metrics.publicDataSourcesCount} {language === 'es' ? 'Fuentes Públicas' : 'Public Feeds'}</span>
          </span>
        )}
      </nav>
    </>
  );
});
