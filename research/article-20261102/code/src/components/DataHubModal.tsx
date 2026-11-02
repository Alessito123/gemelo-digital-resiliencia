import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ExternalLink, 
  Layers, 
  Filter, 
  CheckCircle
} from 'lucide-react';
import { DATASETS_CATALOGUE } from '../data/datasetsCatalogue';
import { useModalDialog } from '../hooks/useModalDialog';
import { PublicDataConsole } from './publicData/PublicDataConsole';
import { PublicDataCalibration, SettlementPreset } from '../types';

interface DataHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: SettlementPreset;
  onApplyCalibration: (calibration: PublicDataCalibration) => void;
}

export const DataHubModal: React.FC<DataHubModalProps> = ({ isOpen, onClose, settlement, onApplyCalibration }) => {
  const { dialogRef, onKeyDown } = useModalDialog(isOpen, onClose);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos los Datasets' },
    { id: 'satellite', label: 'Observación Satelital' },
    { id: 'topography', label: 'Topografía y Vialidad' },
    { id: 'historical', label: 'Desastres Históricos' },
    { id: 'social', label: 'Vulnerabilidad y Riesgo' },
  ];

  const filteredDatasets = selectedCategory === 'all'
    ? DATASETS_CATALOGUE
    : DATASETS_CATALOGUE.filter((d) => d.category === selectedCategory);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div ref={dialogRef} onKeyDown={onKeyDown} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Fuentes de datos" className="modal-surface data-hub-modal bg-[#161618] border border-[#2A2A2E] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="data-hub-modal__header p-4 lg:p-5 border-b border-[#2A2A2E] flex items-center justify-between bg-[#0D0D0E]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-white tracking-wide serif-header">
                Observatorio de Datasets Públicos Recomendados
              </h2>
              <p className="text-xs text-gray-400">
                Fuentes abiertas globales para modelado multi-escala en asentamientos informales sin costos de licenciamiento
              </p>
            </div>
          </div>
          <button
            type="button" aria-label="Cerrar fuentes de datos"
            onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-white hover:bg-[#2A2A2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="data-hub-modal__header px-5 py-2.5 bg-[#0D0D0E] border-b border-[#2A2A2E] flex items-center gap-2 overflow-x-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          {categories.map((cat) => (
            <button
              type="button" aria-pressed={selectedCategory === cat.id}
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-sm font-semibold uppercase tracking-wider text-[10px] transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#F27D26] text-black font-bold'
                  : 'bg-[#161618] text-gray-400 border border-[#2A2A2E] hover:text-white hover:bg-[#2A2A2E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Datasets Content Table / Cards */}
        <div className="data-hub-modal__body p-5 overflow-y-auto space-y-3.5 flex-1">
          <PublicDataConsole settlement={settlement} onApply={onApplyCalibration} />

          <div className="dataset-catalogue-heading">
            <div><p className="eyebrow">Catálogo ampliado</p><h3>Fuentes para el pipeline científico completo</h3></div>
            <p>“Manual” y “con credenciales” indican trabajo pendiente de ETL o autorización; no se muestran como datos ya integrados.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="dataset-card bg-[#0D0D0E] p-4 rounded-md border border-[#2A2A2E] hover:border-[#F27D26]/50 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-white tracking-wide">
                      {dataset.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/50 uppercase tracking-wider">
                      {dataset.category}
                    </span>
                  </div>

                  <div className="mt-1 text-[11px] text-[#F27D26] font-mono">
                    Fuente: {dataset.source}
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-xs text-gray-300">
                    <div>
                      <strong className="text-gray-400 font-normal">Variables Clave: </strong>
                      {dataset.keyVariables}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 font-mono">
                      <span>Cobertura: <strong className="text-gray-200 font-medium">{dataset.coverage}</strong></span>
                      <span>Resolución: <strong className="text-sky-300">{dataset.resolution}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#2A2A2E] flex items-center justify-between text-xs">
                  <span className={`dataset-integration dataset-integration--${dataset.integration ?? 'manual-import'}`}>
                    <CheckCircle className="w-3 h-3" />
                    {dataset.integration === 'live' ? 'Integración en vivo' : dataset.integration === 'credentialed' ? 'Requiere credenciales' : 'Importación manual'}
                  </span>
                  <a
                    href={dataset.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#F27D26] hover:text-[#ff8f3d] hover:underline font-mono text-xs"
                  >
                    <span>Portal Oficial</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {dataset.integrationNote && <p className="dataset-integration-note">{dataset.integrationNote}</p>}
              </div>
            ))}
          </div>

          {/* Architecture Pipeline Banner */}
          <div className="dataset-card p-4 rounded-md bg-[#0D0D0E] border border-[#2A2A2E] text-xs">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-2 serif-header">
              <Layers className="w-4 h-4 text-[#F27D26]" />
              Pipeline de Integración de Datos Multi-Escala (Fase 2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 text-[11px] text-gray-300">
              <div className="p-2.5 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <span className="text-[#F27D26] font-mono font-bold">1. Satelital:</span> GHSL + Sentinel-2 extraen NDBI, pendientes y techos.
              </div>
              <div className="p-2.5 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <span className="text-[#F27D26] font-mono font-bold">2. Red Vial:</span> OpenStreetMap mapea callejones, gradas y anchos de vía.
              </div>
              <div className="p-2.5 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <span className="text-[#F27D26] font-mono font-bold">3. Social:</span> Encuestas BRACED alimentan grafos de confianza y apoyo mutuo.
              </div>
              <div className="p-2.5 bg-[#161618] rounded-sm border border-[#2A2A2E]">
                <span className="text-[#F27D26] font-mono font-bold">4. Calibración:</span> EM-DAT / DesInventar ajustan umbrales de falla física.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="data-hub-modal__footer p-4 bg-[#0D0D0E] border-t border-[#2A2A2E] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-semibold bg-[#2A2A2E] hover:bg-[#3A3A3E] text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cerrar Observatorio
          </button>
        </div>
      </div>
    </div>
  );
};
