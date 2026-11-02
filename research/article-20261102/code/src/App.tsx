import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useDigitalTwinSimulation } from './hooks/useDigitalTwinSimulation';
import { Header } from './components/Header';
import { DigitalTwinCanvas } from './components/DigitalTwinCanvas';
import { SimulationControls } from './components/SimulationControls';
import { MetricsDashboard } from './components/MetricsDashboard';
import { FragilityPointsPanel } from './components/FragilityPointsPanel';
import { EarlyWarningProtocols } from './components/EarlyWarningProtocols';
import { ExperienceIntro } from './components/ExperienceIntro';
import { AiChatbotWidget } from './components/AiChatbotWidget';
import { ExportReportsModal } from './components/ExportReportsModal';
import { useLanguage } from './context/LanguageContext';
import { 
  AlertOctagon, 
  BellRing, 
  Building,
} from 'lucide-react';

const ResearchProposalModal = lazy(() => import('./components/ResearchProposalModal').then((module) => ({ default: module.ResearchProposalModal })));
const DataHubModal = lazy(() => import('./components/DataHubModal').then((module) => ({ default: module.DataHubModal })));
const AgentInspectorModal = lazy(() => import('./components/AgentInspectorModal').then((module) => ({ default: module.AgentInspectorModal })));
const AiResilienceAdvisorModal = lazy(() => import('./components/AiResilienceAdvisorModal').then((module) => ({ default: module.AiResilienceAdvisorModal })));
const EvidenceLab = lazy(() => import('./components/research/EvidenceLab').then((module) => ({ default: module.EvidenceLab })));
const StatisticsLab = lazy(() => import('./components/statistics/StatisticsLab').then((module) => ({ default: module.StatisticsLab })));

const ModalLoading = () => (
  <div className="modal-loading" role="status" aria-live="polite">
    Preparando información…
  </div>
);

