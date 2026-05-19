/**
 * database/migrations доторх *.sql файлуудыг нэрээр эрэмбэлж нэг удаа ажиллуулна.
 * Ашиглалт: npm run db:migrate
 * MYSQL_* — .env.local эсвэл .env-аас автоматаар уншина (аль хэдийн export хийсэн бол түүнийг үлдээнэ).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { mysqlBaseOptions } from "./mysql-connect-env.mjs";

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
        if (process.env[k] === undefined || process.env[k] === "") {
          process.env[k] = v;
        }
      }
    } catch {
      /* ignore missing file */
    }
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `${name} байхгүй — төслийн үндсэн хавтас дээр .env.local үүсгээд MYSQL_* мөрүүдийг .env.example-ээс хуулна уу, эсвэл PowerShell-д: $env:MYSQL_HOST="127.0.0.1" гэх мэт.`,
    );
  }
  return v;
}

function isIgnorableMigrationError(err) {
  const code = String(err?.code ?? "");
  const msg = String(err?.sqlMessage ?? err?.message ?? "");
  return (
    code === "ER_NO_SUCH_TABLE" || // converting table that doesn't exist in this DB
    code === "ER_DUP_FIELDNAME" || // duplicate column
    code === "ER_DUP_KEYNAME" || // duplicate index
    code === "ER_CANT_DROP_FIELD_OR_KEY" || // drop missing
    msg.includes("Duplicate column name") ||
    msg.includes("Duplicate key name") ||
    msg.includes("Duplicate entry") // unique already exists in some cases
  );
}

function splitSqlStatements(sql) {
  // Simple SQL splitter that ignores semicolons inside single/double quotes.
  const out = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  let prev = "";
  for (const ch of sql) {
    if (ch === "'" && !inDouble && prev !== "\\") inSingle = !inSingle;
    if (ch === "\"" && !inSingle && prev !== "\\") inDouble = !inDouble;
    if (ch === ";" && !inSingle && !inDouble) {
      const trimmed = cur.trim();
      if (trimmed) out.push(trimmed);
      cur = "";
    } else {
      cur += ch;
    }
    prev = ch;
  }
  const trimmed = cur.trim();
  if (trimmed) out.push(trimmed);
  return out;
}

async function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  await loadEnvFiles(root);

  const migDir = path.join(root, "database", "migrations");
  const names = (await fs.readdir(migDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const conn = await mysql.createConnection({
    ...mysqlBaseOptions(requireEnv("MYSQL_DATABASE")),
    multipleStatements: false,
  });

  try {
    for (const name of names) {
      const full = path.join(migDir, name);
      const sql = await fs.readFile(full, "utf8");
      console.log("→", name);
      const statements = splitSqlStatements(sql);
      for (const stmt of statements) {
        try {
          await conn.query(stmt);
        } catch (err) {
          if (isIgnorableMigrationError(err)) {
            console.log("  ↳ skip:", String(err?.sqlMessage ?? err?.message ?? err));
            continue;
          }
          throw err;
        }
      }
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
