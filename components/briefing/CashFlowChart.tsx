"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import type { ProjectionPoint } from "@/store/useFinanceStore";

interface Props {
  points: ProjectionPoint[];
}

const W = 520;
const H = 170;
const PAD_L = 42;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 24;

/**
 * Proyección de flujo de caja en SVG puro (sin dependencias de charting).
 * Línea cyan = efectivo proyectado · línea ámbar = gastos por periodo.
 */
export default function CashFlowChart({ points }: Props) {
  const { cashPath, cashArea, expensePath, max, ticks } = useMemo(() => {
    const safe = points.length > 0 ? points : [{ label: "Hoy", cashOnHand: 0, expenses: 0 }];
    const maxVal = Math.max(
      1,
      ...safe.map((p) => p.cashOnHand),
      ...safe.map((p) => p.expenses)
    );
    const niceMax = Math.ceil(maxVal / 500) * 500 || 500;
    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;
    const x = (i: number) =>
      PAD_L + (safe.length === 1 ? innerW / 2 : (i / (safe.length - 1)) * innerW);
    const y = (v: number) => PAD_T + innerH - (v / niceMax) * innerH;

    const toPath = (key: "cashOnHand" | "expenses") =>
      safe
        .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`)
        .join(" ");

    const cash = toPath("cashOnHand");
    const area = `${cash} L${x(safe.length - 1).toFixed(1)},${(H - PAD_B).toFixed(
      1
    )} L${x(0).toFixed(1)},${(H - PAD_B).toFixed(1)} Z`;

    return {
      cashPath: cash,
      cashArea: area,
      expensePath: toPath("expenses"),
      max: niceMax,
      ticks: [0, 0.5, 1].map((f) => ({
        value: Math.round(niceMax * f),
        y: y(niceMax * f),
      })),
    };
  }, [points]);

  const last = points[points.length - 1];

  return (
    <section className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-4 md:p-5 space-y-3 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0EA5E9]" /> Proyección de flujo
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Próximas 6 semanas con la meta semanal actual
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-cyan-400 flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" /> Efectivo
          </span>
          <span className="text-[10px] text-amber-400 flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full" /> Gastos
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[170px]"
        role="img"
        aria-label={`Proyección de efectivo, máximo $${max}`}
      >
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={t.y}
              y2={t.y}
              stroke="#334155"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text x={4} y={t.y + 3} fill="#64748B" fontSize="9">
              ${t.value}
            </text>
          </g>
        ))}

        <path d={cashArea} fill="url(#cashFill)" />
        <path d={cashPath} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d={expensePath}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />

        {points.map((p, i) => {
          const innerW = W - PAD_L - PAD_R;
          const x =
            PAD_L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
          return (
            <text key={p.label} x={x} y={H - 6} fill="#64748B" fontSize="9" textAnchor="middle">
              {p.label}
            </text>
          );
        })}
      </svg>

      {last && (
        <p className="text-[11px] text-slate-400">
          En 6 semanas:{" "}
          <span className="font-bold text-cyan-400 tabular-nums">
            ${last.cashOnHand.toLocaleString("en-US")}
          </span>{" "}
          de efectivo proyectado.
        </p>
      )}
    </section>
  );
}
