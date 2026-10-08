"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface RejectReasonModalProps {
  isOpen: boolean;
  partnerName: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const COMMON_REASONS = [
  "Driving License image is blurry or unreadable",
  "Driving License has expired",
  "Aadhaar Card name/photo does not match application details",
  "Vehicle RC Book registration number mismatch",
  "Vehicle does not meet commercial safety standards",
  "Bank account IFSC or account holder name mismatch",
  "Video KYC identity verification failed or face mismatch",
];

export function RejectReasonModal({
  isOpen,
  partnerName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: RejectReasonModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = React.useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Reject Driver Partner
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Select the compliance violation reason for <b>{partnerName}</b>. The reason will be notified to the driver so they can re-upload valid documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Standard Rejection Reasons:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {COMMON_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                    selectedReason === reason && !customReason
                      ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason && !customReason}
                    onChange={() => {
                      setSelectedReason(reason);
                      setCustomReason("");
                    }}
                    className="mt-0.5 accent-purple-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Or Specify Custom Reason:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific comments or instructions for the driver..."
                rows={3}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              size="sm"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-rose-600/30"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