export default function App() {
  const { language, t } = useLanguage();

  const {
    settlement,
    scenario,
    metrics,
    isPlaying,
    simulationSpeed,
    hazardIntensity,
    warningLeadTimeMin,
    enableMutualAid,
    enableMultiScaleFeedback,
    resilienceHistory,
    fragilityPoints,
    seed,
    selectedAgentId,
    togglePlay,
    stepSimulation,
    resetSimulation,
    handleSelectSettlement,
    handleSelectScenario,
    setSimulationSpeed,
    setHazardIntensity,
    setWarningLeadTimeMin,
    setEnableMutualAid,
    setEnableMultiScaleFeedback,
    setSelectedAgentId,
    setSeed,
    applyCommunitySurvey,
    applyPublicDataCalibration,
  } = useDigitalTwinSimulation();

  // Modals state
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'fragility' | 'protocols' | 'case_study'>('fragility');

  const selectedAgent = settlement.households.find((h) => h.id === selectedAgentId) || null;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsResearchModalOpen(false);
      setIsDataModalOpen(false);
      setIsAiModalOpen(false);
      setIsReportsModalOpen(false);
      setIsChatOpen(false);
      setSelectedAgentId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [setSelectedAgentId]);

  return (
    <div data-app-shell className="min-h-screen font-sans selection:bg-[#F27D26] selection:text-black flex flex-col">
      <a href="#main-content" className="skip-link">
        {language === 'es' ? 'Ir al contenido principal' : 'Skip to main content'}
      </a>

      {/* Top Header */}
      <Header
        settlement={settlement}
        scenario={scenario}
        metrics={metrics}
        isPlaying={isPlaying}
        onOpenResearchModal={() => setIsResearchModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenProtocolModal={() => {
          setBottomTab('protocols');
          const el = document.getElementById('accion');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAiAnalysisModal={() => setIsAiModalOpen(true)}
        onOpenReportsModal={() => setIsReportsModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Main Simulation Viewport */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-7 space-y-5">
        <ExperienceIntro settlement={settlement} scenario={scenario} metrics={metrics} />

        {/* Spatial Digital Twin Visualizer (2D / 3D WebGL) */}
        <section 
          id="territorio" 
          className="story-section story-section--map" 
          data-folio={t.navTerritory} 
          aria-label={language === 'es' ? 'Visor Espacial del Gemelo Digital' : 'Digital Twin Spatial Viewport'}
        >
          <DigitalTwinCanvas
            settlement={settlement}
            scenario={scenario}
            metrics={metrics}
            onSelectAgent={(id) => setSelectedAgentId(id)}
            selectedAgentId={selectedAgentId}
          />
        </section>

        {/* Playback Controls & Simulation Steering Deck */}
        <section 
          id="decisiones" 
          className="story-section" 
          data-folio={t.navDecisions} 
          aria-label={language === 'es' ? 'Controles de Simulación' : 'Simulation Controls'}
        >
          <SimulationControls
            settlement={settlement}
            scenario={scenario}
            metrics={metrics}
            isPlaying={isPlaying}
            simulationSpeed={simulationSpeed}
            hazardIntensity={hazardIntensity}
            warningLeadTimeMin={warningLeadTimeMin}
            enableMutualAid={enableMutualAid}
            enableMultiScaleFeedback={enableMultiScaleFeedback}
            onTogglePlay={togglePlay}
            onStepSimulation={stepSimulation}
            onResetSimulation={resetSimulation}
            onSelectSettlement={handleSelectSettlement}
            onSelectScenario={handleSelectScenario}
            onChangeSpeed={setSimulationSpeed}
            onChangeIntensity={setHazardIntensity}
            onChangeLeadTime={setWarningLeadTimeMin}
            onToggleMutualAid={setEnableMutualAid}
            onToggleMultiScale={setEnableMultiScaleFeedback}
          />
        </section>

        {/* Real-time Dynamic Metrics & Bruneau Resilience Chart */}
        <section 
          id="resultados" 
          className="story-section" 
          data-folio={t.navResults} 
          aria-label={language === 'es' ? 'Métricas de Resiliencia' : 'Resilience Metrics'}
        >
          <MetricsDashboard
            metrics={metrics}
            settlement={settlement}
            resilienceHistory={resilienceHistory}
          />
        </section>

        {/* Evidence Lab */}
        <section 
          id="evidencia" 
          className="story-section" 
          data-folio={t.navEvidence} 
          aria-label={language === 'es' ? 'Laboratorio de evidencia' : 'Evidence Lab'}
        >
          <Suspense fallback={<div className="content-skeleton" role="status">Preparando laboratorio de evidencia…</div>}>
            <EvidenceLab metrics={metrics} seed={seed} onSeedChange={setSeed} onApplySurvey={applyCommunitySurvey} />
          </Suspense>
        </section>

        <section id="laboratorio-ia" className="story-section" data-folio="Laboratorio IA" aria-labelledby="stats-title">
          <Suspense fallback={<div className="content-skeleton" role="status">Preparando motor estadístico…</div>}>
            <StatisticsLab settlementId={settlement.id} settlementName={`${settlement.name}, ${settlement.city}`} settlement={settlement} scenario={scenario} metrics={metrics} />
          </Suspense>
        </section>

        {/* Bottom Tabs Section: Fragility Hotspots / Early Warning / Case Study */}
        <section 
          id="accion" 
          className="story-section space-y-3 pt-2" 
          data-folio={t.navProtocols} 
          aria-label={language === 'es' ? 'Acciones y contexto comunitario' : 'Community actions and context'}
        >
          {/* Tab buttons */}
          <div className="flex items-center gap-2 border-b border-[#2A2A2E] pb-2 text-xs font-semibold overflow-x-auto" role="tablist" aria-label="Información complementaria">
            <button
              role="tab"
              aria-selected={bottomTab === 'fragility'}
              aria-controls="panel-fragility"
              onClick={() => setBottomTab('fragility')}
              className={`px-3.5 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap uppercase tracking-wider text-[11px] ${
                bottomTab === 'fragility'
                  ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                  : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{t.fragilityTitle}</span>
            </button>

            <button
              role="tab"
              aria-selected={bottomTab === 'protocols'}
              aria-controls="panel-protocols"
              onClick={() => setBottomTab('protocols')}
              className={`px-3.5 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap uppercase tracking-wider text-[11px] ${
                bottomTab === 'protocols'
                  ? 'bg-[#F27D26] text-black font-bold'
                  : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{t.protocolsTitle}</span>
            </button>

            <button
              role="tab"
              aria-selected={bottomTab === 'case_study'}
              aria-controls="panel-case-study"
              onClick={() => setBottomTab('case_study')}
              className={`px-3.5 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap uppercase tracking-wider text-[11px] ${
                bottomTab === 'case_study'
                  ? 'bg-[#161618] text-white border border-[#F27D26]'
                  : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{settlement.name} ({settlement.city})</span>
            </button>
          </div>

          {/* Tab Content */}
          {bottomTab === 'fragility' && (
            <div id="panel-fragility" role="tabpanel">
              <FragilityPointsPanel settlement={settlement} points={fragilityPoints} />
            </div>
          )}

          {bottomTab === 'protocols' && (
            <div id="panel-protocols" role="tabpanel">
              <EarlyWarningProtocols
                settlement={settlement}
                scenario={scenario}
                onOpenAiGenerator={() => setIsAiModalOpen(true)}
              />
            </div>
          )}

          {bottomTab === 'case_study' && (
            <div id="panel-case-study" role="tabpanel" className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-5 shadow-xl space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2A2E] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white tracking-wide serif-header">
                    {settlement.name} — {settlement.city}, {settlement.country}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {settlement.description}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-sm text-xs font-mono font-bold bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30">
                  {settlement.densityHabHa} hab/ha • {settlement.totalPopulation.toLocaleString()} {language === 'es' ? 'habitantes' : 'residents'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-300">
                <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E]">
                  <div className="text-gray-500 uppercase text-[10px]">{language === 'es' ? 'Topografía y Pendientes' : 'Topography & Slopes'}</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">{settlement.avgSlopeDeg}° prom.</div>
                  <div className="text-[11px] text-[#F27D26] font-mono mt-0.5">
                    Cota {settlement.minElevationM}m a {settlement.maxElevationM}m
                  </div>
                </div>

                <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E]">
                  <div className="text-gray-500 uppercase text-[10px]">{language === 'es' ? 'Material Predominante' : 'Predominant Material'}</div>
                  <div className="text-sm font-bold text-amber-300 mt-1 capitalize font-mono">
                    {settlement.predominantRoofMaterial.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {language === 'es' ? 'Precariedad Física' : 'Physical Vulnerability'}: {(settlement.avgPhysicalVulnerability * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-3 bg-[#0D0D0E] rounded-md border border-[#2A2A2E]">
                  <div className="text-gray-500 uppercase text-[10px]">{language === 'es' ? 'Capital Social' : 'Social Capital'}</div>
                  <div className="text-lg font-bold text-sky-400 font-mono mt-1">
                    {(settlement.socialCapitalIndex * 100).toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {settlement.meetingPoints.length} {t.meetingPointsCount}
                  </div>
                </div>
              </div>

              {/* Historical Disaster Context */}
              <div className="p-3.5 bg-[#0D0D0E] rounded-md border border-[#2A2A2E]">
                <div className="font-semibold text-gray-200 text-xs mb-1.5 serif-header">
                  {language === 'es' ? 'Antecedentes de Amenazas y Registro Histórico:' : 'Disaster History & Hazards Track Record:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {settlement.historicalDisasters.map((hist, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-sm bg-[#161618] text-gray-300 border border-[#2A2A2E] text-[11px] font-mono"
                    >
                      ⚠️ {hist}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer border-t border-[#2A2A2E] bg-[#0D0D0E] px-4 py-4 mt-8 text-center text-xs text-gray-500">
        <p className="serif-header text-gray-400">
          {t.appTitle} — {t.appSubtitle}
        </p>
        <p className="text-[11px] text-gray-600 font-mono mt-1">
          Motor reproducible micro–meso–macro • 3D WebGL Simulation Engine • ODS 11 Ciudades Resilientes
        </p>
      </footer>

      {/* Floating AI Chatbot Widget */}
      <AiChatbotWidget
        settlement={settlement}
        scenario={scenario}
        metrics={metrics}
        selectedAgent={selectedAgent}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen(!isChatOpen)}
        onOpenReportsModal={() => {
          setIsChatOpen(false);
          setIsReportsModalOpen(true);
        }}
      />

      {/* Export Reports Modal (Word, PDF, Excel) */}
      <ExportReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        settlement={settlement}
        scenario={scenario}
        metrics={metrics}
        fragilityPoints={fragilityPoints}
        resilienceHistory={resilienceHistory}
      />

      {/* Other Lazy Modals */}
      <Suspense fallback={<ModalLoading />}>
        {isResearchModalOpen && <ResearchProposalModal isOpen onClose={() => setIsResearchModalOpen(false)} />}
        {isDataModalOpen && <DataHubModal isOpen settlement={settlement} onApplyCalibration={applyPublicDataCalibration} onClose={() => setIsDataModalOpen(false)} />}
        {selectedAgent && (
          <AgentInspectorModal
            agent={selectedAgent}
            settlement={settlement}
            onClose={() => setSelectedAgentId(null)}
            onSelectNeighbor={(id) => setSelectedAgentId(id)}
          />
        )}
        {isAiModalOpen && (
          <AiResilienceAdvisorModal
            isOpen
            settlement={settlement}
            scenario={scenario}
            metrics={metrics}
            fragilityPoints={fragilityPoints}
            seed={seed}
            hazardIntensity={hazardIntensity}
            warningLeadTimeMin={warningLeadTimeMin}
            enableMutualAid={enableMutualAid}
            enableMultiScaleFeedback={enableMultiScaleFeedback}
            onClose={() => setIsAiModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
