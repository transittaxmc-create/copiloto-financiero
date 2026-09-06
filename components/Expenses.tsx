"use client";

import { useState, useEffect } from 'react';
import { Camera, Briefcase, User, X, Receipt, DollarSign, MapPin, Calendar, Tag } from 'lucide-react';
import BottomNav from './BottomNav';
import { useSupabase } from '@/lib/supabase';
import { Expense } from '@/lib/types';

interface ExpenseFormData {
  amount: string;
  merchant: string;
  category: string;
  date: string;
  location: string;
  notes: string;
  isBusiness: boolean;
  receipt_url?: string;
}

const categories = [
  { id: 'gas', name: 'Gas / Fuel', icon: '⛽' },
  { id: 'food', name: 'Food & Drinks', icon: '🍔' },
  { id: 'parking', name: 'Parking / Tolls', icon: '🅿️' },
  { id: 'maintenance', name: 'Vehicle Maintenance', icon: '🔧' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'phone', name: 'Phone / Data', icon: '📱' },
  { id: 'supplies', name: 'Supplies', icon: '📦' },
  { id: 'other', name: 'Other', icon: '📝' },
];

export default function Expenses() {
  const supabase = useSupabase();
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'business' | 'personal' | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    merchant: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    location: 'Lindenhurst, NY',
    notes: '',
    isBusiness: true,
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await (supabase.from('expenses') as any)
        .select()
        .order('date', { ascending: false })
        .limit(20);

      if (!error && data) {
        setExpenses(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: 'business' | 'personal') => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, isBusiness: type === 'business' }));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedType(null);
    setFormData({
      amount: '',
      merchant: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      location: 'Lindenhurst, NY',
      notes: '',
      isBusiness: true,
    });
  };

  const handleSaveExpense = async () => {
    if (!formData.amount || !formData.merchant || !formData.category) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        category: formData.category,
        date: formData.date,
        location: formData.location,
        notes: formData.notes,
        is_business: formData.isBusiness,
        receipt_url: formData.receipt_url || null,
      };

      const { error } = await (supabase.from('expenses') as any)
        .insert(expenseData);

      if (!error) {
        setShowModal(false);
        setShowSuccess(true);
        fetchExpenses();
        handleCloseModal();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📝' };
  };

  const businessExpenses = expenses.filter(e => e.is_business);
  const personalExpenses = expenses.filter(e => !e.is_business);
  const totalBusiness = businessExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPersonal = personalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black px-6 py-3 rounded-xl font-bold z-50 animate-pulse">
          ✓ Gasto guardado exitosamente
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Gastos y Recibos</h1>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => handleOpenModal('business')}
          className="bg-green-500/20 border border-green-500/40 text-green-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <Briefcase size={18} /> Agregar Business
        </button>
        <button 
          onClick={() => handleOpenModal('personal')}
          className="bg-red-500/20 border border-red-500/40 text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
        >
          <User size={18} /> Agregar Personal
        </button>
      </div>

      {/* Scan Receipt Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full bg-[#1E293B] border border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center mb-6 hover:border-gray-500 transition-colors"
      >
        <Camera size={32} className="text-green-400 mb-2" />
        <span className="text-sm text-gray-300">Escanear Recibo con OCR</span>
      </button>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4 border border-green-500/30">
          <p className="text-xs text-gray-400 mb-1">Gastos Business</p>
          <p className="text-xl font-bold text-green-400">${totalBusiness.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{businessExpenses.length} gastos</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4 border border-red-500/30">
          <p className="text-xs text-gray-400 mb-1">Gastos Personal</p>
          <p className="text-xl font-bold text-red-400">${totalPersonal.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{personalExpenses.length} gastos</p>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-400 mb-2">Todos los Gastos</h2>
          {expenses.map((exp) => {
            const category = getCategoryInfo(exp.category || 'other');
            return (
              <div key={exp.id} className="bg-[#1E293B] rounded-xl p-4 border border-gray-700 flex justify-between items-center hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${exp.is_business ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {exp.is_business ? (
                      <Briefcase size={16} className="text-green-400" />
                    ) : (
                      <User size={16} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{exp.merchant}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{category.icon} {category.name}</span>
                      <span>·</span>
                      <span>{formatDate(exp.date || '')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${exp.is_business ? 'text-green-400' : 'text-red-400'}`}>
                    ${(exp.amount || 0).toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${exp.is_business ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {exp.is_business ? 'Business' : 'Personal'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#1E293B] rounded-xl p-8 border border-gray-700 text-center">
          <Receipt size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay gastos registrados</p>
          <p className="text-sm text-gray-500 mt-1">Agrega tu primer gasto arriba</p>
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">
                Agregar Gasto
                <span className={`ml-2 text-sm font-normal ${selectedType === 'business' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedType === 'business' ? '(Business)' : '(Personal)'}
                </span>
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Monto *</label>
                <div className="flex items-center bg-gray-800 rounded-xl px-4">
                  <DollarSign size={18} className="text-gray-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="bg-transparent w-full py-3 outline-none text-xl font-bold"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Merchant */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Comerciante / Negocio *</label>
                <div className="flex items-center bg-gray-800 rounded-xl px-4">
                  <Receipt size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej: Chevron, 7-Eleven"
                    className="bg-transparent w-full py-3 outline-none"
                    value={formData.merchant}
                    onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Categoría *</label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`p-2 rounded-xl text-center transition-colors ${
                        formData.category === cat.id
                          ? 'bg-green-500/30 border border-green-500'
                          : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <p className="text-xs mt-1 truncate">{cat.name.split(' ')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fecha</label>
                <div className="flex items-center bg-gray-800 rounded-xl px-4">
                  <Calendar size={18} className="text-gray-400" />
                  <input
                    type="date"
                    className="bg-transparent w-full py-3 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ubicación</label>
                <div className="flex items-center bg-gray-800 rounded-xl px-4">
                  <MapPin size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Lindenhurst, NY"
                    className="bg-transparent w-full py-3 outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas (opcional)</label>
                <textarea
                  placeholder="Detalles adicionales..."
                  className="w-full bg-gray-800 rounded-xl px-4 py-3 outline-none resize-none h-20"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Scan Receipt Button */}
              <button className="w-full bg-transparent border border-dashed border-gray-600 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-500">
                <Camera size={20} /> Escanear recibo (próximamente)
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-700 text-white font-bold py-3 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveExpense}
                  className={`flex-1 font-bold py-3 rounded-xl ${
                    selectedType === 'business'
                      ? 'bg-green-500 text-black'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
