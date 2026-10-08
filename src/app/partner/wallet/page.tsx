"use client";

import * as React from "react";
import Link from "next/link";
import { getCurrentUser, type CurrentUser } from "@/actions/auth";
import {
  getDriverWalletDataAction,
  type DriverWalletData,
} from "@/actions/wallet";
import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card";
import { WithdrawModal } from "@/components/wallet/withdraw-modal";
import { BankDetailsCard } from "@/components/wallet/bank-details-card";
import { TransactionLedgerTable } from "@/components/wallet/transaction-ledger-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Wallet,
  RefreshCw,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PartnerWalletPage() {
  const [data, setData] = React.useState<DriverWalletData | null>(null);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false);
  const [isBankSetupOpen, setIsBankSetupOpen] = React.useState(false);

  const loadWallet = React.useCallback(async () => {
    try {
      const res = await getDriverWalletDataAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setCurrentUser(user);
        setAuthChecked(true);

        getDriverWalletDataAction()
          .then((res) => {
            if (!isMounted) return;
            if (res.success && res.data) {
              setData(res.data);
            }
            setIsLoading(false);
          })
          .catch(() => {
            if (isMounted) setIsLoading(false);
          });
      })
      .catch(() => {
        if (isMounted) {
          setAuthChecked(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!authChecked || (isLoading && !data)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-xs text-zinc-500 font-semibold tracking-wide">
          Connecting to SafarX FastPay Driver Wallet...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-xl text-center p-8 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-600/10 text-purple-600 mx-auto flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Partner Authentication Required
            </h2>
            <p className="text-xs text-zinc-500">
              Please sign in with your driver partner credentials to view your wallet balance and payout history.
            </p>
          </div>
          <Link href="/login?next=/partner/wallet" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 text-xs rounded-xl shadow-md">
              Sign In to SafarX
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/partner/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span>Duty Dashboard</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm font-bold">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                  Partner FastPay Wallet
                </span>
                <span className="text-[10px] text-zinc-400 block hidden sm:block">
                  Driver Earnings, Bank Accounts &amp; Instant Settlements
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-300 dark:border-emerald-800 text-[10px] hidden sm:flex items-center gap-1">
              <Zap className="h-3 w-3 fill-emerald-600" />
              <span>Instant IMPS / UPI Payout</span>
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadWallet}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900"
              title="Refresh Wallet"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Wallet Balance Hero Card */}
        {data?.metrics && (
          <WalletBalanceCard
            metrics={data.metrics}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
          />
        )}

        {/* Registered Bank & UPI Account Details Card */}
        <BankDetailsCard
          bankDetails={data?.bankDetails || null}
          onRefresh={loadWallet}
          isSetupOpen={isBankSetupOpen}
          onCloseSetup={() => setIsBankSetupOpen(false)}
        />

        {/* Complete Transaction Ledger Statement */}
        <TransactionLedgerTable ledger={data?.ledger || []} />
      </main>

      {/* Instant Withdraw Modal */}
      {data?.metrics && (
        <WithdrawModal
          isOpen={isWithdrawOpen}
          withdrawableBalance={data.metrics.withdrawableBalance}
          bankDetails={data.bankDetails}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={loadWallet}
          onOpenBankSetup={() => setIsBankSetupOpen(true)}
        />
      )}
    </div>
  );
}
