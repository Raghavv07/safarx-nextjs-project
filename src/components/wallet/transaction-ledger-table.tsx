"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
} from "lucide-react";
import type { LedgerTransaction } from "@/actions/wallet";

interface TransactionLedgerTableProps {
  ledger: LedgerTransaction[];
}

export function TransactionLedgerTable({ ledger }: TransactionLedgerTableProps) {
  const [filterType, setFilterType] = React.useState<"all" | "credit" | "debit">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTransactions = React.useMemo(() => {
    return ledger.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.referenceId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledger, filterType, searchQuery]);

  const creditCount = ledger.filter((l) => l.type === "credit").length;
  const debitCount = ledger.filter((l) => l.type === "debit").length;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      {/* Table Header with Filters */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-purple-600" />
            <span>Transaction Ledger &amp; Earnings History</span>
          </h3>
          <p className="text-[11px] text-zinc-500">
            Chronological statement of trip fares credited and payout withdrawals debited
          </p>
        </div>

        {/* Filter controls + search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, route..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-purple-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 w-full sm:w-44"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              type="button"
              size="sm"
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              className={`text-xs h-7 px-2.5 rounded-lg ${
                filterType === "all" ? "bg-purple-600 text-white" : ""
              }`}
            >
              <span>All ({ledger.length})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={filterType === "credit" ? "default" : "outline"}
              onClick={() => setFilterType("credit")}
              className={`text-xs h-7 px-2.5 rounded-lg gap-1 ${
                filterType === "credit" ? "bg-emerald-600 text-white" : "text-emerald-600"
              }`}
            >
              <ArrowDownLeft className="h-3 w-3" />
              <span>Credits (+{creditCount})</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={filterType === "debit" ? "default" : "outline"}
              onClick={() => setFilterType("debit")}
              className={`text-xs h-7 px-2.5 rounded-lg gap-1 ${
                filterType === "debit" ? "bg-purple-600 text-white" : "text-purple-600"
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>Payouts (-{debitCount})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Transaction / Type</th>
              <th className="py-3 px-4">Description &amp; Route</th>
              <th className="py-3 px-4">Reference UTR / ID</th>
              <th className="py-3 px-4">Date &amp; Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-400">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No transactions recorded</p>
                  <p className="text-[11px] text-zinc-500">
                    Completed trips and payout transfers will automatically reflect here.
                  </p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((item) => {
                const isCredit = item.type === "credit";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Icon + Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-purple-600/10 text-purple-600 dark:text-purple-400"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 capitalize">
                            {isCredit ? "Ride Partner Credit" : "FastPay Withdrawal"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subtitle / Route */}
                    <td className="py-3 px-4 max-w-xs truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                      {item.subtitle}
                    </td>

                    {/* Reference ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                        {item.referenceId.slice(0, 16)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-zinc-500">
                      <span className="block font-medium">
                        {new Date(item.date).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold tracking-wider ${
                          item.status === "completed"
                            ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : item.status === "pending" || item.status === "processing"
                            ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 animate-pulse"
                            : "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black text-sm font-mono ${
                          isCredit
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {isCredit ? "+" : "-"}₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
