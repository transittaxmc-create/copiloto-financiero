"use client";
import { useState } from "react";
import { MapPin, Plane, Building2, Home, Crosshair, Loader2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentLocation, reverseGeocode, detectType, type PlaceType } from "@/lib/geo";

interface LocationData {
  address: string;
  city: string;
  lat: number;
  lng: number;
  placeType?: PlaceType;
  timestamp: Date;
}

interface Props {
  onPickupCapture?: (data: LocationData) => void;
  onDropoffCapture?: (data: LocationData) => void;
  pickupLocation?: LocationData | null;
  dropoffLocation?: LocationData | null;
}

// Dynamic icons based on place type
function PlaceIcon({ type, size = 14 }: { type?: PlaceType; size?: number }) {
  const className = size === 14 ? "text-sm" : "text-base";
  switch (type) {
    case "airport": return <Plane size={size} className={cn("text-sky-400", className)} />;
    case "hospital": return <Crosshair size={size} className={cn("text-red-400", className)} />;
    case "business": return <Building2 size={size} className={cn("text-amber-400", className)} />;
    case "residence": return <Home size={size} className={cn("text-emerald-400", className)} />;
    default: return <Navigation size={size} className={cn("text-slate-400", className)} />;
  }
}

// Place type labels
function PlaceTypeLabel({ type }: { type?: PlaceType }) {
  switch (type) {
    case "airport": return "✈️ Aeropuerto";
    case "hospital": return "🏥 Hospital";
    case "business": return "🏢 Negocio";
    case "residence": return "🏠 Residencia";
    default: return "📍 Ubicación";
  }
}

// GPS Box with fixed height and truncation
function GPSBox({ 
  label, 
  location, 
  onCapture, 
  colorClass, 
  buttonText, 
  isLoading 
}: { 
  label: string; 
  location: LocationData | null; 
  onCapture: () => void; 
  colorClass: string; 
  buttonText: string; 
  isLoading: boolean; 
}) {
  const placeType = location ? detectType(location.address) : undefined;
  const timeStr = location ? new Date(location.timestamp).toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";
  
  return (
    <div className="flex flex-col gap-2">
      <label className="stat-label">{label}</label>
      <button 
        onClick={onCapture} 
        disabled={isLoading} 
        className={cn(
          "w-full rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]",
          colorClass,
          isLoading && "opacity-50"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MapPin size={16} />
          )}
          <span>{isLoading ? "Capturando..." : buttonText}</span>
        </div>
      </button>
      {/* Fixed height container with truncation */}
      <div className={cn(
        "surface flex h-[60px] items-center gap-2 overflow-hidden p-3 transition-colors",
        location ? "border-emerald-500/30" : "border-slate-700/30"
      )}>
        {location ? (
          <>
            <PlaceIcon type={placeType} size={16} />
            <div className="flex flex-1 flex-col justify-center overflow-hidden">
              <div className="flex items-center gap-1">
                <PlaceTypeLabel type={placeType} />
              </div>
              <p className="truncate text-xs text-slate-400 max-w-full">{location.city || "NYC"}</p>
            </div>
            <span className="flex-shrink-0 text-xs text-sky-400 font-medium">{timeStr}</span>
          </>
        ) : (
          <p className="w-full text-center text-xs text-slate-500">
            Captura {label.toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
}

export function GPSPickupDropoff({ onPickupCapture, onDropoffCapture, pickupLocation, dropoffLocation }: Props): React.ReactElement {
  const [loading, setLoading] = useState<"pickup" | "dropoff" | null>(null);

  const captureLocation = async (type: "pickup" | "dropoff") => {
    setLoading(type);
    try {
      const coords = await getCurrentLocation();
      if (!coords) { 
        alert("No se pudo obtener ubicación. Verifica permisos de GPS."); 
        setLoading(null); 
        return; 
      }
      const address = await reverseGeocode(coords);
      const placeType = address ? detectType(address.fullAddress) : "other";
      const data: LocationData = { 
        address: address?.address || "Unknown", 
        city: address?.city || "NYC", 
        lat: coords.lat, 
        lng: coords.lng, 
        placeType, 
        timestamp: new Date() 
      };
      if (type === "pickup" && onPickupCapture) onPickupCapture(data);
      else if (type === "dropoff" && onDropoffCapture) onDropoffCapture(data);
    } catch (e) { 
      console.error(e); 
      alert("Error capturando ubicación"); 
    }
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <GPSBox 
        label="PICKUP" 
        location={pickupLocation ?? null} 
        onCapture={() => captureLocation("pickup")} 
        colorClass="border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" 
        buttonText="Pickup" 
        isLoading={loading === "pickup"} 
      />
      <GPSBox 
        label="DROPOFF" 
        location={dropoffLocation ?? null} 
        onCapture={() => captureLocation("dropoff")} 
        colorClass="border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20" 
        buttonText="Dropoff" 
        isLoading={loading === "dropoff"} 
      />
    </div>
  );
}