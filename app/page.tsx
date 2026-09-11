"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useFinanceStore } from "@/store/useFinanceStore";
import BottomNav from "@/components/BottomNav";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileText,
  BarChart3,
  ArrowRight,
  Wallet,
  Target,
  Receipt,
} from "lucide-react";

export default function HomePage() {
  const startingBalance = useFinanceStore((s) => s.startingBalance);
  const isVerifiedToday = useFinanceStore((s) => s.isVerifiedToday);
  const getWeeklyTarget = useFinanceStore((s) => s.getWeeklyTarget);
  const getWeeklyActual = useFinanceStore((s) => s.getWeeklyActual);
  const getUpcomingExpensesTotal = useFinanceStore((s) => s.getUpcomingExpensesTotal);
  const getInvestableSurplus = useFinanceStore((s) => s.getInvestableSurplus);
  const bankSnapshot = useFinanceStore((s) => s.bankSnapshot);

  const weeklyTarget = getWeeklyTarget();
  const weeklyActual = getWeeklyActual();
  const upcoming7 = getUpcomingExpensesTotal(7);
  const surplus = getInvestableSurplus();
  const verified = isVerifiedToday();
  const progress = weeklyTarget > 0 ? Math.min(100, (weeklyActual / weeklyTarget) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 pb-24">
      <header className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] px-5 pt-12 pb-6 border-b border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Copiloto Financiero</h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${verified ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
            <ShieldCheck className="w-3 h-3" />
            {verified ? "Verificado" : "Sin verificar"}
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Balance bancario</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-0.5">${startingBalance.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {bankSnapshot.verifiedAt ? `Anclado: ${new Date(bankSnapshot.verifiedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : "Sin conciliar hoy"}
          </p>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard" className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between hover:from-cyan-500/30 transition-colors">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <div className="mt-2"><p className="text-sm font-bold">Dashboard</p><p className="text-[10px] text-slate-400">Briefing + plan</p></div>
            <ArrowRight className="w-4 h-4 text-cyan-400 mt-2" />
          </Link>
          <Link href="/register" className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between hover:from-emerald-500/30 transition-colors">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <div className="mt-2"><p className="text-sm font-bold">Registrar viaje</p><p className="text-[10px] text-slate-400">Nuevo trip</p></div>
            <ArrowRight className="w-4 h-4 text-emerald-400 mt-2" />
          </Link>
          <Link href="/expenses" className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between hover:from-amber-500/30 transition-colors">
            <FileText className="w-6 h-6 text-amber-400" />
            <div className="mt-2"><p className="text-sm font-bold">Gastos</p><p className="text-[10px] text-slate-400">Recibos</p></div>
            <ArrowRight className="w-4 h-4 text-amber-400 mt-2" />
          </Link>
          <Link href="/ledger" className="bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between hover:from-purple-500/30 transition-colors">
            <Wallet className="w-6 h-6 text-purple-400" />
            <div className="mt-2"><p className="text-sm font-bold">Ledger</p><p className="text-[10px] text-slate-400">Contabilidad</p></div>
            <ArrowRight className="w-4 h-4 text-purple-400 mt-2" />
          </Link>
        </div>
        {/* Weekly progress */}
        <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Meta semanal
            </h3>
            <span className="text-xs text-slate-400">
              ${weeklyActual.toFixed(0)} / ${weeklyTarget.toFixed(0)}
            </span>
          </div>
          <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {progress >= 100 ? "¡Meta alcanzada!" : `${progress.toFixed(0)}% completado`}
          </p>
        </div>

        {/* Financial snapshot */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              Próx. 7 días
            </p>
            <p className="text-xl font-extrabold text-red-400 mt-1">${upcoming7.toFixed(0)}</p>
          </div>
          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Excedente
            </p>
            <p className={`text-xl font-extrabold mt-1 ${surplus.isSafe ? "text-emerald-400" : "text-slate-500"}`}>
              ${surplus.amount.toFixed(0)}
            </p>
          </div>
        </div>

        {!verified && (
          <Link
            href="/dashboard"
            className="block bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-2xl p-4 text-center hover:from-amber-500/30 transition-colors"
          >
            <p className="text-sm font-bold text-amber-300">⚠ Concilia tu saldo hoy</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Verifica tu balance bancario para un plan preciso</p>
          </Link>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
