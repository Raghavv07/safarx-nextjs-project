import { create } from "zustand";

export type VehicleType = "bike" | "auto" | "mini" | "sedan" | "suv";
export type BookingStep =
  | "select_pickup"
  | "select_dropoff"
  | "choose_ride"
  | "confirm_ride"
  | "matching_driver"
  | "on_trip"
  | "completed";

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export interface BookingState {
  // Trip coordinates & addresses
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;

  // Selected cab options
  vehicleType: VehicleType;
  rideClass: "standard" | "comfort" | "premium";

  // Flow navigation
  step: BookingStep;

  // Estimates
  estimatedFare: number | null;
  estimatedDistanceKm: number | null;
  estimatedDurationMin: number | null;

  // Active DB booking reference
  activeBookingId: string | null;

  // Actions
  setPickup: (location: LocationPoint | null) => void;
  setDropoff: (location: LocationPoint | null) => void;
  setVehicleType: (type: VehicleType) => void;
  setRideClass: (rideClass: "standard" | "comfort" | "premium") => void;
  setStep: (step: BookingStep) => void;
  setEstimates: (fare: number, distanceKm: number, durationMin: number) => void;
  setActiveBookingId: (id: string | null) => void;
  resetBooking: () => void;
}

const initialState = {
  pickup: null,
  dropoff: null,
  vehicleType: "mini" as VehicleType,
  rideClass: "standard" as const,
  step: "select_pickup" as BookingStep,
  estimatedFare: null,
  estimatedDistanceKm: null,
  estimatedDurationMin: null,
  activeBookingId: null,
};

/**
 * Zustand Store for SafarX Ride Booking Flow
 * Atomic state selectors minimize unnecessary re-renders across map and booking panels.
 */
export const useBookingStore = create<BookingState>()((set) => ({
  ...initialState,

  setPickup: (pickup) =>
    set((state) => ({
      pickup,
      step: state.dropoff ? "choose_ride" : "select_dropoff",
    })),

  setDropoff: (dropoff) =>
    set((state) => ({
      dropoff,
      step: state.pickup ? "choose_ride" : "select_pickup",
    })),

  setVehicleType: (vehicleType) => set({ vehicleType }),

  setRideClass: (rideClass) => set({ rideClass }),

  setStep: (step) => set({ step }),

  setEstimates: (estimatedFare, estimatedDistanceKm, estimatedDurationMin) =>
    set({
      estimatedFare,
      estimatedDistanceKm,
      estimatedDurationMin,
    }),

  setActiveBookingId: (activeBookingId) => set({ activeBookingId }),

  resetBooking: () => set(initialState),
}));
