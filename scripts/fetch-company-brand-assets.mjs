/**
 * Компанийн бодит logo (Clearbit / favicon / вэбсайтын icon) болон
 * banner (og:image / screenshot) татаж local + DB-д хадгална.
 *
 * Ажиллуулах: npm run db:company-brands
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (compatible; CWorkBrandFetcher/1.0)";

function websiteToDomain(website) {
  const t = String(website ?? "").trim();
  if (!t) return "";
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return t.replace(/^https?:\/\//i, "").split("/")[0]?.trim() ?? "";
  }
}

function normalizeWebsiteHref(website) {
  const t = String(website ?? "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function resolveHref(baseUrl, href) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function extFromContentType(ct, fallback = "png") {
  const t = (ct ?? "").toLowerCase();
  if (t.includes("svg")) return "svg";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  if (t.includes("gif")) return "gif";
  if (t.includes("ico") || t.includes("x-icon")) return "png";
  if (t.includes("png")) return "png";
  return fallback;
}

async function fetchImageBuffer(url, minBytes = 180) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/*,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < minBytes) return null;
    return { buf, ext: extFromContentType(ct) };
  } catch {
    return null;
  }
}

async function discoverSiteAssets(websiteUrl) {
  const base = normalizeWebsiteHref(websiteUrl);
  if (!base) return { icons: [], ogImage: null };

  try {
    const res = await fetch(base, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { icons: [], ogImage: null };
    const html = await res.text();

    const icons = [];
    for (const tag of html.matchAll(/<link[^>]+>/gi)) {
      const link = tag[0];
      if (!/rel=["'][^"']*(?:apple-touch-icon|icon|shortcut icon)/i.test(link)) continue;
      const href = link.match(/href=["']([^"']+)["']/i)?.[1];
      const resolved = href ? resolveHref(base, href) : null;
      if (resolved) icons.push(resolved);
    }

    const og =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i)?.[1] ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

    return {
      icons,
      ogImage: og ? resolveHref(base, og) : null,
    };
  } catch {
    return { icons: [], ogImage: null };
  }
}

async function fetchLogo(domain, website) {
  const site = normalizeWebsiteHref(website);
  const candidates = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(`https://${domain}`)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];

  if (site) {
    const { icons } = await discoverSiteAssets(site);
    for (const icon of icons.slice(0, 6)) {
      candidates.push(icon);
    }
  }

  for (const url of candidates) {
    const hit = await fetchImageBuffer(url, 120);
    if (hit) return hit;
  }
  return null;
}

async function fetchBanner(domain, website, siteAssets) {
  if (siteAssets?.ogImage) {
    const og = await fetchImageBuffer(siteAssets.ogImage, 1200);
    if (og) return og;
  }

  const screenshot = await fetchImageBuffer(
    `https://image.thum.io/get/width/1200/crop/400/noanimate/https://${domain}`,
    2500,
  );
  if (screenshot) return screenshot;

  return null;
}

async function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const text = await fs.readFile(path.join(root, name), "utf8");
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i < 0) continue;
        const key = t.slice(0, i).trim();
        if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
      }
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  await loadEnv();
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "zeel_platform",
  });

  const [rows] = await db.execute(
    `SELECT user_id, company_name, industry, website
     FROM company_profiles
     WHERE TRIM(company_name) <> ''`,
  );

  let updated = 0;
  for (const row of rows) {
    const userId = row.user_id;
    const name = String(row.company_name ?? "").trim();
    const website = String(row.website ?? "").trim();
    const domain = websiteToDomain(website);
    if (!userId || !name || !domain || domain === "example.com") {
      console.log(`⊘ ${name || userId} — домэйн байхгүй`);
      continue;
    }

    const site = normalizeWebsiteHref(website);
    const siteAssets = site ? await discoverSiteAssets(site) : { icons: [], ogImage: null };

    const logo = await fetchLogo(domain, website);
    const banner = await fetchBanner(domain, website, siteAssets);

    if (!logo && !banner) {
      console.log(`⊘ ${name} — зураг олдсонгүй`);
      continue;
    }

    const dir = path.join(root, "public", "uploads", "companies", String(userId));
    await fs.mkdir(dir, { recursive: true });

    let logoUrl = "";
    let bannerUrl = "";

    if (logo) {
      const logoFile = `logo.${logo.ext}`;
      await fs.writeFile(path.join(dir, logoFile), logo.buf);
      try {
        await fs.unlink(path.join(dir, "logo.svg"));
      } catch {
        /* ignore */
      }
      logoUrl = `/uploads/companies/${userId}/${logoFile}`;
    }

    if (banner) {
      const bannerFile = `banner.${banner.ext}`;
      await fs.writeFile(path.join(dir, bannerFile), banner.buf);
      try {
        await fs.unlink(path.join(dir, "banner.svg"));
      } catch {
        /* ignore */
      }
      bannerUrl = `/uploads/companies/${userId}/${bannerFile}`;
    } else if (logoUrl) {
      bannerUrl = `https://image.thum.io/get/width/1600/crop/760/noanimate/https://${domain}`;
    }

    const [current] = await db.execute(
      `SELECT IFNULL(logo_url,'') AS logo_url, IFNULL(banner_url,'') AS banner_url FROM company_profiles WHERE user_id = ?`,
      [userId],
    );
    const prev = current[0] ?? { logo_url: "", banner_url: "" };
    const nextLogo = logoUrl || prev.logo_url;
    const nextBanner = bannerUrl || prev.banner_url;

    await db.execute(`UPDATE company_profiles SET logo_url = ?, banner_url = ? WHERE user_id = ?`, [
      nextLogo,
      nextBanner,
      userId,
    ]);

    updated += 1;
    console.log(`✓ ${name} — logo: ${logoUrl ? "тийм" : "үгүй"}, banner: ${bannerUrl ? "тийм" : "үгүй"}`);
  }

  await db.end();
  console.log(`\nДууслаа: ${updated} компани шинэчлэгдлээ.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
