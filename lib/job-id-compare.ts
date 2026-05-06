/**
 * job_posts.id (BIGINT) ↔ job_applications.job_id (VARCHAR) харьцуулахад
 * MySQL 8-д utf8mb4_unicode_ci vs utf8mb4_0900_ai_ci коллацийн зөрчил гардаг.
 * BINARY — тэмдэгт мөрийг байт тэнцүүлэх тул коллацийн асуудалгүй (тоон id мөрт тохирно).
 */
/** Нэг job_posts хүснэгтэн дээр: WHERE ... */
export const SQL_JOB_POST_ID_EQ_PARAM = `BINARY CAST(id AS CHAR) = BINARY CAST(? AS CHAR)`;

/** Alias-гүй JOIN-д: j = job_posts, a = job_applications */
export const SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID = `BINARY CAST(j.id AS CHAR) = BINARY CAST(a.job_id AS CHAR)`;
