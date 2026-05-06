import { randomBytes, scryptSync } from "crypto";
import mysql from "mysql2/promise";

const password = process.argv[2]?.trim();
if (!password) {
  console.error("Usage: node scripts/reset-role-passwords.mjs <newPassword>");
  process.exit(1);
}

const db = await mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE ?? "zeel_platform",
  charset: "utf8mb4",
});

const [users] = await db.execute(
  "SELECT id, full_name, email, role FROM users WHERE role IN ('freelancer','company') ORDER BY role, id",
);

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const passwordHash = `${salt}:${hash}`;

await db.execute(
  "UPDATE users SET password_hash = ? WHERE role IN ('freelancer','company')",
  [passwordHash],
);

console.log(JSON.stringify({ ok: true, updated: users.length, password, users }, null, 2));
await db.end();

