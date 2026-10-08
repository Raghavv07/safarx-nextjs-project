"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, guestLoginAction, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, Phone, User, Car, Sparkles, Compass } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const [role, setRole] = useState<"user" | "partner">("user");
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    signupAction,
    null
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-lg dark:bg-white dark:text-black">
            <Car className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Join SafarX as a Rider or Partner
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-zinc-200 shadow-xl dark:border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Sign up</CardTitle>
            <CardDescription>
              Fill in your details to create an account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>I want to join as</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm transition-all ${
                      role === "user"
                        ? "border-black bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <User className="mb-1 h-5 w-5" />
                    <span className="font-medium">Rider</span>
                    <span className="text-[10px] opacity-75">Book Rides</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("partner")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm transition-all ${
                      role === "partner"
                        ? "border-black bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Car className="mb-1 h-5 w-5" />
                    <span className="font-medium">Driver Partner</span>
                    <span className="text-[10px] opacity-75">Drive & Earn</span>
                  </button>
                </div>
                <input type="hidden" name="role" value={role} />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Rahul Sharma"
                    required
                    className="pl-9"
                  />
                </div>
                {state?.fieldErrors?.name && (
                  <p className="text-xs text-red-500">{state.fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="rahul@example.com"
                    required
                    className="pl-9"
                  />
                </div>
                {state?.fieldErrors?.email && (
                  <p className="text-xs text-red-500">{state.fieldErrors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number (India)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="9876543210"
                    maxLength={10}
                    required
                    className="pl-9"
                  />
                </div>
                {state?.fieldErrors?.mobileNumber && (
                  <p className="text-xs text-red-500">{state.fieldErrors.mobileNumber}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password (min 6 characters)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-9"
                  />
                </div>
                {state?.fieldErrors?.password && (
                  <p className="text-xs text-red-500">{state.fieldErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {isPending ? "Creating account..." : "Complete Registration"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Or explore first
                </span>
              </div>
            </div>

            {/* Guest Login Button */}
            <form action={guestLoginAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full gap-2 border-dashed border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Continue as Guest</span>
                <Compass className="h-4 w-4 text-zinc-400" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-zinc-100 p-4 dark:border-zinc-800/50">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
