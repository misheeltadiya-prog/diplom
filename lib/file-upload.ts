import {
  objectStorageRequiredMessage,
  storeImageBuffer,
  deleteStoredUrl,
} from "@/lib/object-storage";
import { logger } from "@/lib/logger";

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
  storage?: "local" | "s3";
};

export async function uploadFile(
  file: File,
  folder: string,
  prefix: string,
): Promise<UploadResult> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const timestamp = Date.now();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${prefix}-${timestamp}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const stored = await storeImageBuffer({
      buffer,
      folder,
      filename,
      contentType: file.type || `image/${extension}`,
    });

    return { success: true, url: stored.url, storage: stored.storage };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("file_upload_failed", { folder, error: message });
    if (message.includes("S3_BUCKET") || message.includes("Продакшн дээр зураг")) {
      return { success: false, error: objectStorageRequiredMessage() };
    }
    return { success: false, error: "Failed to upload file" };
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Only image files are allowed" };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return { valid: false, error: "Invalid file type. Allowed: jpg, jpeg, png, gif, webp" };
  }

  return { valid: true };
}

/** Public URL (local `/uploads/` эсвэл S3/CDN) устгана. */
export async function deletePublicUpload(publicUrl: string | null | undefined): Promise<void> {
  await deleteStoredUrl(publicUrl);
}
