"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { LiveRideMap } from "./live-ride-map";
import type { LatLng, NearbyDriver } from "./live-map-inner";
import { searchPlaces, getDrivingRoute, type GeocodingResult } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  Clock,
  Car,
  CheckCircle2,
  Crosshair,
  CreditCard,
  Banknote,
} from "lucide-react";
import { RideRealtimeCard } from "@/components/booking/ride-realtime-card";
import { DummyCheckoutModal } from "@/components/payments/dummy-checkout-modal";
import { useBookingStore } from "@/stores/booking-store";
import { motion, AnimatePresence } from "motion/react";

export type VehicleOption = "bike" | "auto" | "mini" | "sedan" | "suv";

interface VehicleConfig {
  type: VehicleOption;
  name: string;
  icon: string;
  baseFare: number;
  perKm: number;
  eta: string;
}

const VEHICLES: VehicleConfig[] = [
  { type: "bike", name: "Moto Fast", icon: "🏍️", baseFare: 35, perKm: 9, eta: "2 min" },
  { type: "auto", name: "Auto Rickshaw", icon: "🛺", baseFare: 50, perKm: 13, eta: "3 min" },
  { type: "mini", name: "Mini Comfort", icon: "🚗", baseFare: 80, perKm: 16, eta: "4 min" },
  { type: "sedan", name: "Prime Sedan", icon: "🚘", baseFare: 120, perKm: 20, eta: "5 min" },
  { type: "suv", name: "SafarX XL (SUV)", icon: "🚙", baseFare: 180, perKm: 27, eta: "7 min" },
];

