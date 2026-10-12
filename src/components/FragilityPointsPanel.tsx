import React from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  Wrench, 
  Users, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Flame
} from 'lucide-react';
import { FragilityPoint, SettlementPreset } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FragilityPointsPanelProps {
  settlement: SettlementPreset;
  points: FragilityPoint[];
}

export const FragilityPointsPanel: React.FC<FragilityPointsPanelProps> = ({ points }) => {
  const { language, t } = useLanguage();

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white dark:text-gray-100 tracking-tight m-0">
              {t.fragilityTitle}
            </h3>
            <p className="text-[11px] text-gray-400 m-0">
              {t.fragilitySubtitle}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 uppercase tracking-wider">
          {points.length} {language === 'es' ? 'Zonas Derivadas' : 'Identified Hotspots'}
        </span>
      </div>

      {/* Fragility Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {points.map((point) => (
          <div 
            key={point.id}
            className="glass-card p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider ${
                    point.priority === 'Crítica' 
                      ? 'bg-rose-950/90 text-rose-300 border border-rose-700' 
                      : 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50'
                  }`}>
                    {point.priority}
                  </span>
                  <span className="text-xs font-bold text-white dark:text-gray-200">
                    {point.title}
                  </span>
                </div>
                <span className="text-xs font-mono font-extrabold text-rose-400">
                  {point.riskScore}/100
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-[#F27D26] shrink-0 mt-0.5" />
                <span>{point.locationDesc}</span>
              </p>

              {/* Amplification Mechanism */}
              <div className="mt-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px] text-gray-300">
                <span className="font-mono font-bold text-[#F27D26] flex items-center gap-1 mb-1 uppercase tracking-wider text-[10px]">
                  <Flame className="w-3 h-3 text-[#F27D26]" />
                  {language === 'es' ? 'Mecanismo de Amplificación:' : 'Amplification Mechanism:'}
                </span>
                <p className="m-0 leading-relaxed">{point.amplificationMechanism}</p>
              </div>
            </div>

            {/* Recommended Mitigation Action */}
            <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[11px]">
              <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-200">
                  {language === 'es' ? 'Mitigación Proactiva Sugerida:' : 'Proactive Mitigation:'}
                </span>{' '}
                <span className="text-gray-400">{point.recommendedMitigation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
