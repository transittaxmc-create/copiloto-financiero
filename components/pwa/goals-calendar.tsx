"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function GoalsCalendar({
  metaSemanal = 2100,
}: {
  metaSemanal?: number;
}): React.ReactElement {
  const [diasLaborables, setDiasLaborables] = useState<boolean[]>([
    true, true, true, true, true, true, false,
  ]);

  const diasTrabajo = diasLaborables.filter(Boolean).length;
  const targetDiario = diasTrabajo > 0 ? metaSemanal / diasTrabajo : 0;

  const toggleDia = (idx: number) => {
    setDiasLaborables((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-sky-400" />
        <span className="stat-label">Metas de Ingreso Semanal</span>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xs text-slate-400">Meta Total</span>
        <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-sky-400">
          {formatCurrency(metaSemanal)}
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-xs text-slate-400">Días laborables</span>
        <span className="text-sm font-semibold text-slate-200">{diasTrabajo} de 7</span>
      </div>

      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-xs text-slate-400">Target diario</span>
        <span className="font-mono text-sm font-bold text-sky-400">
          {formatCurrency(targetDiario)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((nombre, idx) => {
          const esLaborable = diasLaborables[idx];
          return (
            <button
              key={nombre}
              onClick={() => toggleDia(idx)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-2 transition-all active:scale-95",
                esLaborable ? "bg-sky-500/15 text-sky-400" : "bg-slate-800/40 text-slate-500"
              )}
            >
              <span className="text-[10px] font-semibold">{nombre}</span>
              <span className={cn("h-1.5 w-6 rounded-full", esLaborable ? "bg-sky-400" : "bg-slate-700")} />
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        Toca un día para marcarlo como libre. La meta se redistribuye automáticamente.
      </p>
    </div>
  );
}
