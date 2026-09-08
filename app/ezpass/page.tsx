"use client";

import { useState, useEffect, useCallback } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { Camera, Search, ChevronLeft, ChevronRight, Plus, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EZPassRecord, EZPassDispute, EZPassSummary, EZPassSource } from "@/lib/ezpass-types";
import { fetchRecordsByMonth, fetchSummary, fetchDisputes, createRecord, updateRecordStatus, createDispute, detectDuplicates, filterBySource } from "@/lib/ezpass-service";
import { generateDisputePDF } from "@/lib/ezpass-pdf";
import SummaryCards from "@/components/ezpass/SummaryCards";
import SourceTabs from "@/components/ezpass/SourceTabs";
import TripCard from "@/components/ezpass/TripCard";
import InvestigationView from "@/components/ezpass/InvestigationView";
import DisputeHistory from "@/components/ezpass/DisputeHistory";
import UploadModal from "@/components/ezpass/UploadModal";

export default function EZPassPage() {
  const [records, setRecords] = useState<EZPassRecord[]>([]);
  const [disputes, setDisputes] = useState<EZPassDispute[]>([]);
  const [summary, setSummary] = useState<EZPassSummary>({
    totalBilled: 0, duplicatesDetected: 0, totalRealToPay: 0,
    pendingCount: 0, verifiedCount: 0, disputedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EZPassSource | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [investigatingRecord, setInvestigatingRecord] = useState<EZPassRecord | null>(null);
  const [showDisputes, setShowDisputes] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsData, summaryData, disputesData] = await Promise.all([
        fetchRecordsByMonth(selectedYear, selectedMonth),
        fetchSummary(selectedYear, selectedMonth),
        fetchDisputes(),
      ]);
      setRecords(recordsData);
      setSummary(summaryData);
      setDisputes(disputesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { unique: uniqueRecords, duplicates: duplicateGroups } = detectDuplicates(records);
  const duplicateIds = new Set(duplicateGroups.flatMap(g => g.records.map(r => r.id)));
  
  const processedRecords = records.map(r => ({
    ...r,
    status: duplicateIds.has(r.id) ? "duplicate" as const : r.status,
  }));

  const filteredRecords = filterBySource(processedRecords, activeTab);

  const tabs: (EZPassSource | "all")[] = ["all", "gps", "screenshot", "ezpass_statement", "company_invoice"];
  const counts = tabs.reduce((acc, tab) => {
    acc[tab] = filterBySource(processedRecords, tab).length;
    return acc;
  }, {} as Record<EZPassSource | "all", number>);

  const handleConfirmDuplicate = async (record: EZPassRecord) => {
    try {
      await updateRecordStatus(record.id, "duplicate");
      await loadData();
    } catch (error) {
      console.error("Error confirming duplicate:", error);
    }
  };

  const handleGenerateDispute = async (record: EZPassRecord) => {
    try {
      const pdfBytes = await generateDisputePDF(record);
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      await createDispute(record.id, [url]);
      await updateRecordStatus(record.id, "disputed");
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `disputa-${record.id}.pdf`;
      a.click();
      
      await loadData();
      setInvestigatingRecord(null);
    } catch (error) {
      console.error("Error generating dispute:", error);
    }
  };

  const handleUpload = async (file: File, source: EZPassSource) => {
    const newRecord: Omit<EZPassRecord, "id" | "created_at" | "updated_at"> = {
      source,
      location: "Ubicación detectada por OCR",
      amount: 9.56,
      trip_date: new Date().toISOString().split("T")[0],
      trip_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "pending",
      screenshot_url: URL.createObjectURL(file),
    };
    await createRecord(newRecord);
    await loadData();
  };

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-sm border-b border-slate-800/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-500 rounded-sm flex items-center justify-center">
              <span className="text-xs font-bold text-white">EZ</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white">E-ZPass</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reconciliación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDisputes(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <History size={16} />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus size={12} />
              Subir
            </button>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/40">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-1 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-1 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Source Tabs */}
        <SourceTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

        {/* Records List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-sm animate-spin"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-slate-800 rounded-sm flex items-center justify-center mx-auto mb-3">
                <Search size={20} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-400">Sin registros</p>
              <p className="text-xs text-slate-600 mt-1">Sube un screenshot para comenzar</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <TripCard
                key={record.id}
                record={record}
                onInvestigate={setInvestigatingRecord}
                onMarkDuplicate={handleConfirmDuplicate}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />

      {investigatingRecord && (
        <InvestigationView
          record={investigatingRecord}
          originalRecord={records.find(r => r.id === investigatingRecord.duplicate_of_id)}
          onClose={() => setInvestigatingRecord(null)}
          onConfirmDuplicate={handleConfirmDuplicate}
          onGenerateDispute={handleGenerateDispute}
        />
      )}

      {showDisputes && (
        <DisputeHistory
          disputes={disputes}
          onClose={() => setShowDisputes(false)}
        />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}