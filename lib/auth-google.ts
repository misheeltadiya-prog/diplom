import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { GoogleProfile } from "@/lib/google-oauth";

type UserLookupRow = {
  id: number;
  role?: string | null;
  google_id?: string | null;
  avatar_url?: string | null;
};

function normalizeRole(raw: string | null | undefined): "client" | "freelancer" | "company" | "admin" {
  if (raw === "freelancer" || raw === "admin" || raw === "company") return raw;
  return "client";
}

function checkRoleIntent(
  roleOut: "client" | "freelancer" | "company" | "admin",
  intentRole?: "company" | "freelancer",
): { ok: true } | { ok: false; code: "ROLE_INTENT_MISMATCH" } {
  if (!intentRole) return { ok: true };
  if (intentRole === "company" && roleOut !== "company" && roleOut !== "admin") {
    return { ok: false, code: "ROLE_INTENT_MISMATCH" };
  }
  if (intentRole === "freelancer" && roleOut !== "freelancer" && roleOut !== "admin") {
    return { ok: false, code: "ROLE_INTENT_MISMATCH" };
  }
  return { ok: true };
}

async function selectUserByGoogleId(googleId: string): Promise<UserLookupRow | null> {
  const db = getDb();
  try {
    const [rows] = (await db.execute(
      `SELECT id, role, google_id, IFNULL(avatar_url, '') AS avatar_url FROM users WHERE google_id = ? LIMIT 1`,
      [googleId],
    )) as [UserLookupRow[], unknown];
    return rows[0] ?? null;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ER_BAD_FIELD_ERROR") {
      throw new Error("GOOGLE_ID_COLUMN_MISSING");
    }
    throw err;
  }
}

async function selectUserByEmail(email: string): Promise<UserLookupRow | null> {
  const db = getDb();
  try {
    const [rows] = (await db.execute(
      `SELECT id, role, google_id, IFNULL(avatar_url, '') AS avatar_url FROM users WHERE email = ? LIMIT 1`,
      [email],
    )) as [UserLookupRow[], unknown];
    return rows[0] ?? null;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ER_BAD_FIELD_ERROR") {
      const [rows] = (await db.execute(`SELECT id, role FROM users WHERE email = ? LIMIT 1`, [email])) as [
        UserLookupRow[],
        unknown,
      ];
      return rows[0] ?? null;
    }
    throw err;
  }
}

async function linkGoogleId(userId: number, googleId: string, picture?: string) {
  const db = getDb();
  await db.execute(`UPDATE users SET google_id = ? WHERE id = ?`, [googleId, userId]);
  if (picture?.trim()) {
    try {
      await db.execute(
        `UPDATE users SET avatar_url = ? WHERE id = ? AND (avatar_url IS NULL OR avatar_url = '')`,
        [picture.trim(), userId],
      );
    } catch {
      /* avatar_url optional */
    }
  }
}

async function createGoogleUser(
  profile: GoogleProfile,
  role: "client" | "freelancer" | "company",
): Promise<number> {
  const db = getDb();
  const passwordHash = hashPassword(randomBytes(32).toString("hex"));
  const phone = "";

  try {
    const [result] = (await db.execute(
      `
        INSERT INTO users (full_name, phone, email, google_id, password_hash, role, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [profile.name, phone, profile.email, profile.sub, passwordHash, role],
    )) as [{ insertId: number }, unknown];
    const userId = result.insertId;
    if (profile.picture?.trim()) {
      try {
        await db.execute(`UPDATE users SET avatar_url = ? WHERE id = ?`, [profile.picture.trim(), userId]);
      } catch {
        /* ignore */
      }
    }
    return userId;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "ER_BAD_FIELD_ERROR") {
      try {
        const [result] = (await db.execute(
          `INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [profile.name, phone, profile.email, passwordHash, role],
        )) as [{ insertId: number }, unknown];
        return result.insertId;
      } catch {
        throw new Error("GOOGLE_ID_COLUMN_MISSING");
      }
    }
    throw err;
  }
}

export async function resolveGoogleLogin(
  profile: GoogleProfile,
  intentRole?: "company" | "freelancer",
): Promise<
  | {
      ok: true;
      userId: number;
      role: "client" | "freelancer" | "company" | "admin";
      isNewUser: boolean;
    }
  | { ok: false; code: "ROLE_INTENT_MISMATCH" | "GOOGLE_ID_COLUMN_MISSING" | "EMAIL_REQUIRED" }
> {
  if (!profile.email?.trim()) {
    return { ok: false, code: "EMAIL_REQUIRED" };
  }

  let user = await selectUserByGoogleId(profile.sub);

  if (!user) {
    user = await selectUserByEmail(profile.email);
    if (user) {
      await linkGoogleId(user.id, profile.sub, profile.picture);
    }
  }

  if (user) {
    const roleOut = normalizeRole(user.role);
    const intentCheck = checkRoleIntent(roleOut, intentRole);
    if (!intentCheck.ok) {
      return { ok: false, code: intentCheck.code };
    }
    return { ok: true, userId: user.id, role: roleOut, isNewUser: false };
  }

  const newRole =
    intentRole === "freelancer" ? "freelancer" : intentRole === "company" ? "company" : "client";
  const userId = await createGoogleUser(profile, newRole);
  return { ok: true, userId, role: newRole, isNewUser: true };
}
