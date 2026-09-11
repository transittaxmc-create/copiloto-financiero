"use client";

import { Home, Car, CreditCard, Fuel, Server, CircleDollarSign } from "lucide-react";
import {
  AI_STATUS_LABEL,
  type AiPayStatus,
  type ObligationCategory,
  type PaymentPlanItem,
} from "@/lib/engines/types";

const catIcon: Record<ObligationCategory, typeof Home> = {
  rent: Home,
  car: Car,
  card: CreditCard,
  fuel: Fuel,
  ops: Server,
  other: CircleDollarSign,
};

const statusStyle: Record<AiPayStatus, string> = {
  PAY_NOW: "text-red-400 bg-red-500/10 border-red-500/35",
  PAY_MIN: "text-amber-300 bg-amber-500/10 border-amber-500/35",
  RECOMMENDED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  DEFER: "text-slate-400 bg-slate-700/30 border-slate-600/40",
};

interface Props {
  item: PaymentPlanItem;
  onPay?: (item: PaymentPlanItem) => void;
}

export default function PaymentActionCard({ item, onPay }: Props) {
  const Icon = catIcon[item.category] ?? CircleDollarSign;
  const canPay = item.aiStatus !== "DEFER" && item.recommendedAmount > 0;

  return (
    <article className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-4 space-y-3 flex flex-col h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#0EA5E9]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>
            <p className="text-[10px] text-slate-500">
              Vence {item.dueDate} · {item.daysUntilDue === 0 ? "hoy" : `${item.daysUntilDue}d`}
            </p>
          </div>
        </div>
        <p className="text-lg font-black text-white tabular-nums shrink-0">
          ${item.amount.toFixed(0)}
        </p>
      </div>

      <div
        className={`text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border w-fit ${statusStyle[item.aiStatus]}`}
      >
        {AI_STATUS_LABEL[item.aiStatus]}
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed flex-1">{item.reason}</p>

      {item.aiStatus === "PAY_MIN" && (
        <p className="text-[10px] text-amber-200/90">
          Recomendado ahora: <span className="font-bold">${item.recommendedAmount.toFixed(0)}</span>
        </p>
      )}

      <button
        type="button"
        disabled={!canPay}
        onClick={() => onPay?.(item)}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
          canPay
            ? "bg-slate-100 text-slate-900 hover:bg-white"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {item.aiStatus === "PAY_MIN"
          ? `Marcar mínimo $${item.recommendedAmount.toFixed(0)}`
          : canPay
            ? "Marcar pagado"
            : "Diferido"}
      </button>
    </article>
  );
}
