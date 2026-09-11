"use client";

import type { PaymentPlan, PaymentPlanItem } from "@/lib/engines/types";
import PaymentActionCard from "./PaymentActionCard";

interface Props {
  plan: PaymentPlan;
  onPay?: (item: PaymentPlanItem) => void;
}

function TierColumn({
  emoji,
  title,
  total,
  children,
  accent,
}: {
  emoji: string;
  title: string;
  total: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl border ${accent} bg-[#1E293B]/80 p-3.5 space-y-3 min-h-[140px]`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-white">
          {emoji} {title}
        </h4>
        <span className="text-[11px] font-bold text-slate-300 tabular-nums">{total}</span>
      </div>
      {children}
    </div>
  );
}

export default function PaymentPlanBoard({ plan, onPay }: Props) {
  const sum = (items: PaymentPlanItem[]) =>
    items.reduce((s, i) => s + (i.recommendedAmount > 0 ? i.recommendedAmount : i.amount), 0);

  const highTotal = sum(plan.high);
  const medTotal = sum(plan.medium);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Plan operativo de pagos
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Prioridad por vencimiento, criticidad y colchón de seguridad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TierColumn
          emoji="🔴"
          title="Prioridad alta"
          total={`$${highTotal.toFixed(0)}`}
          accent="border-red-500/30"
        >
          {plan.high.length === 0 ? (
            <p className="text-[11px] text-slate-500 py-4 text-center">Nada urgente</p>
          ) : (
            <div className="grid gap-2">
              {plan.high.map((item) => (
                <PaymentActionCard key={item.obligationId} item={item} onPay={onPay} />
              ))}
            </div>
          )}
        </TierColumn>

        <TierColumn
          emoji="🟡"
          title="Prioridad media"
          total={`$${medTotal.toFixed(0)}`}
          accent="border-amber-500/30"
        >
          {plan.medium.length === 0 ? (
            <p className="text-[11px] text-slate-500 py-4 text-center">Sin media</p>
          ) : (
            <div className="grid gap-2">
              {plan.medium.map((item) => (
                <PaymentActionCard key={item.obligationId} item={item} onPay={onPay} />
              ))}
            </div>
          )}
        </TierColumn>

        <TierColumn
          emoji="🔵"
          title="Fondo operativo"
          total={`$${plan.opsFund.amount.toFixed(0)}`}
          accent="border-sky-500/30"
        >
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
            <p className="text-2xl font-black text-sky-400 tabular-nums">
              ${plan.opsFund.amount.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">{plan.opsFund.reason}</p>
            {plan.deferred.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Más adelante</p>
                {plan.deferred.map((d) => (
                  <p key={d.obligationId} className="text-[11px] text-slate-400 flex justify-between gap-2">
                    <span className="truncate">{d.name}</span>
                    <span className="tabular-nums shrink-0">${d.amount.toFixed(0)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </TierColumn>
      </div>
    </section>
  );
}
