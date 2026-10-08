"use client";

import * as React from "react";
import Link from "next/link";
import {
  savePartnerPersonalInfoAction,
  savePartnerVehicleAction,
  savePartnerDocsAction,
  savePartnerBankAction,
  getPartnerOnboardingDetailsAction,
  checkPartnerEligibilityAction,
} from "@/actions/partner";
import { uploadImageAction } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  User,
  FileText,
  CreditCard,
  Video,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  ShieldCheck,
} from "lucide-react";
import type { VehicleType } from "@/generated/prisma/enums";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PartnerOnboardPage() {
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isGuest, setIsGuest] = React.useState(false);

  // Form states
  const [phone, setPhone] = React.useState("");

  // Vehicle states
  const [vehicleType, setVehicleType] = React.useState<VehicleType>("car");
  const [vehicleModel, setVehicleModel] = React.useState("");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [vehicleImageUrl, setVehicleImageUrl] = React.useState("");

  // Docs states
  const [aadharUrl, setAadharUrl] = React.useState("");
  const [licenseUrl, setLicenseUrl] = React.useState("");
  const [rcUrl, setRcUrl] = React.useState("");
  const [uploadingDoc, setUploadingDoc] = React.useState<string | null>(null);

  // Bank states
  const [accountHolder, setAccountHolder] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [ifsc, setIfsc] = React.useState("");
  const [upi, setUpi] = React.useState("");

  // Load existing data if partner already filled some steps
  React.useEffect(() => {
    checkPartnerEligibilityAction().then((status) => {
      if (status.isGuest) {
        setIsGuest(true);
      }
    });

    getPartnerOnboardingDetailsAction().then((data) => {
      if (data) {
        if (data.mobileNumber) setPhone(data.mobileNumber);
        if (data.partnerOnboardingStep && data.partnerOnboardingStep > 0) {
          setCurrentStep(Math.min(data.partnerOnboardingStep + 1, 5));
        }
        if (data.vehicles && data.vehicles.length > 0) {
          const v = data.vehicles[0];
          setVehicleType(v.type);
          setVehicleModel(v.vehicleModel);
          setVehicleNumber(v.number);
          if (v.imageUrl) setVehicleImageUrl(v.imageUrl);
        }
        if (data.partnerDocs) {
          setAadharUrl(data.partnerDocs.aadharUrl || "");
          setLicenseUrl(data.partnerDocs.licenseUrl || "");
          setRcUrl(data.partnerDocs.rcUrl || "");
        }
        if (data.partnerBank) {
          setAccountHolder(data.partnerBank.accountHolder || "");
          setAccountNumber(data.partnerBank.accountNumber || "");
          setIfsc(data.partnerBank.ifsc || "");
          setUpi(data.partnerBank.upi || "");
        }
      }
    });
  }, []);

  // Generic ImageKit Uploader helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "vehicle" | "aadhar" | "license" | "rc"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(field);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadImageAction(formData, "/safarx/partners");
      if (res.success && res.url) {
        if (field === "vehicle") setVehicleImageUrl(res.url);
        if (field === "aadhar") setAadharUrl(res.url);
        if (field === "license") setLicenseUrl(res.url);
        if (field === "rc") setRcUrl(res.url);
      } else {
        alert(res.error || "File upload failed");
      }
    } catch {
      alert("Upload failed. Please check network.");
    } finally {
      setUploadingDoc(null);
    }
  };

  // Submit Step 1
  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await savePartnerPersonalInfoAction({ mobileNumber: phone });
    setIsSubmitting(false);
    if (res.success) setCurrentStep(2);
    else setErrorMessage(res.error || "Step 1 failed");
  };

  // Submit Step 2
  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleModel || !vehicleNumber) {
      setErrorMessage("Please fill all vehicle details");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await savePartnerVehicleAction({
      type: vehicleType,
      vehicleModel,
      number: vehicleNumber.toUpperCase().trim(),
      imageUrl: vehicleImageUrl,
    });
    setIsSubmitting(false);
    if (res.success) setCurrentStep(3);
    else setErrorMessage(res.error || "Step 2 failed");
  };

  // Submit Step 3
  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadharUrl || !licenseUrl || !rcUrl) {
      setErrorMessage("Please upload all 3 mandatory verification documents");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await savePartnerDocsAction({ aadharUrl, licenseUrl, rcUrl });
    setIsSubmitting(false);
    if (res.success) setCurrentStep(4);
    else setErrorMessage(res.error || "Step 3 failed");
  };

  // Submit Step 4
  const submitStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolder || !accountNumber || !ifsc) {
      setErrorMessage("Please fill all bank details");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await savePartnerBankAction({
      accountHolder,
      accountNumber,
      ifsc,
      upi,
    });
    setIsSubmitting(false);
    if (res.success) setCurrentStep(5);
    else setErrorMessage(res.error || "Step 4 failed");
  };

  const STEPS = [
    { num: 1, title: "Personal", icon: User },
    { num: 2, title: "Vehicle", icon: Car },
    { num: 3, title: "Documents", icon: FileText },
    { num: 4, title: "Bank", icon: CreditCard },
    { num: 5, title: "Video KYC", icon: Video },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Driver Partner Onboarding
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Complete your 5-step registration to start earning on SafarX.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Badge className="bg-purple-600 text-white">Partner Program</Badge>
          </div>
        </div>

        {/* Wizard Steps Navigation Bar */}
        <div className="grid grid-cols-5 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center gap-1.5 text-center ${
                  isCurrent
                    ? "text-purple-600 dark:text-purple-400 font-semibold"
                    : isDone
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                    isCurrent
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-sm"
                      : isDone
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-[11px] hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Guest Warning */}
        {isGuest && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Guest Rider Account Detected
                </h3>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  To register your commercial vehicle and bank account, you must create a permanent driver account.
                </p>
              </div>
            </div>
            <Link href="/register">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Create Permanent Account
              </Button>
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Contact & Profile Details</CardTitle>
              <CardDescription>
                Provide your active WhatsApp / calling mobile number for trip dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitStep1} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Mobile Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue to Vehicle Setup</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Vehicle Setup */}
        {currentStep === 2 && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Vehicle Information</CardTitle>
              <CardDescription>
                Tell us about the vehicle you will be driving on SafarX.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitStep2} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Vehicle Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {[
                      { type: "bike", label: "Motorcycle", icon: "🏍️" },
                      { type: "auto", label: "Auto Rickshaw", icon: "🛺" },
                      { type: "car", label: "Cab / Car", icon: "🚗" },
                      { type: "truck", label: "Mini Truck", icon: "🚚" },
                    ].map((v) => (
                      <button
                        key={v.type}
                        type="button"
                        onClick={() => setVehicleType(v.type as VehicleType)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          vehicleType === v.type
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 font-semibold"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="text-2xl mb-1">{v.icon}</div>
                        <span className="text-xs text-zinc-900 dark:text-zinc-100">
                          {v.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Vehicle Model & Make
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Maruti Suzuki Swift Dzire"
                      className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Registration Plate Number
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. MH 02 AB 1234"
                      className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Optional Vehicle Image Upload to ImageKit */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Vehicle Front Photo (Optional)
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400">
                      <UploadCloud className="h-4 w-4" />
                      <span>{uploadingDoc === "vehicle" ? "Uploading to ImageKit..." : "Upload Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "vehicle")}
                        className="hidden"
                      />
                    </label>
                    {vehicleImageUrl && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded to ImageKit
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Documents</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Documents Upload */}
        {currentStep === 3 && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Step 3: Verification Documents</CardTitle>
              <CardDescription>
                Upload clear photos of your official documents. Files are stored securely on ImageKit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitStep3} className="space-y-4">
                {[
                  {
                    field: "aadhar" as const,
                    label: "1. Aadhaar Card (Front/Back)",
                    url: aadharUrl,
                  },
                  {
                    field: "license" as const,
                    label: "2. Commercial Driving License",
                    url: licenseUrl,
                  },
                  {
                    field: "rc" as const,
                    label: "3. Vehicle Registration Certificate (RC)",
                    url: rcUrl,
                  },
                ].map((doc) => (
                  <div
                    key={doc.field}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {doc.label}
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        Max 5MB. JPG or PNG supported.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.url ? (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Uploaded
                        </span>
                      ) : (
                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors">
                          {uploadingDoc === doc.field ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="h-3.5 w-3.5" />
                          )}
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingDoc !== null}
                            onChange={(e) => handleFileUpload(e, doc.field)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !aadharUrl || !licenseUrl || !rcUrl}
                    className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Bank Details</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Bank Details */}
        {currentStep === 4 && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Step 4: Bank Account & Payouts</CardTitle>
              <CardDescription>
                Weekly ride earnings and bonuses will be transferred directly to this account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitStep4} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="As shown in your bank passbook"
                    className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      IFSC Code (11 digits)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    UPI ID (Optional for Instant Settlement)
                  </label>
                  <input
                    type="text"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                    placeholder="e.g. mobile@okhdfcbank"
                    className="mt-1 w-full rounded-xl border border-zinc-200 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit & Proceed to Video KYC</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Video KYC Launch & Final Submission */}
        {currentStep === 5 && (
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Step 5: Final Video KYC Verification</CardTitle>
                  <CardDescription>
                    All documents are submitted! Complete the live video verification call to activate your driver account.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-emerald-300 text-emerald-600">
                  Ready for KYC
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-900 dark:text-purple-200">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>What happens next?</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Click the button below to launch your dedicated <b>GetStream Video Room</b>. Keep your original Driving License and Aadhaar Card in front of your camera for the compliance agent.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/dashboard/kyc" className="flex-1">
                  <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white py-5">
                    <Video className="h-4 w-4" />
                    <span>Launch Live Video KYC Room</span>
                  </Button>
                </Link>

                <Link href="/partner/dashboard">
                  <Button variant="outline" className="w-full sm:w-auto py-5 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                    Go to Driver Console
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full sm:w-auto py-5">
                    Rider View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
