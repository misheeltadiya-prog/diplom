import type { CompanyBase } from "@/components/index-landing/companies-directory";
import { getDb } from "@/lib/db";
import { websiteToDomain } from "@/lib/website-domain";
import { fixMojibakeMaybe } from "@/lib/text-normalize";

type CompanyRow = {
  user_id: number;
  company_name: string;
  industry: string;
  website: string;
  description: string;
  city?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
};

function mapRowToCompany(row: CompanyRow): CompanyBase {
  const website = fixMojibakeMaybe(row.website).trim();
  const bannerUrl = fixMojibakeMaybe(row.banner_url ?? "").trim();
  const logoUrl = fixMojibakeMaybe(row.logo_url ?? "").trim();
  return {
    name: fixMojibakeMaybe(row.company_name).trim(),
    domain: websiteToDomain(website),
    industry: fixMojibakeMaybe(row.industry).trim() || "Компани",
    city: fixMojibakeMaybe(row.city ?? "").trim() || "Ulaanbaatar",
    description: fixMojibakeMaybe(row.description).trim() || undefined,
    isRegistered: true,
    userId: row.user_id,
    websiteRaw: website || undefined,
    bannerUrl: bannerUrl || undefined,
    logoUrl: logoUrl || undefined,
  };
}

async function fetchRegisteredCompanies(): Promise<CompanyBase[]> {
  try {
    const db = getDb();
    try {
      const [rows] = (await db.execute(
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description,
                IFNULL(cp.city, '') AS city,
                IFNULL(cp.banner_url, '') AS banner_url,
                IFNULL(cp.logo_url, '') AS logo_url
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
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description,
                IFNULL(cp.city, '') AS city
         FROM company_profiles cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'company'
         WHERE TRIM(cp.company_name) <> ''
         ORDER BY cp.updated_at DESC`,
      )) as [CompanyRow[], unknown];
      return rows.map((r) => mapRowToCompany({ ...r, banner_url: "", logo_url: "" }));
    }
  } catch (error) {
    console.error("[company-directory] fetchRegisteredCompanies failed:", error);
    return [];
  }
}

/** Зөвхөн MySQL `company_profiles` — статик seed жагсаалтгүй. */
export async function getMergedCompaniesForDirectory(): Promise<CompanyBase[]> {
  return fetchRegisteredCompanies();
}

export async function getCompanyProfileByUserId(userId: number): Promise<CompanyBase | null> {
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  try {
    const db = getDb();
    try {
      const [rows] = (await db.execute(
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description,
                IFNULL(cp.city, '') AS city,
                IFNULL(cp.banner_url, '') AS banner_url,
                IFNULL(cp.logo_url, '') AS logo_url
         FROM company_profiles cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'company'
         WHERE cp.user_id = ? AND TRIM(cp.company_name) <> ''
         LIMIT 1`,
        [userId],
      )) as [CompanyRow[], unknown];
      return rows[0] ? mapRowToCompany(rows[0]) : null;
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      const [rows] = (await db.execute(
        `SELECT cp.user_id, cp.company_name, cp.industry, cp.website, cp.description,
                IFNULL(cp.city, '') AS city
         FROM company_profiles cp
         INNER JOIN users u ON u.id = cp.user_id AND u.role = 'company'
         WHERE cp.user_id = ? AND TRIM(cp.company_name) <> ''
         LIMIT 1`,
        [userId],
      )) as [CompanyRow[], unknown];
      return rows[0] ? mapRowToCompany({ ...rows[0], banner_url: "", logo_url: "" }) : null;
    }
  } catch (error) {
    console.error("[company-directory] getCompanyProfileByUserId failed:", error);
    return null;
  }
}

export async function getDirectoryCompanyCount(): Promise<number> {
  const merged = await getMergedCompaniesForDirectory();
  return merged.length;
}
