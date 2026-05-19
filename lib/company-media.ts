import { getDb } from "@/lib/db";
import { deletePublicUpload } from "@/lib/file-upload";

export async function getCompanyMediaUrls(
  userId: number,
): Promise<{ bannerUrl: string; logoUrl: string }> {
  const db = getDb();
  try {
    const [rows] = (await db.execute(
      `SELECT IFNULL(banner_url, '') AS banner_url, IFNULL(logo_url, '') AS logo_url
       FROM company_profiles WHERE user_id = ? LIMIT 1`,
      [userId],
    )) as [{ banner_url: string; logo_url: string }[], unknown];
    const row = rows[0];
    return { bannerUrl: row?.banner_url?.trim() ?? "", logoUrl: row?.logo_url?.trim() ?? "" };
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ER_BAD_FIELD_ERROR") {
      return { bannerUrl: "", logoUrl: "" };
    }
    throw err;
  }
}

export async function replaceCompanyMediaUrl(
  userId: number,
  column: "banner_url" | "logo_url",
  nextUrl: string,
): Promise<void> {
  const db = getDb();
  const current = await getCompanyMediaUrls(userId);
  const oldUrl = column === "banner_url" ? current.bannerUrl : current.logoUrl;
  await db.execute(`UPDATE company_profiles SET ${column} = ? WHERE user_id = ?`, [nextUrl, userId]);
  if (oldUrl && oldUrl !== nextUrl) {
    await deletePublicUpload(oldUrl);
  }
}

export async function clearCompanyMediaUrl(
  userId: number,
  column: "banner_url" | "logo_url",
): Promise<void> {
  const current = await getCompanyMediaUrls(userId);
  const oldUrl = column === "banner_url" ? current.bannerUrl : current.logoUrl;
  const db = getDb();
  await db.execute(`UPDATE company_profiles SET ${column} = '' WHERE user_id = ?`, [userId]);
  await deletePublicUpload(oldUrl);
}
