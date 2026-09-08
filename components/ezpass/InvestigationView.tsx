'use client';

import type { EZPassRecord } from '@/lib/ezpass-types';
import { SOURCE_CONFIG, STATUS_CONFIG } from '@/lib/ezpass-types';
import { AlertTriangle, FileText, MapPin, X } from 'lucide-react';

interface Props {
  record: EZPassRecord;
  originalRecord?: EZPassRecord;
  onClose: () => void;
  onConfirmDuplicate: (record: EZPassRecord) => void;
  onGenerateDispute: (record: EZPassRecord) => void;
}

export default function InvestigationView({ 
  record, 
  originalRecord, 
  onClose, 
  onConfirmDuplicate, 
  onGenerateDispute 
}: Props) {
  const sourceConfig = SOURCE_CONFIG[record.source];
  const statusConfig = STATUS_CONFIG[record.status];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Investigación
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Alerta de duplicado */}
        <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-sm text-amber-300 font-medium">
            ⚠️ Posible duplicado detectado
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Misma fecha y hora que otro registro. Verifica si es un cargo legítimo o duplicado.
          </p>
        </div>

        {/* Comparación lado a lado */}
        <div className="p-4 space-y-3">
          {/* Mi registro (original) */}
          {originalRecord && (
            <div className="bg-[#0F172A] rounded-xl p-3 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{SOURCE_CONFIG[originalRecord.source].icon}</span>
                <span className="text-xs font-bold text-emerald-400 uppercase">Mi Registro (Original)</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-400" />
                  <span className="text-sm text-white">{originalRecord.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">📅 {originalRecord.trip_date}</span>
                  {originalRecord.trip_time && (
                    <span className="text-xs text-slate-400">🕐 {originalRecord.trip_time}</span>
                  )}
                </div>
                <p className="text-lg font-bold text-emerald-400">${Number(originalRecord.amount).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Cargo externo (duplicado) */}
          <div className="bg-[#0F172A] rounded-xl p-3 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{sourceConfig.icon}</span>
              <span className="text-xs font-bold text-red-400 uppercase">Cargo Externo (Duplicado?)</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-sm text-white">{record.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">📅 {record.trip_date}</span>
                {record.trip_time && (
                  <span className="text-xs text-slate-400">🕐 {record.trip_time}</span>
                )}
              </div>
              <p className="text-lg font-bold text-red-400">${Number(record.amount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Evidencia */}
        {record.screenshot_url && (
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <FileText size={12} /> Evidencia adjunta
            </p>
            <img 
              src={record.screenshot_url} 
              alt="Evidencia" 
              className="w-full rounded-lg border border-slate-700"
            />
          </div>
        )}

        {/* Botones de acción */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            onClick={() => onConfirmDuplicate(record)}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle size={16} />
            Confirmar Duplicado (Bloquear pago)
          </button>
          <button
            onClick={() => onGenerateDispute(record)}
            className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            Generar Disputa PDF
          </button>
          <button
            onClick={onClose}
            className="w-full bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 font-medium py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}