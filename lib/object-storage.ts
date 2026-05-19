import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "@/lib/logger";

export type StoredObject = {
  url: string;
  storage: "local" | "s3";
};

export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_REGION?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim(),
  );
}

/** Vercel зэрэг serverless дээр локал диск руу бичих боломжгүй — S3/R2 заавал. */
export function objectStorageRequiredMessage(): string {
  return "Продакшн дээр зураг хадгалахын тулд S3 (эсвэл Cloudflare R2) тохиргоо хэрэгтэй. Vercel → Environment Variables: S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL.";
}

export function mustUseObjectStorage(): boolean {
  return process.env.NODE_ENV === "production" && !isS3Configured();
}

function publicUrlForKey(key: string): string {
  const cdn = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (cdn) {
    return `${cdn.replace(/\/$/, "")}/${key}`;
  }
  const bucket = process.env.S3_BUCKET!.trim();
  const region = process.env.S3_REGION!.trim();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<StoredObject> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.S3_REGION!.trim(),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!.trim(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return { url: publicUrlForKey(key), storage: "s3" };
}

async function uploadToLocal(buffer: Buffer, folder: string, filename: string): Promise<StoredObject> {
  const uploadDir = join(process.cwd(), "public", "uploads", folder);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);
  return { url: `/uploads/${folder}/${filename}`, storage: "local" };
}

export async function storeImageBuffer(opts: {
  buffer: Buffer;
  folder: string;
  filename: string;
  contentType: string;
}): Promise<StoredObject> {
  const key = `uploads/${opts.folder}/${opts.filename}`;

  if (mustUseObjectStorage()) {
    throw new Error(objectStorageRequiredMessage());
  }

  if (isS3Configured()) {
    try {
      return await uploadToS3(opts.buffer, key, opts.contentType);
    } catch (e) {
      logger.error("s3_upload_failed", {
        error: e instanceof Error ? e.message : String(e),
        key,
      });
      if (process.env.S3_FALLBACK_LOCAL !== "1") {
        throw e;
      }
    }
  }

  return uploadToLocal(opts.buffer, opts.folder, opts.filename);
}

export async function deleteStoredUrl(publicUrl: string | null | undefined): Promise<void> {
  const raw = publicUrl?.trim();
  if (!raw) return;

  if (raw.startsWith("/uploads/")) {
    const relative = raw.replace(/^\/+/, "");
    const filepath = join(process.cwd(), "public", relative);
    if (!filepath.startsWith(join(process.cwd(), "public", "uploads"))) return;
    try {
      if (existsSync(filepath)) await unlink(filepath);
    } catch {
      /* */
    }
    return;
  }

  if (!isS3Configured()) return;

  const cdn = process.env.S3_PUBLIC_BASE_URL?.trim();
  let key: string | null = null;
  if (cdn && raw.startsWith(cdn)) {
    key = raw.slice(cdn.length).replace(/^\//, "");
  } else {
    const bucket = process.env.S3_BUCKET!.trim();
    const region = process.env.S3_REGION!.trim();
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
    if (raw.startsWith(prefix)) {
      key = raw.slice(prefix.length);
    }
  }

  if (!key) return;

  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.S3_REGION!.trim(),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
      },
      endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
    });
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
      }),
    );
  } catch (e) {
    logger.warn("s3_delete_failed", { error: e instanceof Error ? e.message : String(e), key });
  }
}
