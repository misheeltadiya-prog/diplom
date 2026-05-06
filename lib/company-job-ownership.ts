import type { Pool } from "mysql2/promise";
import type { SessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type CompanyProfileRow = {
  company_name: string;
};

type CompanyUserRow = {
  id: number;
};

function normalizeCompanyName(value: string) {
  return value.trim().toLowerCase();
}

export function isCompanyNameMatch(companyName: string, identityNames: string[]) {
  const normalized = normalizeCompanyName(companyName);
  return normalized.length > 0 && identityNames.includes(normalized);
}

export async function getCompanyIdentityNames(user: Pick<SessionUser, "id" | "fullName" | "role">) {
  if (user.role !== "company") {
    return [] as string[];
  }

  const names = new Set<string>();
  const ownName = normalizeCompanyName(user.fullName ?? "");
  if (ownName) {
    names.add(ownName);
  }

  const db = getDb();
  try {
    const [rows] = (await db.execute(
      "SELECT company_name FROM company_profiles WHERE user_id = ? LIMIT 1",
      [user.id],
    )) as [CompanyProfileRow[], unknown];
    const profileName = normalizeCompanyName(rows[0]?.company_name ?? "");
    if (profileName) {
      names.add(profileName);
    }
  } catch {
    /* company profile is optional */
  }

  return [...names];
}

export function buildCompanyOwnedJobsClause(userId: number, identityNames: string[], alias = "j") {
  const params: Array<number | string> = [userId];
  const clauses = [`${alias}.created_by = ?`];

  if (identityNames.length > 0) {
    clauses.push(`LOWER(TRIM(${alias}.company_name)) IN (${identityNames.map(() => "?").join(", ")})`);
    params.push(...identityNames);
  }

  return {
    sql: `(${clauses.join(" OR ")})`,
    params,
  };
}

export async function findCompanyUserIdsByCompanyName(
  companyName: string,
  options?: { db?: Pool; excludeUserId?: number },
) {
  const normalized = normalizeCompanyName(companyName);
  if (!normalized) {
    return [] as number[];
  }

  const db = options?.db ?? getDb();
  const params: Array<number | string> = [normalized, normalized];
  let excludeSql = "";

  if (typeof options?.excludeUserId === "number") {
    excludeSql = " AND u.id <> ?";
    params.push(options.excludeUserId);
  }

  try {
    const [rows] = (await db.execute(
      `SELECT DISTINCT u.id
       FROM users u
       LEFT JOIN company_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'company'
         AND (
           LOWER(TRIM(u.full_name)) = ?
           OR LOWER(TRIM(IFNULL(cp.company_name, ''))) = ?
         )${excludeSql}
       ORDER BY u.id ASC`,
      params,
    )) as [CompanyUserRow[], unknown];

    return rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}
