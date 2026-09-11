"use client";

import { useState, useEffect } from "react";

export function DailyEntryHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [address, setAddress] = useState("Obteniendo ubicación...");
  const [isGpsActive, setIsGpsActive] = useState(false);

  // 1. Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. GPS en tiempo real (Watch Position)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        setIsGpsActive(true);
        const { latitude, longitude } = position.coords;

        // Usamos Nominatim (OpenStreetMap) - gratis, sin API key
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const road = data.address.road || "Calle desconocida";
          const city = data.address.city || data.address.town || data.address.village || "";
          setAddress(`${road}, ${city}`);
        } catch {
          setAddress("Sin señal de GPS");
        }
      },
      () => setAddress("GPS no disponible"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col justify-start items-start p-4 bg-[#0B132B] text-white border-b border-gray-800 w-full">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-bold">{greeting}, Miguel.</h1>
        <span className={`text-xs font-semibold ${isGpsActive ? "text-green-400" : "text-red-400"}`}>
          {isGpsActive ? "GPS activo" : "GPS inactivo"}
        </span>
      </div>
      <p className="text-xs text-yellow-500 mt-1">{formattedDate} · {formattedTime}</p>
      <div className="flex items-center gap-2 mt-2 h-5 overflow-hidden w-full">
        <span className="text-xs">📍</span>
        <p className="text-xs text-gray-300 truncate">{address}</p>
      </div>
    </div>
  );
}