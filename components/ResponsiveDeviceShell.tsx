"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Monitor, Wifi, Battery, Signal, Car } from "lucide-react";

interface ResponsiveDeviceShellProps {
  children: React.ReactNode;
}

export default function ResponsiveDeviceShell({ children }: ResponsiveDeviceShellProps) {
  const [viewMode, setViewMode] = useState<"phone" | "expanded">("phone");
  const [timeStr, setTimeStr] = useState("5:45 PM");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col">
      {/* 1. BARRA SUPERIOR DE CONTROL (visible solo en pantallas >= 768px) */}
      <header className="hidden md:flex w-full border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md px-6 py-3 items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            <Car size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-wide">COPILOTO FINANCIERO</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                PWA Driver
              </span>
            </div>
            <p className="text-xs text-slate-400">Plataforma contable para conductores Uber / Lyft / TLC</p>
          </div>
        </div>

        {/* Badges de estado en tiempo real */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Supabase conectado</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>GPS Activo</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span>Conductor: <strong className="text-slate-100">Miguel</strong></span>
          </div>
        </div>

        {/* Selector de modo: Teléfono vs Expandido */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode("phone")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "phone"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone size={14} />
            <span>Vista Celular</span>
          </button>
          <button
            onClick={() => setViewMode("expanded")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "expanded"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor size={14} />
            <span>Vista Expandida</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center md:p-6 overflow-hidden md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] md:from-[#131C2E] md:via-[#0B0F19] md:to-[#070A10]">
        <div className={`w-full flex-1 flex flex-col items-center justify-center ${
          viewMode === "phone" ? "" : "max-w-2xl"
        }`}>
          {viewMode === "phone" ? (
            /* CHASIS CELULAR */
            <div className="relative w-full md:w-[412px] h-full md:h-[860px] md:max-h-[90vh] flex flex-col items-center justify-center">
              
              {/* Resplandor ambiental de fondo en desktop */}
              <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-sky-500/10 to-indigo-500/20 rounded-[58px] blur-xl opacity-70 -z-10" />

              {/* Botones físicos laterales en desktop */}
              <div className="hidden md:block absolute -left-[14px] top-28 w-[4px] h-8 bg-slate-700 rounded-l-sm" />
              <div className="hidden md:block absolute -left-[14px] top-40 w-[4px] h-12 bg-slate-700 rounded-l-sm" />
              <div className="hidden md:block absolute -left-[14px] top-56 w-[4px] h-12 bg-slate-700 rounded-l-sm" />
              <div className="hidden md:block absolute -right-[14px] top-36 w-[4px] h-16 bg-slate-700 rounded-r-sm" />

              {/* Carcasa exterior */}
              <div className="w-full h-full md:bg-[#1E293B] md:rounded-[52px] md:p-[10px] md:shadow-[0_25px_70px_rgba(0,0,0,0.85)] md:border md:border-slate-700/80 flex flex-col">
                
                {/* Pantalla del teléfono */}
                <div 
                  className="w-full h-full bg-[#0F172A] md:rounded-[42px] overflow-hidden flex flex-col relative"
                  style={{ transform: "translateZ(0)" }}
                >
                  {/* Barra de estado con Dynamic Island (visible en desktop dentro del marco) */}
                  <div className="hidden md:flex w-full h-11 bg-[#0F172A] items-center justify-between px-6 shrink-0 z-30 select-none pt-1">
                    <span className="text-[13px] font-semibold text-slate-200 tracking-tight">{timeStr}</span>
                    <div className="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-inner">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Signal size={12} className="fill-current" />
                      <Wifi size={12} />
                      <Battery size={13} className="fill-current" />
                    </div>
                  </div>

                  {/* Contenedor del contenido de la App */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    {children}
                  </div>

                  {/* Indicador inferior Home Bar en desktop */}
                  <div className="hidden md:flex w-full h-4 bg-[#0F172A] items-center justify-center shrink-0 z-30 pointer-events-none pb-1">
                    <div className="w-32 h-1 bg-slate-500/50 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Etiqueta inferior en desktop */}
              <div className="hidden md:block mt-2 text-center text-[11px] text-slate-500 tracking-wider">
                Simulador Móvil · 393 × 852 (Escala 1:1)
              </div>
            </div>
          ) : (
            /* VISTA EXPANDIDA EN DESKTOP */
            <div 
              className="w-full max-h-[88vh] bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-y-auto flex flex-col relative"
              style={{ transform: "translateZ(0)" }}
            >
              <div className="p-2 border-b border-slate-800/80 bg-slate-900/40 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">
                  Modo Expandido · Optimizado para pantalla completa
                </span>
                <span className="text-[11px] text-slate-500">Copiloto Financiero</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
