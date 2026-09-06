"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Undo2,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Car,
  Calculator,
  Smartphone,
  DollarSign,
  CreditCard,
  Receipt
} from "lucide-react";

interface PlatformGroup {
  platform_id: string;
  trips: Trip[];
  totalNet: number;
  totalEarnings: number;
  totalTips: number;
  count: number;
}

interface RegisterProps {
  onReconcile?: () => void;
  dateFrom?: string;
  dateTo?: string;
}

const PLATFORM_NAMES: Record<string, string> = {
  uber: "Uber",
  lyft: "Lyft",
  via: "Via",
  juno: "Juno",
  gett: "Gett"
};

// MOCK DATA
const MOCK_TRIPS: Trip[] = [
  { id: "1", platform_id: "uber", pickup_time: "2026-09-06T14:30:00", dropoff_time: "2026-09-06T15:00:00", pickup_gps: { lat: 40.7128, lng: -74.0060 }, dropoff_gps: { lat: 40.6892, lng: -73.9442 }, earnings: 24.50, extra_cash: 0, tips: 5.00, tolls: 0, platform_fee: 3.20, black_car_phones_fee: 2.75, gross: 29.50, net: 23.55, status: "pending", trip_notes: "Airport pickup", created_at: "2026-09-06T14:30:00" },
  { id: "2", platform_id: "uber", pickup_time: "2026-09-06T10:15:00", dropoff_time: "2026-09-06T10:45:00", pickup_gps: { lat: 40.7580, lng: -73.9855 }, dropoff_gps: { lat: 40.7614, lng: -73.9776 }, earnings: 18.75, extra_cash: 0, tips: 3.50, tolls: 6.50, platform_fee: 2.45, black_car_phones_fee: 2.75, gross: 22.25, net: 16.55, status: "in_ledger", trip_notes: "", created_at: "2026-09-06T10:15:00" },
  { id: "3", platform_id: "lyft", pickup_time: "2026-09-06T09:00:00", dropoff_time: "2026-09-06T09:30:00", pickup_gps: { lat: 40.7527, lng: -73.9772 }, dropoff_gps: { lat: 40.7589, lng: -73.9851 }, earnings: 15.30, extra_cash: 0, tips: 2.00, tolls: 0, platform_fee: 2.10, black_car_phones_fee: 2.75, gross: 17.30, net: 12.45, status: "pending", trip_notes: "", created_at: "2026-09-06T09:00:00" },
  { id: "4", platform_id: "lyft", pickup_time: "2026-09-05T18:45:00", dropoff_time: "2026-09-05T19:15:00", pickup_gps: { lat: 40.7589, lng: -73.9851 }, dropoff_gps: { lat: 40.7484, lng: -73.9857 }, earnings: 12.80, extra_cash: 0, tips: 2.50, tolls: 0, platform_fee: 1.85, black_car_phones_fee: 2.75, gross: 15.30, net: 10.70, status: "reconciled", trip_notes: "", created_at: "2026-09-05T18:45:00" },
  { id: "5", platform_id: "uber", pickup_time: "2026-09-05T16:20:00", dropoff_time: "2026-09-05T16:40:00", pickup_gps: { lat: 40.7127, lng: -74.0059 }, dropoff_gps: { lat: 40.7061, lng: -74.0089 }, earnings: 8.90, extra_cash: 5.00, tips: 2.00, tolls: 0, platform_fee: 1.20, black_car_phones_fee: 2.75, gross: 15.90, net: 11.95, status: "in_ledger", trip_notes: "Extra cash tip", created_at: "2026-09-05T16:20:00" },
];

