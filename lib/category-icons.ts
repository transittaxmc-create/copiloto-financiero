// getCategoryIcon — mapa de 24 categorías de lugares/POIs (Master System Prompt, sección 2)
// Entrada: clave de categoría normalizada; salida: emoji + etiqueta legible.
// Regla: Nominatim comercial → ícono de categoría; residencial → 🏠 Residencia.

export interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryInfo[] = [
  { key: "airport", label: "Aeropuerto", icon: "✈️" },
  { key: "hospital/clinic", label: "Hospital o clínica", icon: "🏥" },
  { key: "hotel/lodging", label: "Hotel o hospedaje", icon: "🏨" },
  { key: "education", label: "Escuela o universidad", icon: "🏫" },
  { key: "commercial_office", label: "Oficina o edificio", icon: "🏢" },
  { key: "retail_shopping", label: "Tienda o shopping", icon: "🛒" },
  { key: "restaurant", label: "Restaurante", icon: "🍽️" },
  { key: "transit_station", label: "Estación (tren/metro)", icon: "🚉" },
  { key: "gas_station", label: "Gasolinera", icon: "⛽" },
  { key: "pharmacy", label: "Farmacia", icon: "💊" },
  { key: "salon_spa", label: "Peluquería / Spa", icon: "✂️" },
  { key: "cafe_bakery", label: "Cafetería / Panadería", icon: "☕" },
  { key: "nightlife_bar", label: "Bar / Discoteca", icon: "🍺" },
  { key: "bank_finance", label: "Banco / Cajero", icon: "🏦" },
  { key: "postal_courier", label: "Correo / Envíos", icon: "📦" },
  { key: "automotive_service", label: "Taller mecánico", icon: "🛠️" },
  { key: "gym_sports", label: "Gimnasio", icon: "🏋️" },
  { key: "stadium", label: "Estadio", icon: "🏟️" },
  { key: "entertainment_cinema", label: "Cine / Teatro", icon: "🎬" },
  { key: "park_recreation", label: "Parque", icon: "🌳" },
  { key: "government_public", label: "Gobierno / Comisaría", icon: "🏛️" },
  { key: "place_of_worship", label: "Lugar de culto", icon: "⛪" },
  { key: "public_business", label: "Negocio público", icon: "📍" },
  { key: "residence", label: "Residencia", icon: "🏠" },
];

const ALIASES: Record<string, string> = {
  "aerodrome": "airport", "heliport": "airport", "gate": "airport",
  "hospital": "hospital/clinic", "clinic": "hospital/clinic", "doctors": "hospital/clinic",
  "hotel": "hotel/lodging", "motel": "hotel/lodging", "hostel": "hotel/lodging", "guest_house": "hotel/lodging", "inn": "hotel/lodging",
  "school": "education", "university": "education", "college": "education", "kindergarten": "education",
  "office": "commercial_office", "commercial": "commercial_office",
  "shop": "retail_shopping", "mall": "retail_shopping", "supermarket": "retail_shopping", "grocery": "retail_shopping", "department_store": "retail_shopping",
  "restaurant": "restaurant", "fast_food": "restaurant", "food_court": "restaurant",
  "station": "transit_station", "train_station": "transit_station", "subway": "transit_station", "bus_stop": "transit_station", "tram_stop": "transit_station", "ferry_terminal": "transit_station",
  "fuel": "gas_station", "gas_station": "gas_station",
  "pharmacy": "pharmacy",
  "hairdresser": "salon_spa", "barber": "salon_spa", "beauty": "salon_spa", "spa": "salon_spa", "sauna": "salon_spa",
  "cafe": "cafe_bakery", "coffee": "cafe_bakery", "bakery": "cafe_bakery", "pastry": "cafe_bakery",
  "bar": "nightlife_bar", "pub": "nightlife_bar", "nightclub": "nightlife_bar", "biergarten": "nightlife_bar",
  "bank": "bank_finance", "atm": "bank_finance", "money": "bank_finance",
  "post": "postal_courier", "post_office": "postal_courier", "courier": "postal_courier", "parcel": "postal_courier",
  "car_repair": "automotive_service", "mechanic": "automotive_service", "tyres": "automotive_service", "car_wash": "automotive_service",
  "gym": "gym_sports", "fitness": "gym_sports", "sport": "gym_sports", "swimming": "gym_sports",
  "stadium": "stadium", "arena": "stadium",
  "cinema": "entertainment_cinema", "theatre": "entertainment_cinema", "theater": "entertainment_cinema",
  "park": "park_recreation", "recreation": "park_recreation", "garden": "park_recreation", "dog_park": "park_recreation",
  "government": "government_public", "police": "government_public", "townhall": "government_public", "courthouse": "government_public",
  "church": "place_of_worship", "cathedral": "place_of_worship", "chapel": "place_of_worship", "mosque": "place_of_worship", "synagogue": "place_of_worship", "temple": "place_of_worship",
  "residential": "residence", "house": "residence", "apartment": "residence", "flat": "residence",
};

const FALLBACK: CategoryInfo = { key: "public_business", label: "Negocio público", icon: "📍" };

export const DEFAULT_RESIDENCE: CategoryInfo = { key: "residence", label: "Residencia", icon: "🏠" };

/** Normaliza cualquier clave de Nominatim/TomTom a una de las 24 categorías. */
export function resolveCategory(rawKey: string | undefined, name: string = ""): CategoryInfo {
  if (!rawKey) {
    if (/residen|house|apartment|home/i.test(name)) return DEFAULT_RESIDENCE;
    return FALLBACK;
  }
  const k = rawKey.toLowerCase().replace(/[-\s]+/g, "_");
  const direct = ALIASES[k] ?? CATEGORIES.find((c) => c.key === k)?.key;
  if (direct) return CATEGORIES.find((c) => c.key === direct) ?? FALLBACK;
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (k.includes(alias)) return CATEGORIES.find((c) => c.key === target) ?? FALLBACK;
  }
  if (/residen|house|apartment|home/i.test(name)) return DEFAULT_RESIDENCE;
  return FALLBACK;
}

/** Ícono directo por clave de categoría (para uso en tarjetas GPS). */
export function getCategoryIcon(rawKey: string | undefined, name: string = ""): string {
  return resolveCategory(rawKey, name).icon;
}