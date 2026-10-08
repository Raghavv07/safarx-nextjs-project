"use client";

import * as React from "react";
import Link from "next/link";
import { useRideChannel } from "@/hooks/use-ride-channel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InRideChatDrawer } from "@/components/chat/in-ride-chat-drawer";
import { DummyCheckoutModal } from "@/components/payments/dummy-checkout-modal";
import {
  Car,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  AlertTriangle,
  Star,
  Radio,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RideRealtimeCardProps {
  bookingId: string;
  onReset?: () => void;
  onDriverLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export function RideRealtimeCard({
  bookingId,
  onReset,
  onDriverLocationUpdate,
}: RideRealtimeCardProps) {
  const {
    booking,
    isLoading,
    error,
    driverLocation,
    distanceKm,
    etaMinutes,
    cancelRide,
    refetch,
  } = useRideChannel(bookingId);

  const [isCancelling, setIsCancelling] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [rated, setRated] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  // Notify parent of driver location changes for map updates
  React.useEffect(() => {
    if (driverLocation && onDriverLocationUpdate) {
      onDriverLocationUpdate(driverLocation);
    }
  }, [driverLocation, onDriverLocationUpdate]);

  if (isLoading && !booking) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg p-6 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
        <p className="text-xs text-zinc-500 font-medium">Connecting to SafarX Realtime Dispatch...</p>
      </Card>
    );
  }

  if (error || !booking) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {error || "Booking details could not be loaded"}
        </p>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            Book Again
          </Button>
        )}
      </Card>
    );
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this ride request?")) return;
    setIsCancelling(true);
    await cancelRide("Cancelled by user");
    setIsCancelling(false);
  };

  const status = booking.status;

  // 0. STATE: AWAITING PAYMENT (bookingStatus === 'awaiting_payment')
  if (status === "awaiting_payment") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="border-amber-300 dark:border-amber-800 shadow-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-bold text-sm tracking-tight">Payment Required</span>
              </div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-mono">
                Order ID #{booking.id.slice(0, 8)}
              </Badge>
            </div>
            <h3 className="mt-2 text-lg font-extrabold tracking-tight">
              Pay ₹{booking.fare} to Confirm Ride
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              Online cashless ride requires payment confirmation to dispatch nearby fleet partner.
            </p>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Pickup:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{booking.pickUpAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Destination:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{booking.dropAddress}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Total Fare:</span>
                <span className="text-base font-extrabold text-purple-600">₹{booking.fare}</span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-sm rounded-xl shadow-lg transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay ₹{booking.fare} Online (UPI / Card)</span>
              </Button>
            </motion.div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full text-rose-600 border-rose-200 text-xs"
            >
              Cancel Request
            </Button>
          </CardContent>
        </Card>

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
      </motion.div>
    );
  }

  // 1. STATE: SEARCHING FOR DRIVER (bookingStatus === 'requested')
  if (status === "requested") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="border-purple-200 dark:border-purple-900/40 shadow-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          {/* Top Animated Radar Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
                  Live Dispatch
                </span>
              </div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-mono">
                ID #{booking.id.slice(0, 8)}
              </Badge>
            </div>

            <h3 className="mt-2 text-lg font-extrabold tracking-tight">
              Searching for nearby drivers...
            </h3>
            <p className="text-xs text-purple-100/90 mt-0.5">
              Broadcasting your request to active online drivers in your area.
            </p>
          </div>

          <CardContent className="p-5 space-y-5">
            {/* Pulsing Sonar Graphic */}
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center h-24 w-24">
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-24 w-24 rounded-full bg-purple-500/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0.15, 0.7] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="absolute h-16 w-16 rounded-full bg-purple-500/30"
                />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative h-12 w-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg"
                >
                  <Radio className="h-6 w-6 animate-pulse" />
                </motion.div>
              </div>
              <span className="text-xs text-zinc-500 font-medium mt-3">
                Matching closest verified partner...
              </span>
            </div>

            {/* Ride Details Summary */}
            <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Pickup</span>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {booking.pickUpAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Navigation className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Dropoff</span>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                    {booking.dropAddress}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Estimated Fare</span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  ₹{booking.fare}
                </span>
              </div>
            </div>

            {/* Cancel Request Button */}
            <Button
              type="button"
              variant="outline"
              disabled={isCancelling}
              onClick={handleCancel}
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 text-xs font-semibold py-4"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>Cancel Ride Request</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 2. STATE: DRIVER ACCEPTED / ON THE WAY (bookingStatus === 'confirmed')
  if (status === "confirmed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="border-emerald-200 dark:border-emerald-900/40 shadow-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          {/* Confirmed Banner */}
          <div className="bg-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold text-sm tracking-tight">Driver Assigned!</span>
              </div>
              <Badge className="bg-white/20 text-white border-none text-[10px] font-mono">
                On the Way
              </Badge>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Driver & Vehicle Profile Header */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                    {booking.driver?.name ? booking.driver.name.charAt(0).toUpperCase() : "D"}
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {booking.driver?.name || "Verified Partner"}
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[9px] py-0">
                      ★ 4.9
                    </Badge>
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {booking.vehicle?.model || "Standard Fleet"}
                  </p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-mono text-[11px] font-bold tracking-widest uppercase">
                      {booking.vehicle?.number || "MH02 DZ 4819"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Call Button */}
              {booking.driver?.mobileNumber && (
                <a href={`tel:${booking.driver.mobileNumber}`}>
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button size="sm" className="h-10 w-10 p-0 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </a>
              )}
            </div>

            {/* 4-DIGIT PICKUP SECURITY OTP BANNER */}
            {booking.pickUpOtp && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-300 dark:border-purple-800 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                  <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                  <span>PICKUP SECURITY CODE</span>
                </div>

                {/* OTP Digits Display */}
                <div className="flex items-center justify-center gap-2">
                  {booking.pickUpOtp.split("").map((digit, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 0.1 + idx * 0.08,
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="h-11 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-700 font-mono text-xl font-extrabold text-purple-900 dark:text-purple-100 shadow-sm"
                    >
                      {digit}
                    </motion.span>
                  ))}
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Share this 4-digit OTP with your driver upon arrival to begin your trip.
                </p>
              </div>
            )}

            {/* Live Driver ETA & Distance Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="font-semibold block">Driver is Approaching</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {distanceKm !== null ? `${distanceKm.toFixed(1)} km away` : "Nearby"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  ~{etaMinutes ?? 3} mins
                </span>
                <span className="text-[10px] text-zinc-400 block font-medium">Estimated Arrival</span>
              </div>
            </div>

            {/* Link to Dedicated Full Progression Screen */}
            <Link href={`/ride/${booking.id}`} className="block">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl shadow-md transition-all"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Open Dedicated Ride Progression Screen</span>
                </Button>
              </motion.div>
            </Link>

            {/* Cancel button */}
            <Button
              type="button"
              variant="ghost"
              disabled={isCancelling}
              onClick={handleCancel}
              className="w-full text-zinc-400 hover:text-rose-600 text-xs"
            >
              Cancel Ride
            </Button>
          </CardContent>
        </Card>
        <InRideChatDrawer
          bookingId={booking.id}
          currentUserRole="rider"
          counterpartName={booking.driver?.name || "Driver Partner"}
        />
      </motion.div>
    );
  }

  // 3. STATE: TRIP IN PROGRESS (bookingStatus === 'started')
  if (status === "started") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="border-purple-200 dark:border-purple-900 shadow-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95">
          <div className="bg-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 animate-pulse" />
                <span className="font-bold text-sm">Trip in Progress</span>
              </div>
              <Badge className="bg-white/20 text-white border-none text-[10px]">
                En Route
              </Badge>
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Driving to Destination
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {booking.dropAddress}
                  </p>
                </div>
                <span className="text-base font-extrabold text-purple-600">
                  ₹{booking.fare}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-xs text-zinc-500 space-y-1">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>SafarX Safety Shield Active</span>
              </div>
              <p className="text-[11px]">
                Your trip is monitored via real-time satellite GPS tracking.
              </p>
            </div>

            <Link href={`/ride/${booking.id}`} className="block">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl shadow-md transition-all"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Open Dedicated Trip Screen (/ride/{booking.id.slice(0, 8)})</span>
                </Button>
              </motion.div>
            </Link>
          </CardContent>
        </Card>
        <InRideChatDrawer
          bookingId={booking.id}
          currentUserRole="rider"
          counterpartName={booking.driver?.name || "Driver Partner"}
        />
      </motion.div>
    );
  }

  // 4. STATE: TRIP COMPLETED (bookingStatus === 'completed')
  if (status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, type: "spring", stiffness: 350, damping: 25 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-900 shadow-xl overflow-hidden text-center p-6 space-y-5 bg-white dark:bg-zinc-900">
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              You Have Arrived!
            </h3>
            <p className="text-xs text-zinc-500">
              Trip successfully completed. Total Fare: <b>₹{booking.fare}</b>
            </p>
          </div>

          {/* Rating Stars */}
          <div className="space-y-2 py-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Rate your driver partner
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
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-emerald-600 font-medium block"
              >
                Thanks for your feedback!
              </motion.span>
            )}
          </div>

          {onReset && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={onReset}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-5"
              >
                Book Another Ride
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    );
  }

  // 5. STATE: CANCELLED OR REJECTED
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg text-center p-6 space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
          <XCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Ride {status === "cancelled" ? "Cancelled" : "Declined"}
          </h4>
          <p className="text-xs text-zinc-500">
            {status === "cancelled"
              ? "This ride request was cancelled."
              : "No driver accepted this request in time. Please try booking again."}
          </p>
        </div>

        {onReset && (
          <Button size="sm" onClick={onReset} className="w-full">
            Book Another Ride
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
