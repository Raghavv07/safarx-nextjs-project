import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

export const signupSchema = z.object({
  name: z
    .string("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z
    .string("Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters long"),
  mobileNumber: z
    .string("Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  role: z.enum(["user", "partner", "admin"]).default("user"),
});

export const verifyOtpSchema = z.object({
  identifier: z.string("Email or Mobile Number is required").min(1),
  otp: z
    .string("OTP is required")
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain numbers only"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
