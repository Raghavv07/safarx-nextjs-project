"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getLiveBookingDetailsAction,
  cancelBookingAction,
  driverArrivedAction,
  verifyPickupOtpAndStartRideAction,
  completeTripWithDropOtpAction,
  type LiveBookingDetails,
  type FareBreakdown,
} from "@/actions/booking";
import { calculateHaversineDistance } from "@/lib/geo";
import { playChimeTone } from "@/lib/sound";

export interface UseRideChannelReturn {
  booking: LiveBookingDetails | null;
  isLoading: boolean;
  error: string | null;
  driverLocation: { lat: number; lng: number } | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  isDriverArrived: boolean;
  refetch: () => Promise<void>;
  markDriverArrived: () => Promise<boolean>;
  verifyPickupOtp: (otp: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  completeTrip: (
    dropOtp?: string,
    paymentMethod?: "cash" | "upi" | "card"
  ) => Promise<{
    success: boolean;
    message?: string;
    fareBreakdown?: FareBreakdown;
    error?: string;
  }>;
  cancelRide: (reason?: string) => Promise<boolean>;
}

/**
 * SafarX Real-Time Ride Matching & Live Sync Hook
 * Powered by Supabase Realtime (WebSocket Broadcast & Postgres Changes)
 * with automatic fallback polling for 100% resilient ride sync.
 */
export function useRideChannel(bookingId: string | null): UseRideChannelReturn {
  const [booking, setBooking] = React.useState<LiveBookingDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(bookingId));
  const [error, setError] = React.useState<string | null>(null);
  const [isDriverArrived, setIsDriverArrived] = React.useState(false);
  const [driverLocation, setDriverLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Fetch live state from PostgreSQL via Server Action
  const fetchBooking = React.useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await getLiveBookingDetailsAction(bookingId);
      if (res.success && res.booking) {
        setBooking(res.booking);
        if (res.booking.driver?.lat && res.booking.driver?.lng) {
          setDriverLocation({
            lat: res.booking.driver.lat,
            lng: res.booking.driver.lng,
          });
        }
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err) {
      console.error("[useRideChannel] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  // Initial load and Realtime Subscription
  React.useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;

    // 1. Initial fetch
    getLiveBookingDetailsAction(bookingId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.booking) {
          setBooking(res.booking);
          if (res.booking.driver?.lat && res.booking.driver?.lng) {
            setDriverLocation({
              lat: res.booking.driver.lat,
              lng: res.booking.driver.lng,
            });
          }
        } else if (res.error) {
          setError(res.error);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("[useRideChannel] Initial fetch error:", err);
        setIsLoading(false);
      });

    // 2. Supabase Realtime Channel
    const supabase = createClient();
    const channelName = `ride-${bookingId}`;
    const channel = supabase.channel(channelName);

    channel
      // Listen to PostgreSQL changes on the Booking table
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Booking",
          filter: `id=eq.${bookingId}`,
        },
        () => {
          fetchBooking().catch(() => {});
        }
      )
      // Listen to Realtime Broadcast events
      .on("broadcast", { event: "ride-accepted" }, () => {
        playChimeTone(587.33, 880, 0.3);
        fetchBooking().catch(() => {});
      })
      .on("broadcast", { event: "driver-arrived" }, () => {
        setIsDriverArrived(true);
        playChimeTone(523.25, 1046.5, 0.4);
        fetchBooking().catch(() => {});
      })
      .on("broadcast", { event: "ride-started" }, () => {
        playChimeTone(659.25, 880, 0.3);
        fetchBooking().catch(() => {});
      })
      .on("broadcast", { event: "ride-completed" }, () => {
        playChimeTone(440, 880, 0.4);
        fetchBooking().catch(() => {});
      })
      .on("broadcast", { event: "ride-status-update" }, () => {
        fetchBooking().catch(() => {});
      })
      .on(
        "broadcast",
        { event: "driver-location" },
        (payload: { payload: { lat: number; lng: number } }) => {
          if (payload?.payload?.lat && payload?.payload?.lng) {
            setDriverLocation({
              lat: payload.payload.lat,
              lng: payload.payload.lng,
            });
          }
        }
      )
      .subscribe();

