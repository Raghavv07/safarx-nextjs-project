"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import {
  getAdminOverviewAction,
  promoteCurrentUserToAdminAction,
  type PartnerVerificationItem,
} from "@/actions/admin";
import { OfficerVideoKycRoom } from "@/components/admin/officer-video-kyc-room";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ShieldCheck,
  Video,
  Lock,
  ShieldAlert,
  Loader2,
  Users,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function AdminVideoKycContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlDriverId = searchParams.get("driverId") || "";

  const [fallbackDriverId, setFallbackDriverId] = React.useState<string>("");
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);

  const [partners, setPartners] = React.useState<PartnerVerificationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Derived effective driver ID
  const selectedDriverId = urlDriverId || fallbackDriverId;

  // Load auth and list of partners
  const loadData = React.useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setAuthChecked(true);

      if (user && user.role === "admin") {
        const res = await getAdminOverviewAction();
        if (res.success && res.data) {
          setPartners(res.data.partners);
          if (!urlDriverId && res.data.partners.length > 0) {
            const firstPending = res.data.partners.find(
              (p) => p.videoKycStatus === "pending" || p.videoKycStatus === "inprogress"
            );
            setFallbackDriverId(firstPending ? firstPending.id : res.data.partners[0].id);
          }
        }
      }
    } catch (err) {
      console.error("KYC page auth error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [urlDriverId]);

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
                setPartners(res.data.partners);
                if (!urlDriverId && res.data.partners.length > 0) {
                  const firstPending = res.data.partners.find(
                    (p) => p.videoKycStatus === "pending" || p.videoKycStatus === "inprogress"
                  );
                  setFallbackDriverId(firstPending ? firstPending.id : res.data.partners[0].id);
                }
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
  }, [urlDriverId]);

  const handlePromoteToAdmin = async () => {
    setIsPromoting(true);
    try {
      const res = await promoteCurrentUserToAdminAction();
      if (res.success) {
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

  if (!authChecked || (isLoading && currentUser?.role === "admin")) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs text-zinc-500 font-semibold tracking-wide">
          Connecting to SafarX Video KYC Officer Console...
        </p>
      </div>
    );
  }

  // Not signed in gate
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-xl text-center p-8 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-600/10 text-purple-600 mx-auto flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Officer Login Required
            </h2>
            <p className="text-xs text-zinc-500">
              Please sign in with compliance credentials to enter the Video KYC room.
            </p>
          </div>
          <Link href="/login?next=/admin/kyc" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl shadow-md">
              Sign In to SafarX
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Non-admin gate
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-xl text-center p-8 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Officer Clearance Required
            </h2>
            <p className="text-xs text-zinc-500">
              Logged in as <b>{currentUser.name}</b> ({currentUser.role}).
            </p>
          </div>
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
        </Card>
      </div>
    );
  }

  const selectedPartner = partners.find((p) => p.id === selectedDriverId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span>Admin Console</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                  Live Video KYC Officer Room
                </span>
                <span className="text-[10px] text-zinc-400 block hidden sm:block">
                  Side-by-Side Face &amp; Driving License Verification
                </span>
              </div>
            </div>
          </div>

          {/* Quick candidate selector dropdown */}
          <div className="flex items-center gap-3">
            {partners.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-semibold hidden md:inline">
                  Driver:
                </span>
                <select
                  value={selectedDriverId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setFallbackDriverId(nextId);
                    router.push(`/admin/kyc?driverId=${nextId}`);
                  }}
                  className="text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.videoKycStatus})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-semibold text-[11px] hidden sm:inline">256-Bit Encrypted</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {selectedDriverId ? (
          <OfficerVideoKycRoom
            partnerId={selectedDriverId}
            initialPartnerData={selectedPartner}
            officerName={currentUser.name}
            onDecisionCompleted={loadData}
          />
        ) : (
          <Card className="border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-zinc-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              No Driver Partners Registered
            </h3>
            <p className="text-xs text-zinc-500">
              No driver partners found in the database. When drivers complete onboarding, they will appear here for identity verification.
            </p>
            <Link href="/admin">
              <Button size="sm" variant="outline" className="text-xs mt-2">
                Return to Admin Dashboard
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function AdminVideoKycPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-xs text-zinc-500 font-semibold tracking-wide">
            Loading Video KYC Room...
          </p>
        </div>
      }
    >
      <AdminVideoKycContent />
    </React.Suspense>
  );
}
