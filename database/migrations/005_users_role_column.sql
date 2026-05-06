-- ============================================================================
-- users.role багана + ENUM(client, freelancer, company, admin)
--
-- Workbench: Зургийн баруун талын ⚡ товч → Open SQL Script → энийг нээгээд
--           Lightning / Execute бүх блокыг сонгож ажиллуул (цуглуулаад Ctrl+Shift+Enter).
--
-- Алдаа гарвал:
--   • "Unknown database" → доорх USE мөрийг өөрийн DB нэрээр солино (.env доторх MYSQL_DATABASE).
--   • "Can't run DDL with PREPARE" гэх мэт → доорх **Хялбар (гар ажиллуулалт)** хэсгийг ашиглана.
-- ============================================================================

-- >>> Өөрийн өгөгдлийн сангийн нэрийг нэг удаа заана <<<
USE zeel_platform;

-- 1) role багана байхгүй бол л нэмнэ (давхардуулахгүй)
SET @db := DATABASE();

SELECT COUNT(*) INTO @has_role
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'role';

SET @stmt_add := IF(
  @has_role = 0,
  'ALTER TABLE users ADD COLUMN role ENUM(''client'', ''freelancer'', ''company'', ''admin'') NOT NULL DEFAULT ''client'' AFTER password_hash',
  'SELECT ''005: role багана аль хэдийн байна — ADD алгаслаа'' AS migration_note'
);

PREPARE p_add FROM @stmt_add;
EXECUTE p_add;
DEALLOCATE PREPARE p_add;

-- 2) Хуучин ENUM-д company байхгүй байсан бол энд бүрэн болгоно
ALTER TABLE users
  MODIFY COLUMN role ENUM('client', 'freelancer', 'company', 'admin') NOT NULL DEFAULT 'client';

SELECT '005_users_role_column.sql амжилттай дууслаа' AS done;


-- ============================================================================
-- Хялбар (гар ажиллуулалт) — дээрх PREPARE ажиллахгүй бол гурвыг дарааллаар оролд:
--
-- ① role огт байхгүй үед:
--    USE zeel_platform;
--    ALTER TABLE users
--      ADD COLUMN role ENUM('client','freelancer','company','admin')
--      NOT NULL DEFAULT 'client' AFTER password_hash;
--
-- ② "Duplicate column name 'role'" гэвэл ADD алгасаж зөвхөн энийг:
--    USE zeel_platform;
--    ALTER TABLE users
--      MODIFY COLUMN role ENUM('client','freelancer','company','admin')
--      NOT NULL DEFAULT 'client';
--
-- ③ AFTER password_hash алдаа заавал бол AFTER хэсгийг хас:
--    ALTER TABLE users
--      ADD COLUMN role ENUM('client','freelancer','company','admin')
--      NOT NULL DEFAULT 'client';
-- ============================================================================
