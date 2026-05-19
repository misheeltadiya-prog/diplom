import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseSalaryAmount } from "@/lib/salary-amount";
import { fixMojibake } from "@/lib/text-normalize";
import { websiteToDomain } from "@/lib/website-domain";

export type JobPayload = {
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
};

export type StoredJob = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
  createdAt: string;
  createdByName: string | null;
  createdByUserId: number | null;
  createdByAvatarUrl: string | null;
  companyDomain: string | null;
  companyProfileUserId: number | null;
  companyLogoUrl: string | null;
  companyBannerUrl: string | null;
  applicantCount: number;
};

type JobsSchema = "zeel" | "diplom";

type JobsSchemaInfo = {
  schema: JobsSchema;
  databaseName: string;
};

type TableRow = {
  TABLE_NAME: string;
};

type CurrentDbRow = {
  db_name: string | null;
};

type ZeelActorRow = {
  id: number;
};

type DiplomActorRow = {
  id: string;
};

type ZeelJobRow = {
  id: number;
  created_by: number;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  salary: string;
  description: string;
  created_at: Date | string;
  created_by_name: string | null;
  created_by_avatar_url: string | null;
  company_website: string | null;
  company_profile_user_id: number | null;
  company_logo_url: string | null;
  company_banner_url: string | null;
};

type DiplomJobRow = {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  status: string;
  createdAt: Date | string;
  created_by_name: string | null;
  created_by_avatar_url?: string | null;
  company_website?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var jobsSchemaCache: JobsSchemaInfo | undefined;
}

function escapeIdentifier(value: string) {
  return `\`${value.replace(/`/g, "``")}\``;
}

function qualifiedTable(databaseName: string, tableName: string) {
  return `${escapeIdentifier(databaseName)}.${escapeIdentifier(tableName)}`;
}

