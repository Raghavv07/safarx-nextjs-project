"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { PartnerVerificationItem } from "@/actions/admin";

interface DocumentPreviewModalProps {
  partner: PartnerVerificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (partnerId: string) => void;
  onReject?: (partnerId: string) => void;
}

export function DocumentPreviewModal({
  partner,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DocumentPreviewModalProps) {
  const [selectedDoc, setSelectedDoc] = React.useState<"license" | "aadhar" | "rc">("license");

  if (!partner) return null;

  const docs = partner.partnerDocs;
  const currentDocUrl =
    selectedDoc === "license"
      ? docs?.licenseUrl
      : selectedDoc === "aadhar"
      ? docs?.aadharUrl
      : docs?.rcUrl;

  const docTitle =
    selectedDoc === "license"
      ? "Driving License (DL)"
      : selectedDoc === "aadhar"
      ? "Aadhaar Card (Govt ID)"
      : "Vehicle Registration Certificate (RC Book)";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Compliance Document Inspection
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Driver: <b className="text-zinc-800 dark:text-zinc-200">{partner.name}</b> ({partner.mobileNumber || partner.email})
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                partner.partnerStatus === "approved"
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                  : partner.partnerStatus === "rejected"
                  ? "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                  : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40"
              }
            >
              {partner.partnerStatus.toUpperCase()}
            </Badge>
          </div>

          {/* Doc Switcher Tabs */}
          <div className="flex gap-2 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-3">
            <Button
              type="button"
              size="sm"
              variant={selectedDoc === "license" ? "default" : "outline"}
              onClick={() => setSelectedDoc("license")}
              className={`text-xs gap-1.5 ${selectedDoc === "license" ? "bg-purple-600 text-white" : ""}`}
            >
              <span>Driving License</span>
              {docs?.licenseUrl ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-400" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedDoc === "aadhar" ? "default" : "outline"}
              onClick={() => setSelectedDoc("aadhar")}
              className={`text-xs gap-1.5 ${selectedDoc === "aadhar" ? "bg-purple-600 text-white" : ""}`}
            >
              <span>Aadhaar Card</span>
              {docs?.aadharUrl ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-400" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedDoc === "rc" ? "default" : "outline"}
              onClick={() => setSelectedDoc("rc")}
              className={`text-xs gap-1.5 ${selectedDoc === "rc" ? "bg-purple-600 text-white" : ""}`}
            >
              <span>Vehicle RC</span>
              {docs?.rcUrl ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-400" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Document Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-5 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center min-h-[360px]">
          {currentDocUrl ? (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="relative w-full max-h-[460px] flex items-center justify-center rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-inner">
                {currentDocUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || currentDocUrl.includes("imagekit") ? (
                  // Image document preview
                  <div className="relative w-full h-[380px]">
                    <Image
                      src={currentDocUrl}
                      alt={docTitle}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                      unoptimized
                    />
                  </div>
                ) : (
                  // PDF or external link
                  <div className="text-center p-8 space-y-3">
                    <FileText className="h-12 w-12 text-purple-600 mx-auto" />
                    <p className="text-sm font-semibold">{docTitle}</p>
                    <p className="text-xs text-zinc-500">Document available via secure storage.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between w-full text-xs text-zinc-500 px-1">
                <span>{docTitle}</span>
                <a
                  href={currentDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Full Screen Document</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2 text-zinc-400">
              <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Document Not Uploaded Yet
              </p>
              <p className="text-xs text-zinc-500">
                Partner hasn&apos;t completed uploading this specific document.
              </p>
            </div>
          )}
        </div>

        {/* Footer with Quick Decision Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>SafarX Identity &amp; Compliance Audit</span>
          </div>

          <div className="flex items-center gap-2">
            {onReject && partner.partnerStatus !== "rejected" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onReject(partner.id);
                }}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 text-xs font-semibold"
              >
                Reject Profile
              </Button>
            )}

            {onApprove && partner.partnerStatus !== "approved" && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose();
                  onApprove(partner.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve All Documents</span>
              </Button>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
