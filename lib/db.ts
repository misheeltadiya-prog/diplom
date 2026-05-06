import mysql from "mysql2/promise";

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
    host: requireEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    /** Монгол кирилл, Unicode — буруу client charset-аас mojibake гарахгүй */
    charset: "utf8mb4",
  });

  global.mysqlPool = pool;

  return pool;
}
