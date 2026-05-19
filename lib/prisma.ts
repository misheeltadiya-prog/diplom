import { PrismaClient } from "@prisma/client";

function buildDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) {
    return direct;
  }

  const host = process.env.MYSQL_HOST ?? "127.0.0.1";
  const port = process.env.MYSQL_PORT ?? "3306";
  const user = process.env.MYSQL_USER ?? "root";
  const password = process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.MYSQL_DATABASE ?? "zeel_platform";

  const enc = encodeURIComponent;
  return `mysql://${enc(user)}:${enc(password)}@${host}:${port}/${enc(database)}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: { url: buildDatabaseUrl() },
      },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await globalForPrisma.prisma?.$disconnect();
}
