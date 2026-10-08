import Link from "next/link";
import { getCurrentUser, guestLoginAction } from "@/actions/auth";
import { HeroMotion } from "@/components/landing/hero-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Compass,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                    SafarX
                  </span>
                  <span className="rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium block -mt-0.5 hidden sm:block">
                  Next-Gen Urban Mobility &amp; Freight
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge variant={user.isGuest ? "secondary" : "default"} className="hidden sm:inline-flex">
                  {user.isGuest ? "Guest Rider" : user.role}
                </Badge>
                <Link href="/dashboard">
                  <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md">
                    <span>Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <form action={guestLoginAction}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-zinc-700 hover:text-purple-600 dark:text-zinc-300 dark:hover:text-purple-400 rounded-xl"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Guest Mode</span>
                  </Button>
                </form>

                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-xs rounded-xl border-zinc-200 dark:border-zinc-800">
                    Sign In
                  </Button>
                </Link>

                <Link href="/register">
                  <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Animated Hero & Features Section with Motion */}
      <main className="flex-1 flex flex-col">
        <HeroMotion user={user} guestLoginAction={guestLoginAction} />
      </main>
    </div>
  );
}
