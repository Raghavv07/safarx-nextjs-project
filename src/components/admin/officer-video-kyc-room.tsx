"use client";

import * as React from "react";
import Image from "next/image";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  type Call,
  type User as StreamUser,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  type PartnerVerificationItem,
  updatePartnerKycStatusAction,
  getPartnerDetailsForKycAction,
} from "@/actions/admin";
import { startVideoKycSessionAction } from "@/actions/stream";
import { RejectReasonModal } from "./reject-reason-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Video,
  ShieldCheck,
  PhoneOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface OfficerVideoKycRoomProps {
  partnerId: string;
  initialPartnerData?: PartnerVerificationItem | null;
  officerName?: string;
  onDecisionCompleted?: () => void;
}

export function OfficerVideoKycRoom({
  partnerId,
  initialPartnerData,
  officerName = "Compliance Officer",
  onDecisionCompleted,
}: OfficerVideoKycRoomProps) {
  const [partner, setPartner] = React.useState<PartnerVerificationItem | null>(
    initialPartnerData || null
  );
  const [client, setClient] = React.useState<StreamVideoClient | null>(null);
  const [call, setCall] = React.useState<Call | null>(null);
  const [isJoining, setIsJoining] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Document tab in sidebar
  const [activeDocTab, setActiveDocTab] = React.useState<"license" | "aadhar" | "rc">("license");

  // Decision loading states
  const [isApprovingKyc, setIsApprovingKyc] = React.useState(false);
  const [isApprovingFull, setIsApprovingFull] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // Load partner details if not provided
  React.useEffect(() => {
    if (!partnerId) return;
    let isMounted = true;

    getPartnerDetailsForKycAction(partnerId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setPartner(res.data);
        }
      })
      .catch((err) => console.error("Error loading KYC partner:", err));

    return () => {
      isMounted = false;
    };
  }, [partnerId]);

  // Connect to Stream Call as Officer
  const handleJoinCall = async () => {
    setIsJoining(true);
    setErrorMsg(null);

    try {
      const res = await startVideoKycSessionAction(partnerId);

      if (!res.success || !res.callId || !res.token || !res.apiKey || !res.userId) {
        throw new Error(res.error || "Failed to initialize KYC video room");
      }

      const streamUser: StreamUser = {
        id: res.userId,
        name: officerName,
      };

      const videoClient = new StreamVideoClient({
        apiKey: res.apiKey,
        user: streamUser,
        token: res.token,
      });

      const videoCall = videoClient.call("default", res.callId);
      await videoCall.join({ create: true });

      setClient(videoClient);
      setCall(videoCall);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join room";
      setErrorMsg(message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleEndCall = async () => {
    if (call) {
      await call.leave();
      setCall(null);
    }
    if (client) {
      await client.disconnectUser();
      setClient(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (call) call.leave();
      if (client) client.disconnectUser();
    };
  }, [call, client]);

  // Handle Approve Video KYC Only
  const handleApproveVideoKyc = async () => {
    setIsApprovingKyc(true);
    try {
      const res = await updatePartnerKycStatusAction(partnerId, "approved", undefined, false);
      if (res.success) {
        setActionNotice("✓ Video KYC Approved successfully!");
        setPartner((prev) => (prev ? { ...prev, videoKycStatus: "approved" } : null));
        onDecisionCompleted?.();
      } else {
        alert(res.error || "Failed to approve Video KYC");
      }
    } catch {
      alert("Network error");
    } finally {
      setIsApprovingKyc(false);
    }
  };

  // Handle Approve Complete Profile (KYC + Docs + Vehicle)
  const handleApproveFullProfile = async () => {
    setIsApprovingFull(true);
    try {
      const res = await updatePartnerKycStatusAction(partnerId, "approved", undefined, true);
      if (res.success) {
        setActionNotice("✓ Full Driver Partner Profile Approved & Activated!");
        setPartner((prev) =>
          prev
            ? {
                ...prev,
                videoKycStatus: "approved",
                partnerStatus: "approved",
              }
            : null
        );
        onDecisionCompleted?.();
      } else {
        alert(res.error || "Failed to approve partner");
      }
    } catch {
      alert("Network error");
    } finally {
      setIsApprovingFull(false);
    }
  };

  // Handle Reject KYC
  const handleConfirmReject = async (reason: string) => {
    setIsRejecting(true);
    try {
      const res = await updatePartnerKycStatusAction(partnerId, "rejected", reason, false);
      if (res.success) {
        setActionNotice(`✗ Video KYC Rejected: ${reason}`);
        setPartner((prev) =>
          prev
            ? {
                ...prev,
                videoKycStatus: "rejected",
                videoKycRejectionReason: reason,
              }
            : null
        );
        setIsRejectModalOpen(false);
        onDecisionCompleted?.();
      } else {
        alert(res.error || "Failed to reject KYC");
      }
    } catch {
      alert("Network error");
    } finally {
      setIsRejecting(false);
    }
  };

  const docs = partner?.partnerDocs;
  const activeDocUrl =
    activeDocTab === "license"
      ? docs?.licenseUrl
      : activeDocTab === "aadhar"
      ? docs?.aadharUrl
      : docs?.rcUrl;

  const activeDocName =
    activeDocTab === "license"
      ? "Driving License"
      : activeDocTab === "aadhar"
      ? "Aadhaar Card"
      : "Vehicle RC Book";

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-[10px] uppercase font-bold text-purple-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Grid: Live Stream on Left (7 cols), Verification Sidebar on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: STREAM VIDEO CALL (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {client && call ? (
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <div className="flex flex-col h-[580px] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl relative">
                  {/* Top Bar Overlay */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-700 pointer-events-auto">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">
                        Officer KYC Session
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Room: #{partnerId.slice(0, 8)}
                      </span>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleEndCall}
                      className="pointer-events-auto gap-1 text-xs shadow-lg"
                    >
                      <PhoneOff className="h-3.5 w-3.5" />
                      <span>Leave Call</span>
                    </Button>
                  </div>

                  {/* Video layout */}
                  <div className="flex-1 w-full bg-zinc-950 flex items-center justify-center p-2">
                    <SpeakerLayout />
                  </div>

                  {/* Call Controls */}
                  <div className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 py-2.5 flex justify-center z-10">
                    <CallControls onLeave={handleEndCall} />
                  </div>
                </div>
              </StreamCall>
            </StreamVideo>
          ) : (
            <Card className="h-[580px] border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="h-20 w-20 rounded-3xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Video className="h-10 w-10" />
              </div>

              <div className="max-w-md space-y-2 mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Compliance Officer Video KYC Portal
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Join the encrypted WebRTC room to verify driver candidate{" "}
                  <b>{partner?.name || "Driver"}</b>. Ask candidate to show their original physical driving license in front of the camera.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 max-w-sm">
                  {errorMsg}
                </div>
              )}

              <Button
                type="button"
                size="lg"
                disabled={isJoining}
                onClick={handleJoinCall}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-6 rounded-2xl shadow-xl shadow-purple-600/30 text-sm"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting WebRTC Video...</span>
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    <span>Join Live KYC Room Now</span>
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: DOCUMENT VERIFICATION SIDEBAR (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[580px]">
            {/* Header info */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                    {partner?.name ? partner.name.charAt(0).toUpperCase() : "D"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {partner?.name || "Driver Candidate"}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {partner?.mobileNumber || partner?.email}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${
                    partner?.videoKycStatus === "approved"
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                      : partner?.videoKycStatus === "rejected"
                      ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                      : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                  }`}
                >
                  KYC: {partner?.videoKycStatus || "Pending"}
                </Badge>
              </div>

              {/* Document Tabs */}
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <Button
                  type="button"
                  size="sm"
                  variant={activeDocTab === "license" ? "default" : "outline"}
                  onClick={() => setActiveDocTab("license")}
                  className={`text-xs h-7 px-2.5 rounded-lg ${
                    activeDocTab === "license" ? "bg-purple-600 text-white" : ""
                  }`}
                >
                  <span>License</span>
                  {docs?.licenseUrl ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ml-1" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 ml-1" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeDocTab === "aadhar" ? "default" : "outline"}
                  onClick={() => setActiveDocTab("aadhar")}
                  className={`text-xs h-7 px-2.5 rounded-lg ${
                    activeDocTab === "aadhar" ? "bg-purple-600 text-white" : ""
                  }`}
                >
                  <span>Aadhaar</span>
                  {docs?.aadharUrl ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ml-1" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 ml-1" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeDocTab === "rc" ? "default" : "outline"}
                  onClick={() => setActiveDocTab("rc")}
                  className={`text-xs h-7 px-2.5 rounded-lg ${
                    activeDocTab === "rc" ? "bg-purple-600 text-white" : ""
                  }`}
                >
                  <span>RC Book</span>
                  {docs?.rcUrl ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 ml-1" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Document Image View */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center relative min-h-[220px]">
              {activeDocUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-between gap-2">
                  <div className="relative w-full flex-1 min-h-[200px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
                    <Image
                      src={activeDocUrl}
                      alt={activeDocName}
                      fill
                      className="object-contain"
                      sizes="350px"
                      unoptimized
                    />
                  </div>

                  <a
                    href={activeDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open {activeDocName} in New Tab</span>
                  </a>
                </div>
              ) : (
                <div className="text-center p-4 space-y-1 text-zinc-400">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold">Document Not Uploaded</p>
                </div>
              )}
            </div>

            {/* Decision Buttons Footer */}
            <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 shrink-0">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isApprovingKyc || isApprovingFull}
                  onClick={handleApproveVideoKyc}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 rounded-xl shadow-sm"
                >
                  {isApprovingKyc ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Video KYC</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isApprovingKyc || isApprovingFull}
                  onClick={() => setIsRejectModalOpen(true)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 text-xs font-bold gap-1 rounded-xl"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
              </div>

              {/* Full Profile Activation Button */}
              <Button
                type="button"
                size="sm"
                disabled={isApprovingFull || isApprovingKyc}
                onClick={handleApproveFullProfile}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold py-4 rounded-xl shadow-md gap-1.5"
              >
                {isApprovingFull ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>Approve &amp; Activate Full Driver Account</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        partnerName={partner?.name || "Driver"}
        isSubmitting={isRejecting}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
