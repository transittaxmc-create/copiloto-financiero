"use client";

import { DollarSign } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NumericInput({ label, value, onChange, placeholder = "$0.00" }: Props): React.ReactElement {
  // Never display "0" or "0.00" - show empty instead for clean UX
  const displayValue = value === "" || value === "0" || value === "0.00" ? "" : value;

  return (
    <div>
      <label className="stat-label mb-1 block">{label}</label>
      <div className="relative">
        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9.]*"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            // Allow only numbers and decimal point, prevent multiple decimals
            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
            const parts = cleaned.split(".");
            if (parts.length > 2) return;
            onChange(cleaned);
          }}
          className="input-field pl-8"
        />
      </div>
    </div>
  );
}
