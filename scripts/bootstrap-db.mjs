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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is missing.`);
  }
  return value;
}

async function runSqlFile(conn, filePath) {
  const sql = await fs.readFile(filePath, "utf8");
  await conn.query(sql);
}

async function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const schemaPath = path.join(root, "database", "schema.sql");
  const seedPath = path.join(root, "database", "workbench-seed.sql");
  const envPath = path.join(root, ".env.local");

  try {
    const rawEnv = await fs.readFile(envPath, "utf8");
    const parsed = parseEnv(rawEnv);
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  } catch {
    // If .env.local is missing, use already exported shell env.
  }

  const connection = await mysql.createConnection({
    host: requireEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? "3306"),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    multipleStatements: true,
  });

  try {
    await runSqlFile(connection, schemaPath);
    await runSqlFile(connection, seedPath);
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS total FROM zeel_platform.job_seeker_profiles WHERE is_active = 1",
    );
    const total = Number(rows?.[0]?.total ?? 0);
    console.log(`Database bootstrap complete. job_seeker_profiles: ${total} rows.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Failed to bootstrap database:", error.message);
  process.exitCode = 1;
});
