import { z } from "zod";

export const createBookingSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  driverId: z.string().min(1, "Driver ID is required"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  pickUpAddress: z.string().min(3, "Pickup address is required"),
  dropAddress: z.string().min(3, "Drop address is required"),
  pickUpLat: z.number().min(-90).max(90, "Invalid pickup latitude"),
  pickUpLng: z.number().min(-180).max(180, "Invalid pickup longitude"),
  dropLat: z.number().min(-90).max(90, "Invalid drop latitude"),
  dropLng: z.number().min(-180).max(180, "Invalid drop longitude"),
  fare: z.number().positive("Fare must be greater than 0"),
  userMobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  driverMobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  bookingStatus: z.enum([
    "idle",
    "requested",
    "awaiting_payment",
    "confirmed",
    "started",
    "completed",
    "cancelled",
    "rejected",
    "expired",
  ]),
});

export const chatMessageSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  text: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
  sender: z.enum(["user", "driver"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
