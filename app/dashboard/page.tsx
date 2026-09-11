"use client";

import { useMemo, useRef } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import BankAuditSheet from "@/components/BankAuditSheet";
import FinanceRegisterTable from "@/components/FinanceRegisterTable";
import BottomNav from "@/components/BottomNav";
import BankBalanceHero from "@/components/briefing/BankBalanceHero";
import CopilotInbox from "@/components/briefing/CopilotInbox";
import PaymentPlanBoard from "@/components/briefing/PaymentPlanBoard";
import { buildPaymentPlan } from "@/lib/engines/paymentPlanner";
import { buildBriefingNotes } from "@/lib/engines/copilotPolicy";
import type { PaymentPlanItem } from "@/lib/engines/types";
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const startingBalance = useFinanceStore((s) => s.startingBalance);
  const days = useFinanceStore((s) => s.days);
  const previousBalance = useFinanceStore((s) => s.previousBalance);
  const toggleWorkingDay = useFinanceStore((s) => s.toggleWorkingDay);
  const markObligationPaid = useFinanceStore((s) => s.markObligationPaid);
  const getMinProjectedBalance = useFinanceStore((s) => s.getMinProjectedBalance);
  const getUpcomingExpensesTotal = useFinanceStore((s) => s.getUpcomingExpensesTotal);
  const getInvestableSurplus = useFinanceStore((s) => s.getInvestableSurplus);
  const getEmergencyPlan = useFinanceStore((s) => s.getEmergencyPlan);
  const getObligations = useFinanceStore((s) => s.getObligations);
  const isVerifiedToday = useFinanceStore((s) => s.isVerifiedToday);
  const getWorkingDaysRemaining = useFinanceStore((s) => s.getWorkingDaysRemaining);
  const upcomingExpenses = useFinanceStore((s) => s.upcomingExpenses);
  const bankSnapshot = useFinanceStore((s) => s.bankSnapshot);

  const heroRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLElement>(null);

  const verified = isVerifiedToday();
  const minProjected = getMinProjectedBalance();
  const upcomingBills = getUpcomingExpensesTotal(7);
  const { amount: surplus, isSafe } = getInvestableSurplus();
  const emergencyData = getEmergencyPlan();
  const obligations = getObligations();
  const workingDaysRemaining = getWorkingDaysRemaining();

  const plan = useMemo(
    () => buildPaymentPlan(startingBalance, obligations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startingBalance, upcomingExpenses, bankSnapshot.verifiedAt]
  );

  const notes = useMemo(
    () =>
      buildBriefingNotes({
        balance: startingBalance,
        isVerifiedToday: verified,
        emergency: emergencyData,
        plan,
        bills7d: upcomingBills,
        surplus: { amount: surplus, isSafe },
        workingDaysRemaining,
        previousBalance,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      startingBalance,
      verified,
      plan,
      upcomingBills,
      surplus,
      isSafe,
      workingDaysRemaining,
      previousBalance,
      emergencyData.hasDeficit,
    ]
  );

  const headerTime = new Date().toLocaleTimeString("es-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const onPay = (item: PaymentPlanItem) => {
    const amt =
      item.aiStatus === "PAY_MIN"
        ? item.recommendedAmount
        : item.recommendedAmount || item.amount;
    markObligationPaid(item.obligationId, amt, true);
  };

  const onCopilotAction = (actionId: string) => {
    if (actionId === "focus-reconcile") {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = document.getElementById(
        "reconcile-amount"
      ) as HTMLInputElement | null;
      input?.focus();
      return;
    }
    if (actionId === "open-schedule") {
      scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (actionId.startsWith("mark-")) {
      const id = actionId.replace("mark-", "");
      const item =
        plan.high.find((i) => i.obligationId === id) ||
        plan.medium.find((i) => i.obligationId === id);
      if (item) onPay(item);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B132B] text-slate-100 p-4 md:p-8 pb-28 md:pb-10 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white font-[family-name:var(--font-space-grotesk)]">
              ACTUALIZACION MATUTINA DEL BANCO
            </h1>
            <span className="bg-[#0EA5E9]/10 text-[#0EA5E9] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0EA5E9]/30">
              CFO AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {headerTime}
            <span className="text-slate-600">Â·</span>
            {verified ? (
              <span className="text-emerald-400 font-semibold">Verificado hoy</span>
            ) : (
              <span className="text-amber-400 font-semibold">Pendiente de conciliar</span>
            )}
          </p>
        </div>
        <BankAuditSheet />
      </header>

      {emergencyData.hasDeficit && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-400 text-sm">
              Plan de emergencia: faltan ${emergencyData.deficitAmount.toFixed(2)}
            </p>
            <p className="text-slate-300">
              Para cubrir{" "}
              <span className="font-semibold text-white">
                {emergencyData.targetPaymentName}
              </span>{" "}
              en {emergencyData.daysRemaining} dia(s): necesitas{" "}
              <span className="font-bold text-red-300">
                +${emergencyData.suggestedDailyIncrease.toFixed(0)}/dia
              </span>{" "}
              adicionales.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div ref={heroRef}>
          <BankBalanceHero />
        </div>
        <CopilotInbox notes={notes} onAction={onCopilotAction} />
      </div>

      <PaymentPlanBoard plan={plan} onPay={onPay} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Balance actual
          </p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            ${startingBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Minimo proyectado
          </p>
          <p
            className={`text-2xl font-extrabold mt-1 ${
              minProjected < 400 ? "text-amber-400" : "text-cyan-400"
            }`}
          >
            ${minProjected.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Facturas 7 dias
          </p>
          <p className="text-2xl font-extrabold text-red-400 mt-1">
            ${upcomingBills.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Excedente invertible
          </p>
          <p
            className={`text-2xl font-extrabold mt-1 ${
              isSafe ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            ${surplus.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isSafe ? "Libre de riesgo" : "No invertir aun"}
          </p>
        </div>
      </section>

      <section
        ref={scheduleRef}
        className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0EA5E9]" /> Plan semanal de ingresos
          </h3>
          <span className="text-[10px] text-slate-500 shrink-0">
            Toca un dia para activar/descansar
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {days.map((day) => {
            const projected = day.platforms.reduce(
              (acc, p) => acc + p.projectedAmount,
              0
            );
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleWorkingDay(day.id)}
                className={`rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
                  day.isWorkingDay
                    ? "bg-[#10B981]/10 border-[#10B981]/40 hover:border-[#10B981]/70"
                    : "bg-slate-900/60 border-slate-700/50 hover:border-slate-600"
                }`}
              >
                <p
                  className={`text-xs font-bold ${
                    day.isWorkingDay ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {day.date}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {day.isWorkingDay
                    ? `Proy. $${projected.toFixed(0)}`
                    : "Descanso"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <FinanceRegisterTable />
      <BottomNav />
    </main>
  );
}
