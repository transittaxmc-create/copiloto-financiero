'use client';

import type { EZPassSummary } from '@/lib/ezpass-types';
import { AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface Props {
  summary: EZPassSummary;
}

export default function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700/50 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign size={14} className="text-slate-400" />
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total Facturado</p>
        </div>
        <p className="font-bold text-xl text-slate-50">${summary.totalBilled.toFixed(2)}</p>
        <p className="text-[10px] text-slate-500 mt-1">Todos los cargos</p>
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-4 border border-red-500/30 bg-red-500/5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={14} className="text-red-400" />
          <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Duplicados</p>
        </div>
        <p className="font-bold text-xl text-red-400">${summary.duplicatesDetected.toFixed(2)}</p>
        <p className="text-[10px] text-slate-500 mt-1">Detectados este mes</p>
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">Real a Pagar</p>
        </div>
        <p className="font-bold text-xl text-emerald-400">${summary.totalRealToPay.toFixed(2)}</p>
        <p className="text-[10px] text-slate-500 mt-1">Total deducible</p>
      </div>
    </div>
  );
}