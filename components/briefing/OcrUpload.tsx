"use client";

import { useState, useRef } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Camera, Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function OcrUpload() {
  const setVerifiedBalance = useFinanceStore((s) => s.setVerifiedBalance);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ balance: number | null; charges: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "OCR failed");
      setResult({ balance: data.balance, charges: data.charges?.length ?? 0 });
      if (data.balance != null) {
        setVerifiedBalance(data.balance, "ocr");
      }
    } catch (e: any) {
      setError(e.message ?? "Error procesando archivo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4 space-y-2">
      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
        <Camera className="w-4 h-4 text-purple-400" />
        OCR Bancario
      </h3>
      <p className="text-[10px] text-slate-500">
        Sube un screenshot del app bancario o PDF de estado de cuenta.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-300 text-xs font-semibold py-2 rounded-lg"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {busy ? "Procesando..." : "Subir screenshot / PDF"}
      </button>

      {result && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300">
            Saldo detectado: {result.balance != null ? `$${result.balance.toFixed(2)}` : "no encontrado"}
            {result.charges > 0 && ` · ${result.charges} cargos visibles`}
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">⚠ {error}</p>
      )}
    </div>
  );
}
