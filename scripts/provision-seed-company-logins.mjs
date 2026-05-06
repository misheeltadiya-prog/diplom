import { randomBytes, scryptSync } from "crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const seedCompanies = [
  "AND Global",
  "Infinite Solutions",
  "Interactive LLC",
  "GrapeCity Mongolia",
  "Mongol iD",
  "Smart Logic",
  "Able Soft",
  "CallPro",
  "IT Zone",
  "Unitel Group",
  "Mobicom Corporation",
  "Skytel",
  "Datacom LLC",
  "Ard Financial Group",
  "LendMN",
  "QPay",
  "HiPay",
  "Erxes Inc",
  "Fibo Cloud",
  "Mezorn LLC",
];

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

const credentials = [];

for (let i = 0; i < seedCompanies.length; i += 1) {
  const companyName = seedCompanies[i];
  const idx = i + 1;
  const email = `seed.company${idx}@cwork.local`;

  const [existing] = await conn.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  let userId;
  if (existing.length > 0) {
    userId = Number(existing[0].id);
    await conn.execute(
      "UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = 'company' WHERE id = ?",
      [companyName, `88${String(100000 + idx).slice(-6)}`, passwordHash, userId],
    );
  } else {
    const [ins] = await conn.execute(
      "INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'company')",
      [companyName, `88${String(100000 + idx).slice(-6)}`, email, passwordHash],
    );
    userId = Number(ins.insertId);
  }

  credentials.push({
    companyName,
    email,
    password,
    userId,
  });
}

await conn.end();
console.log(JSON.stringify({ ok: true, total: credentials.length, credentials }, null, 2));

