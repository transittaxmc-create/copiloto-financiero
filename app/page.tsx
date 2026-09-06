"use client";
import { useState } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import { DailyEntryForm } from "@/components/pwa/daily-entry-form";
import { Wallet, TrendingUp, TrendingDown, Calendar, CheckCircle2 } from "lucide-react";

interface DailyStats { gross: number; net: number; trips: number; miles: number; }

export default function HomePage(): React.ReactElement {
  const [stats] = useState<DailyStats>({ gross: 245.50, net: 208.68, trips: 12, miles: 87 });
  const [lastSaved, setLastSaved] = useState<string | null>("14:32");
  const handleTripSaved = (data: any) => { console.log("Trip saved:", data); setLastSaved(new Date().toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit", hour12: true })); };
  const taxReserve = stats.net * 0.25;

  return (
    <div className="flex min-h-screen flex-col">
      <DailyEntryHeader />
      <div className="flex-1 space-y-4 px-4 pt-4">
        <div className="surface-elevated rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="stat-label flex items-center gap-2"><Wallet size={14} />Resumen del Día</h3>{lastSaved && <span className="chip chip-green">Guardado {lastSaved}</span>}</div>
          <p className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-emerald-400">${stats.net.toFixed(2)}</p>
          <p className="text-sm text-slate-400">Neto del día · {stats.trips} viajes · {stats.miles} millas</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="surface rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Bruto</p><p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-slate-100">${stats.gross.toFixed(2)}</p></div>
            <div className="surface rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Deducciones</p><p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-emerald-400">${(stats.gross - stats.net).toFixed(2)}</p></div>
          </div>
        </div>
        <div className="surface-elevated rounded-2xl p-4">
          <h3 className="stat-label mb-3">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="surface flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-slate-700/50 active:scale-[0.98]"><TrendingUp size={24} className="text-emerald-400" /><span className="text-xs font-semibold text-slate-200">Ver Proyecciones</span></button>
            <button className="surface flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-slate-700/50 active:scale-[0.98]"><Calendar size={24} className="text-sky-400" /><span className="text-xs font-semibold text-slate-200">Calendario</span></button>
            <button className="surface flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-slate-700/50 active:scale-[0.98]"><TrendingDown size={24} className="text-amber-400" /><span className="text-xs font-semibold text-slate-200">Gastos</span></button>
            <button className="surface flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-slate-700/50 active:scale-[0.98]"><CheckCircle2 size={24} className="text-sky-400" /><span className="text-xs font-semibold text-slate-200">Reconciliar</span></button>
          </div>
        </div>
        <div className="surface surface-elevated flex items-center justify-between rounded-xl border-l-4 border-sky-500 bg-sky-500/5 p-4">
          <div><p className="text-xs font-semibold text-sky-400">🏦 Colchón Fiscal (25%)</p><p className="text-sm text-slate-400">Apartado para el IRS</p></div>
          <p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-sky-400">${taxReserve.toFixed(2)}</p>
        </div>
        <div className="surface-elevated rounded-2xl p-4">
          <h3 className="stat-label mb-4">➕ Nuevo Viaje</h3>
          <DailyEntryForm onTripSaved={handleTripSaved} />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}