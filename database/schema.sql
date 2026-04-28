-- Хүснэгт: бүтнээр ажиллуул. Дараа нь workbench-seed.sql (30 job_seeker + demo user + employees).

CREATE DATABASE IF NOT EXISTS zeel_platform;
USE zeel_platform;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY job_seeker_active_sort (is_active, sort_order)
);

