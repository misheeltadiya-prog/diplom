-- Нэвтэрсэн хэрэглэгчийн өргөдөл холбох + CV зам (хуучин schema-д байхгүй бол)
USE zeel_platform;

ALTER TABLE job_applications
  ADD COLUMN applicant_user_id BIGINT UNSIGNED NULL AFTER job_id;

ALTER TABLE job_applications
  ADD COLUMN cv_file_path VARCHAR(512) NOT NULL DEFAULT '' AFTER cover_note;
