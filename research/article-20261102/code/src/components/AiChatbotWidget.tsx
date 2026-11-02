import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  ChevronDown, 
  RefreshCw, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  Globe,
  Mic,
  MicOff
} from 'lucide-react';
import { SettlementPreset, DisasterScenario, SimulationMetrics, AgentHousehold } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AiChatbotWidgetProps {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  selectedAgent: AgentHousehold | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenReportsModal: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
  suggestions?: string[];
}

type SpeechRecognitionResultLike = { [index: number]: { [index: number]: { transcript: string } } };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: SpeechRecognitionResultLike }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export const AiChatbotWidget: React.FC<AiChatbotWidgetProps> = ({
  settlement,
  scenario,
  metrics,
  selectedAgent,
  isOpen,
  onToggleOpen,
  onOpenReportsModal,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: language === 'en'
        ? `Hello! I am the **AI Resilience Assistant** for the Digital Twin of **${settlement.name}**. I can analyze bottlenecks, explain evacuation dynamics, suggest early warning protocols, or generate reports for the active **${scenario.name}** scenario.`
        : `¡Hola! Soy el **Asistente IA de Resiliencia** para el Gemelo Digital de **${settlement.name}**. Puedo analizar cuellos de botella, explicar la dinámica de evacuación, recomendar protocolos de alerta temprana o asistirte con reportes para el escenario de **${scenario.name}**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: language === 'en' 
        ? ['Analyze current bottlenecks', 'What is the optimal early warning lead time?', 'Export simulation report']
        : ['Analizar cuellos de botella actuales', '¿Cuál es el tiempo óptimo de alerta?', 'Exportar reporte de simulación'],
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setInputQuery((current) => current || (language === 'es' ? 'El dictado por voz no está disponible en este navegador.' : 'Voice dictation is not available in this browser.'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'es' ? 'es-PE' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) setInputQuery((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          context: {
            settlement: {
              id: settlement.id,
              name: settlement.name,
              city: settlement.city,
              areaHa: settlement.areaHa,
              avgSlopeDeg: settlement.avgSlopeDeg,
              totalPopulation: settlement.totalPopulation,
            },
            scenario: {
              name: scenario.name,
              type: scenario.type,
              intensityScale: scenario.parameters.intensityScale,
              warningLeadTimeMin: scenario.parameters.warningLeadTimeMin,
            },
            metrics: {
              currentStep: metrics.currentStep,
              timeElapsedMin: metrics.timeElapsedMin,
              systemResilienceIndex: metrics.systemResilienceIndex,
              evacuationRatePct: metrics.evacuationRatePct,
              safeCount: metrics.safeCount,
              trappedCount: metrics.trappedCount,
              injuredCount: metrics.injuredCount,
            },
            selectedAgent: selectedAgent ? {
              name: selectedAgent.name,
              state: selectedAgent.state,
              roofMaterial: selectedAgent.roofMaterial,
              residentsCount: selectedAgent.residentsCount,
            } : null,
          }
        }),
      });

      const data = await response.json();

      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: data.source,
          suggestions: data.suggestions || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error?.message || 'Error processing query');
      }
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: language === 'en'
          ? `### Resilience Briefing for ${settlement.name}\n- **Evacuation Progress**: ${metrics.evacuationRatePct}% (${metrics.safeCount} safe).\n- **Resilience Score**: ${metrics.systemResilienceIndex}/100.\n- **Priority Directive**: Reinforce neighborhood mutual aid to speed up dependents and clear chokepoints.`
          : `### Diagnóstico de Resiliencia para ${settlement.name}\n- **Avance de Evacuación**: ${metrics.evacuationRatePct}% (${metrics.safeCount} hogares a salvo).\n- **Índice de Resiliencia**: ${metrics.systemResilienceIndex}/100.\n- **Directiva Prioritaria**: Activar brigadas comunitarias en escalinatas centrales para acelerar el flujo de hogares vulnerables.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: language === 'en'
          ? ['Recommend evacuation protocol', 'How to reduce bottlenecks?']
          : ['Recomendar protocolo de evacuación', '¿Cómo mitigar cuellos de botella?'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render basic markdown formatting: headers, bold, bullets
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-[#F27D26] text-xs mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="ml-3 list-disc text-[11px] leading-relaxed my-0.5">
            {formatBoldText(line.replace('- ', ''))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1" />;
      }
      return <p key={idx} className="text-[11px] leading-relaxed my-0.5">{formatBoldText(line)}</p>;
    });
  };

  const formatBoldText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={t.btnChatAssistant}
          className="floating-chat-trigger"
        >
          <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
          <span>{t.btnChatAssistant}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-1" />
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <aside
          className={`floating-chat-panel ${isExpanded ? '!w-[36rem] !h-[42rem]' : ''}`}
          aria-label={t.chatTitle}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F27D26]/20 border border-[#F27D26]/50 flex items-center justify-center text-[#F27D26]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 m-0">
                  {t.chatTitle}
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">Live</span>
                </h3>
                <p className="text-[10px] text-gray-400 m-0">{settlement.name} · {scenario.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className="p-1 rounded text-gray-400 hover:text-white text-[10px] font-mono flex items-center gap-0.5 border border-transparent hover:border-gray-700"
                title="Cambiar Idioma / Switch Language"
              >
                <Globe className="w-3 h-3" />
                <span>{language.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-gray-400 hover:text-white"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onToggleOpen}
                className="p-1 rounded text-gray-400 hover:text-white"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}
              >
                <div>{renderFormattedText(msg.text)}</div>
                <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-white/10 text-[9px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {msg.source && <span className="font-mono">{msg.source}</span>}
                </div>

                {/* Quick Prompts Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                    {msg.suggestions.map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          if (sugg.includes('report') || sugg.includes('reporte')) {
                            onOpenReportsModal();
                          } else {
                            handleSendMessage(sugg);
                          }
                        }}
                        className="px-2 py-0.8 rounded-full bg-white/10 hover:bg-[#F27D26]/20 text-[10px] text-white/90 hover:text-[#F27D26] border border-white/15 hover:border-[#F27D26]/40 cursor-pointer transition-colors text-left"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble chat-bubble--assistant flex items-center gap-2 text-gray-400 text-xs py-2">
                <Sparkles className="w-3.5 h-3.5 text-[#F27D26] animate-spin" />
                <span>{t.chatThinking}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="chat-input-row">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chatPlaceholder}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`chat-voice-button ${isListening ? 'is-listening' : ''}`}
              title={isListening ? 'Detener dictado' : 'Dictar consulta por voz'}
              aria-label={isListening ? 'Detener dictado por voz' : 'Dictar consulta por voz'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 rounded-lg bg-[#F27D26] text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ff8f3d] transition-all cursor-pointer"
              title={t.chatSend}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
