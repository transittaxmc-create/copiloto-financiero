"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ProactiveNotifier() {
  const supabase = useSupabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const runSolver = async () => {
    try {
      // 1. Obtener el ultimo balance real
      const { data: lastBalance } = await supabase
        .from("daily_balances")
        .select("closing_balance")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      const currentBalance = lastBalance?.closing_balance || 0;

      // 2. Obtener los proximos gastos fijos activos
      const { data: bills } = await supabase
        .from("fixed_expenses")
        .select("*")
        .eq("is_active", true);

      // 3. Obtener el promedio diario de ingresos proyectados
      const { data: schedules } = await supabase
        .from("schedules")
        .select("projected_amount")
        .eq("is_working", true);

      const avgDailyProjection = schedules?.length
        ? schedules.reduce((sum: number, s: { projected_amount?: number }) => sum + (s.projected_amount || 0), 0) / schedules.length
        : 150;

      // 4. Calcular la proxima fecha de pago para cada bill
      const today = new Date();
      const upcomingBills = (bills || [])
        .map((bill: { due_day: number; amount: number; name: string; [key: string]: unknown }) => {
          const nextDue = new Date(today);
          nextDue.setDate(bill.due_day);
          if (nextDue < today) nextDue.setMonth(nextDue.getMonth() + 1);
          return { ...bill, nextDue };
        })
        .filter((bill: { nextDue: Date }) => bill.nextDue <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000))
        .sort((a: { nextDue: Date }, b: { nextDue: Date }) => a.nextDue.getTime() - b.nextDue.getTime());

      // 5. Ejecutar el algoritmo Solver
      const alerts: Omit<Notification, "id" | "is_read" | "created_at">[] = [];

      for (const bill of upcomingBills) {
        const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const potentialEarnings = daysUntilDue * avgDailyProjection;
        const totalAvailable = currentBalance + potentialEarnings;

        if (totalAvailable < (bill.amount as number)) {
          const shortfall = (bill.amount as number) - totalAvailable;
          const hoursNeeded = Math.ceil(shortfall / 65);
          alerts.push({
            type: "warning",
            title: `Alerta: ${bill.name as string}`,
            message: `Para el ${bill.nextDue.toLocaleDateString()} (${daysUntilDue} dias), te faltan $${shortfall}. Trabaja ${hoursNeeded}h extra.`,
          });
        } else {
          alerts.push({
            type: "success",
            title: `Bien: ${bill.name as string}`,
            message: `Tienes suficiente. Te sobran $${(totalAvailable - (bill.amount as number)).toFixed(2)}.`,
          });
        }
      }

      // 6. Guardar alertas (sin duplicar las del dia)
      for (const alert of alerts) {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("title", alert.title)
          .gte("created_at", new Date().toISOString().split("T")[0]);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert(alert);
        }
      }

      // 7. Cargar alertas para mostrar
      const { data: freshNotifications } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setNotifications(freshNotifications || []);
    } catch (error) {
      console.error("Error ejecutando el Solver:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSolver();
    const interval = setInterval(runSolver, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="bg-[#1E293B] border border-gray-800 p-6 rounded-xl">
      <div className="flex items-center justify-center gap-3">
        <RefreshCw className="h-5 w-5 animate-spin text-sky-400" />
        <span className="text-gray-400">Analizando flujo de caja...</span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1E293B] border border-gray-800 p-5 rounded-xl">
      <h3 className="text-lg font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-sky-400" />
        Asistente Financiero Proactivo
      </h3>
      
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={cn(
                "p-4 rounded-xl border",
                n.type === "warning" && "bg-red-500/10 border-red-500/30",
                n.type === "success" && "bg-emerald-500/10 border-emerald-500/30",
                n.type === "info" && "bg-sky-500/10 border-sky-500/30"
              )}
            >
              <div className="flex items-start gap-3">
                {n.type === "warning" && <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />}
                {n.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold text-[#F8FAFC]">{n.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-gray-400">No hay alertas pendientes. Tu caja esta estable.</p>
        </div>
      )}
    </div>
  );
}
