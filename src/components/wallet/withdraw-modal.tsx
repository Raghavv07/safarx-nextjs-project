"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  requestPayoutAction,
  type BankDetailsData,
} from "@/actions/wallet";
import {
  ArrowUpRight,
  Landmark,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ShieldCheck,
} from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  withdrawableBalance: number;
  bankDetails: BankDetailsData | null;
  onClose: () => void;
  onSuccess: () => void;
  onOpenBankSetup: () => void;
}

export function WithdrawModal({
  isOpen,
  withdrawableBalance,
  bankDetails,
  onClose,
  onSuccess,
  onOpenBankSetup,
}: WithdrawModalProps) {
  const [amount, setAmount] = React.useState<number>(() => Math.min(withdrawableBalance, 500));
  const [method, setMethod] = React.useState<"bank" | "upi">(
    bankDetails?.upi ? "upi" : "bank"
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{
    message: string;
    amount: number;
  } | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessResult(null);
    onClose();
  };

  const quickAmounts = [
    100,
    500,
    1000,
    2000,
    Math.floor(withdrawableBalance),
  ].filter((v, idx, arr) => v > 0 && v <= withdrawableBalance && arr.indexOf(v) === idx);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankDetails) {
      setErrorMessage("Please link your bank account or UPI ID first.");
      return;
    }

    if (amount <= 0 || amount > withdrawableBalance) {
      setErrorMessage(
        `Please enter an amount between ₹10 and ₹${withdrawableBalance.toFixed(2)}.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await requestPayoutAction(amount, method);
      if (res.success && res.message) {
        setSuccessResult({
          message: res.message,
          amount,
        });
        onSuccess();
      } else {
        setErrorMessage(res.error || "Failed to process withdrawal");
      }
    } catch {
      setErrorMessage("Network error during withdrawal processing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
        {/* SUCCESS STATE SCREEN */}
        {successResult ? (
          <div className="p-8 text-center space-y-5">
            <div className="h-16 w-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Transfer Initiated &amp; Settled
              </span>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                ₹{successResult.amount.toLocaleString("en-IN")} Sent!
              </h3>
              <p className="text-xs text-zinc-500">
                {successResult.message}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>SafarX FastPay Instant Payout Guarantee</span>
            </div>

            <Button
              type="button"
              onClick={handleClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl"
            >
              Done &amp; View Ledger
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Withdraw Earnings
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                      Transfer money to your registered account
                    </DialogDescription>
                  </div>
                </div>

                <Badge className="bg-purple-600 text-white text-[10px]">
                  FastPay
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-4">
              {/* Available balance chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                  Available for withdrawal:
                </span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300">
                  ₹{withdrawableBalance.toFixed(2)}
                </span>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Enter Amount (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={withdrawableBalance}
                    step={1}
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-lg font-black rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick preset amount chips */}
              {quickAmounts.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                        amount === q
                          ? "bg-purple-600 text-white border-purple-600 font-bold"
                          : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                      }`}
                    >
                      {q === Math.floor(withdrawableBalance)
                        ? `All (₹${q})`
                        : `₹${q}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Payout Destination Selector */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Select Payout Destination:
                </label>

                {!bankDetails ? (
                  <div className="p-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 text-center space-y-2">
                    <p>No Bank or UPI details linked to your account.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenBankSetup();
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    >
                      Link Bank Account Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Bank Option */}
                    <label
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        method === "bank"
                          ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="bank"
                          checked={method === "bank"}
                          onChange={() => setMethod("bank")}
                          className="accent-purple-600"
                        />
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                            Bank Account (IMPS)
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {bankDetails.maskedAccountNumber} · IFSC: {bankDetails.ifsc}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">
                        Verified
                      </Badge>
                    </label>

                    {/* UPI Option */}
                    {bankDetails.upi && (
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          method === "upi"
                            ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payoutMethod"
                            value="upi"
                            checked={method === "upi"}
                            onChange={() => setMethod("upi")}
                            className="accent-purple-600"
                          />
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              Instant UPI Transfer
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {bankDetails.upi}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[9px]">
                          ⚡ Fast
                        </Badge>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !bankDetails || amount <= 0 || amount > withdrawableBalance}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-purple-600/30 py-5 px-5 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-white" />
                    <span>Confirm Instant Payout (₹{amount})</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
