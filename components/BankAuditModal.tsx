"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileSearch, X, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";

interface OcrResult {
  bank_name: string;
  extracted_balance: number;
  statement_period_end: string;
}

/**
 * Auditoría bancaria por OCR: sube/toma foto del extracto, la IA extrae el
 * balance disponible y actualiza el balance inicial del planificador.
 */
export default function BankAuditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const setStartingBalance = useFinanceStore((s) => s.setStartingBalance);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch("/api/ai/ocr-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error del servidor");
        const data: OcrResult = json.data;
        if (typeof data.extracted_balance !== "number") throw new Error("No se detectó el balance");
        setResult(data);
        setStartingBalance(data.extracted_balance);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar el extracto");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("No se pudo leer el archivo");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0B132B] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-700/70">
          <p className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileSearch size={16} className="text-sky-400" /> Auditoría Bancaria
          </p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Zona de subida */}
          <label
            className={`border-2 border-dashed rounded-2xl p-6 block text-center cursor-pointer transition-colors ${
              loading ? "border-sky-500 bg-sky-500/10" : "border-slate-700 hover:border-sky-500 bg-slate-900/60"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={28} className="text-sky-400 mx-auto mb-2 animate-spin" />
                <span className="text-xs text-slate-300 block font-medium">Analizando extracto con IA…</span>
              </>
            ) : (
              <>
                <UploadCloud size={28} className="text-sky-400 mx-auto mb-2" />
                <span className="text-xs text-slate-300 block font-medium">Sube o toma foto a tu Extracto Bancario</span>
                <span className="text-[10px] text-slate-500 mt-1 block">PNG, JPG</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
              disabled={loading}
            />
          </label>

          {/* Resultado */}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1.5">
                <CheckCircle2 size={14} /> Balance detectado y actualizado
              </div>
              <p className="text-[11px] text-slate-400">
                {result.bank_name || "Banco"} · cierre {result.statement_period_end}
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                ${result.extracted_balance.toFixed(2)}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setError(null);
                fileRef.current?.click();
              }}
              disabled={loading}
              className="flex-1 bg-slate-800/60 border border-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700/60 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={13} /> Probar otra imagen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-emerald-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}