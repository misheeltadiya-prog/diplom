import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const SESSION_COOKIE = "zeel_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 7);

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "client" | "freelancer" | "company" | "admin";
  createdAt: string;
  avatarUrl?: string | null;
};

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role?: string | null;
  created_at: Date;
  avatar_url?: string | null;
};

function makePasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function hashPassword(password: string) {
  return makePasswordHash(password);
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (candidateHash.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, originalBuffer);
}

function normalizeRole(raw: string | null | undefined): SessionUser["role"] {
  if (raw === "freelancer" || raw === "admin" || raw === "company") {
    return raw;
  }
  return "client";
}

function mapUser(row: UserRow): SessionUser {
  const avatar = row.avatar_url?.trim();
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: normalizeRole(row.role),
    createdAt: row.created_at.toISOString(),
    avatarUrl: avatar ? avatar : null,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const db = getDb();
    let rows: UserRow[];
    try {
      const [r] = (await db.execute(
        `
          SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
                 IFNULL(u.avatar_url, '') AS avatar_url
          FROM user_sessions s
          INNER JOIN users u ON u.id = s.user_id
          WHERE s.session_token = ? AND s.expires_at > NOW()
          LIMIT 1
        `,
        [sessionToken],
      )) as [UserRow[], unknown];
      rows = r;
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      try {
        const [r] = (await db.execute(
          `
            SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at
            FROM user_sessions s
            INNER JOIN users u ON u.id = s.user_id
            WHERE s.session_token = ? AND s.expires_at > NOW()
            LIMIT 1
          `,
          [sessionToken],
        )) as [UserRow[], unknown];
        rows = r;
      } catch (err2: unknown) {
        if ((err2 as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
          throw err2;
        }
        const [r] = (await db.execute(
          `
            SELECT u.id, u.full_name, u.email, u.phone, u.created_at
            FROM user_sessions s
            INNER JOIN users u ON u.id = s.user_id
            WHERE s.session_token = ? AND s.expires_at > NOW()
            LIMIT 1
          `,
          [sessionToken],
        )) as [UserRow[], unknown];
        rows = r;
      }
    }

    if (rows.length === 0) {
      return null;
    }

    try {
      await db.execute(
        `UPDATE user_sessions
         SET expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY)
         WHERE session_token = ? AND expires_at > UTC_TIMESTAMP()`,
        [SESSION_DAYS, sessionToken],
      );
    } catch {
      /* session slide optional */
    }

    return mapUser(rows[0]);
  } catch {
    return null;
  }
}

const SESSION_COOKIE_OPTIONS = (expiresAt: Date) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires: expiresAt,
});

/** DB-д session үүсгээд token буцаана */
export async function issueSession(userId: number) {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.execute(
    `INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)`,
    [userId, token, expiresAt],
  );

  return { token, expiresAt };
}

/** Redirect response дээр session cookie (OAuth callback) */
export function applySessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS(expiresAt));
}

export async function createSession(userId: number) {
  const { token, expiresAt } = await issueSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS(expiresAt));
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      const db = getDb();
      await db.execute("DELETE FROM user_sessions WHERE session_token = ?", [sessionToken]);
    } catch {
      // Ignore session cleanup errors so logout can still clear the cookie.
    }
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
