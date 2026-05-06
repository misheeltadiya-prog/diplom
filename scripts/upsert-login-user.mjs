import { randomBytes, scryptSync } from "crypto";
import mysql from "mysql2/promise";

function readEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const role = (process.argv[2] || "").trim();
  const email = (process.argv[3] || "").trim().toLowerCase();
  const password = (process.argv[4] || "").trim();
  const fullName = (process.argv[5] || "").trim() || `Test ${role || "user"}`;
  const phone = (process.argv[6] || "").trim() || "99000000";

  if (!["freelancer", "company", "client", "admin"].includes(role)) {
    throw new Error("Role буруу. Ж: freelancer | company");
  }
  if (!email || !password) {
    throw new Error("Usage: node scripts/upsert-login-user.mjs <role> <email> <password> [fullName] [phone]");
  }

  const db = await mysql.createPool({
    host: readEnv("MYSQL_HOST"),
    port: Number(readEnv("MYSQL_PORT", "3306")),
    user: readEnv("MYSQL_USER"),
    password: readEnv("MYSQL_PASSWORD"),
    database: readEnv("MYSQL_DATABASE"),
    waitForConnections: true,
    connectionLimit: 4,
    charset: "utf8mb4",
  });

  const passwordHash = hashPassword(password);

  const [existing] = await db.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );

  if (Array.isArray(existing) && existing.length > 0) {
    const id = existing[0].id;
    await db.execute(
      "UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = ? WHERE id = ?",
      [fullName, phone, passwordHash, role, id],
    );
    console.log(JSON.stringify({ ok: true, action: "updated", id, role, email }));
  } else {
    const [result] = await db.execute(
      "INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [fullName, phone, email, passwordHash, role],
    );
    console.log(JSON.stringify({ ok: true, action: "created", id: result.insertId, role, email }));
  }

  await db.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

