"use client";

import { Register } from "@/app/components/Register";
import { BottomNav } from "@/components/pwa/bottom-nav";

export default function RegisterPage() {
  const handleReconcile = () => {
    alert("Funcionalidad de reconciliacion con invoices");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24">
      <div className="px-4 py-6">
        <Register onReconcile={handleReconcile} />
      </div>
      <BottomNav />
    </div>
  );
}
