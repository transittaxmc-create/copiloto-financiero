"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Trash2, 
  Pencil, 
  MapPin, 
  DollarSign, 
  Car, 
  ArrowRight, 
  RefreshCw, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  TrendingUp,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BottomNav from './BottomNav';
import { logoFor } from '@/lib/logos';
import Link from 'next/link';
import { getLocalTrips, deleteLocalTrip, updateLocalTrip, mergeRemoteTrips, LocalTrip } from '@/lib/localStore';
import { syncTripsWithSupabase } from '@/lib/syncManager';

interface LocationInfo {
  name?: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface TripItem {
  id: string;
  platform_id: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  pickup_gps: LocationInfo | null;
  dropoff_gps: LocationInfo | null;
  earnings: number;
  tips: number;
  tolls: number;
  platform_fee: number;
  black_car_phones_fee: number;
  gross: number;
  net: number;
  net_payout: number;
  status: 'pending' | 'reconciled' | 'in_ledger' | string;
  trip_notes: string;
  sync_status?: 'local' | 'synced' | 'error';
  created_at: string;
}

export default function RegisterFlow() {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reconciled' | 'in_ledger'>('all');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal de edición
  const [editingTrip, setEditingTrip] = useState<TripItem | null>(null);
  const [editGross, setEditGross] = useState('');
  const [editTips, setEditTips] = useState('');
  const [editTolls, setEditTolls] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editBlackCarFee, setEditBlackCarFee] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    console.log(`Toast [${type}]:`, text);
    setToast({ text, type });
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 3000);
  };

  const fetchTrips = useCallback(async () => {
    try {
      // 1. Cargar datos locales inmediatamente (Offline-First)
      const localTrips = getLocalTrips();
      setTrips((localTrips as TripItem[]) || []);
      console.log('[RegisterFlow] Trips cargados localmente:', localTrips.length);

      // 2. Intentar sincronizar con Supabase en segundo plano
      const syncResult = await syncTripsWithSupabase();
      console.log('[RegisterFlow] Sync result:', syncResult);

      // 3. Traer los viajes del servidor (select *) y fusionar los que falten localmente
      const { data: remoteTrips, error: remoteError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      if (remoteError) {
        console.warn('[RegisterFlow] Error trayendo viajes de Supabase (usando locales):', remoteError.message);
      } else if (remoteTrips && remoteTrips.length > 0) {
        const imported = mergeRemoteTrips(remoteTrips);
        if (imported > 0) {
          console.log(`[RegisterFlow] ${imported} viajes importados desde Supabase`);
        }
      }

      // 4. Recargar datos locales después del sync/merge (pueden tener nuevos IDs)
      const updatedTrips = getLocalTrips();
      setTrips((updatedTrips as TripItem[]) || []);

      // 5. Mostrar aviso si hay trips pendientes de sync
      const pendingCount = updatedTrips.filter(t => t.sync_status === 'local' || t.sync_status === 'error').length;
      if (pendingCount > 0) {
        console.log(`[RegisterFlow] ${pendingCount} trips pendientes de sincronización`);
      }
    } catch (err: unknown) {
      // No mostrar error rojo - los datos locales ya están cargados
      console.warn('[RegisterFlow] Error en sync (usando datos locales):', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const handleUpdateStatus = async (id: string, newStatus: 'reconciled' | 'in_ledger' | 'pending') => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setTrips(prev =>
        prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
      );

      const statusLabels = {
        reconciled: 'Viaje marcado como Reconciliado',
        in_ledger: 'Viaje movido al Ledger',
        pending: 'Viaje devuelto a Pendiente'
      };
      showToast(statusLabels[newStatus] || 'Estado actualizado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      showToast(msg, 'error');
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este viaje?')) return;

    try {
      // 1. Eliminar localmente primero
      deleteLocalTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));

      // 2. Intentar eliminar de Supabase (si no es ID local)
      if (!id.startsWith('local_')) {
        await supabase.from('trips').delete().eq('id', id);
      }

      showToast('Viaje eliminado');
    } catch (err: unknown) {
      // El viaje ya fue eliminado localmente, no mostrar error
      console.warn('[RegisterFlow] Error al eliminar de Supabase:', err);
      showToast('Viaje eliminado localmente');
    }
  };

  const openEditModal = (trip: TripItem) => {
    setEditingTrip(trip);
    setEditGross(trip.earnings ? trip.earnings.toString() : '');
    setEditTips(trip.tips ? trip.tips.toString() : '');
    setEditTolls(trip.tolls ? trip.tolls.toString() : '');
    setEditFee(trip.platform_fee ? trip.platform_fee.toString() : '');
    setEditBlackCarFee(trip.black_car_phones_fee ? trip.black_car_phones_fee.toString() : '');
    setEditNotes(trip.trip_notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTrip) return;
    if (!window.confirm('¿Confirmas los cambios en este viaje?')) return;
    setSavingEdit(true);

    const grossNum = parseFloat(editGross) || 0;
    const tipsNum = parseFloat(editTips) || 0;
    const tollsNum = parseFloat(editTolls) || 0;
    const feeNum = parseFloat(editFee) || 0;
    const blackCarFeeNum = parseFloat(editBlackCarFee) || 0;
    const grossTotal = grossNum + tipsNum + tollsNum;
    const netPayout = grossTotal - feeNum - blackCarFeeNum;

    const updates = {
      earnings: grossNum,
      tips: tipsNum,
      tolls: tollsNum,
      platform_fee: feeNum,
      black_car_phones_fee: blackCarFeeNum,
      gross: grossTotal,
      net: netPayout,
      net_payout: netPayout,
      trip_notes: editNotes,
    };

    console.log('[RegisterFlow] Editando viaje:', editingTrip.id, updates);

    try {
      // 1. Actualizar localmente primero
      const updatedTrip = updateLocalTrip(editingTrip.id, updates);
      if (updatedTrip) {
        setTrips(prev =>
          prev.map(t => t.id === editingTrip.id ? { ...t, ...updates } : t)
        );
      }

      // 2. Intentar actualizar en Supabase (si no es ID local)
      if (!editingTrip.id.startsWith('local_')) {
        const { error } = await supabase
          .from('trips')
          .update(updates)
          .eq('id', editingTrip.id);

        if (error) {
          console.warn('[RegisterFlow] Error al actualizar en Supabase:', error);
          // No bloquear la UI, el cambio ya está guardado localmente
        }
      }

      setEditingTrip(null);
      showToast('✓ Viaje actualizado');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      console.error('[RegisterFlow] Error en handleSaveEdit:', err);
      showToast(`Guardado localmente. Error en servidor: ${msg}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredTrips = trips.filter(t => {
    if (filter === 'all') return true;
    const normStatus = (t.status || 'pending').toLowerCase();
    if (filter === 'pending') return normStatus === 'pending';
    if (filter === 'reconciled') return normStatus === 'reconciled';
    if (filter === 'in_ledger') return normStatus === 'in_ledger' || normStatus === 'en_ledger';
    return true;
  });

  // Agrupación por plataforma (con logo en el header del grupo)
  const groups = new Map<string, TripItem[]>();
  filteredTrips.forEach((t) => {
    const key = (t.platform_id || 'viaje').toLowerCase().trim() || 'viaje';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  });

  const totalGross = trips.reduce((sum, t) => sum + (Number(t.gross) || 0), 0);
  const totalNet = trips.reduce((sum, t) => sum + (Number(t.net_payout || t.net) || 0), 0);
  const pendingCount = trips.filter(t => (t.status || 'pending').toLowerCase() === 'pending').length;
  const reconciledCount = trips.filter(t => (t.status || '').toLowerCase() === 'reconciled').length;
  const ledgerCount = trips.filter(t => ['in_ledger', 'en_ledger'].includes((t.status || '').toLowerCase())).length;

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

      {/* Sync Status Banner */}
      {trips.some(t => t.sync_status === 'local' || t.sync_status === 'error') && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
          {navigator.onLine ? (
            <Cloud size={14} className="text-yellow-400" />
          ) : (
            <WifiOff size={14} className="text-yellow-400" />
          )}
          <span className="text-xs text-yellow-400">
            {trips.filter(t => t.sync_status === 'local' || t.sync_status === 'error').length} viaje(s) pendientes de sincronizar
          </span>
          <button
            onClick={fetchTrips}
            className="ml-auto text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Registro de Viajes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Flujo: Captura → Reconciliación → Ledger</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-[#1E293B] border border-gray-700 rounded-xl hover:border-gray-500 transition-colors active:scale-95"
          title="Recargar viajes"
        >
          <RefreshCw size={18} className={`text-gray-300 ${refreshing ? 'animate-spin text-green-400' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-2xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <DollarSign size={14} className="text-green-400" /> Total Neto ({trips.length} viajes)
          </p>
          <p className="text-2xl font-bold text-green-400">${totalNet.toFixed(2)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Gross: ${totalGross.toFixed(2)}</p>
        </div>

        <div className="bg-[#1E293B] rounded-2xl p-4 border border-gray-700 flex flex-col justify-between">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <TrendingUp size={14} className="text-blue-400" /> Estados
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-yellow-500 font-medium">Pendientes:</span>
              <span className="font-bold">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400 font-medium">Reconciliados:</span>
              <span className="font-bold">{reconciledCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400 font-medium">En Ledger:</span>
              <span className="font-bold">{ledgerCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-green-400 text-black font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          Todos ({trips.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-black font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('reconciled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'reconciled'
              ? 'bg-green-500 text-black font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          Reconciliados ({reconciledCount})
        </button>
        <button
          onClick={() => setFilter('in_ledger')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'in_ledger'
              ? 'bg-blue-500 text-white font-bold'
              : 'bg-[#1E293B] text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          En Ledger ({ledgerCount})
        </button>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <RefreshCw size={28} className="animate-spin text-green-400 mb-3" />
          <p className="text-sm">Cargando viajes desde Supabase...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-gray-700 text-center my-6">
          <Car size={36} className="text-gray-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">No hay viajes en esta sección</h3>
          <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
            {filter === 'all'
              ? 'Aún no has registrado ningún viaje. Puedes guardar tu primer trip desde la pantalla de Inicio.'
              : `No tienes viajes con estado "${filter}".`}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-green-300 transition-colors"
          >
            <Plus size={16} /> Capturar nuevo viaje
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {[...groups.entries()].map(([groupKey, groupTrips]) => {
            const groupLabel = groupTrips[0]?.platform_id || 'Viaje';
            const groupCount = groupTrips.length;
            return (
              <div key={groupKey} className="space-y-2.5">
                {/* Header de grupo con logo redondo */}
                <div className="flex items-center gap-2.5 bg-[#1E293B] rounded-xl px-3 py-2 border border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoFor(groupLabel)} alt={groupLabel} className="w-6 h-6 rounded-full object-contain" />
                  <h3 className="capitalize font-bold text-sm text-white">{groupLabel}</h3>
                  <span className="text-[11px] text-gray-400 ml-auto">{groupCount} viaje(s)</span>
                </div>
                <div className="space-y-3">
                  {groupTrips.map(trip => {
            const normStatus = (trip.status || 'pending').toLowerCase();
            const isPending = normStatus === 'pending';
            const isReconciled = normStatus === 'reconciled';
            const isLedger = normStatus === 'in_ledger' || normStatus === 'en_ledger';

            const pickupLabel = trip.pickup_gps?.name || trip.pickup_gps?.city || 'Origen no especificado';
            const dropoffLabel = trip.dropoff_gps?.name || trip.dropoff_gps?.city || 'Destino no especificado';
            const createdDate = new Date(trip.created_at).toLocaleDateString('es-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            });

            const netVal = Number(trip.net_payout || trip.net || 0);
            const grossVal = Number(trip.gross || trip.earnings || 0);

            return (
              <div
                key={trip.id}
                className={`bg-[#1E293B] rounded-2xl p-4 border transition-all ${
                  isPending
                    ? 'border-yellow-500/40 hover:border-yellow-500/70'
                    : isReconciled
                    ? 'border-green-500/40 hover:border-green-500/70'
                    : 'border-blue-500/40 hover:border-blue-500/70'
                }`}
              >
                {/* Header card: Platform & Status */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 capitalize font-bold text-base tracking-wide text-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoFor(trip.platform_id)} alt={trip.platform_id || 'Viaje'} className="w-5 h-5 rounded-full object-contain" />
                      {trip.platform_id || 'Viaje'}
                    </span>
                    <span className="text-[11px] text-gray-500">· {createdDate}</span>
                    {trip.sync_status === 'local' && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <Cloud size={9} /> Local
                      </span>
                    )}
                    {trip.sync_status === 'error' && (
                      <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <CloudOff size={9} /> Error sync
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Clock size={12} /> Pendiente
                    </span>
                  )}
                  {isReconciled && (
                    <span className="bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Reconciliada
                    </span>
                  )}
                  {isLedger && (
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <BookOpen size={12} /> En Ledger
                    </span>
                  )}
                </div>

                {/* Route */}
                <div className="flex items-center gap-1.5 text-xs text-gray-300 mb-2 truncate">
                  <MapPin size={13} className="text-green-400 shrink-0" />
                  <span className="truncate">{pickupLabel}</span>
                  <ArrowRight size={12} className="text-gray-500 shrink-0 mx-0.5" />
                  <span className="truncate">{dropoffLabel}</span>
                </div>

                {/* Financial Details */}
                <div className="flex justify-between items-end border-t border-gray-700/50 pt-2 mb-3">
                  <div>
                    <span className="text-2xl font-bold text-green-400">${netVal.toFixed(2)}</span>
                    <span className="text-[11px] text-gray-400 ml-1.5">Net Payout</span>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Gross: ${grossVal.toFixed(2)}</p>
                    {trip.tips > 0 && <p className="text-green-400/80">Tips: +${Number(trip.tips).toFixed(2)}</p>}
                    {trip.tolls > 0 && <p className="text-sky-400/80">Tolls: +${Number(trip.tolls).toFixed(2)}</p>}
                    {trip.platform_fee > 0 && <p className="text-red-400/80">Fee: -${Number(trip.platform_fee).toFixed(2)}</p>}
                  </div>
                </div>

                {/* GPS Pickup / Dropoff con coordenadas y hora */}
                <div className="bg-[#0F172A]/40 rounded-xl border border-gray-700/50 p-2.5 mt-1 space-y-1.5">
                  <div className="flex items-start gap-1.5 text-[11px] text-gray-300">
                    <MapPin size={12} className="text-green-400 shrink-0" />
                    <span className="font-semibold">Pickup:</span>
                    <span className="truncate">{pickupLabel}</span>
                    {trip.pickup_gps?.lat ? <span className="text-gray-500 whitespace-nowrap">({trip.pickup_gps.lat.toFixed(5)}, {trip.pickup_gps.lng?.toFixed(5)})</span> : null}
                    {trip.pickup_time ? <span className="text-gray-500 whitespace-nowrap">{new Date(trip.pickup_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span> : null}
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-gray-300">
                    <MapPin size={12} className="text-blue-400 shrink-0" />
                    <span className="font-semibold">Dropoff:</span>
                    <span className="truncate">{dropoffLabel}</span>
                    {trip.dropoff_gps?.lat ? <span className="text-gray-500 whitespace-nowrap">({trip.dropoff_gps.lat.toFixed(5)}, {trip.dropoff_gps.lng?.toFixed(5)})</span> : null}
                    {trip.dropoff_time ? <span className="text-gray-500 whitespace-nowrap">{new Date(trip.dropoff_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span> : null}
                  </div>
                </div>

                {/* Montos: Gross verde · Tips azul · Toll naranja */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="bg-green-500/15 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Gross ${grossVal.toFixed(2)}</span>
                  <span className="bg-blue-500/15 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Tips ${Number(trip.tips || 0).toFixed(2)}</span>
                  <span className="bg-orange-500/15 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Toll ${Number(trip.tolls || 0).toFixed(2)}</span>
                </div>

                {trip.trip_notes && (
                  <p className="text-[11px] text-gray-400 italic mb-3 bg-[#0F172A]/50 px-2.5 py-1.5 rounded-lg">
                    {trip.trip_notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-700/40">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(trip)}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1 rounded transition-colors"
                      title="Editar viaje"
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1 p-1 rounded transition-colors"
                      title="Eliminar viaje"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Flow progression buttons */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'reconciled')}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold text-xs px-3 py-1.5 rounded-xl border border-green-500/30 flex items-center gap-1 transition-colors"
                      >
                        <Check size={13} /> Reconciliar
                      </button>
                    )}

                    {isReconciled && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(trip.id, 'pending')}
                          className="text-[11px] text-gray-400 hover:text-gray-300"
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(trip.id, 'in_ledger')}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold text-xs px-3 py-1.5 rounded-xl border border-blue-500/30 flex items-center gap-1 transition-colors"
                        >
                          <BookOpen size={13} /> A Ledger
                        </button>
                      </>
                    )}

                    {isLedger && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'reconciled')}
                        className="text-[11px] text-gray-400 hover:text-gray-300"
                      >
                        Deshacer Ledger
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] rounded-2xl p-5 w-full max-w-sm border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Pencil size={18} className="text-green-400" /> Editar Viaje
              </h3>
              <button onClick={() => setEditingTrip(null)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {/* Sección de Ubicación */}
              <div className="bg-[#0F172A] rounded-xl p-3 border border-gray-700/50">
                <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                  <MapPin size={12} className="text-green-400" /> Detalles de Ubicación
                </h4>
                <div className="mb-2">
                  <p className="text-[10px] text-green-400 font-semibold mb-1">PICKUP</p>
                  <p className="text-xs text-white font-medium">{editingTrip.pickup_gps?.name || 'N/A'}</p>
                  <p className="text-[11px] text-gray-400">{editingTrip.pickup_gps?.address || editingTrip.pickup_gps?.city || ''}</p>
                  {editingTrip.pickup_gps?.lat && (
                    <span className="text-[10px] text-gray-500">📍 {editingTrip.pickup_gps.lat.toFixed(5)}, {editingTrip.pickup_gps.lng?.toFixed(5)}</span>
                  )}
                  {editingTrip.pickup_time && (
                    <p className="text-[10px] text-gray-500">🕐 {new Date(editingTrip.pickup_time).toLocaleDateString('es-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-semibold mb-1">DROPOFF</p>
                  <p className="text-xs text-white font-medium">{editingTrip.dropoff_gps?.name || 'N/A'}</p>
                  <p className="text-[11px] text-gray-400">{editingTrip.dropoff_gps?.address || editingTrip.dropoff_gps?.city || ''}</p>
                  {editingTrip.dropoff_gps?.lat && (
                    <span className="text-[10px] text-gray-500">📍 {editingTrip.dropoff_gps.lat.toFixed(5)}, {editingTrip.dropoff_gps.lng?.toFixed(5)}</span>
                  )}
                  {editingTrip.dropoff_time && (
                    <p className="text-[10px] text-gray-500">🕐 {new Date(editingTrip.dropoff_time).toLocaleDateString('es-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Gross fare</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editGross}
                  onChange={e => setEditGross(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-green-400"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Propinas (Tips)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editTips}
                    onChange={e => setEditTips(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Peajes (Tolls)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editTolls}
                    onChange={e => setEditTolls(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Platform Fee</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editFee}
                  onChange={e => setEditFee(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Black Car Phones Fee</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editBlackCarFee}
                  onChange={e => setEditBlackCarFee(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-green-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Notas / Ref</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-green-400"
                  placeholder="Referencia o detalles..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                disabled={savingEdit}
                className="flex-1 bg-transparent border border-gray-700 text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 bg-green-400 text-black py-3 rounded-xl font-bold text-sm hover:bg-green-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {savingEdit ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Guardar Cambios
                  </>
                )}
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

