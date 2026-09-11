"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import { Sparkles, TrendingUp, Zap, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight { id: string; category: string; score: number; trend: "up" | "down" | "stable"; message: string; }
const INSIGHTS: Insight[] = [{ id: "1", category: "Payment History", score: 780, trend: "up", message: "100% on-time" }, { id: "2", category: "Credit Utilization", score: 750, trend: "up", message: "Using 23%" }, { id: "3", category: "Account Age", score: 710, trend: "stable", message: "Avg 4.2 years" }, { id: "4", category: "Total Accounts", score: 720, trend: "down", message: "Close 2 unused" }];
interface Tip { id: string; title: string; desc: string; savings: number; priority: "high" | "medium" | "low"; }
const TIPS: Tip[] = [{ id: "1", title: "Aumenta Colchón", desc: "Aparta 30% en lugar de 25%", savings: 450, priority: "high" }, { id: "2", title: "Deducción Millaje", desc: "Conduce 2,000+ millas más", savings: 1400, priority: "high" }, { id: "3", title: "Gastos Carro", desc: "Track maintenance", savings: 320, priority: "medium" }];
const SUGGESTIONS = ["¿Cuánto apartar para taxes?", "¿Cómo mejoro mi score?", "¿Cuánto debo ganar?"];

export default function AICreditPage(): React.ReactElement {
  const [tab, setTab] = useState<"insights" | "tips" | "chat">("insights");
  const [msg, setMsg] = useState("");
  const score = Math.round(INSIGHTS.reduce((s, i) => s + i.score, 0) / INSIGHTS.length);
  const savings = TIPS.reduce((s, t) => s + t.savings, 0);

  return (
    <div className="min-h-screen bg-[#0B132B] pb-24">
      <div className="px-4 py-6">
        <DailyEntryHeader />
        <div className="flex gap-2 border-b border-slate-700/50 pt-4">
          {(["insights", "tips", "chat"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("py-3 text-sm font-semibold capitalize", tab === t ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-500")}>{t === "insights" ? "💳 Score" : t === "tips" ? "💡 Tips" : "💬 AI"}</button>
          ))}
        </div>
        <div className="space-y-4 pt-4">
          {tab === "insights" && (
            <>
              <div className="surface-elevated rounded-2xl p-5 text-center">
                <p className="text-xs text-slate-400"><Sparkles className="inline mr-1 text-amber-400" />AI INSIGHTS</p>
                <p className="text-5xl font-bold text-slate-100">{score}</p>
                <p className="text-sm text-emerald-400">Good Credit</p>
                <div className="mt-4 h-2 w-full rounded-full bg-slate-700"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${(score / 850) * 100}%` }} /></div>
              </div>
              <div className="space-y-2">
                {INSIGHTS.map((i) => (
                  <div key={i.id} className="surface p-4">
                    <div className="flex justify-between"><div><p className="font-semibold text-slate-100">{i.category}</p><p className="text-xs text-slate-400">{i.message}</p></div><div className="text-right"><p className="font-bold">{i.score}</p>{i.trend === "up" && <TrendingUp size={12} className="text-emerald-400 ml-auto" />}{i.trend === "down" && <TrendingUp size={12} className="text-red-400 rotate-180 ml-auto" />}</div></div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "tips" && (
            <>
              <div className="surface-elevated flex justify-between rounded-2xl p-4"><div><p className="text-xs text-slate-400">Ahorro Potencial</p><p className="text-2xl font-bold text-emerald-400">${savings.toFixed(2)}</p></div><div className="surface rounded-xl p-3 text-center"><p className="text-[10px] text-slate-400">Tips</p><p className="text-xl font-bold">{TIPS.length}</p></div></div>
              <div className="surface flex items-center gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 p-4"><Zap size={24} className="text-emerald-400" /><div><p className="font-semibold text-emerald-400">Siguiente Paso</p><p className="text-sm text-slate-300">Abre una cuenta HYSA</p></div></div>
              <div className="space-y-2">
                {TIPS.map((t) => (
                  <div key={t.id} className="surface p-4">
                    <div className="mb-2 flex justify-between"><p className="font-semibold text-slate-100">{t.title}</p><span className={cn("chip", t.priority === "high" ? "chip-red" : t.priority === "medium" ? "chip-amber" : "chip-gray")}>{t.priority}</span></div>
                    <p className="text-sm text-slate-400">{t.desc}</p><p className="mt-2 font-bold text-emerald-400">+${t.savings}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "chat" && (
            <div className="surface-elevated rounded-2xl p-4">
              <p className="mb-3 font-semibold text-slate-100"><MessageSquare className="inline mr-2 text-sky-400" />Asistente AI</p>
              <div className="mb-4 min-h-[150px] rounded-xl bg-slate-800/50 p-4"><div className="surface inline-block rounded-xl p-3"><p className="text-sm text-slate-200">👋 Hola! ¿En qué puedo ayudarte?</p></div></div>
              <div className="mb-3 space-y-2">{SUGGESTIONS.map((s, i) => (<button key={i} onClick={() => setMsg(s)} className="surface w-full text-left p-3 text-sm text-slate-300"><ChevronRight size={14} className="inline mr-2 text-slate-500" />{s}</button>))}</div>
              <div className="flex gap-2"><input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe..." className="input-field flex-1" /><button className="btn-primary px-4">Enviar</button></div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
