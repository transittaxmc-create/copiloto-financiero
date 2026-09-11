"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";
import BankAuditModal from "./BankAuditModal";

/**
 * Botón de disparo + modal de auditoría bancaria por OCR.
 * El balance extraído actualiza el store del planificador.
 */
export default function BankAuditSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
      >
        <FileSearch className="w-4 h-4 text-[#0EA5E9]" /> Auditar Extracto (OCR)
      </button>
      <BankAuditModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
