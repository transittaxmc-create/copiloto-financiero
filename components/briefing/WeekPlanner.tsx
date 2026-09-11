"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";

const TARGET_OPTIONS = [0, 200, 300, 400, 500, 600];

/**
 * Planificador semanal Lun-Dom: toggle Working/Descanso + meta diaria.
 * Refleja el layout del mock (fila de días, switch, selector "Daily Income").
 */
export default function WeekPlanner() {
  const days = useFinanceStore((s) => s.days);
  const toggleWorkingDay = useFinanceStore((s) => s.toggleWorkingDay);
  const setDayTarget = useFinanceStore((s) => s.setDayTarget);
  const getWeeklyTarget = useFinanceStore((s) => s.getWeeklyTarget);

  const weeklyTarget = getWeeklyTarget();
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = lunes

  return (
    <section className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0EA5E9]" /> Semana de trabajo
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 tabular-nums">
            Meta semanal{" "}
            <span className="text-emerald-400 font-bold">
              ${weeklyTarget.toFixed(0)}
            </span>
          </span>
          <div className="hidden sm:flex items-center gap-1 text-slate-600">
            <ChevronLeft className="w-3.5 h-3.5" />
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isToday = idx === todayIdx;
          const actual = day.platforms.reduce((s, p) => s + p.actualAmount, 0);
          return (
            <div
              key={day.id}
              className={`rounded-xl border p-2.5 space-y-2 transition-colors ${
                isToday
                  ? "border-[#0EA5E9]/60 bg-[#0EA5E9]/5"
                  : day.isWorkingDay
                  ? "border-slate-700/60 bg-slate-900/50"
                  : "border-slate-800 bg-slate-900/30"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <p
                  className={`text-xs font-bold ${
                    isToday ? "text-[#0EA5E9]" : "text-slate-200"
                  }`}
                >
                  {day.date}
                </p>
                {actual > 0 && (
                  <span className="text-[9px] text-emerald-400 tabular-nums font-semibold">
                    ${actual.toFixed(0)}
                  </span>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={day.isWorkingDay}
                aria-label={`${day.date}: ${
                  day.isWorkingDay ? "trabajando" : "descanso"
                }`}
                onClick={() => toggleWorkingDay(day.id)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  day.isWorkingDay ? "bg-[#0EA5E9]" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    day.isWorkingDay ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>

              <p
                className={`text-[9px] uppercase tracking-wide font-bold ${
                  day.isWorkingDay ? "text-[#0EA5E9]" : "text-slate-500"
                }`}
              >
                {day.isWorkingDay ? "Working" : "Descanso"}
              </p>

              <div>
                <label
                  htmlFor={`target-${day.id}`}
                  className="text-[9px] text-slate-500 block mb-0.5"
                >
                  Meta diaria
                </label>
                <select
                  id={`target-${day.id}`}
                  value={day.dailyTarget}
                  disabled={!day.isWorkingDay}
                  onChange={(e) => setDayTarget(day.id, Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-100 outline-none focus:border-[#0EA5E9]/70 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {TARGET_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v === 0 ? "—" : `$${v}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
