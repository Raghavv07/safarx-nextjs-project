/**
 * SafarX Geocoding and Routing Services
 * Powered by OpenStreetMap Nominatim and OSRM (Open Source Routing Machine).
 * Completely free, no API key required.
 */

export interface GeocodingResult {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][]; // [lat, lng] array for Leaflet
  success: boolean;
}

/**
 * Searches for Indian addresses and landmarks using OpenStreetMap Nominatim.
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=5&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SafarX-Ride-App/1.0",
        },
      }
    );

    if (!res.ok) return [];

    interface NominatimItem {
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }

    const data: NominatimItem[] = await res.json();
    return data.map((item) => ({
      placeId: String(item.place_id),
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    console.warn("Geocoding search failed:", err);
    return [];
  }
}

/**
 * Calculates haversine straight-line distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Fetches real driving route polyline and distance using OSRM.
 * Fallbacks to haversine straight-line if OSRM is unreachable.
 */
export async function getDrivingRoute(
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number
): Promise<RouteResult> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMins = Math.round(route.duration / 60);

        // OSRM returns coordinates as [lng, lat], Leaflet expects [lat, lng]
        const polyline: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        return {
          distanceKm,
          durationMins: Math.max(durationMins, 2),
          polyline,
          success: true,
        };
      }
    }
  } catch (err) {
    console.warn("OSRM routing service failed, falling back to direct calculation:", err);
  }

  // Graceful Fallback: direct line and estimated speed (30 km/h in city)
  const dist = calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
  const estMins = Math.round((dist / 30) * 60) + 5;

  return {
    distanceKm: dist,
    durationMins: Math.max(estMins, 3),
    polyline: [
      [pickupLat, pickupLng],
      [dropLat, dropLng],
    ],
    success: false,
  };
}
