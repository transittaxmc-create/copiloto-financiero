"use client";

import { useState } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import type { LedgerBill } from "@/lib/ledger";
import type { ObligationCategory } from "@/lib/engines/types";
import { Plus, Pencil, Trash2, Check, X, FileText } from "lucide-react";

const CATEGORIES = [
  { value: "rent", label: "Renta" },
  { value: "car", label: "Carro" },
  { value: "card", label: "Tarjeta" },
  { value: "fuel", label: "Gasolina" },
  { value: "ops", label: "Operativos" },
  { value: "other", label: "Otros" },
] as const;

const RECURRENCES = [
  { value: "monthly", label: "Mensual" },
  { value: "biweekly", label: "Quincenal" },
  { value: "weekly", label: "Semanal" },
] as const;

interface DraftBill {
  name: string;
  amount: string;
  due_day: string;
  recurrence: "monthly" | "biweekly" | "weekly";
  category: string;
}

const emptyDraft: DraftBill = {
  name: "",
  amount: "",
  due_day: "1",
  recurrence: "monthly",
  category: "other",
};

export default function BillsManager() {
  const ledgerBills = useFinanceStore((s) => s.ledgerBills);
  const addLedgerBill = useFinanceStore((s) => s.addLedgerBill);
  const updateLedgerBill = useFinanceStore((s) => s.updateLedgerBill);
  const removeLedgerBill = useFinanceStore((s) => s.removeLedgerBill);
  const syncing = useFinanceStore((s) => s.syncing);

  const [draft, setDraft] = useState<DraftBill>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftBill | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    if (!draft.name || !draft.amount) return;
    const id = await addLedgerBill({
      name: draft.name,
      amount: parseFloat(draft.amount) || 0,
      due_day: parseInt(draft.due_day) || 1,
      recurrence: draft.recurrence,
      is_active: true,
      category: draft.category as ObligationCategory,
    });
    if (id) {
      setDraft(emptyDraft);
      setShowForm(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDraft) return;
    await updateLedgerBill(editingId, {
      name: editDraft.name,
      amount: parseFloat(editDraft.amount) || 0,
      due_day: parseInt(editDraft.due_day) || 1,
      recurrence: editDraft.recurrence,
      category: editDraft.category as ObligationCategory,
    });
    setEditingId(null);
    setEditDraft(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Eliminar este gasto?")) {
      await removeLedgerBill(id);
    }
  };

  const startEdit = (bill: LedgerBill) => {
    setEditingId(bill.id!);
    setEditDraft({
      name: bill.name,
      amount: String(bill.amount),
      due_day: String(bill.due_day),
      recurrence: bill.recurrence,
      category: bill.category || "other",
    });
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Mis Gastos Fijos
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {syncing && (
        <p className="text-[10px] text-amber-400">Sincronizando...</p>
      )}

      {showForm && (
        <div className="bg-slate-800/60 rounded-xl p-3 space-y-2 border border-slate-600/40">
          <input
            className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
            placeholder="Nombre (ej: Renta)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className="bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
              placeholder="$ Monto"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
            <input
              type="number"
              min={1}
              max={31}
              className="bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
              placeholder="Dia"
              value={draft.due_day}
              onChange={(e) => setDraft({ ...draft, due_day: e.target.value })}
            />
            <select
              className="bg-slate-900/60 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"
              value={draft.recurrence}
              onChange={(e) => setDraft({ ...draft, recurrence: e.target.value as "monthly" | "biweekly" | "weekly" })}
            >
              {RECURRENCES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <select
            className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold py-1.5 rounded-lg">
              Guardar
            </button>
            <button onClick={() => { setShowForm(false); setDraft(emptyDraft); }} className="px-3 bg-slate-700/40 hover:bg-slate-700/60 text-slate-400 text-xs py-1.5 rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {ledgerBills.length === 0 && !showForm && (
          <p className="text-xs text-slate-500 italic">No hay gastos fijos. Agrega uno para que el plan los considere.</p>
        )}
        {ledgerBills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
            {editingId === bill.id && editDraft ? (
              <div className="flex-1 space-y-1.5">
                <input
                  className="w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                />
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    className="flex-1 bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                    value={editDraft.amount}
                    onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                  />
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className="w-14 bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
                    value={editDraft.due_day}
                    onChange={(e) => setEditDraft({ ...editDraft, due_day: e.target.value })}
                  />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handleSaveEdit} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingId(null); setEditDraft(null); }} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{bill.name}</p>
                  <p className="text-[10px] text-slate-500">
                    ${bill.amount.toFixed(2)} · dia {bill.due_day} · {RECURRENCES.find((r) => r.value === bill.recurrence)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => startEdit(bill)} className="text-slate-500 hover:text-slate-300 p-1">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(bill.id!)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
