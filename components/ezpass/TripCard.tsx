'use client';

import type { EZPassRecord } from '@/lib/ezpass-types';
import { SOURCE_CONFIG, STATUS_CONFIG } from '@/lib/ezpass-types';
import { AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react';

interface Props {
  record: EZPassRecord;
  onInvestigate?: (record: EZPassRecord) => void;
  onMarkDuplicate?: (record: EZPassRecord) => void;
}

export default function TripCard({ record, onInvestigate, onMarkDuplicate }: Props) {
  const sourceConfig = SOURCE_CONFIG[record.source];
  const statusConfig = STATUS_CONFIG[record.status];

  return (
    <div className={`bg-[#1E293B] rounded-2xl p-4 border shadow-sm transition-all ${
      record.status === 'duplicate' 
        ? 'border-red-500/40 bg-red-500/5' 
        : record.status === 'verified'
        ? 'border-emerald-500/30 bg-emerald-500/5'
        : 'border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{sourceConfig.icon}</span>
          <div>
            <p className="font-semibold text-slate-100 text-sm">{record.location}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {record.trip_date} {record.trip_time && `· ${record.trip_time}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-slate-100">${Number(record.amount).toFixed(2)}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${statusConfig.color}`}>
            {record.status === 'verified' && <CheckCircle2 size={10} />}
            {record.status === 'duplicate' && <AlertTriangle size={10} />}
            {record.status === 'pending' && <Clock size={10} />}
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Mostrar razón de duplicado si aplica */}
      {record.status === 'duplicate' && record.duplicate_of_id && (
        <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-[11px] text-red-300">
            ⚠️ Posible duplicado detectado. Misma fecha/hora que otro registro.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      {(record.status === 'pending' || record.status === 'duplicate') && (
        <div className="mt-3 flex gap-2">
          {record.status === 'duplicate' && (
            <>
              <button
                onClick={() => onMarkDuplicate?.(record)}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Confirmar Duplicado
              </button>
              <button
                onClick={() => onInvestigate?.(record)}
                className="flex-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Generar Disputa
              </button>
            </>
          )}
          {record.status === 'pending' && (
            <button
              onClick={() => onInvestigate?.(record)}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              Ver Detalles
            </button>
          )}
        </div>
      )}
    </div>
  );
}