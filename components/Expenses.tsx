"use client";

import { useState, useRef } from 'react';
import { 
  Camera, 
  Briefcase, 
  User, 
  X, 
  Trash2, 
  Plus, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Receipt, 
  Fuel, 
  Wrench, 
  Shield, 
  Smartphone,
  CloudOff
} from 'lucide-react';
import { useLocalExpenses } from '@/hooks/useLocalExpenses';
import type { LocalExpense } from '@/lib/localStore';
import BottomNav from './BottomNav';

const CATEGORIES = [
  { id: 'gas', label: 'Gasolina', icon: Fuel },
  { id: 'maintenance', label: 'Mantenimiento / Taller', icon: Wrench },
  { id: 'insurance', label: 'Seguro / Póliza', icon: Shield },
  { id: 'phone', label: 'Teléfono / Internet', icon: Smartphone },
  { id: 'other', label: 'Otro gasto', icon: Receipt },
];

export default function Expenses() {
  const { expenses, loading, addExpense, deleteExpense, pendingCount } = useLocalExpenses();
  const [filter, setFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form state para nuevo gasto
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('gas');
  const [isBusiness, setIsBusiness] = useState(true);
  const [notes, setNotes] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExpense = async () => {
    if (!merchant.trim()) {
      showToast('Por favor escribe el comercio o concepto', 'error');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Por favor ingresa un monto válido mayor a 0', 'error');
      return;
    }

    // Offline-first: guardar localmente al instante; syncManager envía a Supabase en segundo plano
    addExpense({
      merchant: merchant.trim(),
      amount: amt,
      category,
      is_business: isBusiness,
      notes: notes.trim() || null,
      receipt_url: receiptPreview || null,
      date: new Date().toISOString().split('T')[0],
    });

    showToast('✓ Gasto guardado (se sincroniza automáticamente)');
    setShowModal(false);
    // Reset form
    setMerchant('');
    setAmount('');
    setCategory('gas');
    setIsBusiness(true);
    setNotes('');
    setReceiptPreview(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm('¿Deseas eliminar este gasto?')) return;
    deleteExpense(id); // local siempre; si viene del servidor, borra en Supabase (best-effort)
    showToast('Gasto eliminado');
  };

  const totalBusiness = expenses
    .filter(e => e.is_business)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalPersonal = expenses
    .filter(e => !e.is_business)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'business') return e.is_business;
    if (filter === 'personal') return !e.is_business;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-28 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-bold z-50 shadow-lg text-sm flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold">Gastos y Recibos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control de deducciones para impuestos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-400 text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-green-300 transition-colors shadow"
        >
          <Camera size={15} /> Escanear Recibo
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-400 text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-green-300 transition-colors shadow"
        >
          <Plus size={16} /> Nuevo Gasto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1E293B] rounded-2xl p-4 border border-green-500/40">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Briefcase size={14} className="text-green-400" /> Business (Deducible)
          </p>
          <p className="text-2xl font-bold text-green-400">${totalBusiness.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {expenses.filter(e => e.is_business).length} gastos registrados
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-4 border border-red-500/40">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <User size={14} className="text-red-400" /> Personal
          </p>
          <p className="text-2xl font-bold text-red-400">${totalPersonal.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {expenses.filter(e => !e.is_business).length} gastos registrados
          </p>
        </div>
      </div>

      {/* Scan / Add Shortcut Banner */}
      <button
        type="button"
        onClick={() => {
          setShowModal(true);
          setTimeout(() => fileInputRef.current?.click(), 150);
        }}
        className="w-full bg-[#1E293B] border border-dashed border-gray-600 rounded-2xl p-5 flex items-center justify-center gap-3 mb-5 hover:border-green-400 transition-colors group text-left"
      >
        <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
          <Camera size={24} className="text-green-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Escanear o Fotografiar Recibo</p>
          <p className="text-xs text-gray-400">Guarda comprobante para respaldo ante el IRS</p>
        </div>
      </button>

      {/* Pendientes de sincronización */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-[#1E293B] border border-yellow-500/40 rounded-xl px-3.5 py-2.5 text-xs text-yellow-400">
          <CloudOff size={14} className="shrink-0" />
          {pendingCount} gasto(s) pendiente(s) de sincronizar — se enviarán automáticamente al recuperar conexión.
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-green-400 text-black font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700'
          }`}
        >
          Todos ({expenses.length})
        </button>
        <button
          onClick={() => setFilter('business')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'business'
              ? 'bg-green-500 text-black font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700'
          }`}
        >
          Business ({expenses.filter(e => e.is_business).length})
        </button>
        <button
          onClick={() => setFilter('personal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'personal'
              ? 'bg-red-500 text-white font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700'
          }`}
        >
          Personal ({expenses.filter(e => !e.is_business).length})
        </button>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <RefreshCw size={26} className="animate-spin text-green-400 mb-2" />
          <p className="text-sm">Cargando gastos...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-gray-700 text-center my-4">
          <Receipt size={36} className="text-gray-500 mx-auto mb-2" />
          <p className="font-semibold text-sm">No hay gastos en esta sección</p>
          <p className="text-xs text-gray-400 mt-1">
            Registra recibos de combustible, mantenimiento o suministros.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map(exp => (
            <div
              key={exp.id}
              className="bg-[#1E293B] rounded-xl p-3.5 border border-gray-700 flex justify-between items-center hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    exp.is_business ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {exp.is_business ? <Briefcase size={18} /> : <User size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{exp.merchant}</p>
                  <p className="text-xs text-gray-400">
                    {exp.date} · {CATEGORIES.find(c => c.id === exp.category)?.label || 'Gasto'}
                  </p>
                  {exp.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">{exp.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`font-bold text-base ${exp.is_business ? 'text-green-400' : 'text-red-400'}`}>
                    ${Number(exp.amount).toFixed(2)}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                      exp.is_business ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {exp.is_business ? '[BUSINESS]' : '[PERSONAL]'}
                  </span>
                  {exp.sync_status !== 'synced' && (
                    <p className="text-[9px] text-yellow-500 mt-0.5 flex items-center justify-end gap-1">
                      <CloudOff size={9} /> sin sincronizar
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteExpense(exp.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Eliminar gasto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-5 w-full max-w-sm border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Receipt size={20} className="text-green-400" /> Registrar Gasto
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Business vs Personal Switch */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setIsBusiness(true)}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  isBusiness
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                    : 'bg-[#0F172A] text-gray-400 border border-gray-700'
                }`}
              >
                <Briefcase size={14} /> [BUSINESS]
              </button>
              <button
                type="button"
                onClick={() => setIsBusiness(false)}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  !isBusiness
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-[#0F172A] text-gray-400 border border-gray-700'
                }`}
              >
                <User size={14} /> [PERSONAL]
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Monto ($ USD)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2.5 text-xl font-bold text-white outline-none focus:border-green-400"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Comercio / Lugar</label>
                <input
                  type="text"
                  placeholder="ej. Chevron, AutoZone, Car Wash"
                  value={merchant}
                  onChange={e => setMerchant(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Foto del Recibo (Opcional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageCapture}
                  className="hidden"
                />
                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-700 h-28 bg-black/40 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptPreview} alt="Recibo" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setReceiptPreview(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-[#0F172A] border border-dashed border-gray-700 rounded-xl text-xs text-gray-400 flex items-center justify-center gap-2 hover:border-gray-500 transition-colors"
                  >
                    <Camera size={16} className="text-green-400" /> Adjuntar o tomar foto
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Notas adicionales</label>
                <input
                  type="text"
                  placeholder="Detalles opcionales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-transparent border border-gray-700 text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveExpense}
                className="flex-1 bg-green-400 text-black py-3 rounded-xl font-bold text-sm hover:bg-green-300 transition-colors"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

