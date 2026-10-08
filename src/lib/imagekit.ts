import ImageKit from "imagekit";
import { env } from "@/env";

let imagekitInstance: ImageKit | null = null;

/**
 * Lazy singleton retriever for ImageKit instance.
 * Avoids crashing during Next.js static build if credentials are being configured.
 */
export function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    const publicKey = env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "dummy_public_key";
    const privateKey = env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key";
    const urlEndpoint =
      env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/dummy";

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }
  return imagekitInstance;
}

export interface UploadImageOptions {
  file: string | Buffer; // Base64 string, URL or Buffer
  fileName: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
}

export interface UploadImageResult {
  success: boolean;
  fileId?: string;
  url?: string;
  thumbnailUrl?: string;
  name?: string;
  size?: number;
  error?: string;
}

/**
 * Uploads a file (vehicle photo, KYC document, user avatar) to ImageKit.
 */
export async function uploadImage({
  file,
  fileName,
  folder = "/safarx",
  tags = [],
  useUniqueFileName = true,
}: UploadImageOptions): Promise<UploadImageResult> {
  if (!env.IMAGEKIT_PRIVATE_KEY) {
    return {
      success: false,
      error: "IMAGEKIT_PRIVATE_KEY is not configured in .env",
    };
  }

  try {
    const client = getImageKit();
    const response = await client.upload({
      file,
      fileName,
      folder,
      tags,
      useUniqueFileName,
    });

    return {
      success: true,
      fileId: response.fileId,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      name: response.name,
      size: response.size,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image";
    console.error("[ImageKit] Upload Error:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generates client-side upload authentication parameters (token, expire, signature).
 * Used by browser uploader to upload directly to ImageKit without proxying files through Next.js.
 */
export function getImageKitAuth() {
  if (!env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not configured in .env");
  }
  const client = getImageKit();
  return client.getAuthenticationParameters();
}
