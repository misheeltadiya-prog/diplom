-- Зөвхөн ХУУЧИН DB-д (schema.sql-ийн өмнөх хувилбараас) нэг удаа ажиллуулна.
-- Шинээр schema.sql тавьсан бол энэ файлыг алгасаж болно (багана аль хэдийн байгаа).

USE zeel_platform;

ALTER TABLE users
  ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN email_verify_token VARCHAR(255) NULL,
  ADD COLUMN email_verify_expires_at DATETIME NULL,
  ADD COLUMN avatar_url VARCHAR(512) NOT NULL DEFAULT '',
  ADD KEY users_email_verify_token_idx (email_verify_token);

ALTER TABLE job_applications
  ADD COLUMN applicant_user_id BIGINT UNSIGNED NULL,
  ADD COLUMN cv_file_path VARCHAR(512) NOT NULL DEFAULT '';

ALTER TABLE chat_messages
  ADD COLUMN conversation_id VARCHAR(96) NOT NULL DEFAULT '',
  ADD COLUMN read_at DATETIME NULL,
  ADD KEY chat_conversation_id_idx (conversation_id);

ALTER TABLE job_seeker_profiles
  ADD COLUMN linked_user_id BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY job_seeker_linked_user_unique (linked_user_id);

UPDATE chat_messages
SET conversation_id = CONCAT('s', receiver_id, '-u', sender_id)
WHERE (conversation_id = '' OR conversation_id IS NULL)
  AND sender_id IS NOT NULL
  AND receiver_id IS NOT NULL;
