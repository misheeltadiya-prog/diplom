import type { CompanyBase } from "@/components/index-landing/companies-directory";
import { getDb } from "@/lib/db";
import { websiteToDomain } from "@/lib/website-domain";

type CompanyRow = {
  user_id: number;
  company_name: string;
  industry: string;
  website: string;
  description: string;
  city?: string | null;
};

function mapRowToCompany(row: CompanyRow): CompanyBase {
  const website = (row.website ?? "").trim();
  return {
    name: row.company_name.trim(),
    domain: websiteToDomain(website),
    industry: (row.industry ?? "").trim() || "Компани",
    city: (row.city ?? "").trim() || "Ulaanbaatar",
    description: (row.description ?? "").trim() || undefined,
    isRegistered: true,
    userId: row.user_id,
    websiteRaw: website || undefined,
  };
}

async function fetchRegisteredCompanies(): Promise<CompanyBase[]> {
  try {
    const db = getDb();
    try {
      const [rows] = (await db.execute(
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description,
                IFNULL(cp.city, '') AS city
         FROM company_profiles cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'company'
         WHERE TRIM(cp.company_name) <> ''
         ORDER BY cp.updated_at DESC`,
      )) as [CompanyRow[], unknown];
      return rows.map(mapRowToCompany);
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      const [rows] = (await db.execute(
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description
         FROM company_profiles cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'company'
         WHERE TRIM(cp.company_name) <> ''
         ORDER BY cp.updated_at DESC`,
      )) as [Omit<CompanyRow, "city">[], unknown];
      return rows.map((r) => mapRowToCompany({ ...r, city: "" }));
    }
  } catch {
    return [];
  }
}

/** Зөвхөн MySQL `company_profiles` — статик seed жагсаалтгүй. */
export async function getMergedCompaniesForDirectory(): Promise<CompanyBase[]> {
  return fetchRegisteredCompanies();
}

export async function getDirectoryCompanyCount(): Promise<number> {
  const merged = await getMergedCompaniesForDirectory();
  return merged.length;
}
