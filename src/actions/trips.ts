"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

export interface RiderTripItem {
  id: string;
  pickUpAddress: string;
  dropAddress: string;
  pickUpLat: number;
  pickUpLng: number;
  dropLat: number;
  dropLng: number;
  fare: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
  driver: {
    id: string;
    name: string;
    mobileNumber: string | null;
  } | null;
  vehicle: {
    model: string;
    number: string;
    type: string;
  } | null;
}

export interface RiderTripsOverview {
  metrics: {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalSpent: number;
  };
  trips: RiderTripItem[];
}

export interface GstInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  companyDetails: {
    name: string;
    gstin: string;
    sacCode: string;
    cin: string;
    address: string;
    email: string;
    supportDesk: string;
  };
  customerDetails: {
    name: string;
    email: string;
    mobile: string;
  };
  driverDetails: {
    name: string;
    mobile: string;
  };
  vehicleDetails: {
    model: string;
    number: string;
    type: string;
  };
  tripDetails: {
    bookingId: string;
    date: string;
    pickupAddress: string;
    dropAddress: string;
    paymentStatus: string;
    paymentMethod: string;
    orderId: string;
    paymentId: string;
  };
  taxBreakdown: {
    baseFare: number;
    cgstRate: string;
    cgstAmount: number;
    sgstRate: string;
    sgstAmount: number;
    totalTax: number;
    totalAmountPaid: number;
    amountInWords: string;
  };
}

/**
 * Number to Indian English words converter for official GST invoice
 */
function numberToWords(num: number): string {
  const integerPart = Math.floor(num);
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (integerPart === 0) return "Zero Rupees Only";

  function convertBelowHundred(n: number): string {
    if (n < 20) return units[n];
    return `${tens[Math.floor(n / 10)]} ${units[n % 10]}`.trim();
  }

  function convertBelowThousand(n: number): string {
    if (n >= 100) {
      return `${units[Math.floor(n / 100)]} Hundred ${convertBelowHundred(n % 100)}`.trim();
    }
    return convertBelowHundred(n);
  }

  let result = "";
  if (Math.floor(integerPart / 10000000) > 0) {
    result += `${convertBelowHundred(Math.floor(integerPart / 10000000))} Crore `;
  }
  if (Math.floor((integerPart % 10000000) / 100000) > 0) {
    result += `${convertBelowHundred(Math.floor((integerPart % 10000000) / 100000))} Lakh `;
  }
  if (Math.floor((integerPart % 100000) / 1000) > 0) {
    result += `${convertBelowHundred(Math.floor((integerPart % 100000) / 1000))} Thousand `;
  }
  if (integerPart % 1000 > 0) {
    result += convertBelowThousand(integerPart % 1000);
  }

  return `${result.trim()} Rupees Only`;
}

/**
 * Fetches all trips taken by the logged-in rider.
 */
export async function getRiderTripsAction(): Promise<{
  success: boolean;
  data?: RiderTripsOverview;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
          },
        },
        vehicle: {
          select: {
            vehicleModel: true,
            number: true,
            type: true,
          },
        },
      },
    });

    const completedTrips = bookings.filter((b) => b.bookingStatus === "completed");
    const cancelledTrips = bookings.filter((b) => b.bookingStatus === "cancelled" || b.bookingStatus === "rejected");
    const totalSpent = completedTrips.reduce((sum, b) => sum + (b.fare || 0), 0);

    const trips: RiderTripItem[] = bookings.map((b) => ({
      id: b.id,
      pickUpAddress: b.pickUpAddress,
      dropAddress: b.dropAddress,
      pickUpLat: b.pickUpLat,
      pickUpLng: b.pickUpLng,
      dropLat: b.dropLat,
      dropLng: b.dropLng,
      fare: b.fare,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      createdAt: b.createdAt.toISOString(),
      driver: b.driver
        ? {
            id: b.driver.id,
            name: b.driver.name,
            mobileNumber: b.driver.mobileNumber,
          }
        : null,
      vehicle: b.vehicle
        ? {
            model: b.vehicle.vehicleModel,
            number: b.vehicle.number,
            type: b.vehicle.type,
          }
        : null,
    }));

    return {
      success: true,
      data: {
        metrics: {
          totalTrips: bookings.length,
          completedTrips: completedTrips.length,
          cancelledTrips: cancelledTrips.length,
          totalSpent,
        },
        trips,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load trips";
    console.error("[getRiderTripsAction Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Generates official GST Tax Invoice Details for a specific completed trip.
 */
export async function getTripInvoiceDetailsAction(
  bookingId: string
): Promise<{
  success: boolean;
  data?: GstInvoiceData;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true, mobileNumber: true } },
        driver: { select: { name: true, mobileNumber: true } },
        vehicle: { select: { vehicleModel: true, number: true, type: true } },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Verify user ownership or admin privilege
    if (booking.userId !== user.id && user.role !== "admin") {
      return { success: false, error: "Unauthorized access to invoice" };
    }

    const fare = booking.fare;
    // GST on transport aggregators: 5% total (2.5% CGST + 2.5% SGST)
    const baseFare = Math.round((fare / 1.05) * 100) / 100;
    const cgstAmount = Math.round(((fare - baseFare) / 2) * 100) / 100;
    const sgstAmount = Math.round((fare - baseFare - cgstAmount) * 100) / 100;
    const totalTax = Math.round((cgstAmount + sgstAmount) * 100) / 100;

    const invoiceDate = new Date(booking.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const invoiceData: GstInvoiceData = {
      invoiceNumber: `INV-SAFARX-${booking.id.slice(0, 8).toUpperCase()}`,
      invoiceDate,
      companyDetails: {
        name: "SafarX Mobility & Technologies India Pvt. Ltd.",
        gstin: "07AAACS9876C1Z8",
        sacCode: "996412",
        cin: "U63040DL2024PTC123456",
        address: "Plot 42, Cyber Hub Tech Park, Aerocity, New Delhi, 110037",
        email: "support@safarx.in",
        supportDesk: "1800-SAFAR-X (24x7)",
      },
      customerDetails: {
        name: booking.user.name,
        email: booking.user.email,
        mobile: booking.userMobileNumber || booking.user.mobileNumber || "N/A",
      },
      driverDetails: {
        name: booking.driver?.name || "Verified Driver Partner",
        mobile: booking.driverMobileNumber || booking.driver?.mobileNumber || "N/A",
      },
      vehicleDetails: {
        model: booking.vehicle?.vehicleModel || "Standard Fleet",
        number: booking.vehicle?.number || "DL 01 AB 1234",
        type: booking.vehicle?.type || "Car",
      },
      tripDetails: {
        bookingId: booking.id,
        date: new Date(booking.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        pickupAddress: booking.pickUpAddress,
        dropAddress: booking.dropAddress,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentStatus === "cash" ? "Cash on Delivery" : "Online (UPI / Card)",
        orderId: `order_Fake${booking.id.replace(/-/g, "").slice(0, 12)}`,
        paymentId:
          booking.paymentStatus === "cash"
            ? "CASH_SETTLEMENT"
            : `pay_Fake${booking.id.replace(/-/g, "").slice(0, 14)}`,
      },
      taxBreakdown: {
        baseFare,
        cgstRate: "2.5%",
        cgstAmount,
        sgstRate: "2.5%",
        sgstAmount,
        totalTax,
        totalAmountPaid: fare,
        amountInWords: numberToWords(fare),
      },
    };

    return { success: true, data: invoiceData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate invoice";
    console.error("[getTripInvoiceDetailsAction Error]:", msg);
    return { success: false, error: msg };
  }
}
