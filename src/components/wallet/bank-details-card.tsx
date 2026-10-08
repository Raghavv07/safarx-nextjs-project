"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  updatePartnerBankDetailsAction,
  type BankDetailsData,
} from "@/actions/wallet";
import {
  Landmark,
  Edit2,
  Loader2,
  Plus,
} from "lucide-react";

interface BankDetailsFormDialogProps {
  isOpen: boolean;
  bankDetails: BankDetailsData | null;
  onClose: () => void;
  onRefresh: () => void;
}

function BankDetailsFormDialog({
  isOpen,
  bankDetails,
  onClose,
  onRefresh,
}: BankDetailsFormDialogProps) {
  const [accountHolder, setAccountHolder] = React.useState(bankDetails?.accountHolder || "");
  const [accountNumber, setAccountNumber] = React.useState(bankDetails?.accountNumber || "");
  const [ifsc, setIfsc] = React.useState(bankDetails?.ifsc || "");
  const [upi, setUpi] = React.useState(bankDetails?.upi || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim()) {
      setErrorMessage("Please fill all required bank account fields.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await updatePartnerBankDetailsAction({
        accountHolder,
        accountNumber,
        ifsc,
        upi: upi.trim() || undefined,
      });

      if (res.success) {
        onClose();
        onRefresh();
      } else {
        setErrorMessage(res.error || "Failed to update bank details");
      }
    } catch {
      setErrorMessage("Network error updating bank account");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSave}>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {bankDetails ? "Update Payout Bank Details" : "Link Bank Account & UPI"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              All ride earnings will be transferred directly to this account via SafarX FastPay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Account Holder Name:
              </label>
              <input
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Bank Account Number:
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ""))}
                placeholder="e.g. 50100432198765"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Bank IFSC Code:
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="e.g. HDFC0001234"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                UPI ID (Optional for Instant Payout):
              </label>
              <input
                type="text"
                value={upi}
                onChange={(e) => setUpi(e.target.value.trim().toLowerCase())}
                placeholder="e.g. ramesh@okhdfcbank"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Save Bank Details</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BankDetailsCardProps {
  bankDetails: BankDetailsData | null;
  onRefresh: () => void;
  isSetupOpen?: boolean;
  onCloseSetup?: () => void;
}

export function BankDetailsCard({
  bankDetails,
  onRefresh,
  isSetupOpen = false,
  onCloseSetup,
}: BankDetailsCardProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isModalOpen = isSetupOpen || internalOpen;

  const handleClose = () => {
    setInternalOpen(false);
    onCloseSetup?.();
  };

  return (
    <>
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  Payout Accounts
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Registered Bank &amp; UPI handles for instant settlements
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInternalOpen(true)}
              className="text-xs h-7 px-2.5 rounded-lg border-zinc-200 dark:border-zinc-700 gap-1 text-purple-600"
            >
              {bankDetails ? (
                <>
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  <span>Link Bank</span>
                </>
              )}
            </Button>
          </div>

          {bankDetails ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Bank Account */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Bank Account (IMPS)
                  </span>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300 py-0">
                    Active
                  </Badge>
                </div>
                <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {bankDetails.maskedAccountNumber}
                </p>
                <div className="text-[10px] text-zinc-500 flex justify-between">
                  <span>Name: {bankDetails.accountHolder}</span>
                  <span className="font-mono">IFSC: {bankDetails.ifsc}</span>
                </div>
              </div>

              {/* UPI ID */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    UPI Handle
                  </span>
                  <Badge className="bg-purple-600 text-white text-[9px] py-0">
                    Instant
                  </Badge>
                </div>
                <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {bankDetails.upi || "Not configured"}
                </p>
                <p className="text-[10px] text-zinc-500">
                  Direct VPA settlement supported
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-2">
              <p className="text-xs text-zinc-500">
                You haven&apos;t linked any payout method yet.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setInternalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                Add Bank Account / UPI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog rendered with key for clean state reset */}
      {isModalOpen && (
        <BankDetailsFormDialog
          key={bankDetails ? bankDetails.accountNumber : "new"}
          isOpen={isModalOpen}
          bankDetails={bankDetails}
          onClose={handleClose}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
