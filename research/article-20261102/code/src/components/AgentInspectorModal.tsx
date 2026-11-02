import React from 'react';
import { 
  X, 
  Home, 
  Users, 
  Activity, 
  MapPin, 
  ShieldAlert, 
  Radio, 
  Compass, 
  TrendingUp, 
  HeartHandshake,
  Clock
} from 'lucide-react';
import { AgentHousehold, SettlementPreset } from '../types';
import { useModalDialog } from '../hooks/useModalDialog';

interface AgentInspectorModalProps {
  agent: AgentHousehold | null;
  settlement: SettlementPreset;
  onClose: () => void;
  onSelectNeighbor: (id: string) => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  settlement,
  onClose,
  onSelectNeighbor,
}) => {
  const { dialogRef, onKeyDown } = useModalDialog(Boolean(agent), onClose);
  if (!agent) return null;

  const getRoofLabel = (material: AgentHousehold['roofMaterial']) => {
    switch (material) {
      case 'cardboard_plastic':
        return 'Plástico / Cartón / Lona (Muy Precario)';
      case 'corrugated_metal':
        return 'Lámina de Zinc / Calamina Corrugada';
      case 'unreinforced_masonry':
        return 'Mampostería sin Confinar (Ladrillo / Pirca)';
      case 'reinforced_concrete':
        return 'Placa de Concreto Armado';
      default:
        return material;
    }
  };

  const getStateBadge = (state: AgentHousehold['state']) => {
    switch (state) {
      case 'normal':
        return { label: 'Normal / En Hogar', bg: 'bg-sky-950 text-sky-300 border-sky-800' };
      case 'alerted':
        return { label: 'Alerta Recibida', bg: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'preparing':
        return { label: 'Preparando Mochila / Familia', bg: 'bg-orange-950 text-orange-300 border-orange-800' };
      case 'evacuating':
        return { label: 'Evacuando en Ruta', bg: 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse' };
      case 'helping_others':
        return { label: 'Asistiendo a Vecino Vulnerable', bg: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
      case 'safe':
        return { label: 'A Salvo en Punto de Encuentro', bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'trapped':
        return { label: 'Atrapado / Requiere Socorro', bg: 'bg-rose-950 text-rose-300 border-rose-800 animate-ping' };
      default:
        return { label: state, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getStateBadge(agent.state);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div ref={dialogRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Detalle del hogar seleccionado" className="modal-surface bg-[#161618] border border-[#2A2A2E] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2E] flex items-center justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-wide serif-header">
                  {agent.name}
                </h3>
                {agent.isLeader && (
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50">
                    ★ Líder de Manzana
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {settlement.name} • Coordenadas: [{agent.x.toFixed(1)}, {agent.y.toFixed(1)}]
              </p>
            </div>
          </div>
          <button
            type="button" aria-label="Cerrar detalle del hogar"
            onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-white hover:bg-[#2A2A2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Current State & Location */}
          <div className="p-3.5 rounded-md bg-[#0D0D0E] border border-[#2A2A2E] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Estado del Hogar en Simulación:</span>
              <div className="mt-1">
                <span className={`px-2.5 py-1 rounded-xs text-xs font-mono font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            {agent.evacuatedAtMin !== undefined && (
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Evacuó a los:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {agent.evacuatedAtMin} min
                </div>
              </div>
            )}
          </div>

          {/* Micro Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Topography & Physics */}
            <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E] space-y-1.5">
              <div className="font-semibold text-[#F27D26] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Morfología & Terreno
              </div>
              <div className="text-gray-300 space-y-1 text-[11px] font-mono">
                <div>Cota: <strong className="text-white font-mono">{agent.elevationM} msnm</strong></div>
                <div>Pendiente: <strong className="text-[#F27D26] font-mono">{agent.slopeAngleDeg}° ({agent.slopeAngleDeg > 30 ? 'Muy Inestable' : 'Moderada'})</strong></div>
                <div>Cubierta: <strong className="text-gray-200">{getRoofLabel(agent.roofMaterial)}</strong></div>
                <div>Vulnerabilidad: <strong className="text-rose-400 font-mono">{Math.round(agent.structuralVulnerability * 100)}%</strong></div>
              </div>
            </div>

            {/* Social & Demographics */}
            <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E] space-y-1.5">
              <div className="font-semibold text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Composición Familiar
              </div>
              <div className="text-gray-300 space-y-1 text-[11px] font-mono">
                <div>Residentes: <strong className="text-white font-mono">{agent.residentsCount} personas</strong></div>
                <div>Dependientes: <strong className="text-[#F27D26] font-mono">{agent.vulnerableCount}</strong></div>
                <div>Adultos Mayores: <strong className="text-gray-200">{agent.hasElderlyResident ? 'Sí' : 'No'}</strong></div>
                <div>Discapacidad: <strong className="text-rose-300">{agent.hasDisabledResident ? 'Sí (Prioridad)' : 'No'}</strong></div>
              </div>
            </div>
          </div>

          {/* Behavior & Early Warning */}
          <div className="p-3.5 bg-[#0D0D0E] rounded-md border border-[#2A2A2E] space-y-2">
            <div className="font-semibold text-gray-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-[#F27D26]" />
              Comportamiento & Percepción de Riesgo (ML-ABM)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <div className="text-[10px] text-gray-500 uppercase">Canal Alerta</div>
                <div className="font-mono font-bold text-[#F27D26] uppercase mt-0.5">{agent.warningChannel}</div>
              </div>
              <div className="p-2 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <div className="text-[10px] text-gray-500 uppercase">Percepción</div>
                <div className="font-mono font-bold text-amber-400 mt-0.5">{Math.round(agent.riskPerception * 100)}%</div>
              </div>
              <div className="p-2 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <div className="text-[10px] text-gray-500 uppercase">Movilidad</div>
                <div className="font-mono font-bold text-sky-400 mt-0.5">{Math.round(agent.mobilityScore * 100)}%</div>
              </div>
              <div className="p-2 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <div className="text-[10px] text-gray-500 uppercase">Confianza</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">{Math.round(agent.socialTrustScore * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Social Network Ties (Vecinos de Apoyo Mutuo) */}
          <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E]">
            <div className="font-semibold text-gray-300 flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-[#F27D26]" />
              Red de Apoyo Mutuo Vecinal ({agent.socialTies.length} Lazos Directos)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.socialTies.map((tieId) => (
                <button
                  key={tieId}
                  onClick={() => onSelectNeighbor(tieId)}
                  className="px-2.5 py-1 rounded-sm bg-[#161618] hover:bg-[#2A2A2E] text-gray-300 border border-[#2A2A2E] hover:border-[#F27D26] text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {settlement.households.find((h) => h.id === tieId)?.name || tieId} →
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D0D0E] border-t border-[#2A2A2E] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-semibold bg-[#2A2A2E] hover:bg-[#3A3A3E] text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
