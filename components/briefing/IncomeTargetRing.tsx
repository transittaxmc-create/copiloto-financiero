"use client";

import { Target } from "lucide-react";

interface Props {
  actual: number;
  target: number;
}

/** Anillo de progreso de la meta semanal (mock: "Income Target Progress"). */
export default function IncomeTargetRing({ actual, target }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = pct >= 100 ? "#10B981" : pct >= 60 ? "#0EA5E9" : "#F59E0B";

  return (
    <section className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 shadow-xl shadow-black/20">
      <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0 -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#334155" strokeWidth="7" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-[#0EA5E9]" /> Meta de ingresos
        </p>
        <p className="text-lg font-extrabold text-white mt-0.5 tabular-nums">
          ${actual.toLocaleString("en-US")}{" "}
          <span className="text-sm font-semibold text-slate-500">
            / ${target.toLocaleString("en-US")}
          </span>
        </p>
        <p className="text-[11px] font-bold mt-0.5" style={{ color }}>
          {pct}% de la semana
        </p>
      </div>
    </section>
  );
}
