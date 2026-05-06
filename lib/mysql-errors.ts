/** Хэрэглэгчид ойлгомжтой MySQL алдааны мессеж */
export function mysqlErrorToUserMessage(err: unknown): string {
  const e = err as { code?: string; errno?: number; sqlMessage?: string };
  if (e.code === "ER_NO_SUCH_TABLE") {
    return "Өгөгдлийн санд шаардлагатай хүснэгт байхгүй байна. .env дээрх MYSQL_DATABASE-д schema.sql (эсвэл migrations) ажиллуулсан эсэхийг шалгаад, хүснэгт job_applications, job_posts зэрэг үүссэн эсэхийг баталгаажуулна уу.";
  }
  if (e.code === "ER_BAD_FIELD_ERROR") {
    return "Өгөгдлийн сангийн бүтэц (багана) таарахгүй байна. Шинэ migration ажиллуулна уу.";
  }
  if (e.code === "WARN_DATA_TRUNCATED" || e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
    return "Өгөгдөл буруу эсвэл ENUM-д таны сонгосон role (company/freelancer) байхгүй байж магадгүй. users.role-ийг migration-ээр шинэчилна уу.";
  }
  if (e.sqlMessage && process.env.NODE_ENV !== "production") {
    return e.sqlMessage;
  }
  return "Өгөгдлийн санд алдаа гарлаа. Админ эсвэл migration шалгана уу.";
}