function toIsoString(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function parseBudgetFromSalary(rawSalary: string) {
  const parsed = parseSalaryAmount(rawSalary);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function formatBudget(budget: number) {
  if (!Number.isFinite(budget)) {
    return "0";
  }

  return `${budget.toLocaleString("en-US")} MNT`;
}

function encodeDiplomCategory(companyName: string, location: string) {
  const json = JSON.stringify({ companyName, location });

  if (json.length <= 191) {
    return json;
  }

  return `${companyName}|${location}`.slice(0, 191);
}

function decodeDiplomCategory(category: string, fallbackCompanyName: string | null) {
  try {
    const parsed = JSON.parse(category) as { companyName?: string; location?: string };
    return {
      companyName: parsed.companyName?.trim() || fallbackCompanyName || "Company",
      location: parsed.location?.trim() || "-",
    };
  } catch {
    if (category.includes("|")) {
      const [companyName, location] = category.split("|");
      return {
        companyName: companyName?.trim() || fallbackCompanyName || "Company",
        location: location?.trim() || "-",
      };
    }

    return {
      companyName: fallbackCompanyName || "Company",
      location: category.trim() || "-",
    };
  }
}

async function detectJobsSchema(db: Pool): Promise<JobsSchemaInfo> {
  const preferredDatabase = process.env.JOBS_DATABASE?.trim();

  const [currentRows] = (await db.query("SELECT DATABASE() AS db_name")) as [CurrentDbRow[], unknown];
  const currentDatabase = currentRows[0]?.db_name;

  if (
    global.jobsSchemaCache &&
    currentDatabase &&
    global.jobsSchemaCache.databaseName !== currentDatabase
  ) {
    global.jobsSchemaCache = undefined;
  }

  if (global.jobsSchemaCache) {
    if (!preferredDatabase || preferredDatabase === global.jobsSchemaCache.databaseName) {
      return global.jobsSchemaCache;
    }
  }

  /**
   * Эхлээд холболтын default DB (ихэвчлэн MYSQL_DATABASE) — өгөгдөл энд байна.
   * JOBS_DATABASE-ийг түрүүлж тавих нь хоосон job_posts-той өөр schema руу уншуулах алдаатай.
   */
  const candidates: string[] = [];
  if (currentDatabase) {
    candidates.push(currentDatabase);
  }
  if (preferredDatabase && !candidates.includes(preferredDatabase)) {
    candidates.push(preferredDatabase);
  }

  for (const databaseName of candidates) {
    const [rows] = (await db.execute(
      `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME IN ('job_posts', 'job')
      `,
      [databaseName],
    )) as [TableRow[], unknown];

    const tableNames = new Set(rows.map((row) => row.TABLE_NAME));

    if (tableNames.has("job_posts")) {
      const result: JobsSchemaInfo = { schema: "zeel", databaseName };

      if (process.env.NODE_ENV !== "production") {
        global.jobsSchemaCache = result;
      }

      return result;
    }

    if (tableNames.has("job")) {
      const result: JobsSchemaInfo = { schema: "diplom", databaseName };

      if (process.env.NODE_ENV !== "production") {
        global.jobsSchemaCache = result;
      }

      return result;
    }
  }

  throw new Error("Could not find `job_posts` or `job` table in configured database.");
}

async function resolveZeelActorId(db: Pool, databaseName: string) {
  const usersTable = qualifiedTable(databaseName, "users");
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const [currentInDb] = (await db.execute(`SELECT id FROM ${usersTable} WHERE id = ? LIMIT 1`, [
      currentUser.id,
    ])) as [ZeelActorRow[], unknown];

    if (currentInDb.length > 0) {
      return currentUser.id;
    }
  }

  const [existing] = (await db.query(`SELECT id FROM ${usersTable} ORDER BY id ASC LIMIT 1`)) as [
    ZeelActorRow[],
    unknown,
  ];

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [result] = (await db.execute(
    `
      INSERT INTO ${usersTable} (full_name, phone, email, password_hash)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
    `,
    ["System User", "00000000", "system@zeel.local", "system-hash"],
  )) as [ResultSetHeader, unknown];

  return Number(result.insertId);
}

async function resolveDiplomActorId(db: Pool, databaseName: string) {
  const userTable = qualifiedTable(databaseName, "user");

  const [existing] = (await db.query(`SELECT id FROM ${userTable} ORDER BY createdAt ASC LIMIT 1`)) as [
    DiplomActorRow[],
    unknown,
  ];

  if (existing.length > 0) {
    return existing[0].id;
  }

  const systemEmail = "system@c-work.local";
  const [systemUser] = (await db.execute(`SELECT id FROM ${userTable} WHERE email = ? LIMIT 1`, [
    systemEmail,
  ])) as [DiplomActorRow[], unknown];

  if (systemUser.length > 0) {
    return systemUser[0].id;
  }

  const id = randomUUID();

  await db.execute(
    `
      INSERT INTO ${userTable} (id, name, email, password, role, createdAt)
      VALUES (?, ?, ?, ?, ?, NOW(3))
    `,
    [id, "System User", systemEmail, "system-password", "EMPLOYER"],
  );

  return id;
}

export async function listJobs(): Promise<StoredJob[]> {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema === "zeel") {
    const jobsTable = qualifiedTable(info.databaseName, "job_posts");
    const usersTable = qualifiedTable(info.databaseName, "users");
    const applicationsTable = qualifiedTable(info.databaseName, "job_applications");
    const companyProfilesTable = qualifiedTable(info.databaseName, "company_profiles");
    const subsTable = qualifiedTable(info.databaseName, "user_subscriptions");

    const applicantCountSql = `
          (
            SELECT COUNT(*)
            FROM ${applicationsTable} ja
            WHERE ja.job_id COLLATE utf8mb4_unicode_ci = CAST(j.id AS CHAR) COLLATE utf8mb4_unicode_ci
          ) AS applicant_count,`;

    const buildZeelJobsSql = (withApplicantCount: boolean) => `
        SELECT
          j.id,
          j.created_by,
          j.title,
          j.company_name,
          j.location,
          j.employment_type,
          j.salary,
          j.description,
          j.created_at,
          u.full_name AS created_by_name,
          IFNULL(u.avatar_url, '') AS created_by_avatar_url,
          ${withApplicantCount ? applicantCountSql : "0 AS applicant_count,"}
          (
            SELECT cp.website
            FROM ${companyProfilesTable} cp
            WHERE cp.user_id = j.created_by
               OR LOWER(TRIM(cp.company_name)) = LOWER(TRIM(j.company_name))
            ORDER BY CASE WHEN cp.user_id = j.created_by THEN 0 ELSE 1 END
            LIMIT 1
          ) AS company_website,
          (
            SELECT cp.user_id
            FROM ${companyProfilesTable} cp
            WHERE cp.user_id = j.created_by
               OR LOWER(TRIM(cp.company_name)) = LOWER(TRIM(j.company_name))
            ORDER BY CASE WHEN cp.user_id = j.created_by THEN 0 ELSE 1 END
            LIMIT 1
          ) AS company_profile_user_id,
          (
            SELECT IFNULL(cp.logo_url, '')
            FROM ${companyProfilesTable} cp
            WHERE cp.user_id = j.created_by
               OR LOWER(TRIM(cp.company_name)) = LOWER(TRIM(j.company_name))
            ORDER BY CASE WHEN cp.user_id = j.created_by THEN 0 ELSE 1 END
            LIMIT 1
          ) AS company_logo_url,
          (
            SELECT IFNULL(cp.banner_url, '')
            FROM ${companyProfilesTable} cp
            WHERE cp.user_id = j.created_by
               OR LOWER(TRIM(cp.company_name)) = LOWER(TRIM(j.company_name))
            ORDER BY CASE WHEN cp.user_id = j.created_by THEN 0 ELSE 1 END
            LIMIT 1
          ) AS company_banner_url,
          (
            CASE LOWER(IFNULL(us.plan_key, ''))
              WHEN 'premium' THEN 100
              WHEN 'pro' THEN 100
              WHEN 'standard' THEN 50
              WHEN 'business' THEN 50
              WHEN 'basic' THEN 10
              ELSE 10
            END
          ) AS boost_score
        FROM ${jobsTable} j
        LEFT JOIN ${usersTable} u ON u.id = j.created_by
        LEFT JOIN ${subsTable} us ON us.user_id = j.created_by
        ORDER BY boost_score DESC, j.created_at DESC
      `;

    let rows: (ZeelJobRow & { boost_score?: number; applicant_count?: number })[];

    try {
      [rows] = (await db.query(buildZeelJobsSql(true))) as [
        (ZeelJobRow & { boost_score?: number; applicant_count?: number })[],
        unknown,
      ];
    } catch (error) {
      console.error("[listJobs] applicant count query failed, falling back:", error);
      [rows] = (await db.query(buildZeelJobsSql(false))) as [
        (ZeelJobRow & { boost_score?: number; applicant_count?: number })[],
        unknown,
      ];
    }

    return rows.map((row) => ({
      id: String(row.id),
      title: fixMojibake(row.title),
      companyName: fixMojibake(row.company_name),
      location: fixMojibake(row.location),
      employmentType: fixMojibake(row.employment_type),
      salary: fixMojibake(row.salary),
      description: fixMojibake(row.description),
      createdAt: toIsoString(row.created_at),
      createdByName: row.created_by_name ? fixMojibake(row.created_by_name) : null,
      createdByUserId: row.created_by,
      createdByAvatarUrl: row.created_by_avatar_url?.trim() || null,
      companyDomain: websiteToDomain(row.company_website ?? ""),
      companyProfileUserId: row.company_profile_user_id ?? null,
      companyLogoUrl: row.company_logo_url?.trim() || null,
      companyBannerUrl: row.company_banner_url?.trim() || null,
      applicantCount: Number(row.applicant_count ?? 0),
    }));
  }

  const jobsTable = qualifiedTable(info.databaseName, "job");
  const userTable = qualifiedTable(info.databaseName, "user");

  const [rows] = (await db.query(
    `
      SELECT
        j.id,
        j.title,
        j.description,
        j.budget,
        j.category,
        j.status,
        j.createdAt,
        u.name AS created_by_name
      FROM ${jobsTable} j
      LEFT JOIN ${userTable} u ON u.id = j.employerId
      ORDER BY j.createdAt DESC
    `,
  )) as [DiplomJobRow[], unknown];

  return rows.map((row) => {
    const decodedCategory = decodeDiplomCategory(row.category, row.created_by_name);

    return {
      id: row.id,
      title: fixMojibake(row.title),
      companyName: fixMojibake(decodedCategory.companyName),
      location: fixMojibake(decodedCategory.location),
      employmentType: fixMojibake(row.status || "open"),
      salary: fixMojibake(formatBudget(row.budget)),
      description: fixMojibake(row.description),
      createdAt: toIsoString(row.createdAt),
      createdByName: row.created_by_name ? fixMojibake(row.created_by_name) : null,
      createdByUserId: null,
      createdByAvatarUrl: null,
      companyDomain: null,
      companyProfileUserId: null,
      companyLogoUrl: null,
      companyBannerUrl: null,
      applicantCount: 0,
    };
  });
}

