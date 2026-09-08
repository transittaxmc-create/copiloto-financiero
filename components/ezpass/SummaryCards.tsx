"use client";

import type { EZPassSummary } from "@/lib/ezpass-types";
import { AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";

interface Props {
  summary: EZPassSummary;
}

export default function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-slate-800/60 rounded-sm p-3 border border-slate-700/40">
        <div className="flex items-center gap-1.5 mb-1">
          <DollarSign size={10} className="text-slate-500" />
          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Facturado</p>
        </div>
        <p className="font-medium text-sm text-slate-200">${summary.totalBilled.toFixed(2)}</p>
      </div>

      <div className="bg-slate-800/60 rounded-sm p-3 border border-red-500/20">
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={10} className="text-red-400" />
          <p className="text-[9px] uppercase tracking-wider text-red-400/80 font-medium">Duplicados</p>
        </div>
        <p className="font-medium text-sm text-red-400">${summary.duplicatesDetected.toFixed(2)}</p>
      </div>

      <div className="bg-slate-800/60 rounded-sm p-3 border border-emerald-500/20">
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle2 size={10} className="text-emerald-400" />
          <p className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-medium">Real</p>
        </div>
        <p className="font-medium text-sm text-emerald-400">${summary.totalRealToPay.toFixed(2)}</p>
      </div>
    </div>
  );
}
