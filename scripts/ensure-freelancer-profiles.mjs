/**
 * freelancer_profiles хүснэгт байхгүй эсвэл portfolio багана дутуу бол засна.
 *   npm run db:freelancer
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
  if (!value) throw new Error(`${name} байхгүй (.env.local)`);
  return value;
}

async function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  await loadEnvFiles(root);

  const conn = await mysql.createConnection({
    host: requireEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? "3306"),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
    multipleStatements: true,
  });

  try {
    /* TEXT баганад DEFAULT өгөх нь MySQL strict горимд алдаа өгч болно — JSON-тэй талбаруудыг VARCHAR-аар */
    await conn.query(`
      CREATE TABLE IF NOT EXISTS freelancer_profiles (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        role_title VARCHAR(180) NOT NULL DEFAULT '',
        short_description VARCHAR(600) NOT NULL DEFAULT '',
        detail_description MEDIUMTEXT NOT NULL,
        skills_json VARCHAR(8000) NOT NULL DEFAULT '[]',
        price_label VARCHAR(80) NOT NULL DEFAULT '',
        rating VARCHAR(8) NOT NULL DEFAULT '5.0',
        reviews_count VARCHAR(12) NOT NULL DEFAULT '0',
        accent VARCHAR(12) NOT NULL DEFAULT 'lime',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        portfolio_json MEDIUMTEXT NOT NULL,
        listed_on_directory TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY freelancer_profiles_user_unique (user_id),
        CONSTRAINT freelancer_profiles_user_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE
      )
    `);
    console.log("OK: freelancer_profiles хүснэгт бэлэн.");

    for (const [sql, label] of [
      /* TEXT + DEFAULT — зарим MySQL-д хориотой; DEFAULTгүй */
      [
        "ALTER TABLE freelancer_profiles ADD COLUMN portfolio_json MEDIUMTEXT NOT NULL",
        "portfolio_json",
      ],
      [
        "ALTER TABLE freelancer_profiles ADD COLUMN listed_on_directory TINYINT(1) NOT NULL DEFAULT 0",
        "listed_on_directory",
      ],
    ]) {
      try {
        await conn.query(sql);
        console.log(`OK: ${label} нэмэгдлээ.`);
      } catch (e) {
        if (String(e.message).includes("Duplicate column")) {
          console.log(`${label} аль хэдийн байна.`);
        } else {
          throw e;
        }
      }
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Алдаа:", err.message);
  process.exitCode = 1;
});
