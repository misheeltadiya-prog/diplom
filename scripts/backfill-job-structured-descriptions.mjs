/**
 * DB-д хадгалагдсан энгийн (【гүй) job_posts.description-ийг 6 хэсэгтэй формат болгон шинэчилнэ.
 * Аль хэдийн 【】-ээр эхэлсэн мөрийг алгасна.
 *
 * Ашиглалт: node scripts/backfill-job-structured-descriptions.mjs
 * MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (.env.local / .env)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const STRUCTURED_JOB_SECTION_LABELS = [
  "1. Хийж гүйцэтгэх үүрэг",
  "2. Тавигдах шаардлага",
  "3. Нэмэлт мэдээлэл",
  "4. Шаардлагатай ур чадвар",
  "5. Хангамж, урамшуулал",
  "6. Холбоо барих",
];

function parseEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

async function loadEnvFiles(root) {
  for (const name of [".env.local", ".env"]) {
    try {
      const rawText = await fs.readFile(path.join(root, name), "utf8");
      const parsed = parseEnv(rawText);
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined || process.env[k] === "") {
          process.env[k] = v;
        }
      }
    } catch {
      /* ignore */
    }
  }
}

function buildStructuredJobDescription(sections) {
  return STRUCTURED_JOB_SECTION_LABELS.map((label, i) => {
    const body = (sections[i] ?? "").trim();
    return `【${label}】\n${body}`;
  }).join("\n\n");
}

function syntheticSectionBodiesForJob(row) {
  const legacy = (row.description ?? "").trim();
  const hasStructured = legacy.startsWith("【");
  const sec1 =
    !hasStructured && legacy.length > 0
      ? legacy
      : hasStructured
        ? ""
        : `«${row.title}» албан тушаалын хүрээнд үндсэн даалгавар, өдөр тутмын гүйцэтгэлийг тодорхойлно. Үүрэг даалгавар, үр дүнтэй холбоотой ажлыг гүйцэтгэнэ.`;

  if (hasStructured) {
    return Array.from({ length: 6 }, () => "");
  }

  return [
    sec1,
    `Тавигдах шаардлага: ${row.company_name}-д тохирох боловсрол, мэргэжлийн түвшин; холбогдох чиглэлээр сурсан, холбогдох ажлын туршлагад давуу эрх өгнө. Жишээ: тодорхой сургууль, салбарт ажилласан туршлага.`,
    `Нэмэлт мэдээлэл: албан байршил ${row.location}, ажлын төрөл ${row.employment_type}. Ажлын цаг, ээлж, оффис / remote нөхцлийг компаниас тодруулна.`,
    `Шаардлагатай ур чадвар: энэ албан тушаалд шаардлагатай техникийн ур чадвар, хэл, хэрэгсэл; мөн хамтын ажиллагаа, харилцааны чадвар.`,
    `Хангамж, урамшуулал: жишээ нь хоолны мөнгө (12 000 ₮), унааны мөнгө (8 000 ₮) гэх мэт; сургалт, эрүүл мэндийн даатгал зэргийг компанийн бодлогоос.`,
    `Холбоо барих: ${row.company_name} — өргөдөл илгээсний дараа HR эсвэл зар оруулагчтай холбогдоно. Холбоо барих мэдээллийг зарын сурталчилгаанаас үзнэ үү.`,
  ];
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

await loadEnvFiles(root);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? "3306"),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "",
});

const [rows] = await pool.query(
  "SELECT id, title, company_name, location, employment_type, salary, description FROM job_posts WHERE description IS NOT NULL AND TRIM(description) <> ''",
);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const desc = String(row.description ?? "").trim();
  if (desc.startsWith("【")) {
    skipped += 1;
    continue;
  }
  const bodies = syntheticSectionBodiesForJob(row);
  const newDesc = buildStructuredJobDescription(bodies);
  await pool.query("UPDATE job_posts SET description = ? WHERE id = ?", [newDesc, row.id]);
  updated += 1;
}

await pool.end();

console.log(`backfill-job-structured-descriptions: updated=${updated}, skipped_already_structured=${skipped}`);
