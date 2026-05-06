-- Хүснэгт: бүтнээр ажиллуул. (Seed өгөгдөл тусдаа байхгүй — апп өөрөө өгөгдлөө үүсгэнэ.)

CREATE DATABASE IF NOT EXISTS zeel_platform;
USE zeel_platform;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client', 'freelancer', 'company', 'admin') NOT NULL DEFAULT 'client',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  email_verify_token VARCHAR(255) NULL,
  email_verify_expires_at DATETIME NULL,
  avatar_url VARCHAR(512) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_email_verify_token_idx (email_verify_token)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_sessions_token_unique (session_token),
  KEY user_sessions_user_idx (user_id),
  CONSTRAINT user_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role_title VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  skills VARCHAR(255) NOT NULL,
  bio TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY employees_created_by_idx (created_by),
  CONSTRAINT employees_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  location VARCHAR(120) NOT NULL,
  employment_type VARCHAR(60) NOT NULL,
  salary VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY job_posts_created_by_idx (created_by),
  CONSTRAINT job_posts_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), 
  UNIQUE KEY password_resets_token_unique (token),
  KEY password_resets_user_idx (user_id),
  CONSTRAINT password_resets_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role_title VARCHAR(180) NOT NULL DEFAULT '',
  short_description VARCHAR(600) NOT NULL DEFAULT '',
  detail_description TEXT NOT NULL,
  skills_json TEXT NOT NULL DEFAULT '[]',
  price_label VARCHAR(80) NOT NULL DEFAULT '',
  rating VARCHAR(8) NOT NULL DEFAULT '5.0',
  reviews_count VARCHAR(12) NOT NULL DEFAULT '0',
  accent VARCHAR(12) NOT NULL DEFAULT 'lime',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  portfolio_json TEXT NOT NULL DEFAULT '[]',
  listed_on_directory TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY freelancer_profiles_user_unique (user_id),
  CONSTRAINT freelancer_profiles_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(180) NOT NULL DEFAULT '',
  industry VARCHAR(120) NOT NULL DEFAULT '',
  website VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'Ulaanbaatar',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT company_profiles_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_user_id BIGINT UNSIGNED NOT NULL,
  freelancer_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY job_offers_freelancer_idx (freelancer_user_id, status),
  KEY job_offers_company_idx (company_user_id),
  CONSTRAINT job_offers_company_fk
    FOREIGN KEY (company_user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT job_offers_freelancer_fk
    FOREIGN KEY (freelancer_user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id BIGINT UNSIGNED NOT NULL,
  plan_key VARCHAR(40) NOT NULL DEFAULT 'free',
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  expires_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT user_subscriptions_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id VARCHAR(40) NOT NULL,
  applicant_user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  cover_note TEXT NOT NULL,
  cv_file_path VARCHAR(512) NOT NULL DEFAULT '',
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY job_applications_job_idx (job_id),
  KEY job_applications_status_idx (status)
);

CREATE TABLE IF NOT EXISTS profile_cvs (
  user_id BIGINT UNSIGNED NOT NULL,
  headline VARCHAR(180) NOT NULL DEFAULT '',
  location VARCHAR(180) NOT NULL DEFAULT '',
  professional_summary TEXT NOT NULL,
  core_skills TEXT NOT NULL,
  work_experience TEXT NOT NULL,
  education TEXT NOT NULL,
  certifications TEXT NOT NULL,
  languages TEXT NOT NULL,
  portfolio_url VARCHAR(255) NOT NULL DEFAULT '',
  linkedin_url VARCHAR(255) NOT NULL DEFAULT '',
  github_url VARCHAR(255) NOT NULL DEFAULT '',
  preferred_role VARCHAR(180) NOT NULL DEFAULT '',
  salary_expectation VARCHAR(120) NOT NULL DEFAULT '',
  availability VARCHAR(120) NOT NULL DEFAULT '',
  achievements TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT profile_cvs_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id BIGINT UNSIGNED NOT NULL COMMENT 'users.id of sender',
  receiver_id BIGINT UNSIGNED NOT NULL COMMENT 'legacy: seeker id or peer user id',
  sender_name VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  conversation_id VARCHAR(96) NOT NULL DEFAULT '',
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY chat_sender_idx (sender_id),
  KEY chat_receiver_idx (receiver_id),
  KEY chat_conversation_idx (sender_id, receiver_id),
  KEY chat_conversation_id_idx (conversation_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL COMMENT 'new_message | new_application | application_status',
  title VARCHAR(180) NOT NULL,
  body VARCHAR(500) NOT NULL DEFAULT '',
  payload JSON NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY notifications_user_idx (user_id),
  KEY notifications_read_idx (user_id, is_read),
  CONSTRAINT notifications_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  freelancer_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY reviews_freelancer_idx (freelancer_id),
  UNIQUE KEY reviews_unique (reviewer_id, freelancer_id),
  CONSTRAINT reviews_reviewer_fk
    FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT reviews_freelancer_fk
    FOREIGN KEY (freelancer_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  initials VARCHAR(4) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role_title VARCHAR(180) NOT NULL,
  short_description VARCHAR(600) NOT NULL,
  detail_description TEXT NOT NULL,
  skills_json TEXT NOT NULL,
  price_label VARCHAR(80) NOT NULL,
  stars_label VARCHAR(32) NOT NULL DEFAULT '★★★★★',
  rating VARCHAR(8) NOT NULL,
  reviews_count VARCHAR(12) NOT NULL,
  accent VARCHAR(12) NOT NULL DEFAULT 'lime',
  badge_label VARCHAR(40) NULL,
  badge_tone VARCHAR(12) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  linked_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY job_seeker_active_sort (is_active, sort_order),
  UNIQUE KEY job_seeker_linked_user_unique (linked_user_id),
  CONSTRAINT job_seeker_linked_user_fk
    FOREIGN KEY (linked_user_id) REFERENCES users (id)
    ON DELETE SET NULL
);