export async function getJobOwnerUserId(jobId: string) {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema !== "zeel") {
    return null;
  }

  const jobsTable = qualifiedTable(info.databaseName, "job_posts");
  const [rows] = (await db.execute(`SELECT created_by FROM ${jobsTable} WHERE id = ? LIMIT 1`, [jobId])) as [
    { created_by: number }[],
    unknown,
  ];

  return rows[0]?.created_by ?? null;
}

/** Компанийн идэвхтэй зарын тоо — subscription хязгаар шалгахад. */
export async function countActiveJobsForUser(userId: number): Promise<number> {
  const db = getDb();
  const info = await detectJobsSchema(db);
  if (info.schema !== "zeel") {
    return 0;
  }
  const jobsTable = qualifiedTable(info.databaseName, "job_posts");
  const [rows] = (await db.execute(
    `SELECT COUNT(*) AS c FROM ${jobsTable} WHERE created_by = ?`,
    [userId],
  )) as [{ c: number }[], unknown];
  return Number(rows[0]?.c ?? 0);
}

export async function createJob(input: JobPayload, opts?: { createdByUserId?: number }) {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema === "zeel") {
    const actorId =
      typeof opts?.createdByUserId === "number" && Number.isFinite(opts.createdByUserId)
        ? opts.createdByUserId
        : await resolveZeelActorId(db, info.databaseName);
    const jobsTable = qualifiedTable(info.databaseName, "job_posts");

    await db.execute(
      `
        INSERT INTO ${jobsTable}
          (created_by, title, company_name, location, employment_type, salary, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        actorId,
        input.title.trim(),
        input.companyName.trim(),
        input.location.trim(),
        input.employmentType.trim(),
        input.salary.trim(),
        input.description.trim(),
      ],
    );

    return;
  }

  const actorId = await resolveDiplomActorId(db, info.databaseName);
  const jobsTable = qualifiedTable(info.databaseName, "job");

  await db.execute(
    `
      INSERT INTO ${jobsTable}
        (id, employerId, title, description, budget, category, deadline, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
    `,
    [
      randomUUID(),
      actorId,
      input.title.trim(),
      input.description.trim(),
      parseBudgetFromSalary(input.salary),
      encodeDiplomCategory(input.companyName.trim(), input.location.trim()),
      null,
      input.employmentType.trim() || "open",
    ],
  );
}

export async function updateJob(jobId: string, input: JobPayload) {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema === "zeel") {
    const jobsTable = qualifiedTable(info.databaseName, "job_posts");

    const [result] = (await db.execute(
      `
        UPDATE ${jobsTable}
        SET
          title = ?,
          company_name = ?,
          location = ?,
          employment_type = ?,
          salary = ?,
          description = ?
        WHERE id = ?
      `,
      [
        input.title.trim(),
        input.companyName.trim(),
        input.location.trim(),
        input.employmentType.trim(),
        input.salary.trim(),
        input.description.trim(),
        jobId,
      ],
    )) as [ResultSetHeader, unknown];

    return result.affectedRows > 0;
  }

  const jobsTable = qualifiedTable(info.databaseName, "job");

  const [result] = (await db.execute(
    `
      UPDATE ${jobsTable}
      SET
        title = ?,
        description = ?,
        budget = ?,
        category = ?,
        status = ?,
        updatedAt = NOW(3)
      WHERE id = ?
    `,
    [
      input.title.trim(),
      input.description.trim(),
      parseBudgetFromSalary(input.salary),
      encodeDiplomCategory(input.companyName.trim(), input.location.trim()),
      input.employmentType.trim() || "open",
      jobId,
    ],
  )) as [ResultSetHeader, unknown];

  return result.affectedRows > 0;
}

export async function deleteJob(jobId: string) {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema === "zeel") {
    const jobsTable = qualifiedTable(info.databaseName, "job_posts");
    const [result] = (await db.execute(`DELETE FROM ${jobsTable} WHERE id = ?`, [jobId])) as [
      ResultSetHeader,
      unknown,
    ];

    return result.affectedRows > 0;
  }

  const jobsTable = qualifiedTable(info.databaseName, "job");
  const [result] = (await db.execute(`DELETE FROM ${jobsTable} WHERE id = ?`, [jobId])) as [
    ResultSetHeader,
    unknown,
  ];

  return result.affectedRows > 0;
}
