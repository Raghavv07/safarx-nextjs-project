import { z } from "zod";

export const vehicleSchema = z.object({
  ownerId: z.string().min(1, "Owner ID is required"),
  type: z.enum(["bike", "car", "loading", "truck", "auto"]),
  vehicleModel: z.string().min(2, "Vehicle model is required"),
  number: z
    .string()
    .min(5, "Invalid vehicle number")
    .toUpperCase()
    .regex(
      /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/,
      "Enter valid vehicle registration number (e.g. DL01AB1234)"
    ),
  imageUrl: z.string().url("Valid image URL required").optional(),
  baseFare: z.number().min(0, "Base fare cannot be negative"),
  waitingCharge: z.number().min(0, "Waiting charge cannot be negative"),
  pricePerKm: z.number().positive("Price per km must be positive"),
});

export const bankDetailsSchema = z.object({
  ownerId: z.string().min(1, "Owner ID is required"),
  accountHolder: z.string().min(2, "Account holder name required"),
  accountNumber: z
    .string()
    .min(9, "Account number must be 9-18 digits")
    .max(18, "Account number must be 9-18 digits")
    .regex(/^\d+$/, "Account number must be numeric"),
  ifsc: z
    .string()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format (e.g. SBIN0001234)"),
  upi: z
    .string()
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format (e.g. name@okhdfcbank)")
    .optional(),
});

export const partnerDocsSchema = z.object({
  ownerId: z.string().min(1, "Owner ID is required"),
  aadharUrl: z.string().url("Valid Aadhar card URL required"),
  rcUrl: z.string().url("Valid RC document URL required"),
  licenseUrl: z.string().url("Valid Driving License URL required"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type PartnerDocsInput = z.infer<typeof partnerDocsSchema>;
