-- Add card-related fields to freelancer_profiles (idempotent).

SET @schema := DATABASE();

-- stars_label
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema
    AND TABLE_NAME = 'freelancer_profiles'
    AND COLUMN_NAME = 'stars_label'
);
SET @sql := IF(
  @col_exists = 0,
  "ALTER TABLE freelancer_profiles ADD COLUMN stars_label VARCHAR(32) NOT NULL DEFAULT '★★★★★'",
  "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- badge_label
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema
    AND TABLE_NAME = 'freelancer_profiles'
    AND COLUMN_NAME = 'badge_label'
);
SET @sql := IF(
  @col_exists = 0,
  "ALTER TABLE freelancer_profiles ADD COLUMN badge_label VARCHAR(40) NULL",
  "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- badge_tone
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @schema
    AND TABLE_NAME = 'freelancer_profiles'
    AND COLUMN_NAME = 'badge_tone'
);
SET @sql := IF(
  @col_exists = 0,
  "ALTER TABLE freelancer_profiles ADD COLUMN badge_tone VARCHAR(12) NULL",
  "SELECT 1"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

