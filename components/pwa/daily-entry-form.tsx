"use client";
import { useState, FormEvent, useCallback } from "react";
import { Save, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GPSPickupDropoff } from "./GPSPickupDropoff";
import { NumericInput } from "./numeric-input";
import { TextInput } from "./text-input";

const PLATFORMS = [
  { id: "uber", name: "Uber", icon: "??" },
  { id: "lyft", name: "Lyft", icon: "??" },
  { id: "via", name: "Via", icon: "??" },
  { id: "gotham", name: "Gotham", icon: "??" },
  { id: "alter", name: "Alter", icon: "??" },
  { id: "other", name: "Otro", icon: "??" },
];

interface TripFormData {
  platform: string;
  earnings: string;
  extraCash: string;
  tips: string;
  tolls: string;
  platformFee: string;
  blackCarPhonesFee: string;
  refInvoice: string;
  notes: string;
}

// Empty initial state - no zeros!
const emptyFormData: TripFormData = {
  platform: "",
  earnings: "",
  extraCash: "",
  tips: "",
  tolls: "",
  platformFee: "",
  blackCarPhonesFee: "",
  refInvoice: "",
  notes: "",
};

interface LocationData {
  address: string;
  city: string;
  lat: number;
  lng: number;
  placeType?: "airport" | "hospital" | "business" | "residence" | "other";
  timestamp: Date;
}

interface Props {
  onTripSaved?: (data: TripFormData & { pickup: LocationData; dropoff: LocationData }) => void;
}

export function DailyEntryForm({ onTripSaved }: Props): React.ReactElement {
  const [formData, setFormData] = useState<TripFormData>(emptyFormData);
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((field: keyof TripFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(emptyFormData);
    setPickup(null);
    setDropoff(null);
    setError(null);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.platform) {
      setError("Selecciona una plataforma");
      return;
    }
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (onTripSaved && pickup && dropoff) {
        onTripSaved({ ...formData, pickup, dropoff });
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals - only show when there's actual data
  const gross = (parseFloat(formData.earnings) || 0) 
    + (parseFloat(formData.extraCash) || 0) 
    + (parseFloat(formData.tips) || 0) 
    + (parseFloat(formData.tolls) || 0);
    
  const deductions = (parseFloat(formData.platformFee) || 0) 
    + (parseFloat(formData.blackCarPhonesFee) || 0);
    
  const net = gross - deductions;
  
  const hasData = gross > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Platform Selection */}
      <div>
        <label className="stat-label mb-2 block">PLATAFORMA</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleChange("platform", p.id)}
              className={cn(
                "surface flex flex-col items-center gap-1 p-3 transition-all active:scale-[0.98]",
                formData.platform === p.id 
                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30" 
                  : "hover:bg-slate-700/50"
              )}
            >
              <span className="text-xl">{p.icon}</span>
              <span className={cn(
                "text-xs font-medium",
                formData.platform === p.id ? "text-emerald-400" : "text-slate-300"
              )}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* GPS Pickup/Dropoff */}
      <GPSPickupDropoff 
        onPickupCapture={setPickup} 
        onDropoffCapture={setDropoff} 
        pickupLocation={pickup} 
        dropoffLocation={dropoff} 
      />

      {/* Income Fields */}
      <div className="grid grid-cols-2 gap-3">
        <NumericInput 
          label="Ganancia Base" 
          value={formData.earnings} 
          onChange={(v) => handleChange("earnings", v)} 
          placeholder="$0.00" 
        />
        <NumericInput 
          label="Extra Cash" 
          value={formData.extraCash} 
          onChange={(v) => handleChange("extraCash", v)} 
          placeholder="$0.00" 
        />
        <NumericInput 
          label="Propinas" 
          value={formData.tips} 
          onChange={(v) => handleChange("tips", v)} 
          placeholder="$0.00" 
        />
        <NumericInput 
          label="Peajes" 
          value={formData.tolls} 
          onChange={(v) => handleChange("tolls", v)} 
          placeholder="$0.00" 
        />
        <NumericInput 
          label="Fee Plataforma" 
          value={formData.platformFee} 
          onChange={(v) => handleChange("platformFee", v)} 
          placeholder="$0.00" 
        />
        <NumericInput 
          label="Black Car Phones" 
          value={formData.blackCarPhonesFee} 
          onChange={(v) => handleChange("blackCarPhonesFee", v)} 
          placeholder="$0.00" 
        />
      </div>

      {/* Reference/Invoice */}
      <TextInput 
        label="Ref / Invoice" 
        value={formData.refInvoice} 
        onChange={(v) => handleChange("refInvoice", v)} 
        placeholder="ej. 12345" 
      />

      {/* Totals Summary - Only show when there's data */}
      {hasData && (
        <div className="surface-elevated rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="stat-label">GROSS</span>
            <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-slate-50">
              ${gross.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-slate-700/50 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Deducciones</span>
              <span className="text-sm text-amber-400">-${deductions.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="stat-label">NET</span>
              <span className={cn(
                "font-[family-name:var(--font-space-grotesk)] text-2xl font-bold",
                net >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                ${net.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="stat-label mb-1 block">Notas</label>
        <textarea 
          placeholder="Notas adicionales del viaje..." 
          value={formData.notes} 
          onChange={(e) => handleChange("notes", e.target.value)} 
          rows={2} 
          className="input-field resize-none" 
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={isSaving || !formData.platform}
        className={cn(
          "btn-primary w-full",
          showSuccess && "bg-emerald-500 hover:bg-emerald-500"
        )}
      >
        {isSaving ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
        ) : showSuccess ? (
          <><Save size={18} /><span>? Guardado</span></>
        ) : (
          <><Plus size={18} /><span>Guardar Viaje</span></>
        )}
      </button>
      
      {!formData.platform && (
        <p className="text-center text-xs text-slate-500">
          Selecciona una plataforma para guardar
        </p>
      )}
    </form>
  );
}
