import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { notify } from "@/lib/notify";

type ReviewPayload = {
  freelancerId?: number;
  rating?: number;
  comment?: string;
};

type ReviewRow = {
  id: number;
  reviewer_id: number;
  freelancer_id: number;
  rating: number;
  comment: string;
  created_at: Date;
  reviewer_name: string;
};

async function ensureTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      reviewer_id BIGINT UNSIGNED NOT NULL,
      freelancer_id BIGINT UNSIGNED NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY reviews_unique (reviewer_id, freelancer_id)
    )
  `);
}

// GET /api/reviews?freelancerId=X
export async function GET(req: Request) {
  try {
  const url = new URL(req.url);
  const freelancerId = url.searchParams.get("freelancerId");

  if (!freelancerId) {
    return NextResponse.json({ error: "freelancerId шаардлагатай." }, { status: 400 });
  }

  await ensureTable();
  const db = getDb();

  const [rows] = (await db.execute(
    `SELECT r.id, r.reviewer_id, r.freelancer_id, r.rating, r.comment, r.created_at,
            u.full_name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     WHERE r.freelancer_id = ?
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [freelancerId],
  )) as [ReviewRow[], unknown];

  const reviews = rows.map((r) => ({
    id: r.id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: new Date(r.created_at).toISOString(),
  }));

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return NextResponse.json({ ok: true, reviews, avgRating, count: reviews.length });
  } catch (error) {
    console.error("[reviews GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Сэтгэгдэл ачаалахад алдаа." },
      { status: 500 },
    );
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const body = (await req.json()) as ReviewPayload;

  if (!body.freelancerId || !body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: "freelancerId болон 1-5 оноо шаардлагатай." },
      { status: 400 },
    );
  }

  if (body.freelancerId === currentUser.id) {
    return NextResponse.json({ error: "Өөрийгөө үнэлэх боломжгүй." }, { status: 400 });
  }

  await ensureTable();
  const db = getDb();

  try {
    await db.execute(
      `INSERT INTO reviews (reviewer_id, freelancer_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [currentUser.id, body.freelancerId, body.rating, (body.comment ?? "").trim()],
    );

    // Notify freelancer
    await notify({
      userId: body.freelancerId,
      type: "new_review",
      title: "Шинэ үнэлгээ ирлээ",
      body: `${currentUser.fullName} таньд ${body.rating} оноо өглөө.`,
      payload: { reviewerId: currentUser.id, rating: body.rating },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Үнэлгээ хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
