"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Landmark } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";

/**
 * Hero del ritual matutino: saldo real + badge de verificación + CONCILIAR.
 */
export default function BankBalanceHero() {
  const startingBalance = useFinanceStore((s) => s.startingBalance);
  const bankSnapshot = useFinanceStore((s) => s.bankSnapshot);
  const setVerifiedBalance = useFinanceStore((s) => s.setVerifiedBalance);
  const isVerifiedToday = useFinanceStore((s) => s.isVerifiedToday);

  const verified = isVerifiedToday();
  const [draft, setDraft] = useState(startingBalance.toFixed(2));
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setDraft(startingBalance.toFixed(2));
  }, [startingBalance]);

  const onReconcile = () => {
    const n = Number(String(draft).replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return;
    setVerifiedBalance(n, "manual");
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
  };

  const verifiedLabel = (() => {
    if (!verified || !bankSnapshot.verifiedAt) return null;
    const t = new Date(bankSnapshot.verifiedAt).toLocaleTimeString("es-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const src = bankSnapshot.source === "ocr" ? "OCR" : bankSnapshot.source === "manual" ? "manual" : "seed";
    return `Verificado y Conciliado · ${t} · ${src}`;
  })();

  return (
    <section className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-[#0EA5E9]" /> Saldo real de hoy
          </p>
          <p
            className={`text-3xl md:text-4xl font-black mt-1 tracking-tight ${
              verified ? "text-emerald-400" : "text-slate-100"
            }`}
          >
            ${startingBalance.toFixed(2)}
          </p>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Anclado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" /> Pendiente
          </span>
        )}
      </div>

      <p className={`text-[11px] ${verified ? "text-emerald-400/90" : "text-amber-300/90"}`}>
        {verified ? verifiedLabel : "Estimación · concilia para anclar el plan de pagos"}
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">$</span>
          <input
            id="reconcile-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onReconcile()}
            className="w-full bg-slate-900/80 border border-slate-600/70 focus:border-violet-500/70 rounded-xl pl-7 pr-3 py-3 text-sm font-semibold text-white outline-none transition-colors"
            aria-label="Monto a conciliar"
          />
        </div>
        <button
          type="button"
          onClick={onReconcile}
          className={`sm:w-auto w-full px-5 py-3 rounded-full text-xs font-black tracking-wide text-white transition-all active:scale-[0.98] shadow-lg ${
            flash
              ? "bg-emerald-500 shadow-emerald-500/30"
              : "bg-fuchsia-500 hover:bg-fuchsia-400 shadow-fuchsia-900/40"
          }`}
        >
          {flash ? "✓ ACTUALIZADO" : "CONCILIAR Y ACTUALIZAR"}
        </button>
      </div>
    </section>
  );
}
