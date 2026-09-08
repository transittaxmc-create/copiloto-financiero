"use client";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import { Camera, Search, AlertTriangle, CheckCircle2, DollarSign, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface TollTrip { id: string; location: string; amount: number; date: string; time: string; status: "detected" | "verified" | "discrepancy"; }

const MOCK_TOLLS: TollTrip[] = [
  { id: "1", location: "Lincoln Tunnel", amount: 9.56, date: "2026-09-05", time: "8:45 AM", status: "verified" },
  { id: "2", location: "Verrazzano Bridge", amount: 6.12, date: "2026-09-05", time: "10:20 AM", status: "detected" },
  { id: "3", location: "Holland Tunnel", amount: 9.56, date: "2026-09-04", time: "5:30 PM", status: "verified" },
];

// Reglas de no-duplicidad por puente/túnel (ventana en minutos)
const TOLWAYS_RULES = [
  { label: "Verrazzano", match: "verrazzano", windowMin: 1440, note: "1 vez/día (entrada a Staten Island)" },
  { label: "Cross Bay", match: "cross bay", windowMin: 1440, note: "1 vez/día (entrada a Rockaway Beach)" },
  { label: "Port Authority", match: "port authority", windowMin: 720, note: "Solo dirección Este (hacia NY/NJ)" },
];
const DEDUP_WINDOW_MIN = 45;

function dedupeTolls(rows: TollTrip[]): { list: TollTrip[]; duplicates: TollTrip[] } {
  const seen = new Set<string>();
  const duplicates: TollTrip[] = [];
  const list = rows.filter((t) => {
    const loc = (t.location || "").toLowerCase();
    const rule = TOLWAYS_RULES.find((r) => loc.includes(r.match));
    const day = t.date || "unknown";
    const ts = new Date(`${t.date || "1970-01-01"}T${t.time || "00:00"}`).getTime();
    const windowMin = rule ? rule.windowMin : DEDUP_WINDOW_MIN;
    const bucket = rule ? `${rule.label}:${day}` : `${loc}:${Math.floor(ts / (windowMin * 60000))}`;
    if (seen.has(bucket)) {
      duplicates.push(t);
      return false;
    }
    seen.add(bucket);
    return true;
  });
  return { list, duplicates };
}

export default function EZPassPage(): React.ReactElement {
  const [tolls, setTolls] = useState<TollTrip[]>(MOCK_TOLLS);
  const [loadingTolls, setLoadingTolls] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("id, platform_id, tolls, pickup_time, created_at, status")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const rows = (data || []) as Array<{
          id: string;
          platform_id?: string | null;
          tolls?: number | null;
          pickup_time?: string | null;
          created_at?: string | null;
        }>;
        // Peajes detectados desde los viajes capturados (GPS)
        const gpsTolls: TollTrip[] = rows
          .filter((r) => Number(r.tolls || 0) > 0)
          .map((r, i) =>
            ({
              id: "gps-" + i,
              location: "Peaje GPS · " + (r.platform_id || "plataforma"),
              amount: Number(r.tolls),
              date: (r.pickup_time || r.created_at || "").slice(0, 10) || "Sin fecha",
              time: "Detectado",
              status: "detected",
            } as TollTrip)
          );
        if (gpsTolls.length) setTolls([...gpsTolls, ...MOCK_TOLLS]);
      } catch {
        // Mantener MOCK_TOLLS si falla la consulta (modo demo)
      } finally {
        setLoadingTolls(false);
      }
    })();
  }, []);

  const { list: uniqueTolls, duplicates } = dedupeTolls(tolls);
  const totalTolls = uniqueTolls.reduce((sum, t) => sum + t.amount, 0);
  const verifiedCount = uniqueTolls.filter(t => t.status === "verified").length;
  const pendingCount = uniqueTolls.filter(t => t.status !== "verified").length;

  return (
    <div className="flex min-h-screen flex-col">
      <DailyEntryHeader />
      <div className="flex-1 space-y-4 px-4 pt-4">
        {/* Scan Button */}
        <button className="surface-elevated surface-elevated flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl p-5 transition-all hover:bg-slate-700/50 active:scale-[0.98]">
          <Camera size={24} className="text-sky-400" />
          <div className="text-left">
            <p className="font-semibold text-slate-100">Escanear Statement E-ZPass</p>
            <p className="text-xs text-slate-400">OCR automático + Match con viajes</p>
          </div>
        </button>

        {/* Stats */}
        <div className="surface-elevated rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="stat-label flex items-center gap-2"><Shield size={14} />Resumen de Peajes</h3>
            <div className="flex items-center gap-1.5">
                {loadingTolls && <span className="chip chip-gray">cargando viajes GPS...</span>}
                {duplicates.length > 0 && <span className="chip chip-amber">{duplicates.length} duplicado(s) excluido(s)</span>}
                {pendingCount > 0 && <span className="chip chip-amber">{pendingCount} por verificar</span>}
              </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p><p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-slate-50">${totalTolls.toFixed(2)}</p></div>
            <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-slate-400">Verificados</p><p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-emerald-400">{verifiedCount}</p></div>
            <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-slate-400">Deducible</p><p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-sky-400">${(totalTolls * 0.67).toFixed(2)}</p></div>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-500">67% deducible según IRS (millas de negocio)</p>
        </div>

        {/* Rules */}
        <div className="surface rounded-xl p-4">
          <h4 className="stat-label mb-3 flex items-center gap-2"><AlertTriangle size={14} />Reglas de No Duplicidad</h4>
          <div className="space-y-2 text-xs text-slate-400">
            <p>• <span className="font-semibold text-slate-200">Verrazzano:</span> Doble al entrar a Staten Island (no al salir)</p>
            <p>• <span className="font-semibold text-slate-200">Cross Bay:</span> Doble al entrar a Rockaway Beach</p>
            <p>• <span className="font-semibold text-slate-200">Port Authority:</span> Solo dirección Este (hacia NY/NJ)</p>
          </div>
        </div>

        {/* Toll List */}
        <div className="space-y-2">
          <h3 className="stat-label">Peajes Detectados (GPS + Manual)</h3>
          {uniqueTolls.map((toll) => (
            <div key={toll.id} className="surface p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><MapPin size={18} className="text-sky-400" /><div><p className="font-semibold text-slate-100">{toll.location}</p><p className="text-xs text-slate-400">{toll.date} · {toll.time}</p></div></div>
                <div className="text-right"><p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-slate-100">${toll.amount.toFixed(2)}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-700/30 pt-2">
                <div className="flex items-center gap-1">
                  {toll.status === "verified" && <><CheckCircle2 size={14} className="text-emerald-400" /><span className="text-xs text-emerald-400">Verificado</span></>}
                  {toll.status === "detected" && <><Search size={14} className="text-amber-400" /><span className="text-xs text-amber-400">Detectado</span></>}
                  {toll.status === "discrepancy" && <><AlertTriangle size={14} className="text-red-400" /><span className="text-xs text-red-400">Discrepancia</span></>}
                </div>
                <button className="chip chip-blue text-xs">Ver Detalles</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
