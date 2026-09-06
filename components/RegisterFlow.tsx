"use client";

import { ArrowDown, Pencil, Check, FileText, Clock } from 'lucide-react';
import BottomNav from './BottomNav';
import { useSupabase } from '@/lib/supabase';
import { Trip } from '@/lib/types';
import { useState, useEffect } from 'react';

// Demo trip for showing the flow
export default function RegisterFlow() {
  const supabase = useSupabase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data, error } = await (supabase.from("trips") as any)
          .select()
          .order("pickup_time", { ascending: false })
          .limit(5);

        if (!error && data && data.length > 0) {
          setTrips(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const demoTrips: (Trip & { _demo?: boolean })[] = [
    {
      id: 'demo1',
      platform_id: 'uber',
      pickup_time: new Date().toISOString(),
      dropoff_time: new Date().toISOString(),
      pickup_gps: { lat: 40.7538, lng: -73.2954 },
      dropoff_gps: { lat: 40.7638, lng: -73.2854 },
      earnings: 30.00,
      extra_cash: 0,
      tips: 4.55,
      tolls: 0,
      platform_fee: 3.00,
      black_car_phones_fee: 2.75,
      gross: 34.55,
      net: 28.80,
      status: 'pending',
      trip_notes: '',
      created_at: new Date().toISOString(),
      _demo: true
    },
  ];

  const displayTrips = trips.length > 0 ? trips : demoTrips;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'Pendiente', border: 'border-yellow-500/40' };
      case 'in_ledger':
        return { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'En Ledger', border: 'border-blue-500/40' };
      case 'reconciled':
        return { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Reconciliada', border: 'border-green-500/40' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-500', label: status, border: 'border-gray-500/40' };
    }
  };

  const getPlatformName = (platform: string | undefined) => {
    if (!platform) return 'Trip';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  const formatTripTime = (trip: Trip) => {
    if (trip.pickup_time) {
      const date = new Date(trip.pickup_time);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 pb-24 font-sans">
      <h1 className="text-2xl font-bold mb-6">Flujo después de guardar</h1>

      <div className="bg-[#1E293B] rounded-2xl p-5 border border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-400 mb-4">Cómo funciona el flujo:</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock size={16} className="text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold">1. Pending</p>
              <p className="text-sm text-gray-400">Trip capturado, esperando statement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={16} className="text-green-500" />
            </div>
            <div>
              <p className="font-semibold">2. Reconciled</p>
              <p className="text-sm text-gray-400">Comparado con statement, confirmado</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">3. In Ledger</p>
              <p className="text-sm text-gray-400">Listo para reportes e impuestos</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Trips Recientes</h2>

      {displayTrips.map((trip, index) => {
        const status = getStatusStyle(trip.status);
        return (
          <div key={trip.id || index}>
            {/* Pending Card */}
            <div className={`bg-[#1E293B] rounded-2xl p-5 border ${status.border} mb-4`}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">
                  {getPlatformName(trip.platform_id)} · #{String(trip.id).slice(-2) || '01'}
                </h2>
                <span className={`${status.bg} ${status.text} text-xs px-3 py-1 rounded-full font-bold`}>
                  {status.label}
                </span>
              </div>
              <p className="text-gray-400 mt-2">
                {formatTripTime(trip)} · GPS data captured
              </p>
              <p className="text-green-400 font-bold mt-2">
                ${trip.net?.toFixed(2) || '0.00'} <span className="text-green-500/60 font-normal">net (capturado)</span>
              </p>
              <button className="mt-4 text-xs text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
                <Pencil size={12} /> Editar
              </button>
            </div>

            {trip.status !== 'pending' && (
              <>
                <div className="flex flex-col items-center mb-4">
                  <ArrowDown className="text-gray-500" />
                  <p className="text-xs text-gray-500 mt-2">Llega el statement · se compara el monto</p>
                </div>

                {/* Reconciled Card */}
                <div className="bg-[#1E293B] rounded-2xl p-5 border border-green-500/40 mb-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold">
                      {getPlatformName(trip.platform_id)} · #{String(trip.id).slice(-2) || '01'}
                    </h2>
                    <span className="bg-green-500/20 text-green-500 text-xs px-3 py-1 rounded-full font-bold">Reconciliada</span>
                  </div>
                  <p className="text-gray-400 mt-2">
                    {formatTripTime(trip)} · GPS data verified
                  </p>
                  <p className="text-green-400 font-bold mt-2">
                    ${trip.net?.toFixed(2) || '0.00'} <span className="text-green-500/60 font-normal">net (confirmado)</span>
                  </p>
                </div>
              </>
            )}

            {trip.status === 'in_ledger' && (
              <>
                <div className="flex flex-col items-center mb-4">
                  <ArrowDown className="text-gray-500" />
                  <p className="text-xs text-gray-500 mt-2">Pasa automaticamente al Ledger</p>
                </div>

                {/* In Ledger Card */}
                <div className="bg-[#1E293B] rounded-2xl p-5 border border-blue-500/40 mb-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold">
                      Ledger · {getPlatformName(trip.platform_id)} #{String(trip.id).slice(-2) || '01'}
                    </h2>
                    <span className="bg-blue-500/20 text-blue-500 text-xs px-3 py-1 rounded-full font-bold">En Ledger</span>
                  </div>
                  <p className="text-gray-400 mt-2">
                    Toda la data GPS + financiera preservada
                  </p>
                  <p className="text-blue-400 font-bold mt-2">
                    Listo para reportes / impuestos
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })}

      <BottomNav />
    </div>
  );
}
