"use client";
import { useState } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import ProactiveNotifier from "@/components/pwa/proactive-notifier";
import { Target, Calendar, TrendingUp, DollarSign, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DaySchedule { day: string; date: number; isWorking: boolean; projected: number; }

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MOCK_BILLS = [
  { id: "1", name: "Renta Carro", amount: 450, dueDate: new Date("2026-09-19"), isPaid: false, recurrence: "weekly" as const },
  { id: "2", name: "Insurance", amount: 280, dueDate: new Date("2026-09-15"), isPaid: false, recurrence: "monthly" as const },
  { id: "3", name: "Gasolina", amount: 60, dueDate: new Date("2026-09-07"), isPaid: false, recurrence: "weekly" as const },
];

export default function GrowthPage(): React.ReactElement {
  const [targetWeekly, setTargetWeekly] = useState(2100);
  const [currentWeek, setCurrentWeek] = useState([
    { day: "Dom", date: 6, isWorking: false, projected: 0 },
    { day: "Lun", date: 7, isWorking: true, projected: 300 },
    { day: "Mar", date: 8, isWorking: true, projected: 300 },
    { day: "Mié", date: 9, isWorking: true, projected: 300 },
    { day: "Jue", date: 10, isWorking: true, projected: 300 },
    { day: "Vie", date: 11, isWorking: true, projected: 300 },
    { day: "Sáb", date: 12, isWorking: true, projected: 300 },
  ]);

  const workingDays = currentWeek.filter(d => d.isWorking).length;
  const projectedDaily = workingDays > 0 ? targetWeekly / workingDays : 0;
  const actualToday = 245.50;
  const balance = 1850.75;

  const toggleDay = (index: number) => {
    const updated = [...currentWeek];
    updated[index].isWorking = !updated[index].isWorking;
    updated[index].projected = updated[index].isWorking ? projectedDaily : 0;
    setCurrentWeek(updated);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DailyEntryHeader />
      <div className="flex-1 space-y-4 px-4 pt-4">
        {/* Weekly Target */}
        <div className="surface-elevated rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="stat-label flex items-center gap-2"><Target size={14} />Meta Semanal</h3>
            <button className="chip chip-blue text-xs">Editable</button>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <DollarSign size={20} className="text-emerald-400" />
            <input type="number" value={targetWeekly} onChange={(e) => setTargetWeekly(parseFloat(e.target.value) || 0)} className="input-field flex-1 text-center text-2xl font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="surface rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Días Trabajados</p><p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-slate-100">{workingDays}</p></div>
            <div className="surface rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">Promedio/Día</p><p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-sky-400">${projectedDaily.toFixed(2)}</p></div>
          </div>
        </div>

        {/* Schedule */}
        <div className="surface rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="stat-label flex items-center gap-2"><Calendar size={14} />Programación Semanal</h4>
            <div className="flex gap-2">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-700/50"><ChevronLeft size={16} /></button>
              <span className="text-xs text-slate-400">Sep 6-12</span>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-700/50"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {currentWeek.map((day, index) => (
              <button key={index} onClick={() => toggleDay(index)} className={cn("surface flex flex-col items-center gap-1 rounded-xl p-2 transition-all", day.isWorking ? "border-emerald-500/50 bg-emerald-500/10" : "opacity-60")}>
                <span className="text-[10px] font-semibold text-slate-400">{day.day}</span>
                <span className={cn("text-lg font-bold", day.isWorking ? "text-emerald-400" : "text-slate-500")}>{day.date}</span>
                {day.isWorking && <div className="h-1 w-6 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Flow Solver */}
        <ProactiveNotifier />

        {/* Guardrail Warning */}
        {projectedDaily < 60 && (
          <div className="surface flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <TrendingUp className="h-8 w-8 text-amber-400" />
            <div><p className="font-semibold text-amber-400">⚠️ Guardrail Bajo</p><p className="text-xs text-slate-400">Tu promedio/hora está por debajo de $60. Considera ajustar tu meta.</p></div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
