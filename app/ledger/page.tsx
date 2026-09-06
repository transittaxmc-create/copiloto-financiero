"use client";
import { useState } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import { Calendar, ChevronLeft, ChevronRight, Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
interface D { date: string; gross: number; net: number; expenses: number; trips: number; }
const M: D[] = [{ date: "2026-09-01", gross: 245.50, net: 208.68, expenses: 45.00, trips: 12 }, { date: "2026-09-02", gross: 189.25, net: 161.16, expenses: 38.50, trips: 9 }, { date: "2026-09-03", gross: 312.00, net: 265.20, expenses: 52.00, trips: 15 }];
export default function LedgerPage(): React.ReactElement {
  const [m, setM] = useState(new Date("2026-09-01"));
  const [sel, setSel] = useState<D | null>(null);
  const tG = M.reduce((s, d) => s + d.gross, 0); const tN = M.reduce((s, d) => s + d.net, 0); const tE = M.reduce((s, d) => s + d.expenses, 0); const tT = M.reduce((s, d) => s + d.trips, 0);
  return (
    <div className="flex min-h-screen flex-col">
      <DailyEntryHeader />
      <div className="flex-1 space-y-4 px-4 pt-4">
        <div className="surface-elevated flex items-center justify-between rounded-2xl p-4">
          <button onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-slate-700/50"><ChevronLeft size={20} className="text-slate-400" /></button>
          <div className="text-center"><h2 className="font-bold text-slate-100 capitalize">{m.toLocaleDateString("es-US", { month: "long", year: "numeric" })}</h2><p className="text-xs text-slate-400">{M.length} días</p></div>
          <button onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-slate-700/50"><ChevronRight size={20} className="text-slate-400" /></button>
        </div>
        <div className="surface-elevated rounded-2xl p-4">
          <h3 className="stat-label mb-3"><Wallet size={14} className="inline mr-2" />Resumen del Mes</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="surface rounded-xl p-3 text-center"><p className="text-[10px] text-slate-400">Bruto</p><p className="text-xl font-bold text-emerald-400">${tG.toFixed(2)}</p></div>
            <div className="surface rounded-xl p-3 text-center"><p className="text-[10px] text-slate-400">Neto</p><p className="text-xl font-bold text-sky-400">${tN.toFixed(2)}</p></div>
            <div className="surface rounded-xl p-3 text-center"><p className="text-[10px] text-slate-400">Gastos</p><p className="text-xl font-bold text-amber-400">${tE.toFixed(2)}</p></div>
            <div className="surface rounded-xl p-3 text-center"><p className="text-[10px] text-slate-400">Viajes</p><p className="text-xl font-bold text-slate-100">{tT}</p></div>
          </div>
        </div>
        <div className="surface flex items-center justify-between rounded-xl border-l-4 border-sky-500 bg-sky-500/5 p-4">
          <div className="flex items-center gap-2"><PiggyBank size={18} className="text-sky-400" /><span className="text-xs text-sky-400">🏦 Colchón Fiscal (25%)</span></div>
          <p className="text-lg font-bold text-sky-400">${(tN * 0.25).toFixed(2)}</p>
        </div>
        <div className="space-y-2">
          <h3 className="stat-label"><Calendar size={14} className="inline mr-2" />Detalle Diario</h3>
          {M.map((d) => (
            <button key={d.date} onClick={() => setSel(d)} className={cn("surface w-full p-4 text-left", sel?.date === d.date && "ring-2 ring-emerald-500/50")}>
              <div className="flex justify-between"><div><p className="font-semibold text-slate-100">{new Date(d.date).toLocaleDateString("es-US", { weekday: "short", day: "numeric" })}</p><p className="text-xs text-slate-400">{d.trips} viajes</p></div><div className="text-right"><p className="font-bold text-emerald-400">+${d.net.toFixed(2)}</p><p className="text-xs text-amber-400">-${d.expenses.toFixed(2)}</p></div></div>
            </button>
          ))}
        </div>
        {sel && (
          <div className="surface-elevated fixed bottom-20 left-4 right-4 rounded-2xl p-4 z-50">
            <div className="mb-3 flex justify-between"><h4 className="font-semibold">{new Date(sel.date).toLocaleDateString("es-US", { month: "long", day: "numeric" })}</h4><button onClick={() => setSel(null)} className="text-slate-500">✕</button></div>
            <div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-[10px] text-slate-400">Bruto</p><p className="font-bold text-slate-100">${sel.gross.toFixed(2)}</p></div><div><p className="text-[10px] text-slate-400">Neto</p><p className="font-bold text-emerald-400">${sel.net.toFixed(2)}</p></div><div><p className="text-[10px] text-slate-400">Gastos</p><p className="font-bold text-amber-400">${sel.expenses.toFixed(2)}</p></div></div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}