export function Register({ onReconcile }: RegisterProps) {
  const supabase = useSupabase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempFee, setTempFee] = useState<string>("");

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
    in_ledger: { label: "Ledger Blando", color: "bg-sky-500/20 text-sky-400 border-sky-500/30", icon: FileText },
    reconciled: { label: "Ledger Duro", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      // Intentar con Supabase real primero
      const { data, error } = await (supabase.from("trips") as any)
        .select()
        .order("pickup_time", { ascending: false });

      if (!error && data && data.length > 0) {
        setTrips(data);
      } else {
        // Usar datos mock
        setTrips(MOCK_TRIPS);
      }
    } catch {
      setTrips(MOCK_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const groupedTrips = trips.reduce<PlatformGroup[]>((acc, trip) => {
    const existing = acc.find((g) => g.platform_id === trip.platform_id);
    if (existing) {
      existing.trips.push(trip);
      existing.totalNet += trip.net;
      existing.totalEarnings += trip.earnings;
      existing.totalTips += trip.tips + trip.extra_cash;
      existing.count++;
    } else {
      acc.push({
        platform_id: trip.platform_id,
        trips: [trip],
        totalNet: trip.net,
        totalEarnings: trip.earnings,
        totalTips: trip.tips + trip.extra_cash,
        count: 1,
      });
    }
    return acc;
  }, []);

  const totals = {
    count: trips.length,
    earnings: trips.reduce((sum, t) => sum + t.earnings, 0),
    tips: trips.reduce((sum, t) => sum + t.tips + t.extra_cash, 0),
    tolls: trips.reduce((sum, t) => sum + t.tolls, 0),
    platformFee: trips.reduce((sum, t) => sum + t.platform_fee, 0),
    blackCarFee: trips.reduce((sum, t) => sum + t.black_car_phones_fee, 0),
    gross: trips.reduce((sum, t) => sum + t.gross, 0),
    net: trips.reduce((sum, t) => sum + t.net, 0),
  };

  const handleRevert = async (tripId: string) => {
    try {
      await (supabase.from("trips") as any)
        .update({ status: "pending" })
        .eq("id", tripId);
    } catch { /* ignore */ }
    setTrips(trips.map(t => t.id === tripId ? { ...t, status: "pending" } : t));
  };

  const handleSaveFee = async (tripId: string) => {
    const newFee = parseFloat(tempFee) || 0;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const newNet = trip.gross - trip.platform_fee - newFee;
    try {
      await (supabase.from("trips") as any)
        .update({ black_car_phones_fee: newFee, net: newNet })
        .eq("id", tripId);
    } catch { /* ignore */ }
    setTrips(trips.map(t => t.id === tripId ? { ...t, black_car_phones_fee: newFee, net: newNet } : t));
    setEditingFeeId(null);
    setTempFee("");
  };

  const startEditFee = (trip: Trip) => {
    setEditingFeeId(trip.id);
    setTempFee(trip.black_car_phones_fee.toFixed(2));
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
          <Receipt className="h-6 w-6 text-sky-400" />
          Registro de Viajes
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-800 border-slate-600 text-slate-300">
            {trips.length} viajes
          </Badge>
          <Button onClick={fetchTrips} variant="outline" size="sm" className="bg-slate-800 border-slate-600">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {groupedTrips.length === 0 ? (
        <Card className="bg-[#1E293B] border-gray-800">
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay viajes registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedTrips.map((group) => (
            <Card key={group.platform_id} className="bg-[#1E293B] border-gray-800 overflow-hidden">
              <div className="bg-[#0F172A] p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <Car className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F8FAFC]">
                        {PLATFORM_NAMES[group.platform_id] || group.platform_id}
                      </h3>
                      <p className="text-sm text-gray-400">{group.count} viajes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">${group.totalNet.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Gan: ${group.totalEarnings.toFixed(2)} | Prop: ${group.totalTips.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-800">
                {group.trips.map((trip) => {
                  const isExpanded = expandedId === trip.id;
                  const status = statusConfig[trip.status];
                  const StatusIcon = status.icon;
                  const isEditing = editingFeeId === trip.id;
                  const canRevert = trip.status === "in_ledger";

                  return (
                    <div key={trip.id} className="transition-colors">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-[#0F172A]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn("p-2 rounded-lg border", status.color)}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F8FAFC] truncate">
                              {new Date(trip.pickup_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - {new Date(trip.dropoff_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(trip.pickup_time).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                              {trip.trip_notes && ` - ${trip.trip_notes}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">${trip.net.toFixed(2)}</p>
                            {(trip.tips > 0 || trip.extra_cash > 0) && (
                              <p className="text-xs text-amber-400">Prop: ${(trip.tips + trip.extra_cash).toFixed(2)}</p>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 bg-[#0F172A]/30 border-t border-gray-800">
                          <div className="pt-3 space-y-3">
                            {trip.pickup_gps && trip.dropoff_gps && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase">Pickup GPS</p>
                                    <p className="text-sm text-gray-300">{trip.pickup_gps.lat.toFixed(6)}, {trip.pickup_gps.lng.toFixed(6)}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase">Dropoff GPS</p>
                                    <p className="text-sm text-gray-300">{trip.dropoff_gps.lat.toFixed(6)}, {trip.dropoff_gps.lng.toFixed(6)}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-[#1E293B] rounded-lg p-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Earnings</span>
                                <span className="text-gray-200">${trip.earnings.toFixed(2)}</span>
                              </div>
                              {(trip.tips > 0 || trip.extra_cash > 0) && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Propinas + Extra Cash</span>
                                  <span className="text-amber-400">+${(trip.tips + trip.extra_cash).toFixed(2)}</span>
                                </div>
                              )}
                              {trip.tolls > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Peajes</span>
                                  <span className="text-amber-400">+${trip.tolls.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Platform Fee</span>
                                <span className="text-red-400">-${trip.platform_fee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4 text-sky-400" />
                                  <span className="text-gray-400">Black Car Phones Fee</span>
                                </div>
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">$</span>
                                    <Input type="number" value={tempFee} onChange={(e) => setTempFee(e.target.value)} className="w-20 h-8 bg-slate-800 border-gray-600 text-center text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveFee(trip.id)} />
                                    <Button size="sm" onClick={() => handleSaveFee(trip.id)} className="h-8 bg-emerald-600">OK</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingFeeId(null)} className="h-8">✕</Button>
                                  </div>
                                ) : (
                                  <button onClick={() => startEditFee(trip)} className="font-bold text-sky-400 hover:text-sky-300">${trip.black_car_phones_fee.toFixed(2)}</button>
                                )}
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                <span className="text-sm font-medium text-gray-300">Gross</span>
                                <span className="font-bold text-emerald-400">${trip.gross.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                              <Badge variant="outline" className={status.color}>{status.label}</Badge>
                              {canRevert && (
                                <Button size="sm" variant="outline" onClick={() => handleRevert(trip.id)} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                                  <Undo2 className="h-4 w-4 mr-1" />Revertir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {trips.length > 0 && (
        <Card className="bg-[#1E293B] border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Viajes</p>
                  <p className="text-xl font-bold text-[#F8FAFC]">{totals.count}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Earnings</p>
                  <p className="text-xl font-bold text-emerald-400">${totals.earnings.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Propinas</p>
                  <p className="text-xl font-bold text-amber-400">${totals.tips.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Peajes</p>
                  <p className="text-xl font-bold text-amber-400">${totals.tolls.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Platform Fee</p>
                  <p className="text-xl font-bold text-red-400">-${totals.platformFee.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">BCP Fee</p>
                  <p className="text-xl font-bold text-sky-400">-${totals.blackCarFee.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Gross</p>
                  <p className="text-xl font-bold text-emerald-400">${totals.gross.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Neto</p>
                  <p className={cn("text-3xl font-bold font-mono", totals.net >= 0 ? "text-emerald-400" : "text-red-400")}>${totals.net.toFixed(2)}</p>
                </div>
                <Button onClick={onReconcile} size="lg" className="bg-sky-600 hover:bg-sky-500 text-white">
                  <Calculator className="h-5 w-5 mr-2" />Reconciliar con Invoices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Register;
