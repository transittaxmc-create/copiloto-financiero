"use client";

import { useState, useEffect } from 'react';
import { Home, MapPin, Coffee, ChevronDown, Check, Loader2, AlertCircle, DollarSign, Navigation, ArrowRight, Store, Cloud, CloudOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BottomNav from './BottomNav';
import { PLATFORMS, logoFor } from '@/lib/logos';
import { addLocalTrip, getLocalTrips } from '@/lib/localStore';
import { syncTripsWithSupabase } from '@/lib/syncManager';

interface LocationPoint {
  name: string;
  city: string;
  time: string;
  lat?: number;
  lng?: number;
  type?: 'business' | 'residence' | 'unknown';
  fullAddress?: string;
  capturedAt?: string; // ISO timestamp exacto al presionar el botón GPS
}

// Plataformas compartidas (ver @/lib/logos): 14 opciones con logo redondo

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
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

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
    // Hora EXACTA en que se presiona el botón GPS (se usa como pickup_time/dropoff_time en la BD)
    const capturedAt = new Date().toISOString();

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
            const houseNumber = data.address?.house_number || '';
            const state = data.address?.state || '';
            const postcode = data.address?.postcode || '';
            const fullAddress = `${houseNumber} ${road}, ${city}, ${state} ${postcode}`.trim();
            const categories = data.category || data.type || '';
            const isBusiness = categories.includes('shop') || categories.includes('amenity') || categories.includes('tourism') || (data.name && data.name !== road);
            const locType = isBusiness ? 'business' : 'residence';
            setLoc({ name: road, city, time: nowStr, lat, lng, type: locType, fullAddress, capturedAt });
          } catch {
            setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: 'Local', time: nowStr, lat, lng, type: 'unknown', capturedAt });
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoc({
            name: type === 'pickup' ? 'Residencia' : 'Business',
            city: type === 'pickup' ? 'Lindenhurst' : 'Copiague',
            time: nowStr,
            capturedAt,
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
        capturedAt,
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

    const tripData = {
      platform_id: platform.toLowerCase(),
      earnings: grossNum,
      tips: tipsNum,
      tolls: tollsNum,
      platform_fee: feeNum,
      black_car_phones_fee: 2.75,
      gross: grossTotal,
      net: netPayout,
      net_payout: netPayout,
      // Hora capturada EXACTAMENTE al presionar el botón GPS (no al guardar)
      pickup_time: pickup?.capturedAt ?? null,
      dropoff_time: dropoff?.capturedAt ?? null,
      pickup_gps: pickup ? { name: pickup.name, city: pickup.city, lat: pickup.lat, lng: pickup.lng, type: pickup.type, address: pickup.fullAddress } : null,
      dropoff_gps: dropoff ? { name: dropoff.name, city: dropoff.city, lat: dropoff.lat, lng: dropoff.lng, type: dropoff.type, address: dropoff.fullAddress } : null,
      pickup_name: pickup?.name ?? null,
      dropoff_name: dropoff?.name ?? null,
      pickup_address: pickup?.fullAddress ?? (pickup ? `${pickup.name}, ${pickup.city}` : null),
      dropoff_address: dropoff?.fullAddress ?? (dropoff ? `${dropoff.name}, ${dropoff.city}` : null),
      trip_notes: ref ? `Ref: ${ref}` : '',
      status: 'pending'
    };

    console.log('[DailyEntry] Guardando viaje:', tripData);

    try {
      // 1. GUARDAR LOCALMENTE SIEMPRE (Offline-First)
      const localTrip = addLocalTrip(tripData);
      console.log('[DailyEntry] Trip guardado localmente:', localTrip.id);

      // 2. Intentar sync con Supabase en segundo plano
      const syncResult = await syncTripsWithSupabase();
      console.log('[DailyEntry] Resultado sync:', syncResult);

      // 3. Mostrar feedback apropiado
      if (syncResult.errors > 0) {
        setFeedback({ text: '⚠ Guardado localmente. Sin conexión al servidor.', type: 'warning' });
      } else {
        setFeedback({ text: '✓ Trip guardado exitosamente', type: 'success' });
      }

      // 4. Limpiar formulario
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
      console.error('[DailyEntry] Error en handleSave:', err);
      setFeedback({ text: `Error: ${msg}`, type: 'error' });
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
    <div className="w-full max-w-md mx-auto p-4 pb-24 font-sans space-y-4">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl font-bold z-50 shadow-2xl text-xs flex items-center gap-2 max-w-[90%] transition-all ${
            feedback.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' : 'bg-red-500 text-white shadow-red-500/30'
          }`}
        >
          {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header con Saludo y GPS */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">{greeting}, Miguel.</h1>
            <p className="text-amber-400 text-xs font-semibold mt-0.5">{formattedDate} · {formattedTime}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner">
            M
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3 py-2 text-xs shadow-sm">
          <MapPin size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate font-medium">{currentAddress}</span>
        </div>
      </div>

      {/* Selector de Plataforma & Modo Break */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setShowPlatforms(!showPlatforms)}
            className="w-full bg-[#1E293B] rounded-xl border border-slate-700/80 p-3 flex items-center justify-between hover:border-slate-500 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Plataforma:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoFor(platform)} alt={platform} className="w-6 h-6 rounded-full object-contain" />
              <span className="font-semibold text-sm text-slate-100">{platform}</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showPlatforms ? 'rotate-180' : ''}`} />
          </button>

          {showPlatforms && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden z-30 shadow-2xl">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    setShowPlatforms(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#334155] transition-colors flex items-center justify-between ${
                    platform === p ? 'text-emerald-400 font-bold bg-[#334155]/60' : 'text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoFor(p)} alt={p} className="w-6 h-6 rounded-full object-contain" />
                    <span>{p}</span>
                  </span>
                  {platform === p && <Check size={14} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOnBreak(!onBreak)}
          className={`px-3.5 rounded-xl flex items-center gap-1.5 border text-xs font-semibold transition-all shadow-sm ${
            onBreak
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-amber-500/20'
              : 'bg-slate-800/60 border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <Coffee size={15} />
          <span>{onBreak ? 'En pausa' : 'Break'}</span>
        </button>
      </div>

      {/* Entradas Financieras: Gross Fare & Ref */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700/80 focus-within:border-emerald-500/60 transition-colors shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Gross fare</p>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold text-base">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="bg-transparent w-full outline-none font-bold text-lg text-slate-100 placeholder-slate-600"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700/80 focus-within:border-emerald-500/60 transition-colors shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Ref / Invoice</p>
          <input
            type="text"
            placeholder="opcional"
            className="bg-transparent w-full outline-none placeholder-slate-600 text-sm font-medium text-slate-100 pt-1.5"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </div>
      </div>

      {/* Botones GPS de Gran Visibilidad (Pickup / Dropoff) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => captureLocation('pickup')}
          disabled={isLocatingPickup}
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-bold py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          {isLocatingPickup ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} className="fill-current" />}
          <span className="text-xs uppercase tracking-wide">Pickup now</span>
        </button>

        <button
          type="button"
          onClick={() => captureLocation('dropoff')}
          disabled={isLocatingDropoff}
          className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-bold py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
        >
          {isLocatingDropoff ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} className="fill-current" />}
          <span className="text-xs uppercase tracking-wide">Dropoff now</span>
        </button>
      </div>

      {/* Tarjetas Indicadoras de Ubicación */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`bg-[#1E293B] rounded-2xl p-3 border transition-colors flex flex-col justify-between h-[60px] shadow-sm ${
          pickup ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700/80'
        }`}>
          <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs truncate">
            {pickup?.type === 'business' ? (
              <Store size={13} className="shrink-0" />
            ) : (
              <Home size={13} className="shrink-0" />
            )}
            <span className="truncate">
              {pickup ? (pickup.type === 'business' ? pickup.name : 'Residencia') : 'Pickup Pendiente'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {pickup ? `${pickup.time} · ${pickup.city}` : 'Toca el botón verde'}
          </div>
        </div>

        <div className={`bg-[#1E293B] rounded-2xl p-3 border transition-colors flex flex-col justify-between h-[60px] shadow-sm ${
          dropoff ? 'border-sky-500/40 bg-sky-500/5' : 'border-slate-700/80'
        }`}>
          <div className="flex items-center gap-1 text-sky-400 font-bold text-xs truncate">
            {dropoff?.type === 'business' ? (
              <Store size={13} className="shrink-0" />
            ) : (
              <MapPin size={13} className="shrink-0" />
            )}
            <span className="truncate">
              {dropoff ? (dropoff.type === 'business' ? dropoff.name : 'Residencia') : 'Destino Pendiente'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {dropoff ? `${dropoff.time} · ${dropoff.city}` : 'Toca el botón azul'}
          </div>
        </div>
      </div>

      {/* Tips & Toll */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700/80 focus-within:border-emerald-500/60 transition-colors shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Tips</p>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold text-sm">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="bg-transparent w-full outline-none font-semibold text-slate-100 placeholder-slate-600 text-base"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700/80 focus-within:border-emerald-500/60 transition-colors shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Toll (Peajes)</p>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold text-sm">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="bg-transparent w-full outline-none font-semibold text-slate-100 placeholder-slate-600 text-base"
              value={tolls}
              onChange={(e) => setTolls(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Platform fee */}
      <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700/80 focus-within:border-emerald-500/60 transition-colors shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Platform fee (Comisión App)</p>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-bold text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="bg-transparent w-full outline-none font-semibold text-slate-100 placeholder-slate-600 text-base"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </div>
      </div>

      {/* Banner de Totales en Tiempo Real */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 p-4 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Net payout</p>
          <p className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-0.5">${netPayout.toFixed(2)}</p>
        </div>
        <div className="bg-white/95 text-slate-900 px-4 py-2.5 rounded-xl text-right shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Gross income</p>
          <p className="text-xl font-black text-slate-950 tracking-tight">${grossIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* Botón Principal: Guardar Trip */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} className="stroke-[3]" />}
        <span>{saving ? 'Guardando en Supabase...' : 'Guardar Trip'}</span>
      </button>

      {/* Barra de Navegación PWA */}
      <BottomNav />
    </div>
  );
}