    // 3. Resilient Polling Heartbeat (every 2.5s while active)
    const pollInterval = setInterval(() => {
      getLiveBookingDetailsAction(bookingId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.booking) {
            setBooking(res.booking);
            if (res.booking.driver?.lat && res.booking.driver?.lng) {
              setDriverLocation({
                lat: res.booking.driver.lat,
                lng: res.booking.driver.lng,
              });
            }
          }
        })
        .catch(() => {});
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [bookingId, fetchBooking]);

  // Step 1 Action: Mark Driver Arrived
  const markDriverArrived = React.useCallback(async (): Promise<boolean> => {
    if (!bookingId) return false;
    try {
      const res = await driverArrivedAction(bookingId);
      if (res.success) {
        setIsDriverArrived(true);
        await broadcastRideEvent(bookingId, "driver-arrived", { bookingId });
        await fetchBooking();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [bookingId, fetchBooking]);

  // Step 2 Action: Verify Pickup OTP
  const verifyPickupOtp = React.useCallback(
    async (otp: string) => {
      if (!bookingId) return { success: false, error: "No booking ID" };
      try {
        const res = await verifyPickupOtpAndStartRideAction(bookingId, otp);
        if (res.success) {
          await broadcastRideEvent(bookingId, "ride-started", { bookingId });
          await fetchBooking();
        }
        return res;
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Verification error",
        };
      }
    },
    [bookingId, fetchBooking]
  );

  // Step 4 Action: Complete Trip with Drop OTP & Fare settlement
  const completeTrip = React.useCallback(
    async (dropOtp?: string, paymentMethod?: "cash" | "upi" | "card") => {
      if (!bookingId) return { success: false, error: "No booking ID" };
      try {
        const res = await completeTripWithDropOtpAction(
          bookingId,
          dropOtp,
          paymentMethod
        );
        if (res.success) {
          await broadcastRideEvent(bookingId, "ride-completed", {
            bookingId,
            fareBreakdown: res.fareBreakdown,
          });
          await fetchBooking();
        }
        return res;
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Completion error",
        };
      }
    },
    [bookingId, fetchBooking]
  );

  // Cancel ride handler
  const cancelRide = React.useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!bookingId) return false;
      try {
        const res = await cancelBookingAction(bookingId, reason);
        if (res.success) {
          await broadcastRideEvent(bookingId, "ride-cancelled", { bookingId });
          await fetchBooking();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [bookingId, fetchBooking]
  );

  // Computed distance and ETA from driver's live GPS to pickup
  const { distanceKm, etaMinutes } = React.useMemo(() => {
    if (!booking || !driverLocation) {
      return {
        distanceKm: booking?.distanceToPickupKm ?? null,
        etaMinutes: booking?.etaMinutes ?? null,
      };
    }

    const dist = calculateHaversineDistance(
      driverLocation.lat,
      driverLocation.lng,
      booking.pickUpLat,
      booking.pickUpLng
    );
    const eta = Math.max(1, Math.round((dist / 25) * 60)); // 25 km/h city average

    return { distanceKm: dist, etaMinutes: eta };
  }, [booking, driverLocation]);

  return {
    booking: bookingId ? booking : null,
    isLoading: Boolean(bookingId) && isLoading,
    error,
    driverLocation: bookingId ? driverLocation : null,
    distanceKm: bookingId ? distanceKm : null,
    etaMinutes: bookingId ? etaMinutes : null,
    isDriverArrived,
    refetch: fetchBooking,
    markDriverArrived,
    verifyPickupOtp,
    completeTrip,
    cancelRide,
  };
}

/**
 * Helper to broadcast realtime events from driver client or rider client
 */
export async function broadcastRideEvent(
  bookingId: string,
  event:
    | "ride-accepted"
    | "driver-location"
    | "driver-arrived"
    | "ride-status-update"
    | "ride-started"
    | "ride-completed"
    | "ride-cancelled",
  payload: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    const channel = supabase.channel(`ride-${bookingId}`);
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  } catch (err) {
    console.warn("[broadcastRideEvent] Error:", err);
  }
}
