/** Aiven / cloud MySQL — `.env` дээр `MYSQL_SSL=1` */
export function mysqlSslOptions() {
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

export function mysqlBaseOptions(database) {
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    ...(database ? { database } : {}),
    charset: "utf8mb4",
    ...mysqlSslOptions(),
  };
}
