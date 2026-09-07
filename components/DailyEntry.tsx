"use client";

import { useState, useEffect } from 'react';
import { Home, MapPin, Coffee, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BottomNav from './BottomNav';

interface LocationPoint {
  name: string;
  city: string;
  time: string;
  lat?: number;
  lng?: number;
}

const PLATFORMS = ['Uber', 'Lyft', 'Via', 'Gotham', 'Particular'];

export default function DailyEntry() {
  const [platform, setPlatform] = useState('Uber');
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [gross, setGross] = useState('');
  const [tips, setTips] = useState('');
  const [tolls, setTolls] = useState('');
  const [fee, setFee] = useState('');
  const [ref, setRef] = useState('');
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null);
  const [isLocatingPickup, setIsLocatingPickup] = useState(false);
  const [isLocatingDropoff, setIsLocatingDropoff] = useState(false);
  const [onBreak, setOnBreak] = useState(false);

  // Fecha y hora dinámica
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentAddress, setCurrentAddress] = useState('Buscando señal GPS...');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            );
            const data = await res.json();
            const road = data.address?.road || data.address?.neighbourhood || "Ubicación detectada";
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
            setCurrentAddress(`${road}${city ? `, ${city}` : ''}`);
          } catch {
            setCurrentAddress("GPS activo · Coordenadas OK");
          }
        },
        () => setCurrentAddress("West Granada Ave, Lindenhurst"),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => clearInterval(timer);
  }, []);

  const captureLocation = (type: 'pickup' | 'dropoff') => {
    const setLoading = type === 'pickup' ? setIsLocatingPickup : setIsLocatingDropoff;
    const setLoc = type === 'pickup' ? setPickup : setDropoff;
    setLoading(true);

    const nowStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            const road = data.address?.road || data.address?.neighbourhood || (type === 'pickup' ? 'Punto Recogida' : 'Punto Destino');
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Local';
            setLoc({ name: road, city, time: nowStr, lat, lng });
          } catch {
            setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: 'Local', time: nowStr, lat, lng });
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoc({
            name: type === 'pickup' ? 'Residencia' : 'Business',
            city: type === 'pickup' ? 'Lindenhurst' : 'Copiague',
            time: nowStr,
          });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoc({
        name: type === 'pickup' ? 'Residencia' : 'Business',
        city: type === 'pickup' ? 'Lindenhurst' : 'Copiague',
        time: nowStr,
      });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gross && !tips) {
      setFeedback({ text: 'Por favor ingresa al menos Gross fare o Propinas', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setSaving(true);
    setFeedback(null);

    const grossNum = parseFloat(gross) || 0;
    const tipsNum = parseFloat(tips) || 0;
    const tollsNum = parseFloat(tolls) || 0;
    const feeNum = parseFloat(fee) || 0;
    const grossTotal = grossNum + tipsNum + tollsNum;
    const netPayout = grossTotal - feeNum;

    try {
      const { error } = await supabase.from('trips').insert({
        platform_id: platform.toLowerCase(),
        earnings: grossNum,
        tips: tipsNum,
        tolls: tollsNum,
        platform_fee: feeNum,
        gross: grossTotal,
        net: netPayout,
        net_payout: netPayout,
        pickup_time: pickup ? new Date().toISOString() : null,
        dropoff_time: dropoff ? new Date().toISOString() : null,
        pickup_gps: pickup ? { name: pickup.name, city: pickup.city, lat: pickup.lat, lng: pickup.lng } : null,
        dropoff_gps: dropoff ? { name: dropoff.name, city: dropoff.city, lat: dropoff.lat, lng: dropoff.lng } : null,
        trip_notes: ref ? `Ref: ${ref}` : '',
        status: 'pending'
      });

      if (error) throw error;

      setFeedback({ text: '✓ Trip guardado exitosamente en Supabase', type: 'success' });
      setGross('');
      setTips('');
      setTolls('');
      setFee('');
      setRef('');
      setPickup(null);
      setDropoff(null);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al guardar';
      setFeedback({ text: `Error al guardar: ${msg}`, type: 'error' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const grossVal = parseFloat(gross) || 0;
  const tipsVal = parseFloat(tips) || 0;
  const tollsVal = parseFloat(tolls) || 0;
  const feeVal = parseFloat(fee) || 0;
  const grossIncome = grossVal + tipsVal + tollsVal;
  const netPayout = grossIncome - feeVal;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl font-bold z-50 shadow-lg text-sm flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
          }`}
        >
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {feedback.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">{greeting}, Miguel.</h1>
        <p className="text-yellow-500 text-sm">{formattedDate} · {formattedTime}</p>
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <MapPin size={14} className="text-green-400 shrink-0" />
          <span className="text-sm truncate">{currentAddress}</span>
        </div>
      </div>

      {/* Platform & Break */}
      <div className="relative flex gap-2 mb-4">
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setShowPlatforms(!showPlatforms)}
            className="w-full bg-[#1E293B] rounded-xl border border-gray-700 p-3 flex items-center justify-between hover:border-gray-500 transition-colors"
          >
            <span className="font-semibold">{platform}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showPlatforms ? 'rotate-180' : ''}`} />
          </button>

          {showPlatforms && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-[#1E293B] border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    setShowPlatforms(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#334155] transition-colors ${
                    platform === p ? 'text-green-400 font-bold bg-[#334155]/50' : 'text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOnBreak(!onBreak)}
          className={`px-4 rounded-xl flex items-center gap-2 border transition-colors ${
            onBreak
              ? 'bg-yellow-500 text-black border-yellow-500 font-bold'
              : 'bg-transparent border-yellow-500 text-yellow-500'
          }`}
        >
          <Coffee size={16} /> {onBreak ? 'En pausa' : 'Break'}
        </button>
      </div>

      {/* Gross Fare & Ref */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Gross fare</p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="bg-transparent w-full outline-none font-semibold text-lg"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
          />
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Ref / Invoice</p>
          <input
            type="text"
            placeholder="opcional"
            className="bg-transparent w-full outline-none placeholder-gray-500 text-sm pt-1"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </div>
      </div>

      {/* GPS Pickup / Dropoff buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => captureLocation('pickup')}
          disabled={isLocatingPickup}
          className="bg-green-400 hover:bg-green-300 active:scale-[0.98] transition-transform text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
        >
          {isLocatingPickup ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          Pickup now
        </button>
        <button
          type="button"
          onClick={() => captureLocation('dropoff')}
          disabled={isLocatingDropoff}
          className="bg-blue-400 hover:bg-blue-300 active:scale-[0.98] transition-transform text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
        >
          {isLocatingDropoff ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          Dropoff now
        </button>
      </div>

      {/* Location indicators */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-green-500/30 flex flex-col justify-between h-[64px] overflow-hidden">
          <div className="flex items-center gap-1 text-green-400 font-bold text-xs truncate">
            <Home size={14} className="shrink-0" /> {pickup ? pickup.name : 'Pendiente'}
          </div>
          <div className="text-xs text-gray-300 truncate">
            {pickup ? `${pickup.time} · ${pickup.city}` : 'Toca Pickup'}
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700 flex flex-col justify-between h-[64px] overflow-hidden">
          <div className="flex items-center gap-1 text-gray-400 font-bold text-xs truncate">
            <MapPin size={14} className="shrink-0" /> {dropoff ? dropoff.name : 'Pendiente'}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {dropoff ? `${dropoff.time} · ${dropoff.city}` : 'Toca dropoff'}
          </div>
        </div>
      </div>

      {/* Tips & Toll */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Tips</p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="bg-transparent w-full outline-none font-semibold"
            value={tips}
            onChange={(e) => setTips(e.target.value)}
          />
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Toll</p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="bg-transparent w-full outline-none font-semibold"
            value={tolls}
            onChange={(e) => setTolls(e.target.value)}
          />
        </div>
      </div>

      {/* Platform fee */}
      <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700 mb-6">
        <p className="text-xs text-gray-400 mb-1">Platform fee</p>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          className="bg-transparent w-full outline-none font-semibold"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
      </div>

      {/* Totals Banner */}
      <div className="flex justify-between items-end mb-6 bg-[#1E293B] p-4 rounded-xl border border-gray-700/50">
        <div>
          <p className="text-xs text-gray-400">Net payout</p>
          <p className="text-3xl font-bold text-green-400">${netPayout.toFixed(2)}</p>
        </div>
        <div className="bg-white text-black p-3 rounded-xl text-right">
          <p className="text-xs text-gray-600">Gross income</p>
          <p className="text-2xl font-bold">${grossIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-400 hover:bg-green-300 active:scale-[0.98] transition-all text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : '✓'}
        {saving ? 'Guardando...' : 'Guardar Trip'}
      </button>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

