USE zeel_platform;

-- Role: company
ALTER TABLE users
  MODIFY COLUMN role ENUM('client', 'freelancer', 'company', 'admin') NOT NULL DEFAULT 'client';

ALTER TABLE freelancer_profiles
  ADD COLUMN portfolio_json TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN listed_on_directory TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(180) NOT NULL DEFAULT '',
  industry VARCHAR(120) NOT NULL DEFAULT '',
  website VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
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
