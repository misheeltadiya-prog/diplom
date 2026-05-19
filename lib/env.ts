import { isS3Configured } from "@/lib/object-storage";
import { isSmtpConfigured } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { getStripeKeyValidationError } from "@/lib/stripe-server";

export type EnvIssue = { key: string; message: string; severity: "warn" | "error" };

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function validateServerEnv(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProd = process.env.NODE_ENV === "production";

  if (!read("MYSQL_HOST") && !read("DATABASE_URL")) {
    issues.push({ key: "MYSQL_HOST", message: "MySQL холболтын тохиргоо байхгүй.", severity: "error" });
  }

  if (isProd) {
    if (!read("NEXT_PUBLIC_SITE_URL") && !read("NEXT_PUBLIC_APP_URL")) {
      issues.push({
        key: "NEXT_PUBLIC_SITE_URL",
        message: "Продакшн дээр site URL заавал.",
        severity: "error",
      });
    }
    if (read("DEMO_LOGIN_ENABLED") === "1" || read("DEMO_LOGIN_ENABLED") === "true") {
      issues.push({
        key: "DEMO_LOGIN_ENABLED",
        message: "Продакшн дээр demo login идэвхтэй байж болохгүй.",
        severity: "error",
      });
    }
    if (!isSmtpConfigured()) {
      issues.push({
        key: "SMTP_HOST",
        message: "SMTP тохируулаагүй — forgot/verify и-мэйл явахгүй.",
        severity: "warn",
      });
    }
    if (!read("STRIPE_SECRET_KEY") || !read("STRIPE_WEBHOOK_SECRET")) {
      issues.push({
        key: "STRIPE_SECRET_KEY",
        message: "Stripe subscription бүрэн ажиллахгүй.",
        severity: "warn",
      });
    }
    if (!isS3Configured()) {
      issues.push({
        key: "S3_BUCKET",
        message: "S3/CDN байхгүй — upload зөвхөн локал диск (server restart-д алдагдах боломжтой).",
        severity: "warn",
      });
    }
  }

  const stripeErr = getStripeKeyValidationError();
  if (stripeErr) {
    issues.push({ key: "STRIPE_SECRET_KEY", message: stripeErr, severity: "error" });
  }

  const gemini = read("GEMINI_API_KEY");
  if (gemini && gemini.length < 20) {
    issues.push({ key: "GEMINI_API_KEY", message: "Gemini түлхүүр хэт богино.", severity: "warn" });
  }

  return issues;
}

export function getEnvStatus() {
  const geminiKey = read("GEMINI_API_KEY");
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    smtp: isSmtpConfigured(),
    s3: isS3Configured(),
    stripe: Boolean(read("STRIPE_SECRET_KEY") && !getStripeKeyValidationError()),
    stripeWebhook: Boolean(read("STRIPE_WEBHOOK_SECRET")),
    gemini: geminiKey.length >= 20,
    geminiModel: read("GEMINI_MODEL") || "gemini-2.0-flash (default)",
    qpay: Boolean(read("QPAY_USERNAME") && read("QPAY_PASSWORD")),
    realtime: read("REALTIME_PROVIDER") || "sse",
    issues: validateServerEnv(),
  };
}

export function logEnvValidation(): void {
  const issues = validateServerEnv();
  if (issues.length === 0) return;
  for (const i of issues) {
    if (i.severity === "error") {
      logger.error("env_validation", { key: i.key, message: i.message });
    } else {
      logger.warn("env_validation", { key: i.key, message: i.message });
    }
  }
}
