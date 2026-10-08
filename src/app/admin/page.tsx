"use client";

import * as React from "react";
import Link from "next/link";
import {
  getAdminOverviewAction,
  promoteCurrentUserToAdminAction,
  type AdminOverviewData,
} from "@/actions/admin";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import { AdminOverviewKpi } from "@/components/admin/admin-overview-kpi";
import { DriverVerificationTable } from "@/components/admin/driver-verification-table";
import { AdminRidesTable } from "@/components/admin/admin-rides-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  ShieldAlert,
  Car,
  Video,
  RefreshCw,
  Users,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);

  const [data, setData] = React.useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [currentTab, setCurrentTab] = React.useState<"drivers" | "rides" | "kyc">("drivers");

  // 1. Check current user auth
  const loadAuthAndData = React.useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setAuthChecked(true);

      if (user && user.role === "admin") {
        const res = await getAdminOverviewAction();
        if (res.success && res.data) {
          setData(res.data);
          setErrorMsg(null);
        } else {
          setErrorMsg(res.error || "Failed to load admin data");
        }
      }
    } catch (err: unknown) {
      console.error("Admin dashboard fetch error:", err);
      setErrorMsg("Failed to communicate with SafarX server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setCurrentUser(user);
        setAuthChecked(true);

        if (user && user.role === "admin") {
          getAdminOverviewAction()
            .then((res) => {
              if (!isMounted) return;
              if (res.success && res.data) {
                setData(res.data);
                setErrorMsg(null);
              } else {
                setErrorMsg(res.error || "Failed to load admin overview");
              }
              setIsLoading(false);
            })
            .catch(() => {
              if (isMounted) setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthChecked(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // One-click Promote to Admin for testing
  const handlePromoteToAdmin = async () => {
    setIsPromoting(true);
    try {
      const res = await promoteCurrentUserToAdminAction();
      if (res.success) {
        // Refresh auth & reload page
        window.location.reload();
      } else {
        alert(res.error || "Failed to promote account");
      }
    } catch {
      alert("Network error");
    } finally {
      setIsPromoting(false);
    }
  };

  // 2. LOADING STATE
  if (!authChecked || (isLoading && !data && currentUser?.role === "admin")) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs text-zinc-500 font-semibold tracking-wide">
          Authenticating SafarX Compliance Officer Console...
        </p>
      </div>
    );
  }

  // 3. UNAUTHENTICATED OR NON-ADMIN GATE
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-xl text-center p-8 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-600/10 text-purple-600 mx-auto flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Admin Authentication Required
            </h2>
            <p className="text-xs text-zinc-500">
              Please sign in with a registered account to access the SafarX Compliance &amp; Admin Console.
            </p>
          </div>
          <Link href="/login?next=/admin" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl shadow-md">
              Sign In to SafarX
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // NON-ADMIN ROLE GATE: Allows promoting account for testing
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-xl text-center p-8 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              SafarX Compliance Clearance Required
            </h2>
            <p className="text-xs text-zinc-500">
              Logged in as <b>{currentUser.name}</b> ({currentUser.email}). Current role is:{" "}
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {currentUser.role}
              </Badge>
            </p>
            <p className="text-[11px] text-zinc-400">
              This portal is restricted to compliance officers and platform administrators.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              disabled={isPromoting}
              onClick={handlePromoteToAdmin}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-5 text-xs rounded-xl shadow-md gap-2"
            >
              {isPromoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-purple-200" />
              )}
              <span>Promote Account to Admin &amp; Continue</span>
            </Button>

            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full text-xs">
                Return to Rider Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 4. AUTHENTICATED ADMIN CONSOLE
  const kycWaitingDrivers = (data?.partners || []).filter(
    (p) => p.videoKycStatus === "pending" || p.videoKycStatus === "inprogress"
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  SafarX Officer Console
                </span>
                <Badge className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0">
                  Admin
                </Badge>
              </div>
              <span className="text-[11px] text-zinc-400 block">
                Compliance, Partner Verification &amp; Platform Dispatch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/kyc">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/40"
              >
                <Video className="h-3.5 w-3.5 text-purple-600" />
                <span className="hidden sm:inline">Officer Video KYC Portal</span>
                {kycWaitingDrivers.length > 0 && (
                  <Badge className="bg-purple-600 text-white text-[9px] px-1 py-0 ml-1">
                    {kycWaitingDrivers.length}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadAuthAndData}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-500">
                User Dashboard
              </Button>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* KPI Platform Overview */}
        {data?.metrics && <AdminOverviewKpi metrics={data.metrics} />}

        {/* Section Navigation Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentTab("drivers")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === "drivers"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Driver Partner Verification</span>
              {data?.metrics.pendingPartnersCount ? (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                  {data.metrics.pendingPartnersCount}
                </Badge>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("rides")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === "rides"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Live Rides &amp; Commission Ledger</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                {data?.recentBookings.length || 0}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("kyc")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                currentTab === "kyc"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Video KYC Waiting Room</span>
              {kycWaitingDrivers.length > 0 && (
                <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0 animate-pulse">
                  {kycWaitingDrivers.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Driver Partner Verification */}
        {currentTab === "drivers" && data && (
          <DriverVerificationTable
            partners={data.partners}
            onRefresh={loadAuthAndData}
          />
        )}

        {/* Tab 2: Rides & Commission Ledger */}
        {currentTab === "rides" && data && (
          <AdminRidesTable bookings={data.recentBookings} />
        )}

        {/* Tab 3: Dedicated Video KYC Waiting Queue */}
        {currentTab === "kyc" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Video KYC Compliance Queue
                </h3>
                <p className="text-xs text-zinc-500">
                  Select any driver candidate below to enter their live encrypted WebRTC verification room.
                </p>
              </div>

              <Link href="/admin/kyc">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 rounded-xl shadow-md">
                  <Video className="h-4 w-4" />
                  <span>Open Full Officer Video Console</span>
                </Button>
              </Link>
            </div>

            {kycWaitingDrivers.length === 0 ? (
              <Card className="border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  No Pending Video KYC Candidates
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  All active partner candidates have either completed their video KYC session or are verified.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kycWaitingDrivers.map((driver) => (
                  <Card
                    key={driver.id}
                    className="border-purple-200 dark:border-purple-900/60 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {driver.name}
                            </h4>
                            <p className="text-xs text-zinc-500">
                              {driver.mobileNumber || driver.email}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40 text-[10px] capitalize"
                        >
                          {driver.videoKycStatus}
                        </Badge>
                      </div>

                      <div className="text-xs text-zinc-500 space-y-1 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between">
                          <span>Vehicle:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {driver.vehicles[0]?.vehicleModel || "Pending"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>License Document:</span>
                          <span
                            className={
                              driver.partnerDocs?.licenseUrl
                                ? "text-emerald-600 font-semibold"
                                : "text-amber-500 font-semibold"
                            }
                          >
                            {driver.partnerDocs?.licenseUrl ? "Uploaded ✓" : "Missing ✗"}
                          </span>
                        </div>
                      </div>

                      <Link href={`/admin/kyc?driverId=${driver.id}`} className="block">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-4 rounded-xl gap-2 shadow-sm">
                          <Video className="h-4 w-4" />
                          <span>Join Video KYC Room</span>
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
