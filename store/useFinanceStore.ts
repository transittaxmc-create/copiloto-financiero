import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IncomePlatform {
  platformName: string;
  projectedAmount: number;
  actualAmount: number;
}

export interface DayData {
  id: string;
  date: string; // etiqueta visible, ej. "Lun 15"
  isWorkingDay: boolean;
  platforms: IncomePlatform[];
}

export interface UpcomingExpense {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO YYYY-MM-DD
}

const SAFE_MARGIN = 300; // colchón mínimo que no cuenta como invertible

/** Días desde hoy hasta la fecha ISO (>=0). */
function daysUntil(iso: string): number {
  const ms = new Date(`${iso}T12:00:00`).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

interface FinanceState {
  startingBalance: number;
  days: DayData[];
  upcomingExpenses: UpcomingExpense[];
  setStartingBalance: (balance: number) => void;
  toggleWorkingDay: (dayId: string) => void;
  /** Balance proyectado mínimo: balance inicial − todos los gastos próximos. */
  getMinProjectedBalance: () => number;
  /** Total de gastos con vencimiento dentro de los próximos N días. */
  getUpcomingExpensesTotal: (daysAhead: number) => number;
  /** Dinero invertible = balance − gastos − colchón de seguridad. */
  getInvestableSurplus: () => { amount: number; isSafe: boolean };
  /** Plan de emergencia si los gastos superan el balance. */
  getEmergencyPlan: () => {
    hasDeficit: boolean;
    deficitAmount: number;
    targetPaymentName: string;
    daysRemaining: number;
    suggestedDailyIncrease: number;
  };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      startingBalance: 1250.0,
      days: [
        { id: '1', date: 'Lun 15', isWorkingDay: true, platforms: [{ platformName: 'Uber', projectedAmount: 180, actualAmount: 200 }] },
        { id: '2', date: 'Mar 16', isWorkingDay: true, platforms: [{ platformName: 'Uber', projectedAmount: 180, actualAmount: 175 }] },
        { id: '3', date: 'Mié 17', isWorkingDay: false, platforms: [{ platformName: 'Uber', projectedAmount: 0, actualAmount: 0 }] },
        { id: '4', date: 'Jue 18', isWorkingDay: true, platforms: [{ platformName: 'Uber', projectedAmount: 180, actualAmount: 0 }] },
      ],
      upcomingExpenses: [
        { id: 'e1', name: 'Servidor / Hosting', amount: 150, dueDate: '2026-09-15' },
        { id: 'e2', name: 'Renta Oficina', amount: 800, dueDate: '2026-09-18' },
      ],

      setStartingBalance: (balance) => set({ startingBalance: Math.max(0, balance) }),

      toggleWorkingDay: (dayId) =>
        set((state) => ({
          days: state.days.map((d) => (d.id === dayId ? { ...d, isWorkingDay: !d.isWorkingDay } : d)),
        })),

      getMinProjectedBalance: () => {
        const { startingBalance, upcomingExpenses } = get();
        const totalExpenses = upcomingExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        return Math.max(0, startingBalance - totalExpenses);
      },

      getUpcomingExpensesTotal: (daysAhead) => {
        const { upcomingExpenses } = get();
        return upcomingExpenses
          .filter((e) => daysUntil(e.dueDate) <= daysAhead)
          .reduce((acc, curr) => acc + curr.amount, 0);
      },

      getInvestableSurplus: () => {
        const { startingBalance, upcomingExpenses } = get();
        const totalBills = upcomingExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const surplus = startingBalance - totalBills - SAFE_MARGIN;
        return { amount: surplus > 0 ? surplus : 0, isSafe: surplus > 0 };
      },

      getEmergencyPlan: () => {
        const { startingBalance, upcomingExpenses } = get();
        const totalBills = upcomingExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const deficit = totalBills - startingBalance;

        if (deficit > 0 && upcomingExpenses.length > 0) {
          // El pago más próximo (por fecha) es el objetivo
          const target = [...upcomingExpenses].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
          const daysRemaining = Math.max(1, daysUntil(target.dueDate));
          return {
            hasDeficit: true,
            deficitAmount: deficit,
            targetPaymentName: target.name,
            daysRemaining,
            suggestedDailyIncrease: Math.ceil(deficit / daysRemaining),
          };
        }

        return { hasDeficit: false, deficitAmount: 0, targetPaymentName: '', daysRemaining: 0, suggestedDailyIncrease: 0 };
      },
    }),
    {
      name: 'copiloto_finance', // sobrevive a navegación y cierres de la PWA
    }
  )
);