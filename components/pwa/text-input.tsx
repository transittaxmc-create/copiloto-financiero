"use client";

import { FileText } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function TextInput({ label, value, onChange, placeholder }: Props): React.ReactElement {
  return (
    <div>
      <label className="stat-label mb-1 block">{label}</label>
      <div className="relative">
        <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pl-8"
        />
      </div>
    </div>
  );
}
