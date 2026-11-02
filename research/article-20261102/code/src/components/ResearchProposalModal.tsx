import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Star, 
  CheckCircle2, 
  Award, 
  Download, 
  FileText, 
  Layers, 
  Calendar, 
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { RESEARCH_FRAMEWORK } from '../data/researchFramework';
import confetti from 'canvas-confetti';
import { useModalDialog } from '../hooks/useModalDialog';

interface ResearchProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchProposalModal: React.FC<ResearchProposalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dialogRef, onKeyDown } = useModalDialog(isOpen, onClose);
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'journal'>('overview');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportMarkdown = () => {
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    const content = `# ${RESEARCH_FRAMEWORK.tentativeTitle}

## Escala de Evaluación
${RESEARCH_FRAMEWORK.evaluationScale.map((e) => `- **${e.dimension}**: ${e.stars} (${e.rating}/5)\n  *Justificación*: ${e.justification}`).join('\n\n')}

## Vacío de Conocimiento
${RESEARCH_FRAMEWORK.knowledgeGap}

## Objetivo General
${RESEARCH_FRAMEWORK.generalObjective}

## Objetivos Específicos
${RESEARCH_FRAMEWORK.specificObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## Metodología Detallada (Fases 1 a 4, Meses 1-20)
${RESEARCH_FRAMEWORK.phases.map((p) => `### ${p.phase}: ${p.title} (${p.months})\n${p.steps.map((s) => `- **Paso ${s.num}: ${s.title}**: ${s.description}`).join('\n')}`).join('\n\n')}

## Revista Q1 Recomendada
- **Revista**: ${RESEARCH_FRAMEWORK.journalTarget.name}
- **Editorial**: ${RESEARCH_FRAMEWORK.journalTarget.publisher}
- **Factor de Impacto**: ${RESEARCH_FRAMEWORK.journalTarget.impactFactor}
- **Justificación**: ${RESEARCH_FRAMEWORK.journalTarget.justification}

## Contribución Teórica y Práctica
- **Teórica**: ${RESEARCH_FRAMEWORK.theoreticalContribution}
- **Práctica**: ${RESEARCH_FRAMEWORK.practicalContribution}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Propuesta_Gemelo_Digital_Resiliencia_IJDRR.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCitation = () => {
    const citation = `Propuesta de Investigación: "${RESEARCH_FRAMEWORK.tentativeTitle}". Target: International Journal of Disaster Risk Reduction (Elsevier, Q1). Enfoque ML-ABM para asentamientos informales.`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div ref={dialogRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Metodología de investigación" className="modal-surface bg-[#161618] border border-[#2A2A2E] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 lg:p-5 border-b border-[#2A2A2E] flex items-center justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50 uppercase tracking-wider">
                  Propuesta Científica Q1
                </span>
                <span className="text-xs text-gray-400 font-mono">IJDRR • Elsevier</span>
              </div>
              <h2 className="text-sm lg:text-base font-semibold text-white tracking-wide mt-0.5 serif-header">
                {RESEARCH_FRAMEWORK.tentativeTitle}
              </h2>
            </div>
          </div>
          <button
            type="button" aria-label="Cerrar metodología"
            onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-white hover:bg-[#2A2A2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-[#0D0D0E] border-b border-[#2A2A2E] flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#F27D26] text-black'
                : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
            }`}
          >
            Evaluación & Objetivos
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-[#F27D26] text-black'
                : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
            }`}
          >
            Metodología Detallada (Fases 1-4)
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-sm font-semibold uppercase tracking-wider text-[11px] transition-colors cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-[#F27D26] text-black'
                : 'text-gray-400 hover:text-gray-200 bg-[#161618] border border-[#2A2A2E]'
            }`}
          >
            Revista Q1 & Contribución
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Evaluation Dimension Cards */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 serif-header">
                  <Award className="w-4 h-4 text-[#F27D26]" />
                  Escala de Evaluación Científica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {RESEARCH_FRAMEWORK.evaluationScale.map((dim) => (
                    <div key={dim.dimension} className="p-3.5 rounded-md bg-[#0D0D0E] border border-[#2A2A2E]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{dim.dimension}</span>
                        <span className="text-[#F27D26] font-mono font-bold tracking-widest text-sm">
                          {dim.stars}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        {dim.justification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Knowledge Gap */}
              <div className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E]">
                <h3 className="text-xs font-semibold text-[#F27D26] uppercase tracking-wider mb-2 flex items-center gap-1.5 serif-header">
                  <Sparkles className="w-4 h-4 text-[#F27D26]" />
                  Vacío de Conocimiento (Knowledge Gap)
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-xs">
                  {RESEARCH_FRAMEWORK.knowledgeGap}
                </p>
              </div>

              {/* Objectives */}
              <div className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E] space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-[#F27D26] uppercase tracking-wider mb-1 serif-header">
                    Objetivo General
                  </h3>
                  <p className="text-gray-200 font-medium text-xs">
                    {RESEARCH_FRAMEWORK.generalObjective}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2A2A2E]">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Objetivos Específicos
                  </h4>
                  <ul className="space-y-1.5 text-gray-300">
                    {RESEARCH_FRAMEWORK.specificObjectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-xs bg-[#F27D26]/20 text-[#F27D26] font-mono font-bold flex items-center justify-center shrink-0 text-[10px] border border-[#F27D26]/50">
                          {idx + 1}
                        </span>
                        <span className="text-xs leading-relaxed">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'methodology' && (
            <div className="space-y-4">
              {RESEARCH_FRAMEWORK.phases.map((phase) => (
                <div key={phase.phase} className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50">
                        {phase.phase}
                      </span>
                      <h3 className="font-semibold text-white text-xs serif-header">
                        {phase.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {phase.months}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {phase.steps.map((step) => (
                      <div key={step.num} className="p-3 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                        <div className="font-semibold text-[#F27D26] text-xs mb-1">
                          Paso {step.num}: {step.title}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="space-y-4">
              {/* Journal Profile */}
              <div className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white serif-header">
                      {RESEARCH_FRAMEWORK.journalTarget.name}
                    </h3>
                    <p className="text-xs text-[#F27D26] font-mono font-medium">
                      Editorial {RESEARCH_FRAMEWORK.journalTarget.publisher} • Cuartil {RESEARCH_FRAMEWORK.journalTarget.quartile}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xs font-mono font-bold text-xs bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Impact Factor {RESEARCH_FRAMEWORK.journalTarget.impactFactor}
                  </span>
                </div>

                <div className="p-3 bg-[#161618] rounded-sm border border-[#2A2A2E] text-xs text-gray-300">
                  <strong className="text-gray-400 font-normal">Justificación de la Elección Editorial: </strong>
                  {RESEARCH_FRAMEWORK.journalTarget.justification}
                </div>
              </div>

              {/* Contributions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E]">
                  <h4 className="font-semibold text-sky-400 text-xs uppercase tracking-wider mb-2">
                    Contribución Teórica
                  </h4>
                  <p className="text-gray-300 leading-relaxed text-xs">
                    {RESEARCH_FRAMEWORK.theoreticalContribution}
                  </p>
                </div>

                <div className="p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E]">
                  <h4 className="font-semibold text-[#F27D26] text-xs uppercase tracking-wider mb-2">
                    Contribución Práctica
                  </h4>
                  <p className="text-gray-300 leading-relaxed text-xs">
                    {RESEARCH_FRAMEWORK.practicalContribution}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Export buttons */}
        <div className="p-4 bg-[#0D0D0E] border-t border-[#2A2A2E] flex items-center justify-between gap-3">
          <button
            onClick={handleCopyCitation}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider bg-[#161618] hover:bg-[#2A2A2E] text-gray-300 border border-[#2A2A2E] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider bg-[#F27D26] hover:bg-[#ff8f3d] text-black transition-colors cursor-pointer shadow-[0_0_10px_rgba(242,125,38,0.25)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Propuesta (.md)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-xs font-semibold bg-[#2A2A2E] hover:bg-[#3A3A3E] text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
