import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logoutAction } from "@/actions/auth";
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
  Shield,
  Sparkles,
  LogOut,
  MapPin,
  ShieldCheck,
  Video,
  Radio,
  Receipt,
} from "lucide-react";
import { RideBookingWidget } from "@/components/dashboard/ride-booking-widget";
import { RidePlanner } from "@/components/map/ride-planner";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                SafarX
              </span>
              <span className="ml-2 text-xs text-zinc-500">Ride & Logistics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Info & Role Badge */}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>

            <Badge
              variant={user.isGuest ? "secondary" : "default"}
              className="capitalize"
            >
              {user.isGuest ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Guest Mode
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {user.role}
                </span>
              )}
            </Badge>

            <Link href="/dashboard/trips">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                <Receipt className="h-3.5 w-3.5 text-purple-600" />
                <span className="hidden sm:inline">My Trips & Invoices</span>
                <span className="sm:hidden">Trips</span>
              </Button>
            </Link>

            {user.role === "admin" ? (
              <Link href="/admin">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin Console</span>
                </Button>
              </Link>
            ) : (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  <span>Admin Portal</span>
                </Button>
              </Link>
            )}

            <ThemeToggle />

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {/* Guest Mode Alert Banner */}
        {user.isGuest && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  You are exploring as a Guest Rider
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You can estimate fares and test ride booking. Sign up anytime to save trips and get invoice receipts.
                </p>
              </div>
            </div>

            <Link href="/register">
              <Button
                size="sm"
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400"
              >
                Create Permanent Account
              </Button>
            </Link>
          </div>
        )}

        {/* Welcome Hero */}
        <div className="rounded-3xl bg-zinc-900 p-6 text-white shadow-xl dark:bg-zinc-900 dark:text-zinc-50 sm:p-8">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Shield className="h-4 w-4 text-emerald-400" />
              SafarX Live Platform
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Hello, {user.name}! 👋
            </h1>
            <p className="text-sm text-zinc-300">
              Where would you like to travel today? Instant booking, verified partners, and real-time tracking across India.
            </p>
          </div>
        </div>

        {/* Live Interactive Map, Route Trajectory & Location Search */}
        <RidePlanner />

        {/* Live Ride Estimator & Cache Widget (Zustand + TanStack Query) */}
        <RideBookingWidget />

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Book Ride Card */}
          <Card className="border-zinc-200 shadow-sm transition-all hover:shadow-md dark:border-zinc-800">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2 text-lg">Book a Ride</CardTitle>
              <CardDescription>
                Choose from Bikes, Autos, Cabs, or Mini-Trucks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Real-time fare calculation with zero hidden charges.
              </p>
              <Link href="/dashboard/trips" className="block">
                <Button variant="outline" size="sm" className="w-full gap-2 border-zinc-200 dark:border-zinc-800 text-xs">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <span>My Past Trips & Invoices</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Partner & Driver Section */}
          <Card className="border-zinc-200 shadow-sm transition-all hover:shadow-md dark:border-zinc-800">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <Car className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2 text-lg">Partner Portal</CardTitle>
              <CardDescription>
                {user.role === "partner"
                  ? "Manage vehicles, trips, and earnings"
                  : "Earn with your vehicle on SafarX"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Flexible hours, instant bank settlement and low commission.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/partner/dashboard" className="block">
                  <Button size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                    <Radio className="h-4 w-4" />
                    <span>Driver Console (Live Duty)</span>
                  </Button>
                </Link>
                <Link href="/partner/onboard" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2 border-zinc-200 dark:border-zinc-800">
                    <Car className="h-4 w-4" />
                    <span>Driver Onboarding Form</span>
                  </Button>
                </Link>
                <Link href="/dashboard/kyc" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Video className="h-4 w-4" />
                    <span>Video KYC Room</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Security & Support */}
          <Card className="border-zinc-200 shadow-sm transition-all hover:shadow-md dark:border-zinc-800">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2 text-lg">Safety & Support</CardTitle>
              <CardDescription>
                24x7 Emergency assistance and GPS monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Every trip is insured and monitored in real-time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details Card */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Account Overview & Authorization
            </CardTitle>
            <CardDescription>
              Supabase Auth & Prisma PostgreSQL Session Details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <span className="text-xs text-zinc-500">Account Type</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.isGuest ? "Temporary Guest" : "Verified User"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <span className="text-xs text-zinc-500">Assigned Role</span>
                <p className="font-semibold uppercase text-zinc-900 dark:text-zinc-100">
                  {user.role}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <span className="text-xs text-zinc-500">Auth Provider</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.isGuest ? "SafarX Guest Session" : "Supabase Auth (SSR)"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <span className="text-xs text-zinc-500">Database Sync</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Active (Supabase Postgres)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
