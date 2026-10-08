"use client";

import * as React from "react";
import { uploadImageAction } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";

export interface ImageUploadProps {
  label?: string;
  folder?: string;
  onUploadSuccess?: (url: string, fileId?: string) => void;
  className?: string;
}

export function ImageUpload({
  label = "Upload Image (KYC / Vehicle)",
  folder = "/safarx/uploads",
  onUploadSuccess,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadImageAction(formData, folder);

      if (!result.success || !result.url) {
        throw new Error(result.error || "Failed to upload to ImageKit");
      }

      setUploadedUrl(result.url);
      onUploadSuccess?.(result.url, result.fileId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <Badge variant="outline" className="text-[10px] font-mono">
          ImageKit CDN
        </Badge>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center transition-all hover:border-emerald-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-emerald-500/50 dark:hover:bg-zinc-800/40"
      >
        {previewUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto h-28 w-28 rounded-xl object-cover shadow-xs"
            />
            <p className="text-xs text-zinc-500">Click to choose another photo</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <ImageIcon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Click or drag image to upload
            </p>
            <p className="text-[10px] text-zinc-400">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          <span>Uploading and optimizing via ImageKit...</span>
        </div>
      )}

      {uploadedUrl && !isUploading && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">Uploaded: {uploadedUrl}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full gap-1.5 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        <span>Browse File</span>
      </Button>
    </div>
  );
}
