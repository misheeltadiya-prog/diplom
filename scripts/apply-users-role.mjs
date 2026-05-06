/**
 * users.role багана + ENUM нэмэх — Workbench-гүйгээр терминалаас.
 * Төслийн MySQL тохиргоо (.env.local эсвэл .env) ашиглана.
 *
 *   npm run db:role
 */

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
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

async function loadEnvFiles(root) {
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(root, name), "utf8");
      const parsed = parseEnv(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      /* ignore */
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} агуулаагүй байна — .env.local үүсгээд MYSQL_* бөглөнө үү (`.env.example` харна).`);
  }
  return value;
}

async function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  await loadEnvFiles(root);

  const host = requireEnv("MYSQL_HOST");
  const port = Number(process.env.MYSQL_PORT ?? "3306");
  const user = requireEnv("MYSQL_USER");
  const password = requireEnv("MYSQL_PASSWORD");
  const database = requireEnv("MYSQL_DATABASE");

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false,
  });

  try {
    const [[{ cnt }]] = await conn.query(
      `
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role'
      `,
      [database],
    );

    if (Number(cnt) === 0) {
      try {
        await conn.query(`
          ALTER TABLE users
            ADD COLUMN role ENUM('client', 'freelancer', 'company', 'admin')
            NOT NULL DEFAULT 'client'
            AFTER password_hash
        `);
        console.log("OK: role багана нэмэгдлээ (password_hash дараа).");
      } catch (e) {
        console.warn("AFTER password_hash алдаатай, AFTERгүйгээр дахин оролдож байна…", e.message);
        await conn.query(`
          ALTER TABLE users
            ADD COLUMN role ENUM('client', 'freelancer', 'company', 'admin')
            NOT NULL DEFAULT 'client'
        `);
        console.log("OK: role багана нэмэгдлээ (таблын төгсгөлд).");
      }
    } else {
      console.log("role багана аль хэдийн байна — ADD алгаслаа.");
    }

    await conn.query(`
      ALTER TABLE users
        MODIFY COLUMN role ENUM('client', 'freelancer', 'company', 'admin')
        NOT NULL DEFAULT 'client'
    `);
    console.log("OK: ENUM бүрэн болгосон (company орсон).");

    const [[col]] = await conn.query(`SHOW COLUMNS FROM users LIKE 'role'`);
    console.log("Шалгалт:", col);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Алдаа:", err.message);
  process.exitCode = 1;
});
