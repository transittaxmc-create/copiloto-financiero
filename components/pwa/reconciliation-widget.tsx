"use client";

import { Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface Props {
  balanceReal: number;
  balanceCalculado: number;
}

export function ReconciliationWidget({
  balanceReal,
  balanceCalculado,
}: Props): React.ReactElement {
  const diferencia = balanceReal - balanceCalculado;
  const reconciliado = Math.abs(diferencia) <= 0.05;

  return (
    <div
      className={cn("surface-elevated p-5 transition-all")}
      style={{
        borderLeft: `4px solid ${reconciliado ? "#10b981" : "#ef4444"}`,
        boxShadow: reconciliado
          ? "0 0 20px rgba(16,185,129,0.3)"
          : "0 0 20px rgba(239,68,68,0.3)",
      }}
    >
      <div className="flex items-center gap-2">
        <Wallet className={cn("h-5 w-5", reconciliado ? "text-emerald-400" : "text-red-400")} />
        <span className="stat-label">Reconciliación Real vs Calculado</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400">Balance Real (Banco)</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-slate-50">
            {formatCurrency(balanceReal)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Calculado (App)</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-slate-50">
            {formatCurrency(balanceCalculado)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-900/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Diferencia</span>
          <span className={cn("font-mono text-lg font-bold", reconciliado ? "text-emerald-400" : "text-red-400")}>
            {diferencia >= 0 ? "+" : ""}{formatCurrency(diferencia)}
          </span>
        </div>
        {!reconciliado && (
          <p className="mt-1 text-[11px] text-red-300/80">Tolerancia: ±$0.05. Requiere revisión.</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {reconciliado ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        )}
        <span className={cn("text-xs font-semibold", reconciliado ? "text-emerald-400" : "text-red-400")}>
          {reconciliado ? "Reconciliado correctamente" : "Discrepancia detectada"}
        </span>
      </div>
    </div>
  );
}
