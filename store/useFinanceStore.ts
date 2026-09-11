import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BankSnapshot,
  BankSource,
  ObligationCategory,
  ObligationInput,
} from '@/lib/engines/types';
import { SAFE_MARGIN_DEFAULT } from '@/lib/engines/types';
import {
  fetchBills,
  addBill as ledgerAddBill,
  updateBill as ledgerUpdateBill,
  deleteBill as ledgerDeleteBill,
  pushBankSnapshot,
  type LedgerBill,
} from '@/lib/ledger';

export interface IncomePlatform {
  platformName: string;
  projectedAmount: number;
  actualAmount: number;
}

export interface DayData {
  id: string;
  date: string;
  isWorkingDay: boolean;
  /** Meta de ingreso del dia (selector 300/400/500). */
  dailyTarget: number;
  platforms: IncomePlatform[];
}

export interface ProjectionPoint {
  label: string;
  cashOnHand: number;
  expenses: number;
}

export interface UpcomingExpense {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category?: ObligationCategory;
  minPayment?: number;
  paidAmount?: number;
}

const SAFE_MARGIN = SAFE_MARGIN_DEFAULT;

function isoPlusDays(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysUntil(iso: string): number {
  const ms = new Date(`${iso}T12:00:00`).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function isSameLocalDay(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const a = new Date(iso);
  const b = new Date();
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface FinanceState {
  startingBalance: number;
  bankSnapshot: BankSnapshot;
  previousBalance: number | null;
  days: DayData[];
  upcomingExpenses: UpcomingExpense[];
  ledgerBills: LedgerBill[];
  lastSyncAt: string | null;
  syncing: boolean;
  setStartingBalance: (balance: number) => void;
  setVerifiedBalance: (amount: number, source?: BankSource) => void;
  toggleWorkingDay: (dayId: string) => void;
  setDayTarget: (dayId: string, target: number) => void;
  markObligationPaid: (id: string, amount?: number, restBalance?: boolean) => void;
  syncToLedger: () => Promise<void>;
  loadLedgerBills: () => Promise<void>;
  addLedgerBill: (bill: Omit<LedgerBill, 'id'>) => Promise<string | null>;
  updateLedgerBill: (id: string, patch: Partial<Omit<LedgerBill, 'id'>>) => Promise<boolean>;
  removeLedgerBill: (id: string) => Promise<boolean>;
  isVerifiedToday: () => boolean;
  getObligations: () => ObligationInput[];
  getMinProjectedBalance: () => number;
  getUpcomingExpensesTotal: (daysAhead: number) => number;
  getInvestableSurplus: () => { amount: number; isSafe: boolean };
  getEmergencyPlan: () => {
    hasDeficit: boolean;
    deficitAmount: number;
    targetPaymentName: string;
    daysRemaining: number;
    suggestedDailyIncrease: number;
  };
  getWorkingDaysRemaining: () => number;
  getWeeklyTarget: () => number;
  getWeeklyActual: () => number;
  getCashFlowProjection: (weeks?: number) => ProjectionPoint[];
}

function makeDay(
  id: string,
  date: string,
  isWorkingDay: boolean,
  dailyTarget: number,
  actualAmount = 0
): DayData {
  return {
    id,
    date,
    isWorkingDay,
    dailyTarget,
    platforms: [
      {
        platformName: 'Uber',
        projectedAmount: isWorkingDay ? dailyTarget : 0,
        actualAmount,
      },
    ],
  };
}

const defaultDays: DayData[] = [
  makeDay('1', 'Lun', true, 300, 300),
  makeDay('2', 'Mar', true, 300, 280),
  makeDay('3', 'Mié', true, 400, 420),
  makeDay('4', 'Jue', true, 400, 200),
  makeDay('5', 'Vie', true, 500, 0),
  makeDay('6', 'Sáb', true, 400, 0),
  makeDay('7', 'Dom', false, 0, 0),
];

const defaultExpenses: UpcomingExpense[] = [
  { id: 'e1', name: 'Combustible semanal', amount: 80, dueDate: isoPlusDays(1), category: 'fuel' },
  { id: 'e2', name: 'Renta', amount: 800, dueDate: isoPlusDays(2), category: 'rent' },
  { id: 'e3', name: 'Tarjeta Visa', amount: 420, dueDate: isoPlusDays(4), category: 'card', minPayment: 120 },
  { id: 'e4', name: 'Pago carro', amount: 350, dueDate: isoPlusDays(6), category: 'car' },
  { id: 'e5', name: 'Hosting / Servidor', amount: 150, dueDate: isoPlusDays(9), category: 'ops' },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      startingBalance: 1250.0,
      bankSnapshot: { amount: 1250.0, verifiedAt: null, source: 'seed' },
      previousBalance: null,
      days: defaultDays,
      upcomingExpenses: defaultExpenses,
      ledgerBills: [],
      lastSyncAt: null,
      syncing: false,

      setStartingBalance: (balance) => {
        const amount = Math.max(0, balance);
        set({
          startingBalance: amount,
          bankSnapshot: { amount, verifiedAt: new Date().toISOString(), source: 'ocr' },
        });
      },

      setVerifiedBalance: (amount, source = 'manual') => {
        const next = Math.max(0, amount);
        const prev = get().startingBalance;
        set({
          previousBalance: prev,
          startingBalance: next,
          bankSnapshot: { amount: next, verifiedAt: new Date().toISOString(), source },
        });
        void get().syncToLedger();
      },

      toggleWorkingDay: (dayId) =>
        set((state) => ({
          days: state.days.map((d) => {
            if (d.id !== dayId) return d;
            const isWorkingDay = !d.isWorkingDay;
            const target = d.dailyTarget > 0 ? d.dailyTarget : 300;
            return {
              ...d,
              isWorkingDay,
              dailyTarget: target,
              platforms: d.platforms.map((p, i) => ({
                ...p,
                projectedAmount: isWorkingDay && i === 0 ? target : 0,
              })),
            };
          }),
        })),

      setDayTarget: (dayId, target) =>
        set((state) => ({
          days: state.days.map((d) => {
            if (d.id !== dayId) return d;
            const next = Math.max(0, target);
            return {
              ...d,
              dailyTarget: next,
              platforms: d.platforms.map((p, i) => ({
                ...p,
                projectedAmount: d.isWorkingDay && i === 0 ? next : p.projectedAmount,
              })),
            };
          }),
        })),

      markObligationPaid: (id, amount, restBalance = true) => {
        const state = get();
        const exp = state.upcomingExpenses.find((e) => e.id === id);
        if (!exp) return;
        const pay = amount ?? Math.max(0, exp.amount - (exp.paidAmount ?? 0));
        if (pay <= 0) return;
        set({
          upcomingExpenses: state.upcomingExpenses.map((e) =>
            e.id === id ? { ...e, paidAmount: (e.paidAmount ?? 0) + pay } : e
          ),
          startingBalance: restBalance ? Math.max(0, state.startingBalance - pay) : state.startingBalance,
          bankSnapshot: restBalance
            ? { ...state.bankSnapshot, amount: Math.max(0, state.bankSnapshot.amount - pay) }
            : state.bankSnapshot,
        });
      },

      isVerifiedToday: () => isSameLocalDay(get().bankSnapshot.verifiedAt),

      getObligations: () =>
        get().upcomingExpenses.map((e) => ({
          id: e.id,
          name: e.name,
          amount: e.amount,
          dueDate: e.dueDate,
          category: e.category ?? 'other',
          minPayment: e.minPayment,
          paidAmount: e.paidAmount ?? 0,
        })),

      getMinProjectedBalance: () => {
        const { startingBalance, upcomingExpenses } = get();
        const totalExpenses = upcomingExpenses.reduce(
          (acc, curr) => acc + Math.max(0, curr.amount - (curr.paidAmount ?? 0)),
          0
        );
        return Math.max(0, startingBalance - totalExpenses);
      },

      getUpcomingExpensesTotal: (daysAhead) => {
        const { upcomingExpenses } = get();
        return upcomingExpenses
          .filter((e) => daysUntil(e.dueDate) <= daysAhead)
          .reduce((acc, curr) => acc + Math.max(0, curr.amount - (curr.paidAmount ?? 0)), 0);
      },

      getInvestableSurplus: () => {
        const { startingBalance, upcomingExpenses } = get();
        const totalBills = upcomingExpenses.reduce(
          (acc, curr) => acc + Math.max(0, curr.amount - (curr.paidAmount ?? 0)),
          0
        );
        const surplus = startingBalance - totalBills - SAFE_MARGIN;
        return { amount: surplus > 0 ? surplus : 0, isSafe: surplus > 0 };
      },

      getEmergencyPlan: () => {
        const { startingBalance, upcomingExpenses } = get();
        const open = upcomingExpenses
          .map((e) => ({ ...e, remaining: Math.max(0, e.amount - (e.paidAmount ?? 0)) }))
          .filter((e) => e.remaining > 0);
        const totalBills = open.reduce((acc, curr) => acc + curr.remaining, 0);
        const deficit = totalBills - startingBalance;

        if (deficit > 0 && open.length > 0) {
          const target = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
          const daysRemaining = Math.max(1, daysUntil(target.dueDate));
          return {
            hasDeficit: true,
            deficitAmount: deficit,
            targetPaymentName: target.name,
            daysRemaining,
            suggestedDailyIncrease: Math.ceil(deficit / daysRemaining),
          };
        }

        return {
          hasDeficit: false,
          deficitAmount: 0,
          targetPaymentName: '',
          daysRemaining: 0,
          suggestedDailyIncrease: 0,
        };
      },

      getWorkingDaysRemaining: () => get().days.filter((d) => d.isWorkingDay).length,

      getWeeklyTarget: () =>
        get()
          .days.filter((d) => d.isWorkingDay)
          .reduce((acc, d) => acc + (d.dailyTarget || 0), 0),

      getWeeklyActual: () =>
        get().days.reduce(
          (acc, d) => acc + d.platforms.reduce((s, p) => s + p.actualAmount, 0),
          0
        ),

      getCashFlowProjection: (weeks = 6) => {
        const { startingBalance, days, upcomingExpenses } = get();
        const weeklyIncome = days
          .filter((d) => d.isWorkingDay)
          .reduce((acc, d) => acc + (d.dailyTarget || 0), 0);
        const openBills = upcomingExpenses.reduce(
          (acc, e) => acc + Math.max(0, e.amount - (e.paidAmount ?? 0)),
          0
        );
        const weeklyExpense = weeks > 0 ? openBills / weeks : 0;

        const points: ProjectionPoint[] = [];
        let cash = startingBalance;
        for (let i = 0; i <= weeks; i++) {
          if (i > 0) cash = Math.max(0, cash + weeklyIncome - weeklyExpense);
          points.push({
            label: i === 0 ? 'Hoy' : `S${i}`,
            cashOnHand: Math.round(cash),
            expenses: Math.round(i === 0 ? 0 : weeklyExpense),
          });
        }
        return points;
      },

      // ── Ledger sync ──────────────────────────────────────────────────────
      syncToLedger: async () => {
        const snap = get().bankSnapshot;
        const calcBal = get().startingBalance;
        set({ syncing: true });
        try {
          await pushBankSnapshot(snap, calcBal);
          set({ lastSyncAt: new Date().toISOString(), syncing: false });
        } catch {
          set({ syncing: false });
        }
      },

      loadLedgerBills: async () => {
        try {
          const bills = await fetchBills();
          set({ ledgerBills: bills });
        } catch {
          // keep local state
        }
      },

      addLedgerBill: async (bill) => {
        const res = await ledgerAddBill(bill);
        if (res.ok && res.id) {
          const newBill: LedgerBill = { ...bill, id: res.id };
          set((s) => ({ ledgerBills: [...s.ledgerBills, newBill] }));
          return res.id;
        }
        return null;
      },

      updateLedgerBill: async (id, patch) => {
        const res = await ledgerUpdateBill(id, patch);
        if (res.ok) {
          set((s) => ({
            ledgerBills: s.ledgerBills.map((b) =>
              b.id === id ? { ...b, ...patch } : b
            ),
          }));
        }
        return res.ok;
      },

      removeLedgerBill: async (id) => {
        const res = await ledgerDeleteBill(id);
        if (res.ok) {
          set((s) => ({
            ledgerBills: s.ledgerBills.filter((b) => b.id !== id),
          }));
        }
        return res.ok;
      },
    }),
    {
      name: 'copiloto_finance_v2',
      version: 4,
      migrate: (persisted: unknown) => {
        const p = (persisted ?? {}) as Partial<FinanceState>;
        const days =
          p.days && p.days.length === 7
            ? p.days.map((d, i) => ({
                ...d,
                dailyTarget:
                  typeof d.dailyTarget === 'number' && d.dailyTarget > 0
                    ? d.dailyTarget
                    : defaultDays[i]?.dailyTarget ?? 300,
              }))
            : defaultDays;
        return {
          ...p,
          days,
          bankSnapshot: p.bankSnapshot ?? {
            amount: p.startingBalance ?? 1250,
            verifiedAt: null,
            source: 'seed' as BankSource,
          },
          previousBalance: p.previousBalance ?? null,
          upcomingExpenses:
            p.upcomingExpenses && p.upcomingExpenses.length >= 3
              ? p.upcomingExpenses
              : defaultExpenses,
          ledgerBills: [],
          lastSyncAt: null,
          syncing: false,
        };
      },
    }
  )
);
