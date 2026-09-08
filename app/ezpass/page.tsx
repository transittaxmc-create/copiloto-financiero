"use client";

import { useState, useEffect, useCallback } from "react";
import { BottomNav } from "@/components/pwa/bottom-nav";
import { Camera, Search, AlertTriangle, ChevronLeft, ChevronRight, FileText, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-[#0F172A] text-white pb-20">
      <div className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg">E-ZPass Reconciliación</h1>
              <p className="text-xs text-slate-400">Anti-Duplicados & Disputas</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-sky-500 hover:bg-sky-400 text-white p-2.5 rounded-xl transition-colors"
          >
            <Camera size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 px-4 pb-3">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium w-24 text-center">
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
            className="text-slate-400 hover:text-white p-1"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <SummaryCards summary={summary} />
        <SourceTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 text-sm mt-2">Cargando registros...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Search size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay registros para este mes</p>
              <p className="text-slate-500 text-xs mt-1">Sube un screenshot o statement para comenzar</p>
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