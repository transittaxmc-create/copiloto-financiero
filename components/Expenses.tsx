"use client";

import { useState } from 'react';
import { Camera, Briefcase, User, X } from 'lucide-react';
import BottomNav from './BottomNav';

interface Expense {
  id: number;
  merchant: string;
  amount: number;
  type: 'business' | 'personal';
}

export default function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, merchant: 'Chevron', amount: 45.00, type: 'business' },
    { id: 2, merchant: '7-Eleven', amount: 5.50, type: 'personal' }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddExpense = (type: 'business' | 'personal') => {
    const newExpense: Expense = {
      id: Date.now(),
      merchant: type === 'business' ? 'Nuevo Gasto' : 'Gasto Personal',
      amount: 0.00,
      type
    };
    setExpenses([newExpense, ...expenses]);
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const totalBusiness = expenses.filter(e => e.type === 'business').reduce((sum, e) => sum + e.amount, 0);
  const totalPersonal = expenses.filter(e => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black px-6 py-3 rounded-xl font-bold z-50 animate-pulse">
          Gasto agregado exitosamente
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Gastos y Recibos</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4 border border-green-500/30">
          <p className="text-xs text-gray-400 mb-1">Business</p>
          <p className="text-xl font-bold text-green-400">${totalBusiness.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{expenses.filter(e => e.type === 'business').length} gastos</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-4 border border-red-500/30">
          <p className="text-xs text-gray-400 mb-1">Personal</p>
          <p className="text-xl font-bold text-red-400">${totalPersonal.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{expenses.filter(e => e.type === 'personal').length} gastos</p>
        </div>
      </div>

      {/* Scan Button */}
      <button 
        onClick={() => setShowModal(true)} 
        className="w-full bg-[#1E293B] border border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center mb-6 hover:border-gray-500 transition-colors"
      >
        <Camera size={32} className="text-green-400 mb-2" />
        <span className="text-sm text-gray-300">Escanear Recibo</span>
      </button>

      {/* Expenses List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-400 mb-2">Todos los Gastos</h2>
        {expenses.map((exp) => (
          <div 
            key={exp.id} 
            className="bg-[#1E293B] rounded-xl p-4 border border-gray-700 flex justify-between items-center hover:border-gray-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${exp.type === 'business' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {exp.type === 'business' ? (
                  <Briefcase size={16} className="text-green-400" />
                ) : (
                  <User size={16} className="text-red-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{exp.merchant}</p>
                <p className={`text-sm ${exp.type === 'business' ? 'text-green-400' : 'text-red-400'}`}>
                  ${exp.amount.toFixed(2)}
                </p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
              exp.type === 'business' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {exp.type === 'business' ? 'Business' : 'Personal'}
            </span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <h4 className="text-sm text-gray-400 mb-4">¿Este gasto es para tu negocio?</h4>
            <div className="space-y-3">
              <button 
                onClick={() => handleAddExpense('business')} 
                className="w-full bg-green-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
              >
                <Briefcase size={18} /> BUSINESS
              </button>
              <button 
                onClick={() => handleAddExpense('personal')} 
                className="w-full bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-400 transition-colors"
              >
                <User size={18} /> PERSONAL
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
