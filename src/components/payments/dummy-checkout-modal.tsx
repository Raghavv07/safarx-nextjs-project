"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  createPaymentOrderAction,
  verifyPaymentAction,
  chooseCashPaymentAction,
  type VerifyPaymentResponse,
} from "@/actions/payments";
import { fakeGateway } from "@/lib/payments/fake-gateway";
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Lock,
  Smartphone,
  Copy,
  Check,
  Car,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type PaymentMethodTab = "upi" | "card" | "netbanking" | "cash";

interface DummyCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  riderName?: string;
  riderMobile?: string;
  onSuccess?: (res: VerifyPaymentResponse) => void;
}

const POPULAR_BANKS = [
  { id: "hdfc", name: "HDFC Bank", short: "HDFC" },
  { id: "sbi", name: "State Bank of India", short: "SBI" },
  { id: "icici", name: "ICICI Bank", short: "ICICI" },
  { id: "axis", name: "Axis Bank", short: "AXIS" },
  { id: "kotak", name: "Kotak Mahindra", short: "KOTAK" },
  { id: "pnb", name: "Punjab National", short: "PNB" },
];

const UPI_APPS = [
  { id: "gpay", name: "Google Pay", handle: "@okaxis" },
  { id: "phonepe", name: "PhonePe", handle: "@ybl" },
  { id: "paytm", name: "Paytm", handle: "@paytm" },
  { id: "bhim", name: "BHIM UPI", handle: "@upi" },
];

