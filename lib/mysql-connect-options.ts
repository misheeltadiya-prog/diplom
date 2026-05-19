import type { PoolOptions } from "mysql2/promise";

/** Aiven / cloud MySQL — `.env` дээр `MYSQL_SSL=1` (CA шаардвал `MYSQL_SSL_CA`). */
export function mysqlSslOptions(): Pick<PoolOptions, "ssl"> | Record<string, never> {
  const on = process.env.MYSQL_SSL === "1" || process.env.MYSQL_SSL === "true";
  if (!on) return {};

  const ca = process.env.MYSQL_SSL_CA?.trim();
  if (ca) {
    return {
      ssl: {
        rejectUnauthorized: true,
        ca: ca.replace(/\\n/g, "\n"),
      },
    };
  }

  return { ssl: { rejectUnauthorized: true } };
}

export function mysqlBaseOptions(database?: string) {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const password = process.env.MYSQL_PASSWORD;
  if (!host || !user || password === undefined || password === "") {
    throw new Error("MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD environment variables are required.");
  }

  return {
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password,
    ...(database ? { database } : {}),
    charset: "utf8mb4" as const,
    ...mysqlSslOptions(),
  };
}
