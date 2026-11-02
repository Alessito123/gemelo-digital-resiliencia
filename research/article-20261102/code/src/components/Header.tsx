import React from 'react';
import { 
  AlertTriangle, 
  BookOpen, 
  Database, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  FileText, 
  Sun, 
  Moon, 
  Globe,
  Bot,
  Activity
} from 'lucide-react';
import { DisasterScenario, SettlementPreset, SimulationMetrics } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  isPlaying: boolean;
  onOpenResearchModal: () => void;
  onOpenDataModal: () => void;
  onOpenProtocolModal: () => void;
  onOpenAiAnalysisModal: () => void;
  onOpenReportsModal: () => void;
  onToggleChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settlement,
  scenario,
  metrics,
  isPlaying,
  onOpenResearchModal,
  onOpenDataModal,
  onOpenProtocolModal,
  onOpenAiAnalysisModal,
  onOpenReportsModal,
  onToggleChat,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Block */}
        <div className="brand-block">
          <div className="brand-logo-icon">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="brand-title">{t.appTitle}</h1>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F27D26]/15 text-[#F27D26] border border-[#F27D26]/30">
                v2.0 3D Twin
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 m-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#F27D26]" /> 
              <span className="font-semibold text-gray-800 dark:text-gray-200">{settlement.name}</span>, {settlement.city} 
              <span className="text-gray-400 dark:text-gray-600">·</span> 
              <span className="text-[#F27D26] font-medium">{scenario.name}</span>
            </p>
          </div>
        </div>

        {/* Live Simulation Meta Context Ticker */}
        <div className="header-live-meta hidden lg:flex items-center gap-2" aria-label="Estado de la simulación">
          <div className="glow-pill font-mono">
            <span className="text-gray-400 dark:text-gray-500">Agentes:</span>
            <strong className="text-white dark:text-gray-200">{metrics.totalAgents}</strong>
          </div>
          <div className="glow-pill font-mono">
            <span className="text-gray-400 dark:text-gray-500">Puntos Seguros:</span>
            <strong className="text-emerald-400">{settlement.meetingPoints.length}</strong>
          </div>
          <div className={`glow-pill font-mono ${isPlaying ? 'glow-pill--live' : ''}`}>
            <Activity className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#F27D26] animate-pulse' : 'text-gray-400'}`} />
            <span>{isPlaying ? t.statusLive : t.statusReady}</span>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <nav className="flex items-center gap-1.5 flex-wrap" aria-label="Herramientas del proyecto">
          <a href="#laboratorio-ia" className="btn-secondary" title="Abrir Laboratorio IA" aria-label="Abrir Laboratorio IA">
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Laboratorio IA</span>
          </a>
          {/* Primary AI Analyze */}
          <button 
            type="button" 
            className="btn-primary"
            onClick={onOpenAiAnalysisModal}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.btnAnalyzeScenario}</span>
          </button>

          {/* Export Reports Button */}
          <button 
            type="button" 
            onClick={onOpenReportsModal}
            className="btn-secondary"
            title="Exportar en Word, PDF y Excel"
          >
            <FileText className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="hidden sm:inline">{t.btnReports}</span>
          </button>

          {/* AI Chat Shortcut */}
          <button 
            type="button" 
            onClick={onToggleChat}
            className="btn-secondary"
            title="Abrir Asistente IA"
          >
            <Bot className="w-3.5 h-3.5 text-[#F27D26]" />
            <span className="hidden sm:inline">{t.btnChatAssistant}</span>
          </button>

          {/* Protocols */}
          <button type="button" onClick={onOpenProtocolModal} className="btn-secondary" title="Ver protocolos de acción" aria-label="Ver protocolos de acción">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">{t.btnProtocols}</span>
          </button>

          {/* Data Hub */}
          <button type="button" onClick={onOpenDataModal} className="btn-secondary" title="Consultar fuentes de datos" aria-label="Consultar fuentes de datos">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{t.btnData}</span>
          </button>

          {/* Methodology */}
          <button type="button" onClick={onOpenResearchModal} className="btn-secondary" title="Abrir metodología" aria-label="Abrir metodología">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline">{t.btnMethodology}</span>
          </button>

          {/* Language Switcher (ES / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn-secondary font-mono font-bold"
            title="Cambiar idioma (ES/EN)"
          >
            <Globe className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Theme Switcher (Dark / Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary !p-2"
            title={isDark ? t.toggleThemeLight : t.toggleThemeDark}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
