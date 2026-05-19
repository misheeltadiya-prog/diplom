-- Migration: Lead submissions from landing hire/join modal
USE zeel_platform;

CREATE TABLE IF NOT EXISTS platform_leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind ENUM('hire', 'join') NOT NULL,
  full_name VARCHAR(120) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(180) NOT NULL DEFAULT '',
  job_type VARCHAR(120) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  budget VARCHAR(80) NOT NULL DEFAULT '',
  duration VARCHAR(80) NOT NULL DEFAULT '',
  status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY platform_leads_kind_idx (kind, status),
  KEY platform_leads_created_idx (created_at)
);
