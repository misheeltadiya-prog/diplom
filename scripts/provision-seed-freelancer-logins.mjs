import { randomBytes, scryptSync } from "crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

function parseEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

async function loadEnv(root) {
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(root, name), "utf8");
      const parsed = parseEnv(raw);
      for (const [k, v] of Object.entries(parsed)) if (!process.env[k]) process.env[k] = v;
    } catch {
      // ignore
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
await loadEnv(root);

const password = (process.argv[2] || "Cwork#2026").trim();
const passwordHash = hashPassword(password);

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "zeel_platform",
  charset: "utf8mb4",
});

const [seedRows] = await conn.query(
  `SELECT id, full_name, role_title, short_description, detail_description, skills_json, price_label, rating, reviews_count, accent
   FROM job_seeker_profiles
   WHERE is_active = 1
   ORDER BY id ASC`,
);

const credentials = [];

for (const row of seedRows) {
  const seedId = Number(row.id);
  const email = `seed.freelancer${seedId}@cwork.local`;

  const [existing] = await conn.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  let userId;
  if (existing.length > 0) {
    userId = Number(existing[0].id);
    await conn.execute(
      "UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = 'freelancer' WHERE id = ?",
      [String(row.full_name), `99${String(100000 + seedId).slice(-6)}`, passwordHash, userId],
    );
  } else {
    const [ins] = await conn.execute(
      "INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'freelancer')",
      [String(row.full_name), `99${String(100000 + seedId).slice(-6)}`, email, passwordHash],
    );
    userId = Number(ins.insertId);
  }

  await conn.execute(
    `INSERT INTO freelancer_profiles
      (user_id, role_title, short_description, detail_description, skills_json, price_label, rating, reviews_count, accent, is_active, portfolio_json, listed_on_directory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '[]', 1)
     ON DUPLICATE KEY UPDATE
      role_title = VALUES(role_title),
      short_description = VALUES(short_description),
      detail_description = VALUES(detail_description),
      skills_json = VALUES(skills_json),
      price_label = VALUES(price_label),
      rating = VALUES(rating),
      reviews_count = VALUES(reviews_count),
      accent = VALUES(accent),
      is_active = 1,
      listed_on_directory = 1`,
    [
      userId,
      String(row.role_title ?? ""),
      String(row.short_description ?? ""),
      String(row.detail_description ?? ""),
      typeof row.skills_json === "string" ? row.skills_json : JSON.stringify(row.skills_json ?? []),
      String(row.price_label ?? ""),
      String(row.rating ?? "5.0"),
      String(row.reviews_count ?? "0"),
      String(row.accent ?? "lime"),
    ],
  );

  credentials.push({
    fullName: String(row.full_name),
    email,
    password,
    userId,
  });
}

await conn.end();
console.log(JSON.stringify({ ok: true, total: credentials.length, credentials }, null, 2));

