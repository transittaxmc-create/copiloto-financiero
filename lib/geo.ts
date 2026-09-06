// TomTom Geocoding Service for NYC Rideshare GPS
// Docs: https://developer.tomtom.com/search-api/documentation

export interface Coords { lat: number; lng: number; }
export interface Address { address: string; city: string; state: string; zipCode: string; fullAddress: string; }
export type PlaceType = "airport" | "hospital" | "business" | "residence" | "other";
export interface Place { id: string; name: string; type: PlaceType; address: string; city: string; coordinates: Coords; icon: string; }

const BASE_URL = "https://api.tomtom.com";
const API_KEY = process.env.TOMTOM_API_KEY;

const TYPE_MAP: Record<string, PlaceType> = {
  airport: "airport", "air port": "airport", hospital: "hospital", "medical center": "hospital",
  office: "business", "business center": "business", company: "business", home: "residence",
  house: "residence", apartment: "residence", residential: "residence",
};

const ICONS: Record<PlaceType, string> = { airport: "✈️", hospital: "🏥", business: "🏢", residence: "🏠", other: "📍" };

/** Get browser GPS location */
export async function getCurrentLocation(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => { console.error(e.message); resolve(null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/** Reverse geocode coords → address */
export async function reverseGeocode(c: Coords): Promise<Address | null> {
  if (!API_KEY) return null;
  try {
    const r = await fetch(`${BASE_URL}/search/2/reverseGeocode/${c.lat},${c.lng}.json?key=${API_KEY}&radius=100`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!d.addresses?.length) return null;
    const a = d.addresses[0];
    return { address: a.streetName || a.street || "Unknown", city: a.municipality || a.city || "NYC", state: a.state || "NY", zipCode: a.postalCode || "", fullAddress: a.freeformAddress || "" };
  } catch (e) { console.error(e); return null; }
}

/** Search nearby POIs */
export async function searchNearby(c: Coords, q: string = ""): Promise<Place[]> {
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({ key: API_KEY, lat: String(c.lat), lon: String(c.lng), limit: "10", radius: "5000" });
    if (q) params.set("query", q);
    const r = await fetch(`${BASE_URL}/search/2/poiSearch/${encodeURIComponent(q || "poi")}.json?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return (d.results || []).map((r: any): Place => {
      const poi = r.poi || {}; const cat = (poi.categories?.[0] || "").toLowerCase();
      let type: PlaceType = "other";
      for (const [k, v] of Object.entries(TYPE_MAP)) { if (cat.includes(k)) { type = v as PlaceType; break; } }
      return { id: r.id || poi.id || String(Math.random()), name: poi.names?.[0] || poi.name || "Unknown", type, address: r.address?.freeformAddress || "", city: r.address?.municipality || "NYC", coordinates: { lat: r.position?.lat || c.lat, lng: r.position?.lon || c.lng }, icon: ICONS[type] };
    });
  } catch (e) { console.error(e); return []; }
}

/** Calculate distance in miles (Haversine) */
export function distance(from: Coords, to: Coords): number {
  const R = 3959, dLat = (to.lat - from.lat) * Math.PI / 180, dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(from.lat * Math.PI/180) * Math.cos(to.lat * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/** Detect place type from address keywords */
export function detectType(address: string, name: string = ""): PlaceType {
  const t = `${address} ${name}`.toLowerCase();
  if (t.includes("airport") || t.includes("jfk") || t.includes("lga")) return "airport";
  if (t.includes("hospital") || t.includes("medical") || t.includes("clinic")) return "hospital";
  if (t.includes("office") || t.includes("business") || t.includes("hotel")) return "business";
  if (t.includes("home") || t.includes("house") || t.includes("apartment")) return "residence";
  return "other";
}
