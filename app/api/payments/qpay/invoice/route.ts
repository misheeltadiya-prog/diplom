import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createQPayInvoice, isQPayConfigured } from "@/lib/qpay";

type Body = {
  amountMnt?: number;
  description?: string;
  escrowId?: number;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON буруу." }, { status: 400 });
  }

  const amountMnt = Math.max(0, Math.floor(body.amountMnt ?? 0));
  if (amountMnt <= 0) {
    return NextResponse.json({ error: "amountMnt (>0) шаардлагатай." }, { status: 400 });
  }

  const senderInvoiceNo = `cw-${user.id}-${body.escrowId ?? Date.now()}`;
  const result = await createQPayInvoice({
    amountMnt,
    description: (body.description ?? "").trim() || "C-Work төлбөр",
    senderInvoiceNo,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "QPay алдаа." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    configured: isQPayConfigured(),
    stub: result.stub ?? false,
    invoiceId: result.invoiceId,
    qrText: result.qrText,
  });
}
