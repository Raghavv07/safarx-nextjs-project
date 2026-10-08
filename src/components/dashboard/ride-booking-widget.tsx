"use client";

import * as React from "react";
import { useBookingStore, type VehicleType } from "@/stores/booking-store";
import { useBookings } from "@/hooks/queries/use-bookings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Car,
  MapPin,
  Navigation,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

const VEHICLES: {
  type: VehicleType;
  name: string;
  icon: string;
  baseFare: number;
  perKm: number;
  eta: string;
}[] = [
  { type: "bike", name: "Moto Fast", icon: "🏍️", baseFare: 40, perKm: 9, eta: "2 min" },
  { type: "auto", name: "Auto Rickshaw", icon: "🛺", baseFare: 55, perKm: 13, eta: "3 min" },
  { type: "mini", name: "Mini Comfort", icon: "🚗", baseFare: 90, perKm: 17, eta: "4 min" },
  { type: "sedan", name: "Prime Sedan", icon: "🚘", baseFare: 130, perKm: 21, eta: "5 min" },
  { type: "suv", name: "SafarX XL (SUV)", icon: "🚙", baseFare: 190, perKm: 28, eta: "7 min" },
];

const PRESET_ROUTES = [
  {
    from: "Connaught Place, New Delhi",
    to: "Cyber City, Gurugram",
    dist: 28.5,
    duration: 45,
  },
  {
    from: "Bandra Kurla Complex (BKC)",
    to: "Chhatrapati Shivaji Terminal (CST)",
    dist: 17.2,
    duration: 35,
  },
  {
    from: "Indira Gandhi International Airport (T3)",
    to: "Noida Sector 62",
    dist: 36.8,
    duration: 55,
  },
];

export function RideBookingWidget() {
  // 1. Zustand Store State (Client-Side Ephemeral UI State)
  const {
    pickup,
    dropoff,
    vehicleType,
    estimatedFare,
    estimatedDistanceKm,
    estimatedDurationMin,
    setPickup,
    setDropoff,
    setVehicleType,
    setEstimates,
    resetBooking,
  } = useBookingStore();

  // 2. TanStack Query Hook (Server-Side Async Cached State)
  const {
    data: bookings = [],
    isLoading: isQueryLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useBookings(5);

  const [bookingSuccessMsg, setBookingSuccessMsg] = React.useState<string | null>(null);

  // Recalculate fare when vehicle or route changes
  const updateFare = React.useCallback(
    (distKm: number, durationMin: number, vType: VehicleType) => {
      const selected = VEHICLES.find((v) => v.type === vType) || VEHICLES[2];
      const fare = Math.round(selected.baseFare + distKm * selected.perKm);
      setEstimates(fare, distKm, durationMin);
    },
    [setEstimates]
  );

  const selectRoute = (route: (typeof PRESET_ROUTES)[0]) => {
    setPickup({
      address: route.from,
      lat: 28.6139,
      lng: 77.209,
    });
    setDropoff({
      address: route.to,
      lat: 28.4595,
      lng: 77.0266,
    });
    updateFare(route.dist, route.duration, vehicleType);
  };

  const handleVehicleSelect = (type: VehicleType) => {
    setVehicleType(type);
    if (estimatedDistanceKm && estimatedDurationMin) {
      updateFare(estimatedDistanceKm, estimatedDurationMin, type);
    }
  };

  return (
    <div className="space-y-6">
      {/* State Architecture Status Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Reactive Architecture
              </span>
              <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                Zustand v5 + TanStack Query v5
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Client UI store synchronizes atomic renders while TanStack Query caches server state.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Server Cache:</span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {isFetching ? "Revalidating..." : "StaleTime Active (30s)"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 w-7 p-0"
            title="Refetch via TanStack Query"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-500" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Booking Flow powered by Zustand */}
        <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-lg">Live Ride Estimator</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Store: useBookingStore
              </Badge>
            </div>
            <CardDescription>
              Test multi-step state management with atomic Zustand selectors.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Quick Preset Routes */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Popular Sample Routes:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_ROUTES.map((route, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectRoute(route)}
                    className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs transition-all hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
                  >
                    <Navigation className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {route.from.split(",")[0]} ➔ {route.to.split(",")[0]}
                    </span>
                    <span className="text-[10px] text-zinc-400">({route.dist} km)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Route Display */}
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-zinc-500">Pickup Location</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {pickup ? pickup.address : "Select or click a sample route above"}
                  </p>
                </div>
              </div>

              <div className="ml-2 h-4 w-0 border-l border-dashed border-zinc-300 dark:border-zinc-700" />

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-rose-500" />
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-zinc-500">Dropoff Location</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {dropoff ? dropoff.address : "Destination will be updated in real-time"}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Selection Chips */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Select Fleet Option:
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {VEHICLES.map((v) => {
                  const isSelected = vehicleType === v.type;
                  return (
                    <button
                      key={v.type}
                      type="button"
                      onClick={() => handleVehicleSelect(v.type)}
                      className={`flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/40"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <span className="mt-1 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {v.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">{v.eta}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Fare Summary Bar */}
            {estimatedFare && (
              <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-zinc-900 p-4 text-white dark:bg-zinc-950 sm:flex-row sm:items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Estimated Total</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300">
                      ~{estimatedDurationMin} mins
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">
                    ₹{estimatedFare}
                    <span className="ml-1 text-xs font-normal text-zinc-400">
                      ({estimatedDistanceKm} km)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetBooking}
                    className="border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setBookingSuccessMsg(`Estimate of ₹${estimatedFare} locked into store!`);
                      setTimeout(() => setBookingSuccessMsg(null), 3500);
                    }}
                    className="bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    Lock Estimate
                  </Button>
                </div>
              </div>
            )}

            {bookingSuccessMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {bookingSuccessMsg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Server State with TanStack Query */}
        <Card className="border-zinc-200 dark:border-zinc-800 lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-lg">Trips Cache</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Hook: useBookings()
              </Badge>
            </div>
            <CardDescription>
              Cached server data from Supabase Postgres via Prisma & TanStack Query.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isQueryLoading ? (
              <div className="space-y-3 py-6 text-center text-xs text-zinc-500">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                <span>Loading trips from database cache...</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                <Clock className="mx-auto h-8 w-8 text-zinc-400" />
                <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No Past Trips Recorded
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  When rides are created, TanStack Query caches and auto-refetches them seamlessly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        #{booking.id.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {booking.bookingStatus}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <p className="truncate">📍 {booking.pickUpAddress}</p>
                      <p className="truncate">🏁 {booking.dropAddress}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
                      <span>Fare: ₹{booking.fare}</span>
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cache Metadata Info */}
            <div className="rounded-xl bg-zinc-50 p-3 text-[11px] text-zinc-500 dark:bg-zinc-900/40">
              <div className="flex justify-between">
                <span>Query Key:</span>
                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  [&apos;bookings&apos;, &apos;list&apos;, &#123;limit: 5&#125;]
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Last Synced:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Never"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
