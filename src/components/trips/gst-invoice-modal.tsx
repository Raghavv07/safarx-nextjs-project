"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTripInvoiceDetailsAction,
  type GstInvoiceData,
} from "@/actions/trips";
import {
  Printer,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface GstInvoiceModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GstInvoiceModal({
  bookingId,
  isOpen,
  onClose,
}: GstInvoiceModalProps) {
  const [invoice, setInvoice] = React.useState<GstInvoiceData | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isCurrentInvoice = invoice?.tripDetails.bookingId === bookingId;
  const isLoading = isOpen && Boolean(bookingId) && !isCurrentInvoice && !errorMessage;

  React.useEffect(() => {
    if (!bookingId || !isOpen) return;

    let isMounted = true;

    getTripInvoiceDetailsAction(bookingId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setInvoice(res.data);
          setErrorMessage(null);
        } else {
          setErrorMessage(res.error || "Failed to load tax invoice");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Invoice fetch error:", err);
        setErrorMessage("Network error loading invoice");
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, isOpen]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:border-zinc-800">
        {/* Modal Top Actions Bar (hidden when printing) */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Official GST Tax Invoice
              </h3>
              <p className="text-[10px] text-zinc-400">
                Valid for corporate expense &amp; tax reimbursement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !invoice}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 h-8 px-3 rounded-lg shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* Invoice Body Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white dark:bg-zinc-900 text-xs space-y-6 printable-invoice">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-xs font-semibold">Generating GST Tax Receipt...</p>
            </div>
          ) : errorMessage ? (
            <div className="py-16 text-center space-y-2 text-rose-600">
              <p className="text-sm font-bold">{errorMessage}</p>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Header: Company & Tax Invoice Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black tracking-tight text-purple-700 dark:text-purple-400">
                      SafarX
                    </span>
                    <Badge variant="outline" className="text-[9px] border-purple-300 text-purple-700 font-bold">
                      Original for Recipient
                    </Badge>
                  </div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                    {invoice.companyDetails.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 max-w-xs">
                    {invoice.companyDetails.address}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    GSTIN: <b>{invoice.companyDetails.gstin}</b> · SAC: <b>{invoice.companyDetails.sacCode}</b>
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wide block">
                    Tax Invoice
                  </span>
                  <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-400">Invoice No: </span>
                    <b>{invoice.invoiceNumber}</b>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    <span>Date: </span>
                    <b>{invoice.invoiceDate}</b>
                  </div>
                </div>
              </div>

              {/* Passenger & Driver / Vehicle Info Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                {/* Billed To */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Billed To (Passenger)
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {invoice.customerDetails.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Email: {invoice.customerDetails.email}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Mobile: {invoice.customerDetails.mobile}
                  </p>
                </div>

                {/* Service Provider */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Service Partner &amp; Vehicle
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {invoice.driverDetails.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Vehicle: {invoice.vehicleDetails.model} ({invoice.vehicleDetails.type})
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono font-semibold">
                    Plate: {invoice.vehicleDetails.number}
                  </p>
                </div>
              </div>

              {/* Trip Route Details */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span>Trip Booking ID: #{invoice.tripDetails.bookingId.slice(0, 8)}</span>
                  <span>Trip Time: {invoice.tripDetails.date}</span>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        Pickup Location
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200">
                        {invoice.tripDetails.pickupAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        Destination Drop
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200">
                        {invoice.tripDetails.dropAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized GST Breakdown Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">SAC Code</th>
                      <th className="py-2.5 px-3 text-right">Taxable Amount</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          Passenger Transport Ride Fare
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Ride hailing service via {invoice.vehicleDetails.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                        996412
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300">
                        ₹{invoice.taxBreakdown.baseFare.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300">
                        ₹{invoice.taxBreakdown.cgstAmount.toFixed(2)} ({invoice.taxBreakdown.cgstRate})
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-300">
                        ₹{invoice.taxBreakdown.sgstAmount.toFixed(2)} ({invoice.taxBreakdown.sgstRate})
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{invoice.taxBreakdown.totalAmountPaid.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 text-right font-sans">
                        Total Amount Paid (Inclusive of Taxes):
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-purple-700 dark:text-purple-400 font-mono font-black">
                        ₹{invoice.taxBreakdown.totalAmountPaid.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in words & digital compliance */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300 block">
                    Amount in Words:
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {invoice.taxBreakdown.amountInWords}
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[9px] shrink-0 capitalize">
                  Payment: {invoice.tripDetails.paymentStatus === "cash" ? "Cash Settlement" : "Paid Online"}
                </Badge>
              </div>

              {/* Payment Gateway Transaction Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="text-zinc-400 block font-sans">Payment Method</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{invoice.tripDetails.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-sans">Gateway Order ID</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{invoice.tripDetails.orderId}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-sans">Payment Reference</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{invoice.tripDetails.paymentId}</span>
                </div>
              </div>

              {/* Footer Legal & Digital Signature Disclaimer */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-[10px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>GST Tax Compliant under Section 9(5) of the CGST Act 2017</span>
                </div>
                <p>
                  This is a computer-generated tax invoice and does not require a physical signature. For queries or claims, contact {invoice.companyDetails.email} or call {invoice.companyDetails.supportDesk}.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
