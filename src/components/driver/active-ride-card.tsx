"use client";

import * as React from "react";
import Link from "next/link";
import {
  verifyPickupOtpAndStartTripAction,
  completeTripAction,
} from "@/actions/driver";
import { broadcastRideEvent } from "@/hooks/use-ride-channel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Navigation,
  User,
  Phone,
  CheckCircle2,
  Loader2,
  KeyRound,
  Flag,
} from "lucide-react";

export interface ActiveTripData {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  fare: number;
  partnerAmount: number;
  status: string;
  riderName: string;
  riderMobile: string;
}

interface ActiveRideCardProps {
  trip: ActiveTripData;
  onRefresh: () => void;
}

export function ActiveRideCard({ trip, onRefresh }: ActiveRideCardProps) {
  const [otpInput, setOtpInput] = React.useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 4) {
      setActionError("Please enter the 4-digit OTP provided by the passenger.");
      return;
    }

    setIsVerifyingOtp(true);
    setActionError(null);
    try {
      const res = await verifyPickupOtpAndStartTripAction(trip.id, otpInput);
      if (res.success) {
        setActionSuccess("OTP Verified! Trip is now active.");
        broadcastRideEvent(trip.id, "ride-status-update", { status: "started" }).catch(() => {});
        onRefresh();
      } else {
        setActionError(res.error || "Verification failed");
      }
    } catch {
      setActionError("Network error while verifying OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!confirm(`Are you sure you have reached the destination? Collect ₹${trip.fare} from passenger.`)) {
      return;
    }

    setIsCompleting(true);
    setActionError(null);
    try {
      const res = await completeTripAction(trip.id, "cash");
      if (res.success) {
        setActionSuccess(res.message || "Trip completed!");
        broadcastRideEvent(trip.id, "ride-status-update", { status: "completed" }).catch(() => {});
        onRefresh();
      } else {
        setActionError(res.error || "Failed to complete trip");
      }
    } catch {
      setActionError("Network error while ending trip");
    } finally {
      setIsCompleting(false);
    }
  };

  const isTripStarted = trip.status === "started";

  return (
    <Card className="border-purple-200 dark:border-purple-900/60 shadow-lg bg-gradient-to-br from-white to-purple-50/20 dark:from-zinc-900 dark:to-purple-950/20">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600" />
            </span>
            <CardTitle className="text-base font-bold">
              {isTripStarted ? "Active Ride in Progress" : "Trip Assigned — Heading to Pickup"}
            </CardTitle>
          </div>

          <Badge
            variant="outline"
            className={
              isTripStarted
                ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40"
            }
          >
            {isTripStarted ? "Driving to Destination" : "Pickup Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Rider Info Strip */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {trip.riderName}
              </p>
              <p className="text-xs text-zinc-500">{trip.riderMobile}</p>
            </div>
          </div>

          <a
            href={`tel:${trip.riderMobile}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call</span>
          </a>
        </div>

        {/* Addresses */}
        <div className="space-y-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                Pickup Address
              </span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {trip.pickupAddress}
              </p>
            </div>
          </div>

          <div className="ml-2.5 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 h-3" />

          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">
                Destination Address
              </span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {trip.dropAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Fare Highlight */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500">Collect from Passenger:</span>
            <span className="ml-1.5 font-bold text-zinc-900 dark:text-zinc-100">
              ₹{trip.fare}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Your Share:</span>
            <span className="ml-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              ₹{trip.partnerAmount}
            </span>
          </div>
        </div>

        {/* Action Error / Success alerts */}
        {actionError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ACTIONS BASED ON TRIP STATUS */}
        {!isTripStarted ? (
          /* STEP: Enter 4-digit Pickup OTP to start */
          <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mb-1.5">
                <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                <span>Enter Passenger 4-Digit Pickup OTP</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 5432"
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5 text-center font-mono text-lg font-bold tracking-widest dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length !== 4}
                  className="px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md"
                >
                  {isVerifyingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Start Trip</span>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Ask passenger for the 4-digit code displayed on their SafarX screen.
            </p>
          </form>
        ) : (
          /* STEP: End Trip Button */
          <div className="pt-2">
            <Button
              type="button"
              disabled={isCompleting}
              onClick={handleCompleteTrip}
              className="w-full py-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  <span>Reached Destination — End Ride (Collect ₹{trip.fare})</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Link to Dedicated Full-Screen Progression View */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Link href={`/ride/${trip.id}`} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold"
            >
              <Navigation className="h-3.5 w-3.5 text-purple-600" />
              <span>Open Dedicated Ride Progression Screen (/ride/{trip.id.slice(0, 8)})</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
