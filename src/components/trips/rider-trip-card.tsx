"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car,
  MapPin,
  Navigation,
  Calendar,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import type { RiderTripItem } from "@/actions/trips";

interface RiderTripCardProps {
  trip: RiderTripItem;
  onOpenInvoice: (bookingId: string) => void;
}

export function RiderTripCard({ trip, onOpenInvoice }: RiderTripCardProps) {
  const isCompleted = trip.bookingStatus === "completed";
  const isActive = trip.bookingStatus === "confirmed" || trip.bookingStatus === "started";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900 overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Top Header: Date, ID, Status Badge */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Calendar className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {new Date(trip.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>·</span>
            <span className="font-mono text-zinc-400">
              {new Date(trip.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 hidden sm:inline">
              #{trip.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[9px] font-semibold ${
                trip.paymentStatus === "paid"
                  ? "border-emerald-300 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : trip.paymentStatus === "cash"
                  ? "border-amber-300 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                  : "border-zinc-300 text-zinc-500"
              }`}
            >
              {trip.paymentStatus === "paid"
                ? "Paid Online"
                : trip.paymentStatus === "cash"
                ? "Cash"
                : "Unpaid"}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-bold tracking-wider ${
                isCompleted
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                  : isActive
                  ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40 animate-pulse"
                  : "border-rose-400 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
              }`}
            >
              {trip.bookingStatus}
            </Badge>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-2.5">
          {/* Pickup */}
          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Pickup Address
              </span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {trip.pickUpAddress}
              </p>
            </div>
          </div>

          {/* Dotted line connector */}
          <div className="ml-2.5 border-l-2 border-dashed border-zinc-200 dark:border-zinc-800 h-3" />

          {/* Destination */}
          <div className="flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="h-3 w-3 text-rose-500" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Destination Drop
              </span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {trip.dropAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle Strip + Total Fare */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {trip.vehicle?.model || "Fleet Vehicle"}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">
                  ({trip.vehicle?.type || "Car"})
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                <span className="font-mono">{trip.vehicle?.number || "DL 01 AB 1234"}</span>
                {trip.driver && (
                  <>
                    <span>·</span>
                    <span>Driver: {trip.driver.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">
              Total Fare
            </span>
            <span className="text-base font-black text-purple-700 dark:text-purple-300">
              ₹{trip.fare}
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href={`/ride/${trip.id}`}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
          >
            <span>View Trip Progression</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenInvoice(trip.id)}
                  className="gap-1.5 text-xs h-8 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-all"
                >
                  <Receipt className="h-3.5 w-3.5 text-purple-600" />
                  <span>Download GST Invoice</span>
                </Button>
              </motion.div>
            )}

            {isActive && (
              <Link href={`/ride/${trip.id}`}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Live Track Trip</span>
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
