/**
 * database/migrations доторх *.sql файлуудыг нэрээр эрэмбэлж нэг удаа ажиллуулна.
 * Ашиглалт: node scripts/run-migrations.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} environment variable is missing.`);
  return v;
}

async function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const migDir = path.join(root, "database", "migrations");
  const names = (await fs.readdir(migDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const conn = await mysql.createConnection({
    host: requireEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    for (const name of names) {
      const full = path.join(migDir, name);
      const sql = await fs.readFile(full, "utf8");
      console.log("→", name);
      await conn.query(sql);
    }
    console.log("Done:", names.length, "files");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
