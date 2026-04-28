import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";
import type { Pool } from "mysql2/promise";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

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
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  salary: string;
  description: string;
  created_at: Date | string;
  created_by_name: string | null;
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
  const numeric = rawSalary.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = Number(numeric);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
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

  if (global.jobsSchemaCache) {
    if (!preferredDatabase || preferredDatabase === global.jobsSchemaCache.databaseName) {
      return global.jobsSchemaCache;
    }
  }

  const [currentRows] = (await db.query("SELECT DATABASE() AS db_name")) as [CurrentDbRow[], unknown];
  const currentDatabase = currentRows[0]?.db_name;

  const candidates: string[] = [];

  if (preferredDatabase) {
    candidates.push(preferredDatabase);
  }

  if (currentDatabase && !candidates.includes(currentDatabase)) {
    candidates.push(currentDatabase);
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

    const [rows] = (await db.query(
      `
        SELECT
          j.id,
          j.title,
          j.company_name,
          j.location,
          j.employment_type,
          j.salary,
          j.description,
          j.created_at,
          u.full_name AS created_by_name
        FROM ${jobsTable} j
        LEFT JOIN ${usersTable} u ON u.id = j.created_by
        ORDER BY j.created_at DESC
      `,
    )) as [ZeelJobRow[], unknown];

    return rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      companyName: row.company_name,
      location: row.location,
      employmentType: row.employment_type,
      salary: row.salary,
      description: row.description,
      createdAt: toIsoString(row.created_at),
      createdByName: row.created_by_name,
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
      title: row.title,
      companyName: decodedCategory.companyName,
      location: decodedCategory.location,
      employmentType: row.status || "open",
      salary: formatBudget(row.budget),
      description: row.description,
      createdAt: toIsoString(row.createdAt),
      createdByName: row.created_by_name,
    };
  });
}

export async function createJob(input: JobPayload) {
  const db = getDb();
  const info = await detectJobsSchema(db);

  if (info.schema === "zeel") {
    const actorId = await resolveZeelActorId(db, info.databaseName);
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
