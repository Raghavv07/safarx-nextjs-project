"use client";

import * as React from "react";
import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import {
  getRiderTripsAction,
  type RiderTripsOverview,
  type RiderTripItem,
} from "@/actions/trips";
import { RiderTripCard } from "@/components/trips/rider-trip-card";
import { GstInvoiceModal } from "@/components/trips/gst-invoice-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Car,
  Receipt,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Calendar,
  Loader2,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type FilterType = "all" | "completed" | "cancelled" | "active";

export default function RiderTripsPage() {
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  const [overview, setOverview] = React.useState<RiderTripsOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all");

  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = React.useState<string | null>(null);

  // Load trips function
  const loadTrips = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getRiderTripsAction();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error("Failed to load rider trips:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth & initial load
  React.useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setCurrentUser(user);
        setAuthChecked(true);

        if (user) {
          getRiderTripsAction()
            .then((res) => {
              if (!isMounted) return;
              if (res.success && res.data) {
                setOverview(res.data);
              }
              setIsLoading(false);
            })
            .catch((err) => {
              if (!isMounted) return;
              console.error("Failed to load trips:", err);
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Auth check failed:", err);
        setAuthChecked(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered trips list (auto-optimized by React 19 compiler)
  const allTrips = overview?.trips || [];

  const filteredTrips = allTrips.filter((trip) => {
    // 1. Status Filter
    if (activeFilter === "completed" && trip.bookingStatus !== "completed") {
      return false;
    }
    if (
      activeFilter === "cancelled" &&
      trip.bookingStatus !== "cancelled" &&
      trip.bookingStatus !== "rejected"
    ) {
      return false;
    }
    if (
      activeFilter === "active" &&
      trip.bookingStatus !== "confirmed" &&
      trip.bookingStatus !== "started"
    ) {
      return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const pickUp = trip.pickUpAddress?.toLowerCase() || "";
      const drop = trip.dropAddress?.toLowerCase() || "";
      const driverName = trip.driver?.name?.toLowerCase() || "";
      const vehicleNumber = trip.vehicle?.number?.toLowerCase() || "";
      const tripId = trip.id.toLowerCase();

      return (
        pickUp.includes(query) ||
        drop.includes(query) ||
        driverName.includes(query) ||
        vehicleNumber.includes(query) ||
        tripId.includes(query)
      );
    }

    return true;
  });

  // Active trips count
  const activeTripsCount = allTrips.filter(
    (t) => t.bookingStatus === "confirmed" || t.bookingStatus === "started"
  ).length;

  if (!authChecked || (isLoading && !overview)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-sm font-medium text-zinc-500">Loading your trip history...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center mb-4">
          <Receipt className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Sign In to Access Trip Invoices
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mt-2 mb-6">
          You need to be logged into your SafarX account to view your past rides and download GST tax receipts.
        </p>
        <Link href="/login">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
            Proceed to Login
          </Button>
        </Link>
      </div>
    );
  }

  const metrics = overview?.metrics || {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalSpent: 0,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold sm:text-base leading-tight">
                  My Trips & GST Invoices
                </h1>
                <p className="text-[11px] text-zinc-500">
                  Passenger: {currentUser.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTrips}
              disabled={isLoading}
              className="gap-1.5 text-xs border-zinc-200 dark:border-zinc-800 rounded-xl"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Link href="/dashboard">
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
              >
                <Car className="h-3.5 w-3.5" />
                <span>Book New Ride</span>
              </Button>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* KPI / Metrics Overview Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Total Trips */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Bookings</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                  {metrics.totalTrips}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Lifetime activity</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Completed Trips */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Completed Trips</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {metrics.completedTrips}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Invoices eligible</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Cancelled / Discarded */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Cancelled / Rejected</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {metrics.cancelledTrips}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Zero charge</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Total Spent */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Spent</p>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  ₹{metrics.totalSpent}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Incl. 5% GST</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <IndianRupee className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              type="button"
              size="sm"
              variant={activeFilter === "all" ? "default" : "ghost"}
              onClick={() => setActiveFilter("all")}
              className={`rounded-xl text-xs gap-1.5 h-8 ${
                activeFilter === "all"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>All Trips</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                {metrics.totalTrips}
              </Badge>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={activeFilter === "completed" ? "default" : "ghost"}
              onClick={() => setActiveFilter("completed")}
              className={`rounded-xl text-xs gap-1.5 h-8 ${
                activeFilter === "completed"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>Completed</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
              >
                {metrics.completedTrips}
              </Badge>
            </Button>

            {activeTripsCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant={activeFilter === "active" ? "default" : "ghost"}
                onClick={() => setActiveFilter("active")}
                className={`rounded-xl text-xs gap-1.5 h-8 ${
                  activeFilter === "active"
                    ? "bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span>Active / In Progress</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                >
                  {activeTripsCount}
                </Badge>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant={activeFilter === "cancelled" ? "default" : "ghost"}
              onClick={() => setActiveFilter("cancelled")}
              className={`rounded-xl text-xs gap-1.5 h-8 ${
                activeFilter === "cancelled"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>Cancelled</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
              >
                {metrics.cancelledTrips}
              </Badge>
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pickup, drop, driver..."
              className="pl-9 h-8 text-xs bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        </div>

        {/* Trips List or Empty State */}
        {filteredTrips.length === 0 ? (
          <Card className="border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <Car className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? "No matching trips found" : "No trips in this category"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery
                ? `No records found for "${searchQuery}". Try searching by another landmark or clear filter.`
                : activeFilter === "completed"
                ? "You haven't completed any rides yet. Book a ride to generate your first GST invoice receipt!"
                : "You don't have any trips recorded under this filter yet."}
            </p>
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs rounded-xl"
              >
                Clear Search Query
              </Button>
            ) : (
              <Link href="/dashboard">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Book Your Next Journey</span>
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrips.map((trip: RiderTripItem) => (
              <RiderTripCard
                key={trip.id}
                trip={trip}
                onOpenInvoice={(bookingId) => setSelectedInvoiceBookingId(bookingId)}
              />
            ))}
          </div>
        )}

        {/* GST Invoice Reimbursement & Regulatory Information Box */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-purple-50/40 dark:bg-purple-950/20 p-4 sm:p-5 text-xs text-zinc-600 dark:text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">
                Official GST Tax Invoices for Reimbursement
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                All SafarX completed ride receipts are officially registered under SAC Code 996412 (Passenger Transport Services) in compliance with Section 9(5) of the CGST Act 2017. Invoices carry valid GSTIN and itemized 2.5% CGST + 2.5% SGST breakdown eligible for corporate reimbursement claims.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* GST Invoice Modal */}
      <GstInvoiceModal
        bookingId={selectedInvoiceBookingId}
        isOpen={Boolean(selectedInvoiceBookingId)}
        onClose={() => setSelectedInvoiceBookingId(null)}
      />
    </div>
  );
}
