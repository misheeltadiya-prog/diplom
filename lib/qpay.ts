import { logger } from "@/lib/logger";

export function isQPayConfigured(): boolean {
  return Boolean(
    process.env.QPAY_USERNAME?.trim() &&
      process.env.QPAY_PASSWORD?.trim() &&
      process.env.QPAY_INVOICE_CODE?.trim(),
  );
}

/** QPay invoice — бодит API холболт: QPAY_* env бөглөх шаардлагатай. */
export async function createQPayInvoice(opts: {
  amountMnt: number;
  description: string;
  senderInvoiceNo: string;
}): Promise<{ ok: boolean; invoiceId?: string; qrText?: string; stub?: boolean; error?: string }> {
  if (!isQPayConfigured()) {
    logger.warn("qpay_not_configured", { senderInvoiceNo: opts.senderInvoiceNo });
    return {
      ok: true,
      stub: true,
      invoiceId: `stub-${opts.senderInvoiceNo}`,
      qrText: "QPay тохируулаагүй (QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE)",
    };
  }

  const base = process.env.QPAY_API_BASE?.trim() || "https://merchant.qpay.mn/v2";
  const tokenRes = await fetch(`${base}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.QPAY_USERNAME,
      password: process.env.QPAY_PASSWORD,
    }),
  }).catch((e) => ({ ok: false as const, error: e }));

  if (tokenRes instanceof Error || !("ok" in tokenRes) || !tokenRes.ok) {
    return { ok: false, error: "QPay token авахад алдаа." };
  }

  const tokenJson = (await (tokenRes as Response).json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return { ok: false, error: "QPay access_token байхгүй." };
  }

  const invoiceRes = await fetch(`${base}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenJson.access_token}`,
    },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: opts.senderInvoiceNo,
      invoice_receiver_code: "terminal",
      invoice_description: opts.description,
      amount: opts.amountMnt,
      callback_url: process.env.QPAY_CALLBACK_URL?.trim() || undefined,
    }),
  });

  if (!invoiceRes.ok) {
    return { ok: false, error: `QPay invoice HTTP ${invoiceRes.status}` };
  }

  const data = (await invoiceRes.json()) as { invoice_id?: string; qr_text?: string };
  return {
    ok: true,
    invoiceId: data.invoice_id,
    qrText: data.qr_text,
  };
}
