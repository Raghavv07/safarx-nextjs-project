"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NearbyDriver {
  id: string;
  name: string;
  type: "bike" | "auto" | "mini" | "sedan" | "suv";
  lat: number;
  lng: number;
  heading?: number;
}

export interface LiveMapInnerProps {
  pickup: LatLng | null;
  drop: LatLng | null;
  routePolyline?: [number, number][];
  onMapClick?: (latlng: LatLng) => void;
  nearbyDrivers?: NearbyDriver[];
  center?: LatLng;
  zoom?: number;
  height?: string;
}

export default function LiveMapInner({
  pickup,
  drop,
  routePolyline = [],
  onMapClick,
  nearbyDrivers = [],
  center = { lat: 19.076, lng: 72.8777 }, // Mumbai default
  zoom = 13,
  height = "520px",
}: LiveMapInnerProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markersLayerRef = React.useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = React.useRef<L.Polyline | null>(null);

  // Initialize Map Instance
  React.useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter: [number, number] = pickup
      ? [pickup.lat, pickup.lng]
      : [center.lat, center.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: false,
    });

    // Official OpenStreetMap tiles (100% Free, No API Key Required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle clicks
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers & Polyline when props change
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (polylineLayerRef.current) {
      polylineLayerRef.current.remove();
      polylineLayerRef.current = null;
    }

    const boundsLatLngs: [number, number][] = [];

    // 1. Pickup Marker (Green Pin)
    if (pickup) {
      boundsLatLngs.push([pickup.lat, pickup.lng]);
      const pickupIcon = L.divIcon({
        className: "custom-pickup-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: pulse 2s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #10b981; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
              📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .bindTooltip("<b>Pickup Location</b>", { direction: "top", offset: [0, -15] })
        .addTo(markersGroup);
    }

    // 2. Drop Marker (Red/Rose Pin)
    if (drop) {
      boundsLatLngs.push([drop.lat, drop.lng]);
      const dropIcon = L.divIcon({
        className: "custom-drop-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #f43f5e; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
              🏁
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([drop.lat, drop.lng], { icon: dropIcon })
        .bindTooltip("<b>Drop Destination</b>", { direction: "top", offset: [0, -15] })
        .addTo(markersGroup);
    }

    // 3. Nearby Online Drivers
    nearbyDrivers.forEach((driver) => {
      const vehicleEmoji =
        driver.type === "bike"
          ? "🏍️"
          : driver.type === "auto"
          ? "🛺"
          : driver.type === "suv"
          ? "🚙"
          : "🚗";

      const driverIcon = L.divIcon({
        className: "custom-driver-marker",
        html: `
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #18181b; border: 2px solid #a855f7; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; transition: transform 0.2s;">
            ${vehicleEmoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([driver.lat, driver.lng], { icon: driverIcon })
        .bindTooltip(`<b>${driver.name}</b> (${driver.type.toUpperCase()})`, {
          direction: "top",
          offset: [0, -12],
        })
        .addTo(markersGroup);
    });

    // 4. Polyline Route
    if (routePolyline && routePolyline.length > 0) {
      const polyline = L.polyline(routePolyline, {
        color: "#7c3aed", // violet-600
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      polylineLayerRef.current = polyline;

      map.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 16,
      });
    } else if (boundsLatLngs.length > 0) {
      if (boundsLatLngs.length === 1) {
        map.setView(boundsLatLngs[0], 14, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(boundsLatLngs), {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
    }
  }, [pickup, drop, routePolyline, nearbyDrivers]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%", borderRadius: "1rem" }}
      className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md relative z-0"
    />
  );
}
