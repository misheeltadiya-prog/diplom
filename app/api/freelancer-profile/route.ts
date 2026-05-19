import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { maxPortfolioItems } from "@/lib/subscription-tier";
import { getCanonicalPlanForUser } from "@/services/subscriptionService";

type ProfilePayload = {
  roleTitle?: string;
  shortDescription?: string;
  detailDescription?: string;
  skills?: string[];
  priceLabel?: string;
  /** Portfolio — URL эсвэл товч тайлбарын жагсаалт */
  portfolio?: string[];
  /** Freelancers жагсаалтад харуулах */
  listedOnDirectory?: boolean;
};

type ProfileRow = {
  id: number;
  user_id: number;
  role_title: string;
  short_description: string;
  detail_description: string;
  skills_json: string;
  price_label: string;
  rating: string;
  reviews_count: string;
  accent: string;
  is_active: number;
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    const db = getDb();
    const [rows] = (await db.execute(
      `SELECT * FROM freelancer_profiles WHERE user_id = ? LIMIT 1`,
      [currentUser.id],
    )) as [ProfileRow[], unknown];

    return NextResponse.json({ ok: true, profile: rows[0] ?? null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Алдаа";
    const hint =
      msg.includes("doesn't exist") || msg.includes("Unknown table")
        ? " DB дээр freelancer_profiles хүснэгт байхгүй — төслийн терминалаас: npm run db:freelancer"
        : "";
    return NextResponse.json({ error: `${msg}${hint}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  if (currentUser.role !== "freelancer") {
    return NextResponse.json(
      { error: "Зөвхөн freelancer бүртгэлтэй хэрэглэгч profile үүсгэж болно." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as ProfilePayload;

    if (!body.roleTitle?.trim()) {
      return NextResponse.json({ error: "Мэргэжил заавал шаардлагатай." }, { status: 400 });
    }

    const db = getDb();
    const skillsJson = JSON.stringify(body.skills ?? []);
    const tier = await getCanonicalPlanForUser(currentUser.id);
    const maxP = maxPortfolioItems(tier);
    const portfolioItems = (body.portfolio ?? []).filter((s) => typeof s === "string" && s.trim());
    if (portfolioItems.length > maxP) {
      return NextResponse.json(
        {
          error: `Portfolio хамгийн ихдээ ${maxP} зүйл (${tier.toUpperCase()} багц).`,
          needSubscription: true,
        },
        { status: 403 },
      );
    }
    const portfolioJson = JSON.stringify(portfolioItems.slice(0, maxP));
    const listed = body.listedOnDirectory === true ? 1 : 0;

    try {
      await db.execute(
        `INSERT INTO freelancer_profiles
           (user_id, role_title, short_description, detail_description, skills_json, price_label, portfolio_json, listed_on_directory)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           role_title = VALUES(role_title),
           short_description = VALUES(short_description),
           detail_description = VALUES(detail_description),
           skills_json = VALUES(skills_json),
           price_label = VALUES(price_label),
           portfolio_json = VALUES(portfolio_json),
           listed_on_directory = VALUES(listed_on_directory),
           updated_at = NOW()`,
        [
          currentUser.id,
          body.roleTitle.trim(),
          (body.shortDescription ?? "").trim(),
          (body.detailDescription ?? "").trim(),
          skillsJson,
          (body.priceLabel ?? "").trim(),
          portfolioJson,
          listed,
        ],
      );
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw e;
      }
      await db.execute(
        `INSERT INTO freelancer_profiles
           (user_id, role_title, short_description, detail_description, skills_json, price_label)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           role_title = VALUES(role_title),
           short_description = VALUES(short_description),
           detail_description = VALUES(detail_description),
           skills_json = VALUES(skills_json),
           price_label = VALUES(price_label),
           updated_at = NOW()`,
        [
          currentUser.id,
          body.roleTitle.trim(),
          (body.shortDescription ?? "").trim(),
          (body.detailDescription ?? "").trim(),
          skillsJson,
          (body.priceLabel ?? "").trim(),
        ],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Алдаа гарлаа." },
      { status: 500 },
    );
  }
}
