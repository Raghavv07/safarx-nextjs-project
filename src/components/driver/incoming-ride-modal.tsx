"use client";

import * as React from "react";
import { startRideAlertLoop, stopRideAlertLoop } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, User, Phone, Check, X, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface PendingRideRequest {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  fare: number;
  partnerAmount: number;
  riderName: string;
  riderMobile: string;
  vehicleType: string;
}

interface IncomingRideModalProps {
  request: PendingRideRequest | null;
  onAccept: (bookingId: string) => Promise<void>;
  onDecline: (bookingId: string) => Promise<void>;
}

const TOTAL_COUNTDOWN = 30; // 30 seconds

export function IncomingRideModal({
  request,
  onAccept,
  onDecline,
}: IncomingRideModalProps) {
  const [timeLeft, setTimeLeft] = React.useState(TOTAL_COUNTDOWN);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);

  // Sound & Countdown lifecycle
  React.useEffect(() => {
    if (!request) {
      stopRideAlertLoop();
      return;
    }

    // Start sound alert
    startRideAlertLoop();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopRideAlertLoop();
          onDecline(request.id).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopRideAlertLoop();
    };
  }, [request, onDecline]);

  if (!request) return null;

  const progressPercent = (timeLeft / TOTAL_COUNTDOWN) * 100;

  const handleAccept = async () => {
    setIsAccepting(true);
    stopRideAlertLoop();
    try {
      await onAccept(request.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    stopRideAlertLoop();
    try {
      await onDecline(request.id);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
        >
        {/* Countdown Progress Bar Header */}
        <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft < 10 ? "bg-rose-500" : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Top Title & Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Incoming Trip Request
              </span>
            </div>

            <Badge
              variant="outline"
              className={`gap-1 font-mono text-xs ${
                timeLeft < 10
                  ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>{timeLeft}s</span>
            </Badge>
          </div>

          {/* Fare & Payout Highlight */}
          <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-950 p-4 text-white text-center shadow-inner">
            <div className="text-xs text-zinc-400">Your Net Earnings (85%)</div>
            <div className="text-4xl font-extrabold text-emerald-400 tracking-tight my-1">
              ₹{request.partnerAmount}
            </div>
            <div className="text-[11px] text-zinc-500">
              Total Customer Fare: ₹{request.fare}
            </div>
          </div>

          {/* Location Details (Pickup & Drop) */}
          <div className="space-y-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3.5">
            {/* Pickup */}
            <div className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs">
                <span className="text-[10px] uppercase font-semibold text-zinc-400">
                  Pickup
                </span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {request.pickupAddress}
                </p>
              </div>
            </div>

            {/* Trajectory Divider */}
            <div className="ml-2.5 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 h-3" />

            {/* Drop */}
            <div className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs">
                <span className="text-[10px] uppercase font-semibold text-zinc-400">
                  Destination
                </span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {request.dropAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="flex items-center justify-between text-xs px-1 text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{request.riderName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{request.riderMobile}</span>
            </div>
          </div>

          {/* Action Buttons: Accept / Decline */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                disabled={isDeclining || isAccepting}
                onClick={handleDecline}
                className="w-full py-5 rounded-xl border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {isDeclining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1 text-rose-500" />
                    <span>Decline</span>
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                disabled={isAccepting || isDeclining}
                onClick={handleAccept}
                className="w-full py-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/30 transition-all"
              >
                {isAccepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    <span>Accept Ride</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
