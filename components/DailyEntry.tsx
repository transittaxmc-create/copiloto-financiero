"use client";

import { useState, useEffect } from 'react';
import { Home, MapPin, Coffee, ChevronDown, Save } from 'lucide-react';
import BottomNav from './BottomNav';
import { useSupabase } from '@/lib/supabase';

interface GPSLocation {
  name: string;
  city: string;
  time: string;
  lat?: number;
  lng?: number;
}

export default function DailyEntry() {
  const supabase = useSupabase();
  const [platform, setPlatform] = useState('uber');
  const [gross, setGross] = useState('');
  const [tips, setTips] = useState('');
  const [tolls, setTolls] = useState('');
  const [fee, setFee] = useState('');
  const [ref, setRef] = useState('');
  const [pickup, setPickup] = useState<GPSLocation | null>(null);
  const [dropoff, setDropoff] = useState<GPSLocation | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const platforms = [
    { id: 'uber', name: 'Uber' },
    { id: 'lyft', name: 'Lyft' },
    { id: 'via', name: 'Via' },
  ];

  const platformsOpen = platforms.map(p => p.id === platform);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const netPayout = (parseFloat(gross) || 0) + (parseFloat(tips) || 0) + (parseFloat(tolls) || 0) - (parseFloat(fee) || 0);
  const grossIncome = (parseFloat(gross) || 0) + (parseFloat(tips) || 0) + (parseFloat(tolls) || 0);

  const handlePickup = () => {
    setPickup({
      name: 'Current Location',
      city: 'Lindenhurst',
      time: formatTime(currentTime),
      lat: 40.7538,
      lng: -73.2954,
    });
  };

  const handleDropoff = () => {
    setDropoff({
      name: 'Destination',
      city: 'Copiague',
      time: formatTime(currentTime),
      lat: 40.7638,
      lng: -73.2854,
    });
  };

  const handleSaveTrip = async () => {
    setSaving(true);
    try {
      const tripData = {
        platform_id: platform,
        pickup_time: new Date().toISOString(),
        dropoff_time: dropoff ? new Date().toISOString() : null,
        pickup_gps: pickup ? { lat: pickup.lat, lng: pickup.lng } : null,
        dropoff_gps: dropoff ? { lat: dropoff.lat, lng: dropoff.lng } : null,
        earnings: parseFloat(gross) || 0,
        extra_cash: 0,
        tips: parseFloat(tips) || 0,
        tolls: parseFloat(tolls) || 0,
        platform_fee: parseFloat(fee) || 0,
        black_car_phones_fee: 2.75,
        gross: grossIncome,
        net: netPayout,
        status: dropoff ? 'pending' : 'pending',
        trip_notes: ref || '',
      };

      const { error } = await (supabase.from("trips") as any)
        .insert(tripData);

      if (!error) {
        // Reset form
        setGross('');
        setTips('');
        setTolls('');
        setFee('');
        setRef('');
        setPickup(null);
        setDropoff(null);
        alert('Trip guardado exitosamente!');
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      {/* Header */}
      <h1 className="text-xl font-bold">{getGreeting()}, Miguel.</h1>
      <p className="text-yellow-500 text-sm">{formatDate(currentTime)} · {formatTime(currentTime)}</p>
      <div className="flex items-center gap-2 text-gray-400 mt-1">
        <MapPin size={14} className="text-green-400" />
        <span className="text-sm truncate">West Granada Ave, Lindenhurst</span>
      </div>

      {/* Platform selector */}
      <div className="flex gap-2 mb-4 mt-4">
        <div className="flex-1 bg-[#1E293B] rounded-xl border border-gray-700 p-3 flex items-center justify-between">
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-transparent w-full outline-none text-white font-semibold cursor-pointer"
          >
            {platforms.map(p => (
              <option key={p.id} value={p.id} className="bg-[#1E293B]">{p.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        <button 
          onClick={() => setIsBreak(!isBreak)}
          className={`${isBreak ? 'bg-yellow-500 text-black' : 'bg-transparent border border-yellow-500 text-yellow-500'} px-4 rounded-xl flex items-center gap-2 transition-colors`}
        >
          <Coffee size={16} /> {isBreak ? 'Working' : 'Break'}
        </button>
      </div>

      {/* Gross & Ref */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Gross fare</p>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">$</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0.00" 
              className="bg-transparent w-full outline-none text-xl font-bold" 
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
            className="bg-transparent w-full outline-none placeholder-gray-500 text-sm" 
            value={ref} 
            onChange={(e) => setRef(e.target.value)} 
          />
        </div>
      </div>

      {/* Pickup/Dropoff buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button 
          onClick={handlePickup} 
          className="bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin size={18} /> Pickup now
        </button>
        <button 
          onClick={handleDropoff} 
          className="bg-blue-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin size={18} /> Dropoff now
        </button>
      </div>

      {/* Pickup/Dropoff status */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`bg-[#1E293B] rounded-xl p-3 border flex flex-col justify-between h-[60px] overflow-hidden ${pickup ? 'border-green-500/30' : 'border-gray-700'}`}>
          <div className="flex items-center gap-1 text-green-400 font-bold text-xs">
            <Home size={14} /> {pickup ? pickup.name : "Pendiente"}
          </div>
          <div className="text-xs text-gray-300 truncate">
            {pickup ? `${pickup.time} · ${pickup.city}` : "Toca Pickup"}
          </div>
        </div>
        <div className={`bg-[#1E293B] rounded-xl p-3 border flex flex-col justify-between h-[60px] overflow-hidden ${dropoff ? 'border-blue-500/30' : 'border-gray-700'}`}>
          <div className="flex items-center gap-1 text-blue-400 font-bold text-xs">
            <MapPin size={14} /> {dropoff ? dropoff.name : "Pendiente"}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {dropoff ? `${dropoff.time} · ${dropoff.city}` : "Toca dropoff"}
          </div>
        </div>
      </div>

      {/* Tips & Toll */}
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

      {/* Platform fee */}
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

      {/* Summary */}
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

      {/* Save button */}
      <button 
        onClick={handleSaveTrip}
        disabled={saving || !gross}
        className={`w-full bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${saving ? 'opacity-50' : 'active:scale-95'} transition-all`}
      >
        {saving ? (
          <span className="animate-spin">⟳</span>
        ) : (
          <Save size={20} />
        )}
        {saving ? 'Guardando...' : '✓ Guardar Trip'}
      </button>

      <BottomNav />
    </div>
  );
}
