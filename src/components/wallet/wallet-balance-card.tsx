"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type { WalletMetrics } from "@/actions/wallet";

interface WalletBalanceCardProps {
  metrics: WalletMetrics;
  onOpenWithdraw: () => void;
}

export function WalletBalanceCard({
  metrics,
  onOpenWithdraw,
}: WalletBalanceCardProps) {
  const canWithdraw = metrics.withdrawableBalance >= 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Main Withdrawable Balance Hero (8 cols) */}
      <Card className="lg:col-span-8 border-purple-200 dark:border-purple-900/60 shadow-xl overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white relative">
        {/* Background glow & subtle patterns */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <CardContent className="p-6 sm:p-8 space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider block">
                  SafarX FastPay Wallet
                </span>
                <span className="text-[11px] text-purple-100/80">
                  Instant Payout Enabled · 24x7 IMPS &amp; UPI
                </span>
              </div>
            </div>

            <Badge className="bg-emerald-400 text-zinc-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Zap className="h-3 w-3 fill-zinc-950" />
              <span>Instant Settlement</span>
            </Badge>
          </div>

          {/* Big Balance Number */}
          <div className="space-y-1">
            <span className="text-xs text-purple-200 font-medium">
              Available Withdrawable Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                ₹{metrics.withdrawableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/90">
              Ready for immediate transfer to your registered Bank Account or UPI handle.
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                disabled={!canWithdraw}
                onClick={onOpenWithdraw}
                className="bg-white text-purple-900 hover:bg-purple-50 font-extrabold text-xs py-5 px-6 rounded-xl shadow-lg transition-all gap-2"
              >
                <ArrowUpRight className="h-4 w-4 text-purple-700" />
                <span>Withdraw Funds to Bank / UPI</span>
              </Button>
            </motion.div>

            {!canWithdraw && (
              <span className="text-[11px] text-purple-200 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Minimum withdrawal amount is ₹10. Complete rides to earn.</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Earnings & Settlement Breakdown (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Lifetime Earnings */}
        <motion.div whileHover={{ scale: 1.01 }} className="flex-1">
          <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Total Lifetime Earnings
                </span>
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  ₹{metrics.lifetimeEarnings.toLocaleString("en-IN")}
                </span>
                <p className="text-[10px] text-zinc-500">
                  From {metrics.totalTrips} completed trips
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settled / Withdrawn */}
        <motion.div whileHover={{ scale: 1.01 }} className="flex-1">
          <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Total Settled &amp; Paid Out
                </span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  ₹{metrics.settledAmount.toLocaleString("en-IN")}
                </span>
                <p className="text-[10px] text-zinc-500">
                  Transferred to Bank / UPI
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
