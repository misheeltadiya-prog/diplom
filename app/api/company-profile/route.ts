import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";

type Body = {
  companyName?: string;
  industry?: string;
  website?: string;
  description?: string;
  city?: string;
};

async function ensureCompanyProfilesTable() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS company_profiles (
      user_id BIGINT UNSIGNED NOT NULL,
      company_name VARCHAR(180) NOT NULL DEFAULT '',
      industry VARCHAR(120) NOT NULL DEFAULT '',
      website VARCHAR(255) NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      city VARCHAR(120) NOT NULL DEFAULT 'Ulaanbaatar',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      CONSTRAINT company_profiles_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    )
  `);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "company") {
    return NextResponse.json({ error: "Зөвхөн company эрхтэй." }, { status: 403 });
  }

  try {
    await ensureCompanyProfilesTable();
    const db = getDb();
    let rows: {
      user_id: number;
      company_name: string;
      industry: string;
      website: string;
      description: string;
      city?: string;
    }[];
    try {
      const [r] = (await db.execute(
        `SELECT user_id, company_name, industry, website, description,
                IFNULL(city, '') AS city
         FROM company_profiles WHERE user_id = ? LIMIT 1`,
        [user.id],
      )) as [
        {
          user_id: number;
          company_name: string;
          industry: string;
          website: string;
          description: string;
          city: string;
        }[],
        unknown,
      ];
      rows = r;
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      const [r] = (await db.execute(
        `SELECT user_id, company_name, industry, website, description
         FROM company_profiles WHERE user_id = ? LIMIT 1`,
        [user.id],
      )) as [
        {
          user_id: number;
          company_name: string;
          industry: string;
          website: string;
          description: string;
        }[],
        unknown,
      ];
      rows = r.map((row) => ({ ...row, city: "" }));
    }
    return NextResponse.json({ ok: true, profile: rows[0] ?? null });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: mysqlErrorToUserMessage(err), profile: null },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "company") {
    return NextResponse.json({ error: "Зөвхөн company эрхтэй. /register?role=company-оор шинээр бүртгүүлнэ үү." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON буруу байна." }, { status: 400 });
  }

  const companyName = (body.companyName ?? "").trim();
  if (!companyName) {
    return NextResponse.json({ error: "Компанийн нэр заавал." }, { status: 400 });
  }

  const db = getDb();
  const city = (body.city ?? "").trim() || "Ulaanbaatar";

  try {
    await ensureCompanyProfilesTable();
    try {
      await db.execute(
        `INSERT INTO company_profiles (user_id, company_name, industry, website, description, city)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           company_name = VALUES(company_name),
           industry = VALUES(industry),
           website = VALUES(website),
           description = VALUES(description),
           city = VALUES(city),
           updated_at = NOW()`,
        [
          user.id,
          companyName,
          (body.industry ?? "").trim(),
          (body.website ?? "").trim(),
          (body.description ?? "").trim(),
          city,
        ],
      );
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      await db.execute(
        `INSERT INTO company_profiles (user_id, company_name, industry, website, description)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           company_name = VALUES(company_name),
           industry = VALUES(industry),
           website = VALUES(website),
           description = VALUES(description),
           updated_at = NOW()`,
        [
          user.id,
          companyName,
          (body.industry ?? "").trim(),
          (body.website ?? "").trim(),
          (body.description ?? "").trim(),
        ],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: mysqlErrorToUserMessage(err) }, { status: 500 });
  }
}
