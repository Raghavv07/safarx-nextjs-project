"use client";

import * as React from "react";
import Link from "next/link";
import {
  getDriverDashboardDataAction,
  toggleDriverOnlineAction,
  updateDriverLocationAction,
  acceptRideRequestAction,
  rejectRideRequestAction,
  type DriverDashboardData,
} from "@/actions/driver";
import { IncomingRideModal } from "@/components/driver/incoming-ride-modal";
import { ActiveRideCard } from "@/components/driver/active-ride-card";
import { InRideChatDrawer } from "@/components/chat/in-ride-chat-drawer";
import { broadcastRideEvent } from "@/hooks/use-ride-channel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Car,
  Power,
  DollarSign,
  TrendingUp,
  Video,
  Radio,
  Loader2,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DriverDashboardPage() {
  const [data, setData] = React.useState<DriverDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTogglingDuty, setIsTogglingDuty] = React.useState(false);
  const [gpsLocation, setGpsLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 1. Fetch dashboard data for explicit actions & refreshes
  const loadDashboardData = React.useCallback(async () => {
    try {
      const res = await getDriverDashboardDataAction();
      if (res.success && res.data) {
        setData(res.data);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    // Initial load via asynchronous promise
    getDriverDashboardDataAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setData(res.data);
        } else if (res.error) {
          setErrorMessage(res.error);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Dashboard initial fetch error:", err);
        setIsLoading(false);
      });

    // Poll every 5 seconds for new incoming ride requests
    const pollInterval = setInterval(() => {
      getDriverDashboardDataAction()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // 2. Real-Time GPS Tracking & Broadcasting (watchPosition)
  React.useEffect(() => {
    if (!data?.driver.isOnline) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLocation({ lat: latitude, lng: longitude });

        // Broadcast to database
        updateDriverLocationAction(latitude, longitude).catch(() => {});

        // Broadcast live coordinates to rider on active trip channel
        if (data?.activeTrip?.id) {
          broadcastRideEvent(data.activeTrip.id, "driver-location", {
            lat: latitude,
            lng: longitude,
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn("GPS watch error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [data?.driver.isOnline, data?.activeTrip?.id]);

  // 3. Toggle Online/Offline Duty Action
  const handleToggleDuty = async () => {
    if (!data) return;
    setIsTogglingDuty(true);
    const newStatus = !data.driver.isOnline;

    try {
      const res = await toggleDriverOnlineAction(newStatus);
      if (res.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                driver: { ...prev.driver, isOnline: newStatus },
              }
            : null
        );
      } else {
        alert(res.error || "Failed to change online status");
      }
    } catch {
      alert("Network error while toggling duty status");
    } finally {
      setIsTogglingDuty(false);
    }
  };

  // 4. Accept Incoming Ride
  const handleAcceptRide = async (bookingId: string) => {
    const res = await acceptRideRequestAction(bookingId);
    if (res.success) {
      // Broadcast acceptance to rider via Supabase Realtime
      broadcastRideEvent(bookingId, "ride-accepted", {
        bookingId,
        driverId: data?.driver.id,
        driverName: data?.driver.name,
      }).catch(() => {});

      await loadDashboardData();
    } else {
      alert(res.error || "Failed to accept ride");
    }
  };

  // 5. Decline Incoming Ride
  const handleDeclineRide = async (bookingId: string) => {
    await rejectRideRequestAction(bookingId);
    await loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Loading Driver Partner Console...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 text-center p-6 space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Access Restricted
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {errorMessage || "You must be a registered driver partner to access this page."}
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/partner/onboard">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Complete Driver Onboarding
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Rider Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { driver, vehicle, stats, activeTrip, pendingRequests } = data;
  const isOnline = driver.isOnline;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      {/* Incoming Request Modal (Sound + 30s Countdown) */}
      {pendingRequests.length > 0 && !activeTrip && (
        <IncomingRideModal
          key={pendingRequests[0].id}
          request={pendingRequests[0]}
          onAccept={handleAcceptRide}
          onDecline={handleDeclineRide}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-zinc-500">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rider View</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm font-bold">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  SafarX Partner Console
                </span>
                <span className="ml-2 text-[10px] text-zinc-400 font-mono">
                  {vehicle ? vehicle.number : "No Vehicle"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/partner/wallet">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-purple-600 border-purple-200 dark:border-purple-800 flex items-center gap-1.5"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>FastPay Wallet</span>
              </Button>
            </Link>

            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-purple-600 border-purple-200 dark:border-purple-800 hidden sm:flex items-center gap-1"
              >
                <span>Admin</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadDashboardData}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Refresh Stats"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            {/* Online / Offline Toggle Button */}
            <Button
              type="button"
              disabled={isTogglingDuty}
              onClick={handleToggleDuty}
              className={`gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-md ${
                isOnline
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {isTogglingDuty ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5" />
              )}
              <span>{isOnline ? "ON DUTY (ONLINE)" : "OFFLINE"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Driver Status Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900 text-white shadow-xl dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-lg text-purple-400">
                {driver.name.charAt(0)}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-900 ${
                  isOnline ? "bg-emerald-500" : "bg-zinc-500"
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{driver.name}</h1>
                <Badge
                  variant="outline"
                  className={
                    driver.partnerStatus === "approved"
                      ? "border-emerald-500 text-emerald-400 text-[10px]"
                      : "border-amber-500 text-amber-400 text-[10px]"
                  }
                >
                  {driver.partnerStatus === "approved" ? "Verified Partner" : "Pending Approval"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {vehicle ? `${vehicle.model} (${vehicle.type.toUpperCase()})` : "Vehicle not assigned yet"}
              </p>
            </div>
          </div>

          {/* GPS Live Status Indicator */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-3.5 py-2 rounded-2xl border border-zinc-700 text-xs">
            <Radio className={`h-4 w-4 ${isOnline ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                Live GPS Broadcast
              </span>
              <span className="text-zinc-200 font-mono text-[11px]">
                {isOnline
                  ? gpsLocation
                    ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}`
                    : "Detecting Coordinates..."
                  : "Broadcasting Paused"}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Earnings & Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Earnings */}
          <Link href="/partner/wallet" className="block">
            <Card className="border-purple-200 dark:border-purple-900/60 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-700 transition-all cursor-pointer">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>Today&apos;s Earnings</span>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  ₹{stats.todayEarnings}
                </div>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-between">
                  <span>Instant wallet payout</span>
                  <span>➔</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 2. Today's Completed Trips */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Trips Completed Today</span>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {stats.todayTripsCount}
              </div>
              <p className="text-[10px] text-zinc-400">Today&apos;s active shifts</p>
            </CardContent>
          </Card>

          {/* 3. All-Time Earnings */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Lifetime Earnings</span>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                ₹{stats.totalEarnings}
              </div>
              <p className="text-[10px] text-zinc-400">Total revenue generated</p>
            </CardContent>
          </Card>

          {/* 4. Total Trips */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>Lifetime Trips</span>
                <Car className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {stats.totalTripsCount}
              </div>
              <p className="text-[10px] text-zinc-400">Total customer rides</p>
            </CardContent>
          </Card>
        </div>

        {/* ACTIVE TRIP OR DUTY RADAR SECTION */}
        {activeTrip ? (
          /* ACTIVE ONGOING TRIP CARD */
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Active Trip Navigation
            </h2>
            <ActiveRideCard trip={activeTrip} onRefresh={loadDashboardData} />
          </div>
        ) : (
          /* NO ACTIVE TRIP: RADAR OR OFFLINE HERO */
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              {isOnline ? (
                <>
                  <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/30" />
                    <span className="relative flex h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center">
                      <Radio className="h-7 w-7" />
                    </span>
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      SafarX Radar Active
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      You are online and visible to passengers. Incoming ride requests will alert here with sound.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Power className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      You Are Currently Offline
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Turn your duty status ON in the top right corner to start receiving ride requests.
                    </p>
                  </div>
                  <Button
                    onClick={handleToggleDuty}
                    disabled={isTogglingDuty}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-6"
                  >
                    <Power className="h-4 w-4" />
                    <span>Go Online Now</span>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Partner Action Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purple-600" />
                Driver Documents & Vehicle Registration
              </CardTitle>
              <CardDescription className="text-xs">
                Update your Driving License, RC Book, or Bank Account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/partner/onboard">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Manage Onboarding Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-600" />
                Live Video KYC Room
              </CardTitle>
              <CardDescription className="text-xs">
                Face-to-face identity verification with SafarX compliance team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/kyc">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Open Video KYC Console
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Floating In-Ride Chat Drawer for active trip */}
        {activeTrip && (
          <InRideChatDrawer
            bookingId={activeTrip.id}
            currentUserRole="driver"
            counterpartName={activeTrip.riderName || "Passenger"}
          />
        )}
      </main>
    </div>
  );
}
