/**
 * SafarX Native Realistic Mock Payment Gateway
 * Emulates Razorpay / Cashfree API surface and transaction flow
 * with realistic order and payment tokens without requiring 3rd party SDKs.
 */

export interface CreateOrderParams {
  amount: number; // in INR
  bookingId: string;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface FakeOrder {
  id: string; // "order_Fake..."
  entity: "order";
  amount: number; // in paisa or whole rupees (we store whole rupees, amount * 100 for razorpay convention)
  amountInRupees: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  createdAt: number;
  bookingId: string;
  keyId: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface FakePaymentVerificationResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  verifiedAt: string;
  error?: string;
}

/**
 * Random alphanumeric generator for realistic IDs
 */
function generateRandomHex(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class FakeRazorpayGateway {
  private keyId: string = "rzp_test_safarx_native";

  /**
   * Generates a realistic Order ID starting with "order_Fake"
   */
  public generateOrderId(): string {
    return `order_Fake${generateRandomHex(12)}`;
  }

  /**
   * Generates a realistic Payment ID starting with "pay_Fake"
   */
  public generatePaymentId(): string {
    return `pay_Fake${generateRandomHex(14)}`;
  }

  /**
   * Generates a HMAC-like mock signature
   */
  public generateSignature(orderId: string, paymentId: string): string {
    return `sig_mock_${orderId.slice(0, 8)}_${paymentId.slice(0, 8)}_${generateRandomHex(8)}`;
  }

  /**
   * Creates a mock Razorpay order
   */
  public createOrder(params: CreateOrderParams): FakeOrder {
    const { amount, bookingId, currency = "INR", receipt, notes = {} } = params;
    const orderId = this.generateOrderId();

    return {
      id: orderId,
      entity: "order",
      amount: Math.round(amount * 100), // In paisa, like Razorpay standard
      amountInRupees: amount,
      currency,
      receipt: receipt || `rcpt_${bookingId.slice(0, 8)}`,
      status: "created",
      attempts: 0,
      notes: {
        bookingId,
        platform: "SafarX",
        ...notes,
      },
      createdAt: Math.floor(Date.now() / 1000),
      bookingId,
      keyId: this.keyId,
    };
  }

  /**
   * Verifies the authenticity of a payment response
   */
  public verifyPayment(params: VerifyPaymentParams): FakePaymentVerificationResult {
    const { orderId, paymentId } = params;

    // Validate prefixes
    if (!orderId || !orderId.startsWith("order_")) {
      return {
        success: false,
        orderId,
        paymentId,
        verifiedAt: new Date().toISOString(),
        error: "Invalid Order ID format: Expected order_* prefix",
      };
    }

    if (!paymentId || !paymentId.startsWith("pay_")) {
      return {
        success: false,
        orderId,
        paymentId,
        verifiedAt: new Date().toISOString(),
        error: "Invalid Payment ID format: Expected pay_* prefix",
      };
    }

    return {
      success: true,
      orderId,
      paymentId,
      verifiedAt: new Date().toISOString(),
    };
  }
}

// Singleton export
export const fakeGateway = new FakeRazorpayGateway();
