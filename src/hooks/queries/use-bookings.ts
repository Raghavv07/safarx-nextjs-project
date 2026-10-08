"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Standard Query Key Factory for Bookings
 * Follows TanStack Query best practices for type-safe cache keys and selective invalidation.
 */
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (params?: { limit?: number }) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

export interface BookingItem {
  id: string;
  userId: string;
  driverId: string;
  vehicleId: string;
  pickUpAddress: string;
  dropAddress: string;
  pickUpLat: number;
  pickUpLng: number;
  dropLat: number;
  dropLng: number;
  fare: number;
  userMobileNumber: string;
  driverMobileNumber: string;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
  vehicle?: {
    vehicleModel: string;
    number: string;
    type: string;
  };
}

/**
 * Hook to fetch bookings list with caching and revalidation.
 */
export function useBookings(limit = 10) {
  return useQuery({
    queryKey: bookingKeys.list({ limit }),
    queryFn: async (): Promise<BookingItem[]> => {
      const res = await fetch(`/api/bookings?limit=${limit}`);
      if (!res.ok) {
        throw new Error("Failed to fetch bookings list");
      }
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 1000, // Fresh for 30s
  });
}

/**
 * Hook to track live booking detail with intelligent polling.
 * Automatically polls every 3s while trip is requested or started, pauses when finished.
 */
export function useBookingDetail(bookingId: string | null) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? ""),
    queryFn: async (): Promise<BookingItem> => {
      if (!bookingId) throw new Error("Booking ID required");
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch booking detail");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(bookingId),
    refetchInterval: (query) => {
      const status = query.state.data?.bookingStatus;
      // Active trip states: poll every 3 seconds
      if (status === "requested" || status === "started" || status === "awaiting_payment") {
        return 3000;
      }
      // Stop polling when completed, cancelled, or rejected
      return false;
    },
  });
}

/**
 * Mutation to cancel an active booking with cache invalidation.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to cancel booking");
      }
      return res.json();
    },
    onSuccess: (_, bookingId) => {
      // Invalidate all booking queries so UI re-syncs immediately
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
    },
  });
}
