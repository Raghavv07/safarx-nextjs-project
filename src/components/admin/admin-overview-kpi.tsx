"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Car,
  Radio,
  Clock,
} from "lucide-react";
import type { AdminMetrics } from "@/actions/admin";

interface AdminOverviewKpiProps {
  metrics: AdminMetrics;
}

export function AdminOverviewKpi({ metrics }: AdminOverviewKpiProps) {
  const completionRate =
    metrics.totalRides > 0
      ? Math.round((metrics.completedRides / metrics.totalRides) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Platform Commission */}
      <Card className="border-purple-200 dark:border-purple-900/60 shadow-sm bg-gradient-to-br from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-950/20">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Platform Commission
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
              ₹{metrics.totalPlatformCommission.toLocaleString("en-IN")}
            </span>
            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
              Admin Rev
            </Badge>
          </div>

          <p className="text-[11px] text-zinc-400">
            Gross booking value: ₹{metrics.totalGrossFare.toLocaleString("en-IN")}
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Rides & Completion */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Total Rides Booked
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Car className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {metrics.totalRides}
            </span>
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
              {completionRate}% Fulfilled
            </Badge>
          </div>

          <p className="text-[11px] text-zinc-400">
            {metrics.completedRides} successful trips completed
          </p>
        </CardContent>
      </Card>

      {/* 3. Active Duty Drivers (Radar) */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Active Duty Drivers
            </span>
            <div className="relative flex items-center justify-center">
              {metrics.activeDutyDrivers > 0 && (
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
              )}
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Radio className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {metrics.activeDutyDrivers}
            </span>
            <Badge
              variant="outline"
              className={
                metrics.activeDutyDrivers > 0
                  ? "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                  : "border-zinc-300 text-zinc-500"
              }
            >
              {metrics.activeDutyDrivers > 0 ? "Online Now" : "None Online"}
            </Badge>
          </div>

          <p className="text-[11px] text-zinc-400">
            {metrics.approvedPartnersCount} total registered partners
          </p>
        </CardContent>
      </Card>

      {/* 4. Pending Verification Queue */}
      <Card className="border-amber-200 dark:border-amber-900/60 shadow-sm bg-gradient-to-br from-white to-amber-50/30 dark:from-zinc-900 dark:to-amber-950/20">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pending Approval Queue
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.pendingPartnersCount}
            </span>
            {metrics.pendingKycCount > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] animate-pulse">
                {metrics.pendingKycCount} Video KYC
              </Badge>
            )}
          </div>

          <p className="text-[11px] text-zinc-400">
            Awaiting compliance officer review
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
