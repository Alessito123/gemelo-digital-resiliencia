import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  FileSpreadsheet, 
  FileType, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { SettlementPreset, DisasterScenario, SimulationMetrics, FragilityPoint } from '../types';
import { exportToWord, exportToPdf, exportToExcel } from '../modules/export/reportExporter';
import { useLanguage } from '../context/LanguageContext';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  fragilityPoints: FragilityPoint[];
  resilienceHistory: Array<{ step: number; timeMin: number; resilienceIndex: number; evacuatedCount: number }>;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  settlement,
  scenario,
  metrics,
  fragilityPoints,
  resilienceHistory,
}) => {
  const { language, t } = useLanguage();
  const [downloadingFormat, setDownloadingFormat] = useState<'word' | 'pdf' | 'excel' | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const dataPayload = {
    settlement,
    scenario,
    metrics,
    fragilityPoints,
    resilienceHistory,
  };

  const handleExportWord = async () => {
    try {
      setDownloadingFormat('word');
      await exportToWord(dataPayload, language);
      setLastDownloaded('Word (.docx)');
    } catch (err) {
      console.error('Error generating Word report', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setDownloadingFormat('pdf');
      exportToPdf(dataPayload, language);
      setLastDownloaded('PDF (.pdf)');
    } catch (err) {
      console.error('Error generating PDF report', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setDownloadingFormat('excel');
      exportToExcel(dataPayload, language);
      setLastDownloaded('Excel (.xlsx)');
    } catch (err) {
      console.error('Error generating Excel file', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl rounded-2xl modal-surface border shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F27D26]/20 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold m-0">{t.reportsTitle}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 m-0">{settlement.name} · {scenario.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t.reportsSubtitle}
          </p>

          {/* Report Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Word (.docx) */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <FileType className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-blue-400 mb-1">Microsoft Word</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {t.reportsDownloadWordDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportWord}
                disabled={downloadingFormat !== null}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md"
              >
                {downloadingFormat === 'word' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar .DOCX</span>
              </button>
            </div>

            {/* PDF (.pdf) */}
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:border-red-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-red-400 mb-1">Documento PDF</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {t.reportsDownloadPdfDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={downloadingFormat !== null}
                className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md"
              >
                {downloadingFormat === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar .PDF</span>
              </button>
            </div>

            {/* Excel (.xlsx) */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-emerald-400 mb-1">Libro Excel</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  {t.reportsDownloadExcelDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={downloadingFormat !== null}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md"
              >
                {downloadingFormat === 'excel' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar .XLSX</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {lastDownloaded && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-none" />
              <span>Reporte generado exitosamente: <strong>{lastDownloaded}</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-xs font-bold hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t.reportsClose}
          </button>
        </div>
      </div>
    </div>
  );
};
