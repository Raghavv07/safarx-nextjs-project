"use server";

import { uploadImage, type UploadImageResult } from "@/lib/imagekit";

/**
 * Server Action to upload a file to ImageKit from forms or Server Components.
 */
export async function uploadImageAction(
  formData: FormData,
  folder = "/safarx/uploads"
): Promise<UploadImageResult> {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided in form data" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return await uploadImage({
    file: buffer,
    fileName: file.name,
    folder,
  });
}
