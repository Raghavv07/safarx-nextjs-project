"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Clock,
  Car,
  CheckCircle2,
  Navigation,
  MapPin,
  TrendingUp,
  Star,
  Users,
  Check,
} from "lucide-react";
import type { CurrentUser } from "@/actions/auth";

interface HeroMotionProps {
  user: CurrentUser | null;
  guestLoginAction: () => Promise<void>;
}

const FLEET_PREVIEWS = [
  { id: "moto", name: "Moto Fast", icon: "🏍️", fare: "₹35", eta: "2 min", tag: "Fastest in Traffic" },
  { id: "auto", name: "Auto Rickshaw", icon: "🛺", fare: "₹50", eta: "3 min", tag: "Pocket Friendly" },
  { id: "mini", name: "Mini Comfort", icon: "🚗", fare: "₹80", eta: "4 min", tag: "Most Popular" },
  { id: "sedan", name: "Prime Sedan", icon: "🚘", fare: "₹120", eta: "5 min", tag: "Top Rated Drivers" },
  { id: "suv", name: "SafarX XL SUV", icon: "🚙", fare: "₹180", eta: "7 min", tag: "Family & Luggage" },
];

export function HeroMotion({ user, guestLoginAction }: HeroMotionProps) {
  const [selectedFleet, setSelectedFleet] = React.useState("mini");
  const activeFleet = FLEET_PREVIEWS.find((f) => f.id === selectedFleet) || FLEET_PREVIEWS[2];

  return (
    <div className="relative overflow-hidden flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-20 text-center sm:px-6">
      {/* Ambient Radial Glow Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-full h-[400px] bg-gradient-to-tr from-purple-500/20 via-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

      {/* Hero Header Motion Container */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl space-y-6"
      >
        {/* Animated Pill Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Badge
            variant="outline"
            className="gap-2 rounded-full border-purple-300 dark:border-purple-800 bg-white/80 dark:bg-purple-950/40 backdrop-blur-md px-4 py-1.5 text-xs text-purple-700 dark:text-purple-300 shadow-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold">Next-Gen Mobility Network · Supabase Realtime &amp; DeepSeek AI</span>
          </Badge>
        </motion.div>

        {/* Main Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl leading-[1.1]"
        >
          Smarter Urban Travel &amp;{" "}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
            Logistics for India
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed"
        >
          Book bikes, autos, cabs, and delivery fleets with millisecond road GPS tracking, 
          dual OTP security, DeepSeek AI smart driver replies, and instant cashless FastPay settlements.
        </motion.p>

        {/* CTA Buttons with Spring Physics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row"
        >
          {user ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 px-8 py-6 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-600/25">
                  <span>Open Live Booking Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link href="/register">
                  <Button size="lg" className="w-full gap-2 px-8 py-6 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-600/25 sm:w-auto">
                    <span>Book Your First Ride</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <form action={guestLoginAction} className="w-full sm:w-auto">
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-8 py-6 text-sm font-bold rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Instant 1-Click Guest Pass</span>
                    <Compass className="h-4 w-4 text-zinc-400" />
                  </Button>
                </form>
              </motion.div>
            </>
          )}

          <Link href="/partner/onboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl"
            >
              Drive with Us · Earn ₹45k+ →
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Interactive Fleet Selection Simulator Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mx-auto mt-12 w-full max-w-3xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl text-left"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
              Live Fleet Preview
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              Select Your Preferred Ride Category
            </h3>
          </div>

          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800 text-[10px] font-mono">
            ● GPS Road Trajectory Active
          </Badge>
        </div>

        {/* Fleet category pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4">
          {FLEET_PREVIEWS.map((fleet) => {
            const isSelected = selectedFleet === fleet.id;
            return (
              <motion.button
                key={fleet.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setSelectedFleet(fleet.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/50 shadow-sm ring-2 ring-purple-600/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50"
                }`}
              >
                <span className="text-2xl block mb-1">{fleet.icon}</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                  {fleet.name}
                </span>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-extrabold text-purple-700 dark:text-purple-300">{fleet.fare}</span>
                  <span className="text-zinc-400 text-[10px]">{fleet.eta}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active fleet highlight strip */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeFleet.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeFleet.name}</span>
                <span className="rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 text-[10px] font-semibold">
                  {activeFleet.tag}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Estimated Arrival: <b>~{activeFleet.eta}</b> · Base fare starting at <b>{activeFleet.fare}</b>
              </p>
            </div>
          </div>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5">
              <span>Book {activeFleet.name} Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Key Metrics Statistics Bar */}
      <div className="mx-auto mt-14 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Verified Trips", val: "50,000+", icon: Car, color: "text-purple-600" },
          { label: "Average Pickup ETA", val: "< 3.5 Mins", icon: Clock, color: "text-emerald-600" },
          { label: "Partner Rating", val: "4.9 ★", icon: Star, color: "text-amber-500" },
          { label: "Dual OTP Security", val: "100%", icon: ShieldCheck, color: "text-indigo-600" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * idx, duration: 0.4 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md p-4 text-left shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="mt-1 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">{stat.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Feature Highlight Cards with Viewport Animation */}
      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            color: "text-amber-500 bg-amber-100 dark:bg-amber-950/40",
            title: "Instant Guest Exploration",
            desc: "Zero-barrier access. Test bookings, vehicle selection, and real-time live routing without upfront registration.",
          },
          {
            icon: ShieldCheck,
            color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40",
            title: "Dual OTP Security & Video KYC",
            desc: "4-Digit Pickup & Drop OTP verification protects every ride, while GetStream WebRTC powers Driver compliance verification.",
          },
          {
            icon: Clock,
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40",
            title: "Real-Time Dispatch & FastPay",
            desc: "Supabase Realtime millisecond dispatch syncing, DeepSeek AI smart replies, and instant UPI/IMPS driver payouts.",
          },
        ].map((feat, idx) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.15 * idx, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${feat.color}`}>
              <feat.icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {feat.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
