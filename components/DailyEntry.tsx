"use client";

import { useState } from 'react';
import { Home, MapPin, Coffee, ChevronDown } from 'lucide-react';
import BottomNav from './BottomNav';

export default function DailyEntry() {
  const [gross, setGross] = useState('');
  const [tips, setTips] = useState('');
  const [tolls, setTolls] = useState('');
  const [fee, setFee] = useState('');
  const [ref, setRef] = useState('');
  const [pickup, setPickup] = useState<{ name: string; city: string; time: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ name: string; city: string; time: string } | null>(null);
  const [platform, setPlatform] = useState('Uber');

  const netPayout = (parseFloat(gross) || 0) + (parseFloat(tips) || 0) + (parseFloat(tolls) || 0) - (parseFloat(fee) || 0);
  const grossIncome = (parseFloat(gross) || 0) + (parseFloat(tips) || 0) + (parseFloat(tolls) || 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    const date = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">{getGreeting()}, Miguel.</h1>
        <p className="text-yellow-500 text-sm">{formatDate()}</p>
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <MapPin size={14} className="text-green-400" />
          <span className="text-sm truncate">West Granada Ave, Lindenhurst</span>
        </div>
      </div>

      {/* Plataforma y Break */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#1E293B] rounded-xl border border-gray-700 p-3 flex items-center justify-between">
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-transparent w-full outline-none font-semibold text-white cursor-pointer"
          >
            <option value="Uber" className="bg-[#1E293B]">Uber</option>
            <option value="Lyft" className="bg-[#1E293B]">Lyft</option>
            <option value="Via" className="bg-[#1E293B]">Via</option>
          </select>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        <button className="bg-transparent border border-yellow-500 text-yellow-500 px-4 rounded-xl flex items-center gap-2">
          <Coffee size={16} /> Break
        </button>
      </div>

      {/* Inputs con estilo de tarjeta */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Gross fare</p>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0.00" 
              className="bg-transparent w-full outline-none text-lg font-bold" 
              value={gross} 
              onChange={(e) => setGross(e.target.value)} 
            />
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Ref / Invoice</p>
          <input 
            type="text" 
            placeholder="opcional" 
            className="bg-transparent w-full outline-none placeholder-gray-500" 
            value={ref} 
            onChange={(e) => setRef(e.target.value)} 
          />
        </div>
      </div>

      {/* Botones grandes de accion */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button 
          onClick={() => setPickup({ name: 'Residencia', city: 'Lindenhurst', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })} 
          className="bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin size={18} /> Pickup now
        </button>
        <button 
          onClick={() => setDropoff({ name: 'Business', city: 'Copiague', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })} 
          className="bg-blue-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin size={18} /> Dropoff now
        </button>
      </div>

      {/* Cajitas compactas de GPS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`bg-[#1E293B] rounded-xl p-3 border flex flex-col justify-between h-[60px] overflow-hidden ${pickup ? 'border-green-500/30' : 'border-gray-700'}`}>
          <div className="flex items-center gap-1 text-green-400 font-bold text-xs">
            <Home size={14} /> {pickup ? pickup.name : "Pendiente"}
          </div>
          <div className="text-xs text-gray-300 truncate">
            {pickup ? `${pickup.time} · ${pickup.city}` : "Toca Pickup"}
          </div>
        </div>
        <div className={`bg-[#1E293B] rounded-xl p-3 border flex flex-col justify-between h-[60px] overflow-hidden ${dropoff ? 'border-blue-500/30 border-gray-700' : 'border-gray-700'}`}>
          <div className="flex items-center gap-1 text-blue-400 font-bold text-xs">
            <MapPin size={14} /> {dropoff ? dropoff.name : "Pendiente"}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {dropoff ? `${dropoff.time} · ${dropoff.city}` : "Toca dropoff"}
          </div>
        </div>
      </div>

      {/* Inputs de Tips, Toll y Fee */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Tips</p>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0.00" 
              className="bg-transparent w-full outline-none" 
              value={tips} 
              onChange={(e) => setTips(e.target.value)} 
            />
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Toll</p>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0.00" 
              className="bg-transparent w-full outline-none" 
              value={tolls} 
              onChange={(e) => setTolls(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700 mb-6">
        <p className="text-xs text-gray-400 mb-1">Platform fee</p>
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">-$</span>
          <input 
            type="text" 
            inputMode="decimal" 
            placeholder="0.00" 
            className="bg-transparent w-full outline-none" 
            value={fee} 
            onChange={(e) => setFee(e.target.value)} 
          />
        </div>
      </div>

      {/* Resultados en tiempo real */}
      <div className="flex justify-between items-end mb-6 bg-[#1E293B] p-4 rounded-xl">
        <div>
          <p className="text-xs text-gray-400">Net payout</p>
          <p className={`text-3xl font-bold ${netPayout >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${netPayout.toFixed(2)}
          </p>
        </div>
        <div className="bg-white text-black p-3 rounded-xl text-right">
          <p className="text-xs text-gray-600">Gross income</p>
          <p className="text-2xl font-bold">${grossIncome.toFixed(2)}</p>
        </div>
      </div>

      <button className="w-full bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
        ✓ Guardar Trip
      </button>
      <BottomNav />
    </div>
  );
}
