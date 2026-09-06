"use client";
import { useState } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import { FileText, Download, Calendar, DollarSign, TrendingUp, Car, Receipt, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportType { id: string; name: string; description: string; icon: React.ReactNode; lastGenerated?: string; }

const REPORTS: ReportType[] = [
  { id: "schedule-c", name: "Schedule C (1040)", description: "Profit or Loss from Business", icon: <FileText size={24} />, lastGenerated: "Sep 5, 2026" },
  { id: "mileage", name: "Mileage Deduction Log", description: "IRS Form 4562 - Depreciation", icon: <Car size={24} />, lastGenerated: "Sep 3, 2026" },
  { id: "quarterly", name: "Quarterly Estimate", description: "ESV Tax Payment Summary", icon: <Calendar size={24} />, lastGenerated: "Jul 15, 2026" },
  { id: "annual", name: "Annual Summary", description: "Full Year Income Statement", icon: <DollarSign size={24} /> },
  { id: "expenses", name: "Expense Report", description: "Itemized Business Expenses", icon: <Receipt size={24} />, lastGenerated: "Aug 31, 2026" },
  { id: "bank", name: "Bank Reconciliation", description: "Cash Flow Analysis", icon: <TrendingUp size={24} /> },
];

const TAX_SUMMARY = {
  grossIncome: 15234.50,
  deductions: { mileage: 4256.80, tolls: 892.45, phone: 1200.00, insurance: 2400.00, maintenance: 680.00, other: 234.50 },
  netProfit: 6571.75,
  taxReserve: 1642.94,
  quarterliesPaid: 3200.00,
  balanceDue: 0,
};

export default function ReportsPage(): React.ReactElement {
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerating(null);
    setSelectedReport(reportId);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DailyEntryHeader />
      <div className="flex-1 space-y-4 px-4 pt-4">
        {/* Tax Summary */}
        <div className="surface-elevated rounded-2xl p-4">
          <h3 className="stat-label mb-3"><DollarSign size={14} className="inline mr-2" />Resumen Fiscal YTD</h3>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-500/10 p-3">
            <div><p className="text-xs text-emerald-400">Net Profit (YTD)</p><p className="text-2xl font-bold text-emerald-400">${TAX_SUMMARY.netProfit.toFixed(2)}</p></div>
            <div className="text-right"><p className="text-xs text-sky-400">Colchón Apartado</p><p className="text-lg font-bold text-sky-400">${TAX_SUMMARY.taxReserve.toFixed(2)}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="surface rounded-xl p-3"><p className="text-[10px] text-slate-400">Quarterlies Pagados</p><p className="font-bold text-emerald-400">${TAX_SUMMARY.quarterliesPaid.toFixed(2)}</p></div>
            <div className="surface rounded-xl p-3"><p className="text-[10px] text-slate-400">Balance</p><p className="font-bold text-slate-100">${TAX_SUMMARY.balanceDue.toFixed(2)}</p></div>
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="surface rounded-xl p-4">
          <h4 className="stat-label mb-3">Deducciones YTD</h4>
          <div className="space-y-2">
            {Object.entries(TAX_SUMMARY.deductions).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-slate-400 capitalize">{key}</span>
                <span className="font-semibold text-amber-400">${value.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-700/50 pt-2 flex justify-between text-sm">
              <span className="text-slate-300 font-semibold">Total Deducciones</span>
              <span className="font-bold text-emerald-400">${Object.values(TAX_SUMMARY.deductions).reduce((a, b) => a + b, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-2">
          <h3 className="stat-label"><FileText size={14} className="inline mr-2" />Reportes Disponibles</h3>
          {REPORTS.map((report) => (
            <div key={report.id} className="surface p-4">
              <div className="flex items-start gap-3">
                <div className={cn("surface-elevated rounded-xl p-3", selectedReport === report.id && "bg-emerald-500/20")}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">{report.name}</p>
                  <p className="text-xs text-slate-400">{report.description}</p>
                  {report.lastGenerated && <p className="mt-1 text-[10px] text-slate-500">Último: {report.lastGenerated}</p>}
                </div>
                <button onClick={() => handleGenerate(report.id)} disabled={generating === report.id} className="chip chip-blue">
                  {generating === report.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-500" /> : generating === null && selectedReport === report.id ? <><Printer size={14} />Ver</> : <><Download size={14} />PDF</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Generate All Button */}
        <button className="btn-primary w-full"><Download size={18} className="inline mr-2" />Generar Todos los Reportes</button>
      </div>
      <BottomNav />
    </div>
  );
}