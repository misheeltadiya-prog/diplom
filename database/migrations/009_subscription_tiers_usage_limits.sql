-- BASIC | STANDARD | PREMIUM (legacy DB утга: free, pro, business — кодоор normalize)
-- Өдрийн хязгаар: usage_limits

CREATE TABLE IF NOT EXISTS usage_limits (
  user_id BIGINT UNSIGNED NOT NULL,
  action_type VARCHAR(40) NOT NULL COMMENT 'apply_job | post_job',
  usage_date DATE NOT NULL,
  count INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action_type, usage_date),
  KEY usage_limits_user_date_idx (user_id, usage_date),
  CONSTRAINT usage_limits_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дараах ALTER-уудыг нэг удаа ажиллуулна (багана аль хэдийн байвал алдаа гарч болно — тэр мөрийг алгасна уу).
ALTER TABLE user_subscriptions ADD COLUMN started_at DATETIME NULL DEFAULT NULL;
ALTER TABLE user_subscriptions ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
