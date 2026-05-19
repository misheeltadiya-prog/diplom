-- Google OAuth: users.google_id
USE zeel_platform;

SET @db := DATABASE();

SELECT COUNT(*) INTO @has_google_id
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'google_id';

SET @stmt := IF(
  @has_google_id = 0,
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(64) NULL AFTER email',
  'SELECT ''017: google_id аль хэдийн байна'' AS migration_note'
);

PREPARE p FROM @stmt;
EXECUTE p;
DEALLOCATE PREPARE p;

-- Unique index (олон NULL зөвшөөрнө)
SELECT COUNT(*) INTO @has_idx
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = @db
  AND TABLE_NAME = 'users'
  AND INDEX_NAME = 'users_google_id_unique';

SET @stmt_idx := IF(
  @has_idx = 0,
  'CREATE UNIQUE INDEX users_google_id_unique ON users (google_id)',
  'SELECT ''017: users_google_id_unique аль хэдийн байна'' AS migration_note'
);

PREPARE p2 FROM @stmt_idx;
EXECUTE p2;
DEALLOCATE PREPARE p2;
