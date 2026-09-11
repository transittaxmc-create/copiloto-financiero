'use client';

import type { EZPassDispute } from '@/lib/ezpass-types';
import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

interface Props {
  disputes: EZPassDispute[];
  onClose: () => void;
}

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  sent: { label: 'Enviada', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  resolved: { label: 'Resuelta', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  rejected: { label: 'Rechazada', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

export default function DisputeHistory({ disputes, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700/50 sticky top-0 bg-[#1E293B]">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText size={18} className="text-sky-400" />
            Historial de Disputas
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XCircle size={20} />
          </button>
        </div>

        {/* Lista de disputas */}
        <div className="p-4 space-y-3">
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No hay disputas aún</p>
              <p className="text-slate-500 text-xs mt-1">Las disputas aparecerán aquí cuando las generes</p>
            </div>
          ) : (
            disputes.map((dispute) => {
              const config = statusConfig[dispute.status];
              const StatusIcon = config.icon;

              return (
                <div key={dispute.id} className="bg-[#0B132B] rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-white">{dispute.dispute_number}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(dispute.dispute_date).toLocaleDateString('es-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
                      <StatusIcon size={12} className={config.color} />
                      <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </div>

                  {dispute.resolved_amount && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30">
                      <p className="text-xs text-slate-400">
                        Monto resuelto: <span className="text-emerald-400 font-medium">${dispute.resolved_amount.toFixed(2)}</span>
                      </p>
                    </div>
                  )}

                  {dispute.pdf_url && (
                    <a
                      href={dispute.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                    >
                      <FileText size={12} />
                      Ver PDF
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}