export function RidePlanner() {
  // Coords & route state
  const [pickup, setPickup] = React.useState<LatLng | null>({
    lat: 19.076,
    lng: 72.8777, // Default Mumbai
  });
  const [pickupText, setPickupText] = React.useState("Chhatrapati Shivaji Maharaj Terminus, Mumbai");
  const [drop, setDrop] = React.useState<LatLng | null>(null);
  const [dropText, setDropText] = React.useState("");

  // Autocomplete suggestions
  const [pickupSuggestions, setPickupSuggestions] = React.useState<GeocodingResult[]>([]);
  const [dropSuggestions, setDropSuggestions] = React.useState<GeocodingResult[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = React.useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = React.useState(false);

  // Selected vehicle & booking
  const [selectedVehicle, setSelectedVehicle] = React.useState<VehicleOption>("mini");
  const [paymentPreference, setPaymentPreference] = React.useState<"online" | "cash">("online");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [pendingPaymentBooking, setPendingPaymentBooking] = React.useState<{
    id: string;
    fare: number;
  } | null>(null);
  const [isBooking, setIsBooking] = React.useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = React.useState<string | null>(null);

  // Global store & live tracking state
  const { activeBookingId, setActiveBookingId } = useBookingStore();
  const [assignedDriverLocation, setAssignedDriverLocation] = React.useState<LatLng | null>(null);

  // Route calculation using TanStack Query
  const { data: routeData, isLoading: isCalculatingRoute } = useQuery({
    queryKey: ["driving-route", pickup?.lat, pickup?.lng, drop?.lat, drop?.lng],
    queryFn: () => getDrivingRoute(pickup!.lat, pickup!.lng, drop!.lat, drop!.lng),
    enabled: Boolean(pickup && drop),
    staleTime: 5 * 60 * 1000,
  });

  const distanceKm = routeData?.distanceKm ?? null;
  const durationMins = routeData?.durationMins ?? null;
  const routePolyline = routeData?.polyline ?? [];

  // Generate nearby simulated drivers around pickup or include assigned driver
  const nearbyDrivers = React.useMemo<NearbyDriver[]>(() => {
    if (!pickup) return [];
    const base: NearbyDriver[] = [
      { id: "d1", name: "Ramesh (Moto)", type: "bike", lat: pickup.lat + 0.004, lng: pickup.lng + 0.003 },
      { id: "d2", name: "Anil (Auto)", type: "auto", lat: pickup.lat - 0.003, lng: pickup.lng + 0.005 },
      { id: "d3", name: "Vijay (Mini)", type: "mini", lat: pickup.lat + 0.006, lng: pickup.lng - 0.004 },
      { id: "d4", name: "Suresh (Sedan)", type: "sedan", lat: pickup.lat - 0.005, lng: pickup.lng - 0.003 },
    ];

    if (assignedDriverLocation) {
      return [
        {
          id: "assigned-driver",
          name: "⭐ Assigned Driver",
          type: selectedVehicle,
          lat: assignedDriverLocation.lat,
          lng: assignedDriverLocation.lng,
        },
        ...base,
      ];
    }

    return base;
  }, [pickup, assignedDriverLocation, selectedVehicle]);

  // Handle GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickup(coords);
        setPickupText("My Current Location (GPS)");
        setPickupSuggestions([]);
      },
      (err) => {
        console.warn("GPS error:", err);
        alert("Could not access location. Please check browser permissions.");
      }
    );
  };

  // Pickup input search
  const handlePickupChange = async (val: string) => {
    setPickupText(val);
    if (val.trim().length < 3) {
      setPickupSuggestions([]);
      return;
    }
    setIsSearchingPickup(true);
    const results = await searchPlaces(val);
    setPickupSuggestions(results);
    setIsSearchingPickup(false);
  };

  // Drop input search
  const handleDropChange = async (val: string) => {
    setDropText(val);
    if (val.trim().length < 3) {
      setDropSuggestions([]);
      return;
    }
    setIsSearchingDrop(true);
    const results = await searchPlaces(val);
    setDropSuggestions(results);
    setIsSearchingDrop(false);
  };

  // Click on map to set pickup or drop
  const handleMapClick = (latlng: LatLng) => {
    if (!pickup) {
      setPickup(latlng);
      setPickupText(`Pin (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`);
    } else if (!drop) {
      setDrop(latlng);
      setDropText(`Pin (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`);
    } else {
      // If both already set, update destination to clicked point
      setDrop(latlng);
      setDropText(`Pin (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`);
    }
  };

  // Fare calculator
  const calculateFare = (v: VehicleConfig) => {
    if (!distanceKm) return v.baseFare;
    return Math.round(v.baseFare + distanceKm * v.perKm);
  };

  // Book ride action
  const handleBookRide = async () => {
    if (!pickup || !drop) {
      alert("Please select both Pickup and Destination on the map.");
      return;
    }

    setIsBooking(true);
    setBookingSuccessMsg(null);

    const activeVehicle = VEHICLES.find((v) => v.type === selectedVehicle) || VEHICLES[2];
    const fare = calculateFare(activeVehicle);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType: selectedVehicle === "mini" ? "car" : selectedVehicle,
          pickUpAddress: pickupText,
          dropAddress: dropText,
          pickUpLat: pickup.lat,
          pickUpLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
          fare,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        if (paymentPreference === "online") {
          setPendingPaymentBooking({
            id: data.booking.id,
            fare,
          });
          setIsPaymentModalOpen(true);
        } else {
          setActiveBookingId(data.booking.id);
          setBookingSuccessMsg(`🎉 Ride request broadcasted! Finding nearby ${activeVehicle.name}...`);
        }
      } else {
        alert(data.error || "Booking failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error booking ride.");
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    if (pendingPaymentBooking) {
      setActiveBookingId(pendingPaymentBooking.id);
      const activeVehicle = VEHICLES.find((v) => v.type === selectedVehicle) || VEHICLES[2];
      setBookingSuccessMsg(`🎉 Payment verified! Finding nearby ${activeVehicle.name}...`);
      setPendingPaymentBooking(null);
    }
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
    if (pendingPaymentBooking) {
      setActiveBookingId(pendingPaymentBooking.id);
      setPendingPaymentBooking(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Search & Fare Controls OR Real-Time Dispatch Card (Left Panel) */}
      <div className="lg:col-span-5 space-y-4">
        {activeBookingId ? (
          <RideRealtimeCard
            bookingId={activeBookingId}
            onReset={() => {
              setActiveBookingId(null);
              setAssignedDriverLocation(null);
              setBookingSuccessMsg(null);
            }}
            onDriverLocationUpdate={(loc) => {
              setAssignedDriverLocation(loc);
            }}
          />
        ) : (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-purple-600" />
                Live Route Planner
              </span>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                OSRM Road Network
              </Badge>
            </div>

            {/* Inputs Box */}
            <div className="space-y-3 relative">
              {/* Pickup Input */}
              <div className="relative">
                <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-purple-500">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <input
                    type="text"
                    value={pickupText}
                    onChange={(e) => handlePickupChange(e.target.value)}
                    placeholder="Enter Pickup Location"
                    className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    title="Use GPS"
                    onClick={handleUseCurrentLocation}
                    className="shrink-0 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-600 transition-colors"
                  >
                    <Crosshair className="h-4 w-4" />
                  </button>
                  {isSearchingPickup && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
                </div>

                {/* Pickup Suggestions dropdown */}
                <AnimatePresence>
                  {pickupSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      {pickupSuggestions.map((item) => (
                        <button
                          key={item.placeId}
                          type="button"
                          onClick={() => {
                            setPickup({ lat: item.lat, lng: item.lng });
                            setPickupText(item.name);
                            setPickupSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-zinc-800 flex items-center gap-2 border-b last:border-0 border-zinc-100 dark:border-zinc-800/50"
                        >
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Destination Input */}
              <div className="relative">
                <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-purple-500">
                  <div className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                  <input
                    type="text"
                    value={dropText}
                    onChange={(e) => handleDropChange(e.target.value)}
                    placeholder="Where to? (Enter destination or click on map)"
                    className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                  />
                  {isSearchingDrop && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
                </div>

                {/* Drop Suggestions dropdown */}
                <AnimatePresence>
                  {dropSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      {dropSuggestions.map((item) => (
                        <button
                          key={item.placeId}
                          type="button"
                          onClick={() => {
                            setDrop({ lat: item.lat, lng: item.lng });
                            setDropText(item.name);
                            setDropSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-zinc-800 flex items-center gap-2 border-b last:border-0 border-zinc-100 dark:border-zinc-800/50"
                        >
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Distance & Duration badge */}
            <AnimatePresence>
              {distanceKm !== null && durationMins !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50"
                >
                  <div className="flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200 font-medium">
                    <Navigation className="h-4 w-4 text-purple-600" />
                    <span>{distanceKm} km Driving Distance</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>~{durationMins} mins</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isCalculatingRoute && (
              <div className="text-center py-1 text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                <span>Computing fastest road trajectory...</span>
              </div>
            )}

            {/* Vehicle Options Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Select Vehicle Category
              </span>
              <div className="space-y-1.5">
                {VEHICLES.map((v) => {
                  const fare = calculateFare(v);
                  const isSelected = selectedVehicle === v.type;
                  return (
                    <motion.button
                      key={v.type}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => setSelectedVehicle(v.type)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-600/30"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{v.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {v.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">· {v.eta}</span>
                          </div>
                          <span className="text-[11px] text-zinc-500">
                            Base ₹{v.baseFare} + ₹{v.perKm}/km
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          ₹{fare}
                        </span>
                        {isSelected && (
                          <div className="text-[10px] text-purple-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Selected
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Booking Confirmation / Alert */}
            <AnimatePresence>
              {bookingSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{bookingSuccessMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Payment Option:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setPaymentPreference("online")}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 ${
                    paymentPreference === "online"
                      ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold block leading-tight">Online Cashless</span>
                    <span className="text-[10px] text-zinc-400">UPI / QR / Card</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setPaymentPreference("cash")}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 ${
                    paymentPreference === "cash"
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-600/20"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                  }`}
                >
                  <Banknote className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block leading-tight">Cash on Drop</span>
                    <span className="text-[10px] text-zinc-400">Pay to Driver</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Book Now Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={handleBookRide}
                disabled={isBooking || !drop}
                className="w-full gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 py-5 text-sm font-semibold rounded-xl shadow-lg transition-all"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Broadcasting Ride Request...</span>
                  </>
                ) : !drop ? (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Choose Destination to Book</span>
                  </>
                ) : (
                  <>
                    <Car className="h-4 w-4" />
                    <span>
                      Book {VEHICLES.find((v) => v.type === selectedVehicle)?.name} · ₹
                      {calculateFare(VEHICLES.find((v) => v.type === selectedVehicle) || VEHICLES[2])}
                    </span>
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Interactive Map Canvas (Right Panel) */}
      <div className="lg:col-span-7">
        <LiveRideMap
          pickup={pickup}
          drop={drop}
          routePolyline={routePolyline}
          onMapClick={handleMapClick}
          nearbyDrivers={nearbyDrivers}
          height="580px"
        />
        <p className="text-[11px] text-zinc-400 text-center mt-2">
          💡 <b>Tip:</b> Click anywhere on the map to set or move your destination pin.
        </p>
      </div>

      {/* Razorpay Dummy Checkout Modal */}
      {pendingPaymentBooking && (
        <DummyCheckoutModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          bookingId={pendingPaymentBooking.id}
          amount={pendingPaymentBooking.fare}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
