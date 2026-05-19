import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensurePaymentEscrowsTable } from "@/lib/escrow-db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { logger } from "@/lib/logger";

type PostBody = {
  payeeUserId?: number;
  amountMnt?: number;
  contractNote?: string;
  jobOfferId?: number;
  provider?: "manual" | "stripe" | "qpay";
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    await ensurePaymentEscrowsTable();
    const db = getDb();
    const [rows] = (await db.execute(
      `SELECT id, payer_user_id, payee_user_id, amount_mnt, currency, status, provider,
              external_ref, contract_note, job_offer_id, created_at, updated_at
       FROM payment_escrows
       WHERE payer_user_id = ? OR payee_user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id, user.id],
    )) as [
      {
        id: number;
        payer_user_id: number;
        payee_user_id: number;
        amount_mnt: number;
        currency: string;
        status: string;
        provider: string;
        external_ref: string;
        contract_note: string;
        job_offer_id: number | null;
        created_at: Date;
        updated_at: Date;
      }[],
      unknown,
    ];

    return NextResponse.json({
      ok: true,
      escrows: rows.map((r) => ({
        id: r.id,
        payerUserId: r.payer_user_id,
        payeeUserId: r.payee_user_id,
        amountMnt: r.amount_mnt,
        currency: r.currency,
        status: r.status,
        provider: r.provider,
        externalRef: r.external_ref,
        contractNote: r.contract_note,
        jobOfferId: r.job_offer_id,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON буруу." }, { status: 400 });
  }

  const payeeUserId = body.payeeUserId;
  const amountMnt = Math.max(0, Math.floor(body.amountMnt ?? 0));
  const contractNote = (body.contractNote ?? "").trim();

  if (!payeeUserId || amountMnt <= 0 || !contractNote) {
    return NextResponse.json(
      { error: "payeeUserId, amountMnt (>0), contractNote шаардлагатай." },
      { status: 400 },
    );
  }

  try {
    await ensurePaymentEscrowsTable();
    const db = getDb();
    const [hdr] = (await db.execute(
      `INSERT INTO payment_escrows
         (payer_user_id, payee_user_id, amount_mnt, contract_note, job_offer_id, provider, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        user.id,
        payeeUserId,
        amountMnt,
        contractNote,
        body.jobOfferId ?? null,
        body.provider ?? "manual",
      ],
    )) as [ResultSetHeader, unknown];

    logger.info("escrow_created", { escrowId: hdr.insertId, payerId: user.id, payeeUserId });

    return NextResponse.json({ ok: true, id: hdr.insertId, status: "pending" });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
