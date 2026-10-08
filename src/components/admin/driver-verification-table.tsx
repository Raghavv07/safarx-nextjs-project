"use client";

import * as React from "react";
import Link from "next/link";
import {
  type PartnerVerificationItem,
  updatePartnerApprovalAction,
} from "@/actions/admin";
import { DocumentPreviewModal } from "./document-preview-modal";
import { RejectReasonModal } from "./reject-reason-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Video,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DriverVerificationTableProps {
  partners: PartnerVerificationItem[];
  onRefresh: () => void;
}

export function DriverVerificationTable({
  partners,
  onRefresh,
}: DriverVerificationTableProps) {
  const [activeTab, setActiveTab] = React.useState<
    "pending" | "kyc" | "approved" | "rejected" | "all"
  >("pending");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Inspect Modal State
  const [selectedPartnerForInspect, setSelectedPartnerForInspect] =
    React.useState<PartnerVerificationItem | null>(null);

  // Reject Modal State
  const [rejectingPartner, setRejectingPartner] =
    React.useState<PartnerVerificationItem | null>(null);
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Quick Action Loading Map
  const [loadingPartnerId, setLoadingPartnerId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filter logic
  const filteredPartners = React.useMemo(() => {
    return partners.filter((p) => {
      // Tab filter
      if (activeTab === "pending" && p.partnerStatus !== "pending") return false;
      if (
        activeTab === "kyc" &&
        p.videoKycStatus !== "pending" &&
        p.videoKycStatus !== "inprogress"
      )
        return false;
      if (activeTab === "approved" && p.partnerStatus !== "approved") return false;
      if (activeTab === "rejected" && p.partnerStatus !== "rejected") return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesEmail = p.email.toLowerCase().includes(q);
        const matchesPhone = p.mobileNumber?.toLowerCase().includes(q);
        const matchesVehicle = p.vehicles.some(
          (v) =>
            v.vehicleModel.toLowerCase().includes(q) ||
            v.number.toLowerCase().includes(q)
        );
        return matchesName || matchesEmail || matchesPhone || matchesVehicle;
      }
      return true;
    });
  }, [partners, activeTab, searchQuery]);

  // Tab counts
  const pendingCount = partners.filter((p) => p.partnerStatus === "pending").length;
  const kycQueueCount = partners.filter(
    (p) => p.videoKycStatus === "pending" || p.videoKycStatus === "inprogress"
  ).length;
  const approvedCount = partners.filter((p) => p.partnerStatus === "approved").length;
  const rejectedCount = partners.filter((p) => p.partnerStatus === "rejected").length;

  // Handle One-Click Approve
  const handleApprove = async (partnerId: string) => {
    setLoadingPartnerId(partnerId);
    setStatusMessage(null);
    try {
      const res = await updatePartnerApprovalAction(partnerId, "approved");
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Driver partner approved successfully!",
        });
        onRefresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Approval failed",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error approving partner",
      });
    } finally {
      setLoadingPartnerId(null);
    }
  };

  // Handle Reject Confirmation
  const handleConfirmReject = async (reason: string) => {
    if (!rejectingPartner) return;
    setIsRejecting(true);
    try {
      const res = await updatePartnerApprovalAction(
        rejectingPartner.id,
        "rejected",
        reason
      );
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Driver partner rejected",
        });
        setRejectingPartner(null);
        onRefresh();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Rejection failed",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error rejecting partner",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner if any action occurred */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[10px] uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Filter Tabs + Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className={`text-xs gap-1.5 rounded-xl ${
              activeTab === "pending"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : ""
            }`}
          >
            <span>Pending Review</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${
                activeTab === "pending"
                  ? "bg-purple-700 text-white"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {pendingCount}
            </Badge>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === "kyc" ? "default" : "outline"}
            onClick={() => setActiveTab("kyc")}
            className={`text-xs gap-1.5 rounded-xl ${
              activeTab === "kyc"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : ""
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Video KYC Queue</span>
            {kycQueueCount > 0 && (
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${
                  activeTab === "kyc"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                }`}
              >
                {kycQueueCount}
              </Badge>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === "approved" ? "default" : "outline"}
            onClick={() => setActiveTab("approved")}
            className={`text-xs gap-1.5 rounded-xl ${
              activeTab === "approved" ? "bg-purple-600 text-white" : ""
            }`}
          >
            <span>Approved</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {approvedCount}
            </Badge>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === "rejected" ? "default" : "outline"}
            onClick={() => setActiveTab("rejected")}
            className={`text-xs gap-1.5 rounded-xl ${
              activeTab === "rejected" ? "bg-purple-600 text-white" : ""
            }`}
          >
            <span>Rejected</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {rejectedCount}
            </Badge>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className={`text-xs gap-1.5 rounded-xl ${
              activeTab === "all" ? "bg-purple-600 text-white" : ""
            }`}
          >
            <span>All ({partners.length})</span>
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, car..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Driver Partner</th>
                <th className="py-3 px-4">Vehicle Details</th>
                <th className="py-3 px-4">Compliance Docs</th>
                <th className="py-3 px-4">Video KYC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Car className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No driver partners found</p>
                    <p className="text-[11px] text-zinc-500">
                      Try selecting a different filter or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p) => {
                  const hasVehicle = p.vehicles.length > 0;
                  const vehicle = hasVehicle ? p.vehicles[0] : null;
                  const docs = p.partnerDocs;
                  const isProcessing = loadingPartnerId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Driver Partner info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {p.name}
                              </span>
                              {p.isOnline && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online on duty" />
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                              <span>{p.mobileNumber || p.email}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Step {p.partnerOnboardingStep}/4 · Joined {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle details */}
                      <td className="py-3.5 px-4">
                        {vehicle ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                              {vehicle.vehicleModel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-[9px] uppercase px-1.5 py-0"
                              >
                                {vehicle.number}
                              </Badge>
                              <span className="text-[10px] text-zinc-400 capitalize">
                                {vehicle.type}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">
                            No vehicle added
                          </span>
                        )}
                      </td>

                      {/* Compliance documents */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                docs?.licenseUrl ? "bg-emerald-500" : "bg-rose-400"
                              }`}
                            />
                            <span className={docs?.licenseUrl ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                              DL {docs?.licenseUrl ? "✓" : "✗"}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                docs?.aadharUrl ? "bg-emerald-500" : "bg-rose-400"
                              }`}
                            />
                            <span className={docs?.aadharUrl ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                              Aadhaar {docs?.aadharUrl ? "✓" : "✗"}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                docs?.rcUrl ? "bg-emerald-500" : "bg-rose-400"
                              }`}
                            />
                            <span className={docs?.rcUrl ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
                              RC {docs?.rcUrl ? "✓" : "✗"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedPartnerForInspect(p)}
                            className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect 3 Documents</span>
                          </button>
                        </div>
                      </td>

                      {/* Video KYC status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              p.videoKycStatus === "approved"
                                ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                                : p.videoKycStatus === "rejected"
                                ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                                : p.videoKycStatus === "inprogress"
                                ? "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/40 animate-pulse"
                                : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                            }`}
                          >
                            {p.videoKycStatus}
                          </Badge>

                          <Link
                            href={`/admin/kyc?driverId=${p.id}`}
                            className="block"
                          >
                            <span className="text-[10px] text-purple-600 hover:underline font-semibold flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              <span>Officer Portal</span>
                            </span>
                          </Link>
                        </div>
                      </td>

                      {/* Overall partner status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            p.partnerStatus === "approved"
                              ? "bg-emerald-500 text-white"
                              : p.partnerStatus === "rejected"
                              ? "bg-rose-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {p.partnerStatus}
                        </Badge>
                        {p.rejectionReason && (
                          <p className="text-[10px] text-rose-500 max-w-xs truncate mt-0.5">
                            {p.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Quick decision actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.partnerStatus !== "approved" && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleApprove(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 rounded-lg shadow-sm font-semibold gap-1"
                              title="One-click Approve Driver Partner"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </>
                              )}
                            </Button>
                          )}

                          {p.partnerStatus !== "rejected" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => setRejectingPartner(p)}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 text-xs h-7 px-2 rounded-lg font-semibold gap-1"
                              title="Reject with Reason"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPartnerForInspect(p)}
                            className="h-7 w-7 p-0 rounded-lg text-zinc-500 hover:text-zinc-900"
                            title="Inspect Documents"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Inspection Dialog */}
      <DocumentPreviewModal
        partner={selectedPartnerForInspect}
        isOpen={Boolean(selectedPartnerForInspect)}
        onClose={() => setSelectedPartnerForInspect(null)}
        onApprove={(id) => handleApprove(id)}
        onReject={(id) => {
          const partner = partners.find((p) => p.id === id);
          if (partner) setRejectingPartner(partner);
        }}
      />

      {/* Reject Reason Dialog */}
      <RejectReasonModal
        isOpen={Boolean(rejectingPartner)}
        partnerName={rejectingPartner?.name || "Driver"}
        isSubmitting={isRejecting}
        onClose={() => setRejectingPartner(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
