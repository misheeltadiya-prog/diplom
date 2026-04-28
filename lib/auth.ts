import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const SESSION_COOKIE = "zeel_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 7);

export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: Date;
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

function mapUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at.toISOString(),
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
    const [rows] = (await db.execute(
      `
        SELECT u.id, u.full_name, u.email, u.phone, u.created_at
        FROM user_sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW()
        LIMIT 1
      `,
      [sessionToken],
    )) as [UserRow[], unknown];

    if (rows.length === 0) {
      return null;
    }

    return mapUser(rows[0]);
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.execute(
    `
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `,
    [userId, token, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
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
