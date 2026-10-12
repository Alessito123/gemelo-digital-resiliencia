import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  BellRing, 
  Users, 
  Building2, 
  Clock, 
  Sparkles,
  Download
} from 'lucide-react';
import { EARLY_WARNING_THRESHOLDS } from '../data/disasterScenarios';
import { SettlementPreset, DisasterScenario } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface EarlyWarningProtocolsProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  onOpenAiGenerator: () => void;
}

export const EarlyWarningProtocols: React.FC<EarlyWarningProtocolsProps> = ({
  settlement,
  scenario,
  onOpenAiGenerator,
}) => {
  const { language, t } = useLanguage();

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30 flex items-center justify-center">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white dark:text-gray-100 tracking-tight m-0">
              {t.protocolsTitle}
            </h3>
            <p className="text-[11px] text-gray-400 m-0">
              {language === 'es' ? 'Matriz de activación por umbrales físicos para Gobiernos Locales y Comités Comunitarios' : 'Threshold activation matrix for local authorities and neighborhood committees'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAiGenerator}
          className="btn-primary self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'es' ? 'Generar Protocolo con IA' : 'Generate Protocol with AI'}</span>
        </button>
      </div>

      {/* Threshold Matrix Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {EARLY_WARNING_THRESHOLDS.map((threshold) => (
          <div 
            key={threshold.level}
            className="glass-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
            style={{ borderLeftColor: threshold.color, borderLeftWidth: '4px' }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider"
                  style={{ backgroundColor: `${threshold.color}20`, color: threshold.color, border: `1px solid ${threshold.color}50` }}
                >
                  NIVEL {threshold.level}
                </span>
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Anticipación: <strong className="text-white font-bold">{threshold.leadTimeHours}</strong></span>
                </span>
              </div>

              {/* Physical Condition */}
              <div className="mt-2.5 text-xs font-semibold text-gray-200 font-mono">
                <span className="text-gray-500 uppercase text-[10px] block">Condición Disparadora:</span>
                <span className="mt-0.5 block">{threshold.hazardCondition}</span>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <div className="font-bold text-[#F27D26] flex items-center gap-1 mb-1 text-[10px] uppercase font-mono">
                    <Users className="w-3 h-3" />
                    {language === 'es' ? 'Acción Comunitaria (Barrio):' : 'Community Action:'}
                  </div>
                  <p className="text-gray-300 m-0 leading-relaxed">{threshold.communityAction}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <div className="font-bold text-sky-400 flex items-center gap-1 mb-1 text-[10px] uppercase font-mono">
                    <Building2 className="w-3 h-3" />
                    {language === 'es' ? 'Acción Institucional (Alcaldía):' : 'Institutional Action:'}
                  </div>
                  <p className="text-gray-300 m-0 leading-relaxed">{threshold.institutionalAction}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
