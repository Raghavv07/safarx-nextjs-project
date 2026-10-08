import { create } from "zustand";

export interface UIState {
  isChatDrawerOpen: boolean;
  activeChatBookingId: string | null;
  isBookingSheetExpanded: boolean;
  activeTab: "rides" | "history" | "profile";

  // Actions
  toggleChat: (open?: boolean, bookingId?: string | null) => void;
  toggleBookingSheet: (expanded?: boolean) => void;
  setActiveTab: (tab: "rides" | "history" | "profile") => void;
}

/**
 * Zustand Store for Global SafarX UI elements (drawers, sheets, tabs).
 */
export const useUIStore = create<UIState>()((set) => ({
  isChatDrawerOpen: false,
  activeChatBookingId: null,
  isBookingSheetExpanded: false,
  activeTab: "rides",

  toggleChat: (open, bookingId = null) =>
    set((state) => ({
      isChatDrawerOpen: open !== undefined ? open : !state.isChatDrawerOpen,
      activeChatBookingId: bookingId ?? state.activeChatBookingId,
    })),

  toggleBookingSheet: (expanded) =>
    set((state) => ({
      isBookingSheetExpanded:
        expanded !== undefined ? expanded : !state.isBookingSheetExpanded,
    })),

  setActiveTab: (activeTab) => set({ activeTab }),
}));
