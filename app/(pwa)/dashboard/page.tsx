"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { DailyEntryHeader } from "@/components/pwa/daily-entry-header";
import ProactiveNotifier from "@/components/pwa/proactive-notifier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wallet, DollarSign, Calendar, RefreshCw, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface Balance { closing_balance: number; date: string; }
interface Bill { id: string; name: string; amount: number; due_day: number; is_active: boolean; }
interface Schedule { id: string; day_of_week: number; is_working: boolean; projected_amount: number; }

export default function Dashboard() {
  const supabase = useSupabase();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ultimo balance cerrado
        const { data: balanceData } = await supabase
          .from("daily_balances")
          .select("closing_balance, date")
          .order("date", { ascending: false })
          .limit(1)
          .single();
        setBalance(balanceData);

        // 2. Gastos fijos activos
        const { data: billsData } = await supabase
          .from("fixed_expenses")
          .select("*")
          .eq("is_active", true);
        setBills(billsData || []);

        // 3. Dias de trabajo
        const { data: schedulesData } = await supabase
          .from("schedules")
          .select("*");
        setSchedules(schedulesData || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 animate-spin text-sky-400 mx-auto mb-2" />
        <p className="text-gray-400">Cargando Dashboard...</p>
      </div>
    </div>
  );

  const days = [
    { n: "Lun", d: 1 }, { n: "Mar", d: 2 }, { n: "Mie", d: 3 },
    { n: "Jue", d: 4 }, { n: "Vie", d: 5 }, { n: "Sab", d: 6 }, { n: "Dom", d: 7 }
  ];

  const getNextDueDate = (dueDay: number): string => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
    return dueDate.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  };

  const getDaysUntilDue = (dueDay: number): number => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
    return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  };

  const totalPending = bills.reduce((sum, b) => sum + b.amount, 0);
  const weeklyProjection = schedules.filter(s => s.is_working).reduce((sum, s) => sum + (s.projected_amount || 150), 0);

  return (
    <div className="min-h-screen bg-[#0F172A] pb-28 lg:pb-0">
      <DailyEntryHeader />
      <div className="px-4 py-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Saldo Real */}
          <Card className="bg-[#1E293B] border-gray-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-gray-300 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                Saldo Real del Banco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-4xl font-bold font-mono", balance && balance.closing_balance > 0 ? "text-emerald-400" : "text-red-400")}>
                ${balance?.closing_balance?.toFixed(2) || "0.00"}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Ultimo cierre: {balance ? new Date(balance.date).toLocaleDateString("es-ES", { month: "long", day: "numeric", year: "numeric" }) : "Sin datos"}
              </p>
              <Badge className="mt-3" variant={balance && balance.closing_balance > 0 ? "default" : "destructive"}>
                {balance && balance.closing_balance > 0 ? "Balance Positivo" : "Revisar Balance"}
              </Badge>
            </CardContent>
          </Card>

          {/* Gastos Fijos */}
          <Card className="bg-[#1E293B] border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-300 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                Gastos Fijos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bills.length > 0 ? bills.map(b => {
                const daysUntil = getDaysUntilDue(b.due_day);
                const urgent = daysUntil <= 3;
                return (
                  <div key={b.id} className={cn("flex justify-between items-center p-3 rounded-lg", urgent ? "bg-red-500/10 border border-red-500/30" : "bg-[#0F172A]")}>
                    <div>
                      <p className="text-sm text-gray-200">{b.name}</p>
                      <p className={cn("text-xs", urgent ? "text-red-400" : "text-gray-500")}>
                        {urgent ? `${daysUntil} dias` : getNextDueDate(b.due_day)}
                      </p>
                    </div>
                    <span className={cn("font-bold", urgent ? "text-red-400" : "text-amber-400")}>${b.amount.toFixed(2)}</span>
                  </div>
                );
              }) : <p className="text-sm text-gray-500 text-center py-4">Sin gastos configurados</p>}
              {bills.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-medium">Total Pendiente</span>
                  <span className="font-bold text-red-400 text-lg">${totalPending.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendario Semanal */}
          <Card className="bg-[#1E293B] border-gray-800 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-300 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-violet-400" />
                  Plan de Trabajo Semanal
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500/50 mr-1"></span>ON</span>
                  <span className="text-gray-500"><span className="inline-block w-3 h-3 rounded-full bg-gray-700 mr-1"></span>OFF</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-3">
                {days.map(day => {
                  const sch = schedules.find(s => s.day_of_week === day.d);
                  const isOn = sch?.is_working || false;
                  return (
                    <div key={day.d} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">{day.n}</span>
                      <div className={cn("w-full h-16 rounded-xl flex flex-col items-center justify-center transition-all", isOn ? "bg-emerald-500/20 border-2 border-emerald-500/50" : "bg-gray-800/50 border-2 border-transparent")}>
                        {isOn ? (
                          <><Power className="h-4 w-4 text-emerald-400 mb-1" /><span className="text-sm font-bold text-emerald-400">${sch?.projected_amount || 150}</span></>
                        ) : <span className="text-xs text-gray-500 font-medium">OFF</span>}
                      </div>
                      <Switch checked={isOn} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-400">Proyeccion semanal</span>
                <span className="text-xl font-bold text-emerald-400">${weeklyProjection.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ProactiveNotifier - Ancho Completo */}
        <div className="w-full">
          <ProactiveNotifier />
        </div>
      </div>
    </div>
  );
}
