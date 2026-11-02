import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  MapPin, 
  AlertOctagon, 
  Users, 
  Home, 
  ShieldCheck, 
  Compass, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Info,
  Box,
  Map as MapIcon
} from 'lucide-react';
import { SettlementPreset, DisasterScenario, AgentHousehold, SimulationMetrics } from '../types';
import { DigitalTwin3DCanvas } from './DigitalTwin3DCanvas';
import { useLanguage } from '../context/LanguageContext';

interface DigitalTwinCanvasProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  onSelectAgent: (agentId: string) => void;
  selectedAgentId: string | null;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  settlement,
  scenario,
  metrics,
  onSelectAgent,
  selectedAgentId,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  // Layer visibility toggles
  const [showTopography, setShowTopography] = useState(true);
  const [showRoofMaterials, setShowRoofMaterials] = useState(true);
  const [showSocialNetwork, setShowSocialNetwork] = useState(true);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [showMeetingPoints, setShowMeetingPoints] = useState(true);
  const [showHazardWave, setShowHazardWave] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Hover state for 2D
  const [hoveredAgent, setHoveredAgent] = useState<AgentHousehold | null>(null);

  const getRoofColor = (material: AgentHousehold['roofMaterial']) => {
    switch (material) {
      case 'cardboard_plastic': return '#F43F5E';
      case 'corrugated_metal': return '#F59E0B';
      case 'unreinforced_masonry': return '#A855F7';
      case 'reinforced_concrete': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const getStateColor = (state: AgentHousehold['state']) => {
    switch (state) {
      case 'normal': return '#38BDF8';
      case 'alerted': return '#FBBF24';
      case 'preparing': return '#F97316';
      case 'evacuating': return '#EAB308';
      case 'helping_others': return '#06B6D4';
      case 'safe': return '#22C55E';
      case 'trapped': return '#EF4444';
      case 'injured': return '#EC4899';
      default: return '#94A3B8';
    }
  };

  return (
    <div className="digital-twin-canvas flex flex-col h-full bg-[#161618] rounded-xl border border-[#2A2A2E] overflow-hidden shadow-2xl">
      {/* Top Toolbar: 2D/3D Mode Switch & Layer Filters */}
      <div className="p-3 bg-[#0D0D0E] border-b border-[#2A2A2E] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 2D / 3D Mode Switcher */}
          <div className="flex items-center bg-[#1A1A1E] p-0.5 rounded-md border border-[#3A3A42] mr-2">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === '3d'
                  ? 'bg-[#F27D26] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{t.viewMode3D}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === '2d'
                  ? 'bg-[#F27D26] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t.viewMode2D}</span>
            </button>
          </div>

          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-[#F27D26]" />
            Capas:
          </span>

          <button
            type="button"
            aria-pressed={showTopography}
            onClick={() => setShowTopography(!showTopography)}
            className={`px-2.5 py-1 rounded-sm transition-colors text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer ${
              showTopography
                ? 'bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/50 shadow-[0_0_8px_rgba(242,125,38,0.2)]'
                : 'bg-[#161618] text-gray-500 border border-[#2A2A2E] hover:text-gray-300'
            }`}
          >
            <span>{t.layerTopography}</span>
          </button>

          <button
            type="button"
            aria-pressed={showRoofMaterials}
            onClick={() => setShowRoofMaterials(!showRoofMaterials)}
            className={`px-2.5 py-1 rounded-sm transition-colors text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer ${
              showRoofMaterials
                ? 'bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/50 shadow-[0_0_8px_rgba(242,125,38,0.2)]'
                : 'bg-[#161618] text-gray-500 border border-[#2A2A2E] hover:text-gray-300'
            }`}
          >
            <span>{t.layerRoofs}</span>
          </button>

          <button
            type="button"
            aria-pressed={showSocialNetwork}
            onClick={() => setShowSocialNetwork(!showSocialNetwork)}
            className={`px-2.5 py-1 rounded-sm transition-colors text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer ${
              showSocialNetwork
                ? 'bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/50 shadow-[0_0_8px_rgba(242,125,38,0.2)]'
                : 'bg-[#161618] text-gray-500 border border-[#2A2A2E] hover:text-gray-300'
            }`}
          >
            <span>{t.layerSocialNetwork}</span>
          </button>

          <button
            type="button"
            aria-pressed={showBottlenecks}
            onClick={() => setShowBottlenecks(!showBottlenecks)}
            className={`px-2.5 py-1 rounded-sm transition-colors text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer ${
              showBottlenecks
                ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
                : 'bg-[#161618] text-gray-500 border border-[#2A2A2E] hover:text-gray-300'
            }`}
          >
            <span>{t.layerBottlenecks}</span>
          </button>

          <button
            type="button"
            aria-pressed={showHazardWave}
            onClick={() => setShowHazardWave(!showHazardWave)}
            className={`px-2.5 py-1 rounded-sm transition-colors text-[11px] font-mono font-medium flex items-center gap-1 cursor-pointer ${
              showHazardWave
                ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                : 'bg-[#161618] text-gray-500 border border-[#2A2A2E] hover:text-gray-300'
            }`}
          >
            <span>{t.layerHazardWave}</span>
          </button>
        </div>

        {/* Zoom Controls for 2D Mode */}
        {viewMode === '2d' && (
          <div className="flex items-center gap-1 bg-[#161618] px-2 py-1 rounded-sm border border-[#2A2A2E]">
            <button
              type="button"
              aria-label="Alejar mapa"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
              className="p-1 hover:text-[#F27D26] transition-colors text-gray-400 cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-gray-400 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              aria-label="Acercar mapa"
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1 hover:text-[#F27D26] transition-colors text-gray-400 cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Restablecer zoom del mapa"
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:text-[#F27D26] transition-colors text-gray-400 cursor-pointer ml-1"
              title="Restablecer vista"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport Container */}
      {viewMode === '3d' ? (
        <DigitalTwin3DCanvas
          settlement={settlement}
          scenario={scenario}
          metrics={metrics}
          onSelectAgent={onSelectAgent}
          selectedAgentId={selectedAgentId}
          showTopography={showTopography}
          showRoofMaterials={showRoofMaterials}
          showSocialNetwork={showSocialNetwork}
          showBottlenecks={showBottlenecks}
          showMeetingPoints={showMeetingPoints}
          showHazardWave={showHazardWave}
        />
      ) : (
        /* 2D Interactive Map Stage */
        <div className="relative flex-1 min-h-[460px] lg:min-h-[540px] w-full bg-[#0A0A0B] overflow-hidden flex items-center justify-center select-none">
          <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>

          {/* Map Header Tag */}
          <div className="absolute top-4 left-4 z-10 bg-[#0D0D0E]/90 backdrop-blur-md p-2.5 border border-[#2A2A2E] rounded-sm">
            <div className="mono text-[10px] text-[#F27D26] font-bold tracking-wider mb-0.5">
              {settlement.id.toUpperCase()}_CARTOGRAPHY_2D
            </div>
            <div className="text-[11px] text-gray-300">
              {settlement.name} — {settlement.city}
            </div>
          </div>

          <div 
            className="relative w-full h-full max-w-5xl transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="slopeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0F172A" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#090D16" stopOpacity="1" />
                </linearGradient>

                <linearGradient id="floodGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
                </linearGradient>

                <linearGradient id="landslideGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#92400E" stopOpacity="0.15" />
                </linearGradient>

                <radialGradient id="bottleneckGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Grid & Topography */}
              <rect width="100" height="100" fill="url(#slopeGradient)" />

              {/* Isometric elevation contour lines */}
              {showTopography && (
                <g opacity="0.35">
                  <path d="M 0 20 Q 50 15 100 25" fill="none" stroke="#0D9488" strokeWidth="0.3" strokeDasharray="1,1" />
                  <path d="M 0 35 Q 50 28 100 40" fill="none" stroke="#0D9488" strokeWidth="0.3" strokeDasharray="1,1" />
                  <path d="M 0 50 Q 50 42 100 55" fill="none" stroke="#0D9488" strokeWidth="0.4" />
                  <path d="M 0 65 Q 50 58 100 70" fill="none" stroke="#0D9488" strokeWidth="0.3" strokeDasharray="1,1" />
                  <path d="M 0 80 Q 50 72 100 85" fill="none" stroke="#0D9488" strokeWidth="0.4" />
                </g>
              )}

              {/* Hazard Wave dynamics */}
              {showHazardWave && (
                <g className="transition-all duration-700">
                  {scenario.type === 'flood' && (
                    <rect 
                      x="0" 
                      y={Math.max(0, 100 - (metrics.currentStep / 50) * (scenario.parameters.intensityScale * 8))} 
                      width="100" 
                      height="100" 
                      fill="url(#floodGrad)" 
                    />
                  )}
                  {scenario.type === 'landslide' && (
                    <polygon 
                      points={`15,0 85,0 95,${Math.min(95, (metrics.currentStep / 50) * 85)} 5,${Math.min(95, (metrics.currentStep / 50) * 85)}`} 
                      fill="url(#landslideGrad)" 
                    />
                  )}
                </g>
              )}

              {/* Social Support Network Ties */}
              {showSocialNetwork && (
                <g opacity="0.35">
                  {settlement.households.map((h) =>
                    h.socialTies.map((targetId) => {
                      const target = settlement.households.find((th) => th.id === targetId);
                      if (!target || h.id > target.id) return null;
                      return (
                        <line
                          key={`${h.id}-${target.id}`}
                          x1={h.currentX}
                          y1={h.currentY}
                          x2={target.currentX}
                          y2={target.currentY}
                          stroke="#06B6D4"
                          strokeWidth="0.2"
                          strokeDasharray="0.8,0.8"
                        />
                      );
                    })
                  )}
                </g>
              )}

              {/* Meeting Points */}
              {settlement.meetingPoints.map((mp) => (
                <g key={mp.id} className="cursor-pointer">
                  <circle cx={mp.x} cy={mp.y} r="3.5" fill="#10B981" fillOpacity="0.2" className="animate-pulse" />
                  <circle cx={mp.x} cy={mp.y} r="1.8" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.3" />
                  <text x={mp.x} y={mp.y + 4.5} fill="#A7F3D0" fontSize="1.8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {mp.name}
                  </text>
                </g>
              ))}

              {/* Bottlenecks */}
              {showBottlenecks && settlement.bottlenecks.map((bn) => (
                <g key={bn.id}>
                  <circle cx={bn.x} cy={bn.y} r={bn.radius} fill="url(#bottleneckGlow)" />
                  <circle cx={bn.x} cy={bn.y} r="1.2" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.2" />
                </g>
              ))}

              {/* Households & Agents */}
              {settlement.households.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                const isHovered = hoveredAgent?.id === agent.id;
                const roofColor = getRoofColor(agent.roofMaterial);
                const stateColor = getStateColor(agent.state);

                return (
                  <g
                    key={agent.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectAgent(agent.id)}
                    onMouseEnter={() => setHoveredAgent(agent)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    {showRoofMaterials && (
                      <rect
                        x={agent.x - 1.2}
                        y={agent.y - 1.2}
                        width="2.4"
                        height="2.4"
                        fill={roofColor}
                        fillOpacity={agent.state === 'safe' ? 0.3 : 0.7}
                        stroke={roofColor}
                        strokeWidth="0.2"
                      />
                    )}

                    <circle
                      cx={agent.currentX}
                      cy={agent.currentY}
                      r={isSelected || isHovered ? 2.2 : agent.isLeader ? 1.6 : 1.2}
                      fill={stateColor}
                      stroke={isSelected ? '#FFFFFF' : agent.isLeader ? '#FDE047' : '#0F172A'}
                      strokeWidth={isSelected ? 0.6 : 0.3}
                    />

                    {agent.isLeader && (
                      <text x={agent.currentX} y={agent.currentY - 1.6} fill="#FACC15" fontSize="2" textAnchor="middle">★</text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip card */}
            {hoveredAgent && (
              <div className="absolute bottom-4 left-4 bg-[#161618]/95 backdrop-blur-md border border-[#2A2A2E] rounded-md p-3 text-xs text-gray-200 shadow-2xl max-w-xs pointer-events-none z-30">
                <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2E] pb-1.5 mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-[#F27D26]" />
                    {hoveredAgent.name}
                  </span>
                  <span 
                    className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold uppercase"
                    style={{ backgroundColor: `${getStateColor(hoveredAgent.state)}20`, color: getStateColor(hoveredAgent.state) }}
                  >
                    {hoveredAgent.state}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-400 font-mono">
                  <div>Habitantes: <span className="text-white font-medium">{hoveredAgent.residentsCount}</span></div>
                  <div>Pendiente: <span className="text-white font-medium">{hoveredAgent.slopeAngleDeg}°</span></div>
                  <div>Techo: <span className="text-white font-medium capitalize">{hoveredAgent.roofMaterial.replace('_', ' ')}</span></div>
                  <div>Movilidad: <span className="text-white font-medium">{Math.round(hoveredAgent.mobilityScore * 100)}%</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="p-2.5 bg-[#0D0D0E] border-t border-[#2A2A2E] flex flex-wrap items-center justify-between gap-3 text-[10px] text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-gray-300">Estados de Agente:</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Normal</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Alerta</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span> Evacuando</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Ayuda Mutua</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> A Salvo</span>
          <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Atrapado</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-500">Material de Techo:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-rose-500"></span> Plástico/Cartón</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-amber-500"></span> Lámina Metálica</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-emerald-500"></span> Concreto</span>
        </div>
      </div>
    </div>
  );
};
