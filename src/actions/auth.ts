"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema } from "@/schemas/auth.schema";
import { validateActionInput } from "@/lib/action-validator";
import { sendWelcomeEmail } from "@/lib/resend";

export interface AuthState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "partner" | "admin";
  mobileNumber?: string | null;
  isGuest: boolean;
};

/**
 * Gets the currently authenticated user (Supabase permanent user or Guest user).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser && authUser.email) {
    // Check if user exists in Prisma DB
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (dbUser) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as "user" | "partner" | "admin",
        mobileNumber: dbUser.mobileNumber,
        isGuest: false,
      };
    }

    return {
      id: authUser.id,
      name: (authUser.user_metadata?.name as string) || "SafarX User",
      email: authUser.email,
      role: (authUser.user_metadata?.role as "user" | "partner" | "admin") || "user",
      isGuest: false,
    };
  }

  // Check guest session
  const cookieStore = await cookies();
  const guestCookie = cookieStore.get("safarx_guest_session")?.value;

  if (guestCookie) {
    try {
      const guestData = JSON.parse(guestCookie);
      const email = guestData.email || `${guestData.id || "guest"}@safarx.local`;
      let role = (guestData.role as "user" | "partner" | "admin") || "user";

      // If user exists in Prisma DB, reflect latest DB role (e.g. if promoted to admin)
      if (guestData.id && guestData.id !== "guest") {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ id: guestData.id }, { email: email }],
          },
        });
        if (dbUser) {
          role = dbUser.role as "user" | "partner" | "admin";
        }
      }

      return {
        id: guestData.id || "guest",
        name: guestData.name || "Guest Rider",
        email: email,
        role: role,
        isGuest: true,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Login action with Supabase Auth
 */
export async function loginAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const data = Object.fromEntries(formData.entries());
  const validation = validateActionInput(loginSchema, data);

  if (!validation.success) {
    return {
      error: validation.message,
      fieldErrors: validation.errors,
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Clear guest cookie if present
  const cookieStore = await cookies();
  cookieStore.delete("safarx_guest_session");

  redirect("/dashboard");
}

/**
 * Signup action with Supabase Auth + Prisma DB Sync
 */
export async function signupAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const data = Object.fromEntries(formData.entries());
  const validation = validateActionInput(signupSchema, data);

  if (!validation.success) {
    return {
      error: validation.message,
      fieldErrors: validation.errors,
    };
  }

  const { name, email, password, mobileNumber, role } = validation.data;
  const supabase = await createClient();

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        mobileNumber,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Sync to Prisma PostgreSQL Database
  try {
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        mobileNumber,
        role: role as "user" | "partner" | "admin",
      },
      create: {
        id: authData.user?.id,
        name,
        email,
        mobileNumber,
        role: role as "user" | "partner" | "admin",
      },
    });
  } catch (dbError) {
    console.error("Prisma User sync error:", dbError);
    // Proceed if auth is successful
  }

  // Clear guest session
  const cookieStore = await cookies();
  cookieStore.delete("safarx_guest_session");

  // Send welcome email via Resend
  try {
    await sendWelcomeEmail({
      to: email,
      name,
      role: role === "partner" ? "driver" : "rider",
    });
  } catch (emailErr) {
    console.error("Welcome email failed to send:", emailErr);
  }

  redirect("/dashboard");
}

/**
 * Guest Login action — allows exploring rides without upfront registration
 */
export async function guestLoginAction(): Promise<void> {
  const supabase = await createClient();
  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;

  // Attempt Supabase anonymous sign-in if enabled
  try {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      redirect("/dashboard");
    }
  } catch {
    // Fall back to robust guest cookie session
  }

  // Set guest session cookie (valid for 7 days)
  const cookieStore = await cookies();
  cookieStore.set(
    "safarx_guest_session",
    JSON.stringify({
      id: guestId,
      name: "Guest Rider",
      email: `${guestId}@safarx.local`,
      isGuest: true,
      createdAt: new Date().toISOString(),
    }),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }
  );

  redirect("/dashboard");
}

/**
 * Logout action — signs out from Supabase and removes guest sessions
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("safarx_guest_session");

  redirect("/login");
}
