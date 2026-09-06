"use client";

import { ArrowDown, Pencil } from 'lucide-react';
import BottomNav from './BottomNav';

export default function Register() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 pb-24 font-sans">
      <h1 className="text-2xl font-bold mb-6">Flujo despues de guardar</h1>

      {/* Pendiente */}
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-yellow-500/40 mb-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold">Uber · #67</h2>
          <span className="bg-yellow-500/20 text-yellow-500 text-xs px-3 py-1 rounded-full font-bold">Pendiente</span>
        </div>
        <p className="text-gray-400 mt-2">Residencia · Lindenhurst → Business · Copiague</p>
        <p className="text-green-400 font-bold mt-2">$34.55 <span className="text-green-500/60 font-normal">net (capturado)</span></p>
        <button className="mt-4 text-xs text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
          <Pencil size={12} /> Editar
        </button>
      </div>

      <div className="flex flex-col items-center mb-4">
        <ArrowDown className="text-gray-500" />
        <p className="text-xs text-gray-500 mt-2">Llega el statement de Uber</p>
      </div>

      {/* Reconciliada */}
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-green-500/40 mb-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold">Uber · #67</h2>
          <span className="bg-green-500/20 text-green-500 text-xs px-3 py-1 rounded-full font-bold">Reconciliada</span>
        </div>
        <p className="text-gray-400 mt-2">Residencia · Lindenhurst → Business · Copiague</p>
        <p className="text-green-400 font-bold mt-2">$34.55 <span className="text-green-500/60 font-normal">net (confirmado)</span></p>
      </div>

      <div className="flex flex-col items-center mb-4">
        <ArrowDown className="text-gray-500" />
        <p className="text-xs text-gray-500 mt-2">Pasa automaticamente al Ledger</p>
      </div>

      {/* En Ledger */}
      <div className="bg-[#1E293B] rounded-2xl p-5 border border-blue-500/40">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold">Ledger · Uber #67</h2>
          <span className="bg-blue-500/20 text-blue-500 text-xs px-3 py-1 rounded-full font-bold">En Ledger</span>
        </div>
        <p className="text-gray-400 mt-2">Toda la data GPS + financiera preservada</p>
        <p className="text-blue-400 font-bold mt-2">Listo para reportes / impuestos</p>
      </div>

      <BottomNav />
    </div>
  );
}
