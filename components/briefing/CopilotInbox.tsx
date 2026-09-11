"use client";

import { Bot, AlertTriangle, Info, CheckCircle2, Zap } from "lucide-react";
import type { CopilotNote, Severity } from "@/lib/engines/types";

const tone: Record<
  Severity,
  { border: string; bg: string; text: string; icon: typeof Bot }
> = {
  urgent: {
    border: "border-red-500/35",
    bg: "bg-red-500/10",
    text: "text-red-300",
    icon: AlertTriangle,
  },
  action: {
    border: "border-amber-500/35",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    icon: Zap,
  },
  watch: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    icon: Info,
  },
  ok: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    icon: CheckCircle2,
  },
};

interface Props {
  notes: CopilotNote[];
  onAction?: (actionId: string) => void;
}

export default function CopilotInbox({ notes, onAction }: Props) {
  return (
    <section className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-5 space-y-3 h-full shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#0EA5E9]" /> AI Copilot
        </h3>
        <span className="text-[10px] text-slate-500">{notes.length} notas</span>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">Sin alertas · todo en orden</p>
      ) : (
        <ul className="space-y-2.5">
          {notes.map((n) => {
            const t = tone[n.severity];
            const Icon = t.icon;
            return (
              <li
                key={n.id}
                className={`rounded-xl border ${t.border} ${t.bg} p-3 space-y-1.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-bold ${t.text} flex items-center gap-1.5`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{n.ts}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{n.body}</p>
                {n.action && (
                  <button
                    type="button"
                    onClick={() => onAction?.(n.action!.id)}
                    className="text-[10px] font-bold uppercase tracking-wide text-[#0EA5E9] hover:text-sky-300 pt-0.5"
                  >
                    {n.action.label} →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
