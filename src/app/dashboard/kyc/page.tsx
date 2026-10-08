import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { VideoKycRoom } from "@/components/video/video-kyc-room";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Video } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export default async function VideoKycPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Video className="h-4 w-4" />
              </div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                Driver Video KYC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">End-to-End Encrypted</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Partner Identity Verification
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Powered by GetStream Video SDK with low-latency WebRTC streaming and active speaker layout.
          </p>
        </div>

        <VideoKycRoom
          partnerId={user.id}
          partnerName={user.name}
        />
      </main>
    </div>
  );
}