export function DummyCheckoutModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  riderName = "Passenger",
  riderMobile = "9876543210",
  onSuccess,
}: DummyCheckoutModalProps) {
  // Tabs & Forms
  const [activeTab, setActiveTab] = React.useState<PaymentMethodTab>("upi");
  const [upiSubTab, setUpiSubTab] = React.useState<"id" | "qr">("id");

  // Order state
  const [orderId, setOrderId] = React.useState<string>("");
  const [copiedOrderId, setCopiedOrderId] = React.useState(false);
  const isInitializing = isOpen && Boolean(bookingId) && !orderId;

  // Form Fields
  const [upiId, setUpiId] = React.useState("traveler@okhdfc");
  const [cardNumber, setCardNumber] = React.useState("4532 8920 1204 8821");
  const [cardExpiry, setCardExpiry] = React.useState("09/28");
  const [cardCvv, setCardCvv] = React.useState("789");
  const [cardHolder, setCardHolder] = React.useState(riderName);
  const [selectedBank, setSelectedBank] = React.useState("hdfc");

  // Simulation states
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStep, setProcessingStep] = React.useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [paidPaymentId, setPaidPaymentId] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 15-Minute Countdown Timer
  const [timeLeft, setTimeLeft] = React.useState(15 * 60);

  // Load order when dialog opens
  React.useEffect(() => {
    if (!isOpen || !bookingId) return;

    let isMounted = true;

    createPaymentOrderAction(bookingId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.order) {
          setOrderId(res.order.id);
        } else {
          // Generate fallback local mock order if needed
          setOrderId(fakeGateway.generateOrderId());
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Order init error:", err);
        setOrderId(fakeGateway.generateOrderId());
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookingId]);

  // Countdown timer effect
  React.useEffect(() => {
    if (!isOpen || paymentSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paymentSuccess]);

  // Format mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  // Card input formatter
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    const chunks = clean.match(/.{1,4}/g);
    setCardNumber(chunks ? chunks.join(" ") : clean);
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Process Online Payment with simulated 2s bank progression
  const handleProcessPayment = async (simulateFailure: boolean = false) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Step 1: Gateway connection
      setProcessingStep("Connecting securely to issuing bank gateway...");
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: 3D Secure / UPI Authorization
      setProcessingStep(
        activeTab === "upi"
          ? "Awaiting authorization on UPI handle..."
          : activeTab === "card"
          ? "Authenticating with 3D Secure 2.0..."
          : "Authorizing with Netbanking server..."
      );
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Verification with SafarX Backend
      setProcessingStep("Finalizing transaction & updating ride status...");
      const paymentId = fakeGateway.generatePaymentId();

      const res = await verifyPaymentAction({
        bookingId,
        orderId,
        paymentId,
        paymentMethod: activeTab,
        failureSimulated: simulateFailure,
      });

      if (res.success) {
        setPaidPaymentId(paymentId);
        setPaymentSuccess(true);
        setIsProcessing(false);

        if (onSuccess) {
          onSuccess(res);
        }

        // Auto close after 2.2 seconds
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setIsProcessing(false);
        setErrorMessage(res.error || "Payment was rejected by bank.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setIsProcessing(false);
      setErrorMessage("Network error during payment verification.");
    }
  };

  // Process Cash alternative
  const handleChooseCash = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStep("Setting ride payment mode to Cash...");

      const res = await chooseCashPaymentAction(bookingId);
      if (res.success) {
        setPaymentSuccess(true);
        setPaidPaymentId("CASH_SETTLEMENT");
        setIsProcessing(false);
        if (onSuccess) {
          onSuccess({
            success: true,
            bookingStatus: "confirmed",
            paymentStatus: "cash",
            message: "Ride confirmed with cash on completion.",
          });
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setIsProcessing(false);
        setErrorMessage(res.error || "Failed to switch to cash");
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setErrorMessage("Error choosing cash payment.");
    }
  };

  const handleModalClose = () => {
    if (isProcessing) return;
    setOrderId("");
    setPaymentSuccess(false);
    setErrorMessage(null);
    setPaidPaymentId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-2xl">
        {/* Razorpay Brand Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white text-purple-700 flex items-center justify-center font-black shadow-md">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight">SafarX Pay</span>
                  <Badge className="bg-emerald-400 text-zinc-950 font-bold text-[9px] px-1.5 py-0 h-4 uppercase">
                    Live Mock
                  </Badge>
                </div>
                <p className="text-[10px] text-purple-200">
                  Instant Cashless Settlement
                </p>
              </div>
            </div>

            {/* Fare badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-purple-200 block">
                Total Payable
              </span>
              <span className="text-2xl font-black tracking-tight text-white">
                ₹{amount}
              </span>
            </div>
          </div>

          {/* Order Details Strip */}
          <div className="mt-4 pt-3 border-t border-purple-500/40 flex items-center justify-between text-[11px] text-purple-100 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-300">Order:</span>
              <span className="font-bold">{orderId ? orderId.slice(0, 16) + "..." : "Loading..."}</span>
              <button
                type="button"
                onClick={copyOrderId}
                className="hover:text-white p-0.5"
                title="Copy Order ID"
              >
                {copiedOrderId ? (
                  <Check className="h-3 w-3 text-emerald-300" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-1 text-purple-200">
              <Clock className="h-3 w-3" />
              <span>Expires in {formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {isInitializing ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-xs font-semibold">Creating secure payment order...</p>
          </div>
        ) : isProcessing ? (
          /* Processing State Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
              <Lock className="h-6 w-6 text-purple-600 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Processing Secure Payment
              </h4>
              <p className="text-xs text-zinc-500 font-medium animate-pulse">
                {processingStep}
              </p>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Protected by SafarX 256-bit SSL Banking Protocol</span>
            </div>
          </motion.div>
        ) : paymentSuccess ? (
          /* Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="p-8 flex flex-col items-center justify-center text-center space-y-3"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {paidPaymentId === "CASH_SETTLEMENT" ? "Ride Confirmed (Cash Mode)" : "Payment Successful!"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {paidPaymentId === "CASH_SETTLEMENT"
                  ? `Please hand ₹${amount} to your driver upon reaching destination.`
                  : `₹${amount} paid securely. Your ride is confirmed and driver notified.`}
              </p>
            </div>

            {paidPaymentId !== "CASH_SETTLEMENT" && (
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400">Payment ID: </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{paidPaymentId}</span>
              </div>
            )}

            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Confirmation receipt sent to registered email</span>
            </p>
          </motion.div>
        ) : (
          /* Active Interactive Payment Interface */
          <div className="p-5 space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setActiveTab("upi");
                  setErrorMessage(null);
                }}
                className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "upi"
                    ? "bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>UPI</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setActiveTab("card");
                  setErrorMessage(null);
                }}
                className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "card"
                    ? "bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Card</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setActiveTab("netbanking");
                  setErrorMessage(null);
                }}
                className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "netbanking"
                    ? "bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>NetBank</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setActiveTab("cash");
                  setErrorMessage(null);
                }}
                className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === "cash"
                    ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>Cash</span>
              </motion.button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* TAB 1: UPI / QR CODE */}
            {activeTab === "upi" && (
              <div className="space-y-3.5">
                {/* UPI Subtabs: ID vs QR */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setUpiSubTab("id")}
                    className={`pb-2 px-3 border-b-2 transition-all ${
                      upiSubTab === "id"
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-zinc-400"
                    }`}
                  >
                    Enter UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiSubTab("qr")}
                    className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                      upiSubTab === "qr"
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-zinc-400"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan UPI QR</span>
                  </button>
                </div>

                {upiSubTab === "id" ? (
                  <div className="space-y-3">
                    {/* Quick App Handles */}
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setUpiId(`${riderMobile}${app.handle}`)}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left hover:border-purple-400 dark:hover:border-purple-600 transition-colors flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {app.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {app.handle}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                        Virtual Payment Address (VPA):
                      </label>
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@okhdfc"
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  /* QR Code Display */
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative p-3 bg-white rounded-xl shadow-md border border-zinc-200">
                      {/* Realistic CSS Mock QR Matrix */}
                      <div className="h-28 w-28 bg-zinc-950 flex flex-col justify-between p-1 rounded">
                        <div className="flex justify-between">
                          <div className="h-8 w-8 bg-white p-1 rounded-sm">
                            <div className="h-full w-full bg-zinc-950 rounded-sm" />
                          </div>
                          <div className="h-8 w-8 bg-white p-1 rounded-sm">
                            <div className="h-full w-full bg-zinc-950 rounded-sm" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 rounded bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">
                            ₹
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-8 w-8 bg-white p-1 rounded-sm">
                            <div className="h-full w-full bg-zinc-950 rounded-sm" />
                          </div>
                          <div className="h-6 w-14 bg-white/20 rounded flex items-center justify-center text-[7px] text-white">
                            SCAN
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Scan using Google Pay, PhonePe, Paytm, or BHIM
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-purple-600">
                      UPI Ref: safarx.{orderId.slice(0, 8)}@icici
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARD */}
            {activeTab === "card" && (
              <div className="space-y-3">
                {/* Visual Card Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white space-y-2 shadow-sm text-xs">
                  <div className="flex justify-between items-center text-zinc-400 text-[10px] uppercase font-mono">
                    <span>SafarX Secure Card</span>
                    <span className="text-white font-bold tracking-widest">VISA / RuPay</span>
                  </div>
                  <div className="font-mono text-sm tracking-widest text-zinc-200 font-bold">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>{cardHolder || "CARDHOLDER"}</span>
                    <span>EXP: {cardExpiry || "MM/YY"}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-500 font-semibold block mb-0.5">
                      Card Number
                    </label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-500 font-semibold block mb-0.5">
                        Expiry Date
                      </label>
                      <Input
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500 font-semibold block mb-0.5">
                        CVV / CVC
                      </label>
                      <Input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                        placeholder="•••"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-500 font-semibold block mb-0.5">
                      Cardholder Name
                    </label>
                    <Input
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Full Name as on card"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NETBANKING */}
            {activeTab === "netbanking" && (
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-zinc-500 block">
                  Select Your Bank:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <motion.button
                      key={b.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                        selectedBank === b.id
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600/20"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                      }`}
                    >
                      <span>{b.short}</span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400">
                  You will be securely redirected to {POPULAR_BANKS.find(b => b.id === selectedBank)?.name} gateway.
                </p>
              </div>
            )}

            {/* TAB 4: CASH ON RIDE */}
            {activeTab === "cash" && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Banknote className="h-4 w-4" />
                  <span>Pay Cash Directly to Driver</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  You can pay the full fare of <b>₹{amount}</b> in cash to your driver once your trip is completed at the destination.
                </p>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={handleChooseCash}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Confirm Ride with Cash (₹{amount})
                  </Button>
                </motion.div>
              </div>
            )}

            {/* Bottom Actions for Online (UPI / Card / Netbanking) */}
            {activeTab !== "cash" && (
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => handleProcessPayment(false)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-5 rounded-xl shadow-md gap-2 transition-all"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Pay ₹{amount} Securely</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>

                {/* Developer / QA Simulator Control */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleProcessPayment(true)}
                    className="text-[10px] text-zinc-400 hover:text-rose-600 underline transition-colors"
                  >
                    Simulate Bank Decline (Test Failure)
                  </button>

                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>256-bit Encrypted</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
