import mysql from "mysql2/promise";
import { mysqlBaseOptions } from "@/lib/mysql-connect-options";

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is missing.`);
  }

  return value;
}

export function getDb() {
  if (global.mysqlPool) {
    return global.mysqlPool;
  }

  const pool = mysql.createPool({
    ...mysqlBaseOptions(requireEnv("MYSQL_DATABASE")),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  global.mysqlPool = pool;

  return pool;
}
