"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRideChannel } from "@/hooks/use-ride-channel";
import { getDrivingRoute } from "@/lib/geo";
import { LiveRideMap } from "@/components/map/live-ride-map";
import type { LatLng, NearbyDriver } from "@/components/map/live-map-inner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InRideChatDrawer } from "@/components/chat/in-ride-chat-drawer";
import {
  Car,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Star,
  Share2,
  ArrowLeft,
  Check,
  Receipt,
  Radio,
  User,
  CreditCard,
} from "lucide-react";
import { DummyCheckoutModal } from "@/components/payments/dummy-checkout-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "motion/react";

export default function RideProgressionPage() {
  const params = useParams();
  const bookingId = (params?.id as string) || "";

  // Realtime channel state
  const {
    booking,
    isLoading,
    error,
    driverLocation,
    distanceKm,
    etaMinutes,
    isDriverArrived: realtimeDriverArrived,
    markDriverArrived,
    verifyPickupOtp,
    completeTrip,
    refetch,
  } = useRideChannel(bookingId);

  // Perspective Switcher: Allow toggling between Rider and Driver views for seamless testing
  const [perspective, setPerspective] = React.useState<"rider" | "driver">("rider");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  // Step 1 Driver arrival local state
  const [hasDriverArrivedLocal, setHasDriverArrivedLocal] = React.useState(false);
  const [isMarkingArrived, setIsMarkingArrived] = React.useState(false);

  // Step 2 OTP verification state
  const [pickupOtpInput, setPickupOtpInput] = React.useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);

  // Step 4 Drop OTP & Completion state
  const [dropOtpInput, setDropOtpInput] = React.useState("");
  const [isEndingTrip, setIsEndingTrip] = React.useState(false);
  const [endTripError, setEndTripError] = React.useState<string | null>(null);

  // Rating state for passenger
  const [rating, setRating] = React.useState(5);
  const [rated, setRated] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const isDriverArrived = realtimeDriverArrived || hasDriverArrivedLocal;

  // Calculate driving route polyline between Pickup and Drop
  const { data: routeData } = useQuery({
    queryKey: ["route-polyline", booking?.pickUpLat, booking?.pickUpLng, booking?.dropLat, booking?.dropLng],
    queryFn: () =>
      getDrivingRoute(
        booking!.pickUpLat,
        booking!.pickUpLng,
        booking!.dropLat,
        booking!.dropLng
      ),
    enabled: Boolean(booking?.pickUpLat && booking?.dropLat),
    staleTime: 10 * 60 * 1000,
  });

  const routePolyline = routeData?.polyline ?? [];

  // Drivers to show on map (current moving driver)
  const mapDrivers = React.useMemo<NearbyDriver[]>(() => {
    if (!booking) return [];
    const activeLat = driverLocation?.lat || booking.driver?.lat || booking.pickUpLat;
    const activeLng = driverLocation?.lng || booking.driver?.lng || booking.pickUpLng;

    return [
      {
        id: booking.driver?.id || "active-driver",
        name: booking.driver?.name || "Driver",
        type: (booking.vehicle?.type as "bike" | "auto" | "mini" | "sedan" | "suv") || "mini",
        lat: activeLat,
        lng: activeLng,
      },
    ];
  }, [booking, driverLocation]);

  // Handle Driver Clicks "I Have Arrived"
  const handleDriverArrived = async () => {
    setIsMarkingArrived(true);
    const ok = await markDriverArrived();
    if (ok) {
      setHasDriverArrivedLocal(true);
    }
    setIsMarkingArrived(false);
  };

  // Handle Driver Submits Pickup OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pickupOtpInput.trim().length !== 4) {
      setOtpError("Please enter the 4-digit code provided by passenger.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    const res = await verifyPickupOtp(pickupOtpInput.trim());
    if (!res.success) {
      setOtpError(res.error || "Incorrect OTP. Try again.");
    }
    setIsVerifyingOtp(false);
  };

  // Handle Driver Ends Trip
  const handleEndTrip = async () => {
    if (!confirm("Are you sure you have arrived at destination and want to complete this ride?")) {
      return;
    }

    setIsEndingTrip(true);
    setEndTripError(null);
    const res = await completeTrip(dropOtpInput.trim() || undefined, "cash");
    if (!res.success) {
      setEndTripError(res.error || "Failed to complete trip.");
    }
    setIsEndingTrip(false);
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (isLoading && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-9 w-9 animate-spin text-purple-600 mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Connecting to Live SafarX Trip Engine...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 text-center p-6 space-y-4 shadow-lg">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Trip Not Found</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {error || "The specified ride does not exist or has expired."}
          </p>
          <Link href="/dashboard">
            <Button size="sm">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const status = booking.status;

  // Determine current step index (1-based: 1=assigned, 2=arrived, 3=started, 4=completed)
  let activeStepIndex = 1;
  if (status === "confirmed") {
    activeStepIndex = isDriverArrived ? 2 : 1;
  } else if (status === "started") {
    activeStepIndex = 3;
  } else if (status === "completed") {
    activeStepIndex = 4;
  }

  const pickupPoint: LatLng = { lat: booking.pickUpLat, lng: booking.pickUpLng };
  const dropPoint: LatLng = { lat: booking.dropLat, lng: booking.dropLng };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-zinc-500">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-xs">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block leading-tight">
                  SafarX Trip Navigation
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  #{booking.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Perspective Toggle & Share */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setPerspective("rider")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  perspective === "rider"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Rider View</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setPerspective("driver")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  perspective === "driver"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Car className="h-3.5 w-3.5" />
                <span>Driver View</span>
              </motion.button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="gap-1.5 text-xs h-8 px-2.5 border-zinc-200 dark:border-zinc-800"
              title="Share Live Trip"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Stepper Progress Bar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { idx: 1, title: "1. Driver En Route", desc: "Heading to pickup" },
              { idx: 2, title: "2. Driver Arrived", desc: "Waiting at pickup" },
              { idx: 3, title: "3. On the Trip", desc: "Pickup OTP verified" },
              { idx: 4, title: "4. Destination Reached", desc: "Fare & receipt" },
            ].map((step) => {
              const isDone = activeStepIndex > step.idx;
              const isCurrent = activeStepIndex === step.idx;

              return (
                <motion.div
                  key={step.idx}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 dark:border-purple-600 ring-2 ring-purple-600/20"
                      : isDone
                      ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                      : "border-zinc-200 dark:border-zinc-800 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    )}
                    <span className={isCurrent ? "text-purple-900 dark:text-purple-200" : ""}>
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Responsive Layout: Map + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: CONTROLS & STEP LIFECYCLE (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Perspective Status Pill */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
              <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
                Active Mode: <b className="capitalize text-zinc-900 dark:text-zinc-100">{perspective} Perspective</b>
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {status}
              </Badge>
            </div>

            {/* STEP 1: DRIVER ARRIVED FLOW */}
            {activeStepIndex <= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-purple-200 dark:border-purple-900/60 shadow-lg overflow-hidden">
                  <div className="bg-purple-600 p-4 text-white">
                    <h3 className="font-bold text-sm">
                      {isDriverArrived ? "Driver Has Arrived at Pickup" : "Driver Approaching Pickup"}
                    </h3>
                    <p className="text-xs text-purple-100/90 mt-0.5">
                      {isDriverArrived
                        ? "Driver is waiting at the designated pickup spot."
                        : "Driver is currently navigating towards your pickup point."}
                    </p>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Driver / Passenger Info Box */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                          {perspective === "driver" ? "Passenger" : "Driver Partner"}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {perspective === "driver"
                            ? booking.passenger?.name || "Passenger"
                            : booking.driver?.name || "SafarX Driver"}
                        </h4>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          {booking.vehicle ? `${booking.vehicle.model} • ${booking.vehicle.number}` : "Vehicle Assigned"}
                        </p>
                      </div>

                      <a
                        href={`tel:${
                          perspective === "driver"
                            ? booking.passenger?.mobileNumber || "9876543210"
                            : booking.driver?.mobileNumber || "9876500001"
                        }`}
                      >
                        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                          <Button size="sm" className="h-9 w-9 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </a>
                    </div>

                    {/* Rider View: Big OTP Alert */}
                    {perspective === "rider" && (
                      <div className="space-y-3">
                        {isDriverArrived && (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Driver is waiting outside! Please proceed to the vehicle.</span>
                          </div>
                        )}

                        {booking.pickUpOtp && (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-300 dark:border-purple-800 text-center space-y-2">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                              Pickup Security Code
                            </span>
                            <div className="flex items-center justify-center gap-2">
                              {booking.pickUpOtp.split("").map((digit, i) => (
                                <motion.span
                                  key={i}
                                  initial={{ scale: 0.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    delay: 0.1 + i * 0.08,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                  className="h-12 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-700 font-mono text-2xl font-extrabold text-purple-950 dark:text-purple-100 shadow-sm"
                                >
                                  {digit}
                                </motion.span>
                              ))}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              Tell this 4-digit code to your driver to start your ride.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Driver View: "I Have Arrived" Button & OTP Input */}
                    {perspective === "driver" && (
                      <div className="space-y-4">
                        {!isDriverArrived ? (
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              onClick={handleDriverArrived}
                              disabled={isMarkingArrived}
                              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-sm rounded-2xl shadow-lg transition-all"
                            >
                              {isMarkingArrived ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <MapPin className="h-5 w-5" />
                              )}
                              <span>📍 I Have Arrived at Pickup</span>
                            </Button>
                          </motion.div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Arrived at Pickup. Enter Passenger OTP to Start:</span>
                            </div>

                            {/* OTP verification form */}
                            <form onSubmit={handleVerifyOtp} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={pickupOtpInput}
                                  onChange={(e) => setPickupOtpInput(e.target.value.replace(/\D/g, ""))}
                                  placeholder="Enter 4-digit OTP"
                                  className="flex-1 text-center font-mono text-lg font-bold tracking-widest px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                />
                                <Button
                                  type="submit"
                                  disabled={isVerifyingOtp || pickupOtpInput.length !== 4}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4"
                                >
                                  {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </Button>
                              </div>
                              {otpError && (
                                <p className="text-xs text-rose-600 font-semibold">{otpError}</p>
                              )}
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3: DESTINATION NAVIGATION IN PROGRESS */}
            {activeStepIndex === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-purple-200 dark:border-purple-900/60 shadow-lg overflow-hidden">
                  <div className="bg-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-5 w-5 animate-pulse" />
                        <h3 className="font-bold text-sm">Trip in Progress</h3>
                      </div>
                      <Badge className="bg-white/20 text-white border-none text-[10px]">
                        En Route
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Destination Info */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Drop Destination</span>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {booking.dropAddress}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Live Fare:</span>
                        <span className="text-base font-extrabold text-purple-600">₹{booking.fare}</span>
                      </div>
                    </div>

                    {/* Rider View: Drop OTP notice (if applicable) */}
                    {perspective === "rider" && booking.dropOtp && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-center">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                          Dropoff Verification PIN
                        </span>
                        <span className="font-mono text-lg font-bold text-purple-700 dark:text-purple-300">
                          {booking.dropOtp}
                        </span>
                      </div>
                    )}

                    {/* Driver View: End Trip Button */}
                    {perspective === "driver" && (
                      <div className="space-y-3">
                        {booking.dropOtp && (
                          <div>
                            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                              Optional Drop OTP (from passenger):
                            </label>
                            <input
                              type="text"
                              maxLength={4}
                              value={dropOtpInput}
                              onChange={(e) => setDropOtpInput(e.target.value.replace(/\D/g, ""))}
                              placeholder="Enter Drop OTP (if requested)"
                              className="w-full text-center font-mono text-sm font-semibold px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                            />
                          </div>
                        )}

                        {endTripError && (
                          <p className="text-xs text-rose-600 font-semibold">{endTripError}</p>
                        )}

                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            onClick={handleEndTrip}
                            disabled={isEndingTrip}
                            className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-6 text-sm rounded-2xl shadow-lg transition-all"
                          >
                            {isEndingTrip ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5" />
                            )}
                            <span>🏁 Reached Destination — End Ride</span>
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 4: TRIP COMPLETED & FARE BREAKDOWN RECEIPT */}
            {activeStepIndex === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 350, damping: 25 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-900 shadow-xl overflow-hidden">
                  <div className="bg-emerald-600 p-5 text-white text-center space-y-1">
                    <CheckCircle2 className="h-8 w-8 mx-auto" />
                    <h3 className="font-bold text-base">Trip Successfully Completed!</h3>
                    <p className="text-xs text-emerald-100">
                      {perspective === "driver"
                        ? "Collect cash or confirm settlement with passenger."
                        : "We hope you had a pleasant trip with SafarX."}
                    </p>
                  </div>

                  <CardContent className="p-5 space-y-5">
                    {/* Itemized Fare Breakdown Card */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        <Receipt className="h-4 w-4 text-purple-600" />
                        <span>Itemized Ride Receipt</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-500">
                          <span>Base Fare</span>
                          <span>₹{booking.fareBreakdown.baseFare}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Distance & Time Charge</span>
                          <span>₹{booking.fareBreakdown.distanceCharge}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Platform Fee & GST (15%)</span>
                          <span>₹{booking.fareBreakdown.taxesAndPlatform}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          <span>Total Fare</span>
                          <span>₹{booking.fareBreakdown.totalFare}</span>
                        </div>
                      </div>

                      {/* Payment Settlement Strip */}
                      <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Payment Mode</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {booking.paymentStatus === "paid"
                              ? "Paid Online (Razorpay Mock)"
                              : booking.paymentStatus === "cash"
                              ? "Cash Settlement"
                              : "Payment Pending"}
                          </span>
                        </div>
                        {booking.paymentStatus === "paid" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">Settled ✓</Badge>
                        ) : booking.paymentStatus === "cash" ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">Cash Mode</Badge>
                        ) : (
                          perspective === "rider" && (
                            <Button
                              size="sm"
                              onClick={() => setIsPaymentModalOpen(true)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 rounded-lg shadow-sm font-bold gap-1"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay Online Now</span>
                            </Button>
                          )
                        )}
                      </div>

                      {perspective === "driver" && (
                        <div className="mt-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-xs font-semibold text-purple-800 dark:text-purple-300 flex justify-between">
                          <span>Driver Net Payout (85%):</span>
                          <span>₹{booking.fareBreakdown.partnerEarnings}</span>
                        </div>
                      )}
                    </div>

                    {/* Rider: Star Rating */}
                    {perspective === "rider" && (
                      <div className="space-y-2 text-center py-1">
                        <span className="text-xs font-medium text-zinc-500">
                          Rate Driver Partner
                        </span>
                        <div className="flex items-center justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              whileHover={{ scale: 1.25 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => {
                                setRating(star);
                                setRated(true);
                              }}
                              className="p-1 transition-colors"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-zinc-300 dark:text-zinc-700"
                                }`}
                              />
                            </motion.button>
                          ))}
                        </div>
                        {rated && (
                          <p className="text-[11px] text-emerald-600 font-semibold">
                            Thank you for rating!
                          </p>
                        )}
                      </div>
                    )}

                    <Link href="/dashboard" className="block">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 transition-all">
                          Return to Dashboard
                        </Button>
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Safety & Emergency SOS Box */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  SafarX Safety Guarantee
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                  Insured
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500">
                This trip is actively tracked. In case of emergency, contact the 24x7 SafarX Emergency Desk at <b>1800-SAFAR-X</b>.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE MAP & ROUTE (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <LiveRideMap
              pickup={pickupPoint}
              drop={dropPoint}
              routePolyline={routePolyline}
              nearbyDrivers={mapDrivers}
              height="600px"
            />
            <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
              <span>📍 Pickup: {booking.pickUpAddress.split(",")[0]}</span>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km · ~${etaMinutes ?? 3} mins` : "Live Route"}
              </Badge>
              <span>🏁 Destination: {booking.dropAddress.split(",")[0]}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating In-Ride Chat Drawer with DeepSeek AI Quick Replies */}
      {status !== "cancelled" && (
        <InRideChatDrawer
          bookingId={booking.id}
          currentUserRole={perspective}
          counterpartName={
            perspective === "rider"
              ? booking.driver?.name || "Driver Partner"
              : booking.passenger?.name || "Passenger"
          }
        />
      )}

      {/* Razorpay Mock Payment Checkout Modal */}
      <DummyCheckoutModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingId={booking.id}
        amount={booking.fare}
        riderName={booking.passenger?.name || "Passenger"}
        riderMobile={booking.passenger?.mobileNumber || "9876543210"}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
