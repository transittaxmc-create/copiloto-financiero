"use client";

import { useFinanceStore } from "@/store/useFinanceStore";

/**
 * Registro numérico y auditoría de caja: corre el saldo día por día
 * (ingresos de plataformas − gastos/facturas vencidas) sobre el balance
 * inicial del planificador y marca el estado de riesgo de cada día.
 */
export default function FinanceRegisterTable() {
  const startingBalance = useFinanceStore((state) => state.startingBalance);
  const days = useFinanceStore((state) => state.days);
  const upcomingExpenses = useFinanceStore((state) => state.upcomingExpenses);

  // Saldo acumulado por día: startingBalance + ingresos − gastos (pareja por índice)
  let runningBalance = startingBalance;
  const rows = days.map((day, idx) => {
    const dayIncome = day.platforms.reduce(
      (acc, p) => acc + (p.actualAmount || p.projectedAmount),
      0
    );
    const dayExpense = upcomingExpenses[idx] ? upcomingExpenses[idx].amount : 0;
    runningBalance = runningBalance + dayIncome - dayExpense;
    return { day, dayIncome, dayExpense, balance: runningBalance };
  });

  return (
    <div className="bg-[#1E293B] border border-gray-700 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-gray-700 pb-3 gap-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Registro Numérico y Auditoría de Caja
        </h3>
        <span className="text-xs text-slate-400 shrink-0">
          Punto de partida: ${startingBalance.toFixed(2)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0B132B] text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Día</th>
              <th className="p-3">Ingreso</th>
              <th className="p-3">Gastos / Facturas</th>
              <th className="p-3">Saldo Resultante</th>
              <th className="p-3">Estado de Riesgo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map(({ day, dayIncome, dayExpense, balance }) => (
              <tr key={day.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="p-3 font-semibold text-white">{day.date}</td>
                <td className="p-3 text-[#10B981] font-bold">
                  +${dayIncome.toFixed(2)}
                </td>
                <td className="p-3 text-red-400 font-bold">
                  {dayExpense > 0 ? `-$${dayExpense.toFixed(2)}` : "$0.00"}
                </td>
                <td className="p-3 text-white font-extrabold">
                  ${balance.toFixed(2)}
                </td>
                <td className="p-3">
                  {balance < 400 ? (
                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      ALERTA BAJO
                    </span>
                  ) : (
                    <span className="bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded text-[10px] font-bold">
                      OPTIMO
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
