"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  ExternalLink,
  Calendar,
} from "lucide-react";
import type { RecentBookingItem } from "@/actions/admin";

interface AdminRidesTableProps {
  bookings: RecentBookingItem[];
}

export function AdminRidesTable({ bookings }: AdminRidesTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Platform Rides &amp; Commission Ledger
          </h3>
          <p className="text-xs text-zinc-500">
            Real-time ride dispatch records with 20% platform commission breakdown
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {bookings.length} Recent Trips
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Trip ID / Time</th>
              <th className="py-3 px-4">Passenger</th>
              <th className="py-3 px-4">Driver Partner</th>
              <th className="py-3 px-4">Pickup &amp; Drop</th>
              <th className="py-3 px-4">Gross Fare</th>
              <th className="py-3 px-4">SafarX Commission</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-400">
                  <Car className="h-7 w-7 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No rides booked yet</p>
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const isCompleted = b.bookingStatus === "completed";
                const isStarted = b.bookingStatus === "started";
                const isConfirmed = b.bookingStatus === "confirmed";
                const isCancelled = b.bookingStatus === "cancelled";

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Trip ID / Time */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">
                        #{b.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Passenger */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                        {b.user.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {b.user.mobileNumber || b.user.email}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="py-3.5 px-4">
                      {b.driver ? (
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                            {b.driver.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {b.vehicle?.vehicleModel} ({b.vehicle?.number})
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Pickup & Drop */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{b.pickUpAddress}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span className="truncate">{b.dropAddress}</span>
                        </div>
                      </div>
                    </td>

                    {/* Gross Fare */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                        ₹{b.fare}
                      </span>
                      <span className="text-[10px] text-zinc-400 block capitalize">
                        {b.paymentStatus}
                      </span>
                    </td>

                    {/* Admin Commission */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        ₹{b.adminCommission}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        Partner: ₹{b.partnerAmount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          isCompleted
                            ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : isStarted
                            ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40 animate-pulse"
                            : isConfirmed
                            ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40"
                            : isCancelled
                            ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                            : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                        }`}
                      >
                        {b.bookingStatus}
                      </Badge>
                    </td>

                    {/* Action link */}
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/ride/${b.id}`} className="inline-block">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-zinc-500 hover:text-purple-600 text-xs"
                          title="Open Progression Screen"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
