"use server";

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const TOMTOM_BASE_URL = "https://api.tomtom.com/search/2";

interface GeocodingResult {
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formattedAddress: string;
}

interface ReverseGeocodingResult {
  address: string;
  category?: string;
  poiName?: string;
}

/**
 * Forward Geocoding: Convert address string to coordinates
 * @param query - Address or place name to search
 * @param limit - Max results (default: 1)
 */
export async function geocodeAddress(query: string, limit: number = 1): Promise<{ success: boolean; results?: GeocodingResult[]; error?: string }> {
  if (!TOMTOM_API_KEY) {
    return { success: false, error: "TomTom API key not configured" };
  }

  try {
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      query: query,
      limit: limit.toString(),
      countrySet: "US", // Filter for US addresses
    });

    const response = await fetch(`${TOMTOM_BASE_URL}?${params}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return { success: false, error: "No results found" };
    }

    const results: GeocodingResult[] = data.results.map((result: any) => ({
      address: result.address.streetName || result.address.freeformAddress || "",
      city: result.address.municipality || result.address.localName || "",
      state: result.address.countryCode,
      zipCode: result.address.postalCode,
      country: result.address.country,
      formattedAddress: result.address.freeformAddress || "",
    }));

    return { success: true, results };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Reverse Geocoding: Convert coordinates to address
 * @param lat - Latitude
 * @param lon - Longitude
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ success: boolean; result?: ReverseGeocodingResult; error?: string }> {
  if (!TOMTOM_API_KEY) {
    return { success: false, error: "TomTom API key not configured" };
  }

  try {
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      position: `${lat},${lon}`,
      language: "en-US",
    });

    const response = await fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat}%2C${lon}?key=${TOMTOM_API_KEY}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.addresses || data.addresses.length === 0) {
      return { success: false, error: "No address found" };
    }

    const addr = data.addresses[0];
    const result: ReverseGeocodingResult = {
      address: addr.address.freeformAddress || addr.address.streetName || "Unknown address",
      category: addr.address.country,
      poiName: addr.poi?.names?.en,
    };

    return { success: true, result };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if coordinates are within a geofence (circle)
 */
export function isWithinGeofence(lat: number, lon: number, centerLat: number, centerLon: number, radiusMiles: number): boolean {
  const distance = calculateDistance(lat, lon, centerLat, centerLon);
  return distance <= radiusMiles;
}

// Common NYC toll geofences
export const NYC_TOLL_GEOFENCES = {
  verrazzano: { lat: 40.6196, lon: -74.0395, radius: 0.3, name: "Verrazzano-Narrows Bridge" },
  lincoln_tunnel: { lat: 40.7632, lon: -74.0028, radius: 0.2, name: "Lincoln Tunnel" },
  holland_tunnel: { lat: 40.7279, lon: -74.0134, radius: 0.2, name: "Holland Tunnel" },
  qb_tunnel: { lat: 40.7572, lon: -73.8226, radius: 0.2, name: "Queensboro Bridge" },
};