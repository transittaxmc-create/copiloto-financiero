"use client";

import DailyEntry from "@/components/DailyEntry";
import Register from "@/components/RegisterFlow";
import Expenses from "@/components/Expenses";

export default function HomePage() {
  return (
    <main>
      <DailyEntry />
      <Register />
      <Expenses />
    </main>
  );
}
