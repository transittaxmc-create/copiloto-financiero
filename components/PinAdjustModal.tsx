"use client";

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, X, Check } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

interface PinResult {
  name: string;
  city: string;
  time: string;
  fullAddress?: string;
  category?: string;
  type?: 'business' | 'residence' | 'unknown';
  lat?: number;
  lng?: number;
  accuracy?: number;
  capturedAt?: string;
}

interface Props {
  open: boolean;
  initial?: { lat: number; lng: number } | null;
  title: string;
  onClose: () => void;
  onConfirm: (loc: PinResult) => void;
}

const FALLBACK_COORDS = { lat: 40.6795, lng: -73.3732 }; // Lindenhurst, NY

export default function PinAdjustModal({ open, initial, title, onClose, onConfirm }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Posición inicial: el pin capturado, o geolocalizar al abrir
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    if (initial) {
      setCoords(initial);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => {
          if (cancelled) return;
          setCoords(FALLBACK_COORDS);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCoords(FALLBACK_COORDS);
    }

    return () => {
      cancelled = true;
    };
  }, [open, initial]);

  // Inicializar el mapa Leaflet cuando el modal esté abierto (import dinámico: solo cliente)
  useEffect(() => {
    if (!open || !coords || !mapEl.current) return;
    let disposed = false;

    (async () => {
      const L = await import('leaflet');
      if (disposed || !mapEl.current) return;

      if (!mapRef.current) {
        const map = L.map(mapEl.current, { zoomControl: true }).setView([coords.lat, coords.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        mapRef.current = map;

        const icon = L.divIcon({
          className: '',
          html: '<div style="font-size:30px;line-height:1;transform:translate(-15px,-30px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">📍</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });
        markerRef.current = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const p = markerRef.current!.getLatLng();
          setCoords({ lat: p.lat, lng: p.lng });
        });
      } else {
        mapRef.current.setView([coords.lat, coords.lng], 16);
        markerRef.current?.setLatLng([coords.lat, coords.lng]);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [open, coords]);

  // Destruir el mapa al cerrar
  useEffect(() => {
    if (!open) {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const confirmPin = async () => {
    if (!coords) return;
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`
      );
      const data = await res.json();
      const road = data.address?.road || data.address?.neighbourhood || 'Ubicación ajustada';
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Local';
      const houseNumber = data.address?.house_number || '';
      const state = data.address?.state || '';
      const postcode = data.address?.postcode || '';
      const fullAddress = `${houseNumber} ${road}, ${city}, ${state} ${postcode}`.trim();
      const categories = `${data.category || ''} ${data.type || ''}`;
      const isBusiness = categories.includes('shop') || categories.includes('amenity') || categories.includes('tourism') || categories.includes('office') || (data.name && data.name !== road);
      onConfirm({
        name: isBusiness && data.name ? data.name : road,
        city,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        fullAddress,
        category: data.category || data.type || '',
        type: isBusiness ? 'business' : 'residence',
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 5, // pin ajustado a mano = confirmado
        capturedAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      onConfirm({
        name: 'Ubicación ajustada',
        city: 'Local',
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 5,
        capturedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setResolving(false);
    }
  };
return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0B132B] border-b border-slate-700/60">
        <div>
          <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <MapPin size={15} className="text-[#10B981]" /> {title}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Arrastra el pin al punto exacto ·{' '}
            {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Localizando…'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div ref={mapEl} className="absolute inset-0" />
        {locating && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[500]">
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-2 text-slate-200 text-sm font-semibold">
              <Loader2 size={16} className="animate-spin text-[#10B981]" /> Localizando…
            </div>
          </div>
        )}
        {!coords && !locating && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[500]">
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm font-semibold">
              No se pudo ubicar una posición inicial
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-[#0B132B] border-t border-slate-700/60 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 font-bold text-xs uppercase tracking-wide hover:bg-slate-800/60 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmPin}
          disabled={!coords || resolving}
          className="flex-[1.5] py-3 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-slate-950 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-[#10B981]/25 disabled:opacity-50"
        >
          {resolving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="stroke-[3]" />}
          Confirmar pin
        </button>
      </div>
    </div>
  );
}