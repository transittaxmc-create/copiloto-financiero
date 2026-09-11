"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Coffee, ChevronDown, Check, Loader2, AlertCircle, DollarSign, Navigation, ArrowRight, Cloud, CloudOff, LogIn, LogOut, Route } from 'lucide-react';
import { distance as haversineMiles } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import BottomNav from './BottomNav';
import { PLATFORMS, logoFor } from '@/lib/logos';
import { addLocalTrip, getLocalTrips } from '@/lib/localStore';
import { syncTripsWithSupabase } from '@/lib/syncManager';
import { getCategoryIcon } from '@/lib/category-icons';
import dynamic from 'next/dynamic';

const PinAdjustModal = dynamic(() => import('./PinAdjustModal'), { ssr: false });

// ── Persistencia de turno y borrador (sobrevive a la navegación entre páginas) ──
const DRAFT_KEY = 'copiloto_entry_draft';
const SHIFT_KEY = 'copiloto_shift';

interface ShiftState {
  clockedIn: boolean;
  clockInAt: string | null;
  onBreak: boolean;
  miles: number;
}

interface DraftState {
  platform: string;
  gross: string;
  tips: string;
  tolls: string;
  fee: string;
  ref: string;
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  gpsWarning: boolean;
}

interface LocationPoint {
  name: string;
  city: string;
  time: string;
  lat?: number;
  lng?: number;
  type?: 'business' | 'residence' | 'unknown';
  category?: string;
  fullAddress?: string;
  capturedAt?: string; // ISO timestamp exacto al presionar el botón GPS
  accuracy?: number;   // precisión GPS en metros (pos.coords.accuracy)
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
  const [gpsWarning, setGpsWarning] = useState(false);
  const [pinModal, setPinModal] = useState<{ target: 'pickup' | 'dropoff' } | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInAt, setClockInAt] = useState<string | null>(null);
  const [miles, setMiles] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

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

  // ── Restaurar turno + borrador al montar (nada se pierde al navegar) ──
  useEffect(() => {
    try {
      const sRaw = localStorage.getItem(SHIFT_KEY);
      if (sRaw) {
        const sh = JSON.parse(sRaw) as ShiftState;
        setIsClockedIn(!!sh.clockedIn);
        setClockInAt(sh.clockInAt ?? null);
        setOnBreak(!!sh.onBreak);
        setMiles(sh.miles ?? 0);
      }
      const dRaw = localStorage.getItem(DRAFT_KEY);
      if (dRaw) {
        const d = JSON.parse(dRaw) as Partial<DraftState>;
        if (d.platform) setPlatform(d.platform);
        setGross(d.gross ?? '');
        setTips(d.tips ?? '');
        setTolls(d.tolls ?? '');
        setFee(d.fee ?? '');
        setRef(d.ref ?? '');
        if (d.pickup) setPickup(d.pickup as LocationPoint);
        if (d.dropoff) setDropoff(d.dropoff as LocationPoint);
        setGpsWarning(!!d.gpsWarning);
        console.log('[DailyEntry] Borrador restaurado: pickup/dropoff y montos intactos tras navegar');
      }
    } catch (e) {
      console.error('[DailyEntry] Error restaurando turno/borrador:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autoguardado del borrador en cada cambio (sobrevive a la navegación) ──
  useEffect(() => {
    try {
      const hasContent = !!(gross || tips || tolls || fee || ref || pickup || dropoff || platform !== 'Uber');
      if (!hasContent) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      const draft: DraftState = { platform, gross, tips, tolls, fee, ref, pickup, dropoff, gpsWarning };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [platform, gross, tips, tolls, fee, ref, pickup, dropoff, gpsWarning]);

  // ── Persistencia del turno (Clock In/Out + Break + millas sobreviven a la navegación) ──
  useEffect(() => {
    try {
      const sh: ShiftState = { clockedIn: isClockedIn, clockInAt, onBreak, miles };
      localStorage.setItem(SHIFT_KEY, JSON.stringify(sh));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [isClockedIn, clockInAt, onBreak, miles]);

  // ── Contador de millas: activo solo entre Clock In y Clock Out (pausa en Break) ──
  useEffect(() => {
    if (!isClockedIn || onBreak || typeof navigator === 'undefined' || !navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        lastPosRef.current = null;
      }
      return;
    }
    lastPosRef.current = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = lastPosRef.current;
        lastPosRef.current = cur;
        // Ignora el primer punto y saltos GPS absurdos (>2 millas entre lecturas = ruido)
        if (!prev) return;
        const d = haversineMiles(prev, cur);
        if (d > 0.01 && d < 2) setMiles((m) => m + d);
      },
      () => {
        /* GPS no disponible durante el turno: el contador simplemente se detiene */
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastPosRef.current = null;
    };
  }, [isClockedIn, onBreak]);

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
          const accuracy = pos.coords.accuracy; // metros
          if (typeof accuracy === 'number' && accuracy > 50) {
            setGpsWarning(true);
          } else {
            setGpsWarning(false);
          }
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
            const categories = `${data.category || ''} ${data.type || ''}`;
            const isBusiness = categories.includes('shop') || categories.includes('amenity') || categories.includes('tourism') || categories.includes('office') || (data.name && data.name !== road);
            const locType = isBusiness ? 'business' : 'residence';
            // Nombre REAL del negocio (Nominatim lo trae en data.name); para residencia usamos la calle
            const displayName = isBusiness && data.name ? data.name : road;
            setLoc({ name: displayName, city, time: nowStr, lat, lng, type: locType, category: data.category || data.type || '', fullAddress, capturedAt, accuracy });
          } catch {
            setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: 'Local', time: nowStr, lat, lng, type: 'unknown', capturedAt, accuracy });
          } finally {
            setLoading(false);
          }
        },
        () => {
          // GPS denegado/fallido: dato HONESTO, no "Residencia" falsa
          setGpsWarning(true);
          setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: '', time: nowStr, type: 'unknown', capturedAt });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsWarning(true);
      setLoc({ name: type === 'pickup' ? 'Recogida GPS' : 'Destino GPS', city: '', time: nowStr, type: 'unknown', capturedAt });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gross && !tips) {
      setFeedback({ text: 'Por favor ingresa al menos Gross fare o Propinas', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (gpsWarning) {
      setFeedback({ text: '⚠️ Ubicación no confirmada: reintenta GPS o confirma manualmente', type: 'error' });
      setTimeout(() => setFeedback(null), 4000);
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

      // 4. Limpiar formulario (y advertencia GPS obsoleta del viaje anterior)
      setGross('');
      setTips('');
      setTolls('');
      setFee('');
      setRef('');
      setPickup(null);
      setDropoff(null);
      setGpsWarning(false);
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

  // ── Turno: Clock In / Clock Out (arranca y detiene el contador de millas) ──
  const handleClockIn = () => {
    if (isClockedIn) return;
    setIsClockedIn(true);
    setClockInAt(new Date().toISOString());
    setOnBreak(false);
    setMiles(0); // turno nuevo = contador de millas desde cero
  };

  const handleClockOut = () => {
    if (miles > 0) {
      console.log(`[DailyEntry] Turno cerrado: ${miles.toFixed(1)} millas desde ${clockInAt}`);
    }
    setIsClockedIn(false);
    setClockInAt(null);
    setOnBreak(false);
    setMiles(0);
    // Fin de turno: limpiar borrador y formulario (turno nuevo = pizarra limpia)
    setGross('');
    setTips('');
    setTolls('');
    setFee('');
    setRef('');
    setPickup(null);
    setDropoff(null);
    setGpsWarning(false);
    setPinModal(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  };

  // Confirmar pin ajustado manualmente en el mapa: cierra la advertencia de precisión
  const handlePinConfirm = (loc: LocationPoint) => {
    if (pinModal?.target === 'pickup') {
      setPickup((prev) => ({ ...prev!, ...loc }));
    } else if (pinModal?.target === 'dropoff') {
      setDropoff((prev) => ({ ...prev!, ...loc }));
    }
    setGpsWarning(false);
    setPinModal(null);
  };

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  // Fecha corta para las casillas GPS (ej. "Sep 8") a partir de la hora exacta de captura
  const boxDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null);

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

      {/* Fila compacta: Plataforma | Clock In | Clock Out | Break */}
      <div className="flex gap-1.5 items-stretch">
        <div className="flex-1 min-w-0 relative">
          <button
            type="button"
            onClick={() => setShowPlatforms(!showPlatforms)}
            className="w-full bg-[#1E293B] rounded-xl border border-slate-700/80 px-2 py-2 flex items-center justify-between hover:border-slate-500 transition-colors shadow-sm min-w-0"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoFor(platform)} alt={platform} className="w-5 h-5 rounded-full object-contain shrink-0" />
              <span className="font-semibold text-xs text-slate-100 truncate">{platform}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${showPlatforms ? 'rotate-180' : ''}`} />
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

        {/* Clock In: inicia turno (verde neón cuando activo) */}
        <button
          type="button"
          onClick={handleClockIn}
          disabled={isClockedIn}
          className={`px-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-[10px] font-bold transition-all shadow-sm shrink-0 ${
            isClockedIn
              ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-emerald-500/25'
              : 'bg-slate-800/60 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <LogIn size={14} />
          <span>{isClockedIn ? 'Activo' : 'In'}</span>
        </button>

        {/* Clock Out: cierra turno y limpia el formulario */}
        <button
          type="button"
          onClick={handleClockOut}
          disabled={!isClockedIn}
          className={`px-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-[10px] font-bold transition-all shadow-sm shrink-0 ${
            isClockedIn
              ? 'bg-slate-800/60 border-red-500/50 text-red-400 hover:bg-red-500/10'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-600 cursor-not-allowed'
          }`}
        >
          <LogOut size={14} />
          <span>Out</span>
        </button>

        {/* Break: pausa dentro del turno */}
        <button
          type="button"
          onClick={() => setOnBreak(!onBreak)}
          disabled={!isClockedIn}
          className={`px-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-[10px] font-bold transition-all shadow-sm shrink-0 ${
            onBreak
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20'
              : isClockedIn
                ? 'bg-slate-800/60 border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Coffee size={14} />
          <span>{onBreak ? 'Pausa' : 'Break'}</span>
        </button>
      </div>

      {/* Aviso sutil de turno activo con hora de inicio + millas del turno */}
      {isClockedIn && clockInAt && (
        <div className="flex items-center justify-between text-[11px] font-medium px-1">
          <span className="flex items-center gap-1.5 text-emerald-400/90">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Turno activo desde las {new Date(clockInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {onBreak && <span className="text-amber-400 ml-1">· En pausa</span>}
          </span>
          <span className="flex items-center gap-1 text-slate-300 font-semibold">
            <Route size={12} className="text-emerald-400" />
            {miles.toFixed(1)} mi
          </span>
        </div>
      )}

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
          className="bg-gradient-to-r from-[#10B981] to-[#0D9668] hover:from-[#34D399] hover:to-[#10B981] text-slate-950 font-bold py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-[#10B981]/25 active:scale-[0.98] transition-all"
        >
          {isLocatingPickup ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} className="fill-current" />}
          <span className="text-xs uppercase tracking-wide">Pickup now</span>
        </button>

        <button
          type="button"
          onClick={() => captureLocation('dropoff')}
          disabled={isLocatingDropoff}
          className="bg-gradient-to-r from-[#06B6D4] to-[#0891B2] hover:from-[#22D3EE] hover:to-[#06B6D4] text-slate-950 font-bold py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-[#06B6D4]/25 active:scale-[0.98] transition-all"
        >
          {isLocatingDropoff ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} className="fill-current" />}
          <span className="text-xs uppercase tracking-wide">Dropoff now</span>
        </button>
      </div>

      {/* Tarjetas Indicadoras de Ubicación */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`bg-[#1E293B] rounded-2xl p-3 border transition-colors flex flex-col justify-between h-[68px] overflow-hidden shrink-0 shadow-sm ${
          pickup ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'border-slate-700/80'
        }`}>
          <div className="flex items-center gap-1 text-[#10B981] font-bold text-xs truncate">
            <span className="shrink-0 text-[10px] leading-none">{pickup ? getCategoryIcon(pickup?.category, pickup?.name) : '📍'}</span>
            <span className="truncate">
              {pickup ? (pickup.type === 'residence' ? 'Residencia' : pickup.name) : 'Pickup Pendiente'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {pickup ? [boxDate(pickup.capturedAt), pickup.time, pickup.city].filter(Boolean).join(' · ') : 'Toca el botón verde'}
          </div>
        </div>

        <div className={`bg-[#1E293B] rounded-2xl p-3 border transition-colors flex flex-col justify-between h-[68px] overflow-hidden shrink-0 shadow-sm ${
          dropoff ? 'border-[#06B6D4]/40 bg-[#06B6D4]/5' : 'border-slate-700/80'
        }`}>
          <div className="flex items-center gap-1 text-[#06B6D4] font-bold text-xs truncate">
            <span className="shrink-0 text-[10px] leading-none">{dropoff ? getCategoryIcon(dropoff?.category, dropoff?.name) : '📌'}</span>
            <span className="truncate">
              {dropoff ? (dropoff.type === 'residence' ? 'Residencia' : dropoff.name) : 'Destino Pendiente'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {dropoff ? [boxDate(dropoff.capturedAt), dropoff.time, dropoff.city].filter(Boolean).join(' · ') : 'Toca el botón azul'}
          </div>
        </div>
      </div>

      {/* Tarjeta de advertencia GPS: precisión > 50m o error de geolocalización */}
      {gpsWarning && (
        <div className="bg-amber-500/10 border border-amber-500/60 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
          <p className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>⚠️ Ubicación no confirmada — la precisión del GPS es insuficiente ({Math.round((pickup?.accuracy ?? dropoff?.accuracy ?? 0))}m)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setGpsWarning(false); captureLocation(pickup ? 'dropoff' : 'pickup'); }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wide"
            >
              Reintentar GPS
            </button>
            <button
              type="button"
              onClick={() => setPinModal({ target: pickup?.accuracy && pickup.accuracy > 50 ? 'pickup' : dropoff ? 'dropoff' : 'pickup' })}
              disabled={!pickup && !dropoff}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-slate-800/50 text-amber-400 font-bold text-[10px] uppercase tracking-wide"
            >
              Ajustar pin en mapa
            </button>
            <button
              type="button"
              onClick={() => setGpsWarning(false)}
              disabled={!pickup && !dropoff}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-slate-800/50 text-amber-400 font-bold text-[10px] uppercase tracking-wide"
            >
              Confirmar manualmente
            </button>
          </div>
        </div>
      )}

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

      {/* Modal: Ajustar pin en mapa (precisión GPS insuficiente) */}
      <PinAdjustModal
        open={pinModal !== null}
        initial={
          pinModal?.target === 'pickup' && pickup?.lat != null && pickup?.lng != null
            ? { lat: pickup.lat, lng: pickup.lng }
            : pinModal?.target === 'dropoff' && dropoff?.lat != null && dropoff?.lng != null
              ? { lat: dropoff.lat, lng: dropoff.lng }
              : null
        }
        title={pinModal?.target === 'dropoff' ? 'Ajustar destino (pin)' : 'Ajustar recogida (pin)'}
        onClose={() => setPinModal(null)}
        onConfirm={handlePinConfirm}
      />

      {/* Barra de Navegación PWA */}
      <BottomNav />
    </div>
  );
}
