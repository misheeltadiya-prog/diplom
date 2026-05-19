import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";
import { getSiteUrl } from "@/lib/site-url";

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim());
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("smtp_not_configured", { hint: "SMTP_HOST/SMTP_USER" });
    }
    return { ok: false, skipped: true };
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === "1",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ?? "",
    },
  });

  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER!;

  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? opts.text.replace(/\n/g, "<br/>"),
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("mail_send_failed", { error: msg, to: opts.to });
    return { ok: false, error: msg };
  }
}

/** И-мэйл доторх абсолют линк (прокси ард зөв домэйн). */
export function publicAppUrl(pathname: string) {
  const base = getSiteUrl().replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
