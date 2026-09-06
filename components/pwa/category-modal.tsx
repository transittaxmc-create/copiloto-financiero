"use client";
import { useState, useEffect } from "react";
import { Briefcase, Home, X, Camera, Receipt, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "business" | "personal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: Category, amount: number, description: string) => void;
  amount?: number;
  description?: string;
}

export function CategoryModal({ isOpen, onClose, onSelect, amount, description }: Props): React.ReactElement {
  const [selected, setSelected] = useState<Category | null>(null);
  const [customAmount, setCustomAmount] = useState(amount?.toString() || "");
  const [customDesc, setCustomDesc] = useState(description || "");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setCustomAmount(amount?.toString() || "");
      setCustomDesc(description || "");
    }
  }, [isOpen, amount, description]);

  const handleSubmit = () => {
    if (!selected) return;
    const parsedAmount = parseFloat(customAmount) || 0;
    onSelect(selected, parsedAmount, customDesc);
    onClose();
  };

  const simulateScan = async () => {
    setScanning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCustomAmount("25.99");
    setCustomDesc("Uber Eats - Lunch");
    setScanning(false);
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-3xl bg-slate-900 p-6 sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt size={20} className="text-sky-400" />
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-slate-50">Clasificar Gasto</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800"><X size={20} /></button>
        </div>
        <div className="mb-4">
          <p className="stat-label mb-2">ESCANEAR RECIBO</p>
          <button onClick={simulateScan} disabled={scanning} className="surface flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl p-5 transition-all hover:bg-slate-700/50">
            {scanning ? (
              <><div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-500" /><span>Escaneando...</span></>
            ) : (
              <><Camera size={24} className="text-sky-400" /><span>Escanear Recibo</span></>
            )}
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" /><span className="text-xs text-slate-500">o manual</span><div className="h-px flex-1 bg-slate-700" />
        </div>
        <div className="mb-6 space-y-4">
          <div>
            <label className="stat-label mb-1 block">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input type="text" inputMode="decimal" placeholder="0.00" value={customAmount} onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="input-field w-full pl-8" />
            </div>
          </div>
          <div>
            <label className="stat-label mb-1 block">Descripción</label>
            <input type="text" placeholder="ej. Gasolina..." value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="input-field w-full" />
          </div>
        </div>
        <div className="mb-6">
          <p className="stat-label mb-3">CATEGORÍA</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSelected("business")} className={cn("surface flex flex-col items-center gap-2 rounded-xl p-4", selected === "business" ? "border-2 border-emerald-500 bg-emerald-500/10" : "hover:bg-slate-800")}>
              {selected === "business" ? <Check size={20} className="text-emerald-400" /> : <Briefcase size={20} className="text-emerald-400" />}
              <span className={cn("font-semibold", selected === "business" ? "text-emerald-400" : "text-slate-200")}>[BUSINESS]</span>
              <span className="text-[10px] text-slate-400">Deducible</span>
            </button>
            <button onClick={() => setSelected("personal")} className={cn("surface flex flex-col items-center gap-2 rounded-xl p-4", selected === "personal" ? "border-2 border-sky-500 bg-sky-500/10" : "hover:bg-slate-800")}>
              {selected === "personal" ? <Check size={20} className="text-sky-400" /> : <Home size={20} className="text-sky-400" />}
              <span className={cn("font-semibold", selected === "personal" ? "text-sky-400" : "text-slate-200")}>[PERSONAL]</span>
              <span className="text-[10px] text-slate-400">No deducible</span>
            </button>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!selected || !customAmount} className={cn("btn-primary w-full", selected === "business" && "bg-emerald-500", selected === "personal" && "bg-sky-500")}>
          Guardar
        </button>
      </div>
    </div>
  );
}