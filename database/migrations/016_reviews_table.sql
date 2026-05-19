-- Freelancer reviews (company/client → freelancer)
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  freelancer_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY reviews_freelancer_idx (freelancer_id),
  UNIQUE KEY reviews_unique (reviewer_id, freelancer_id),
  CONSTRAINT reviews_reviewer_fk
    FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT reviews_freelancer_fk
    FOREIGN KEY (freelancer_id) REFERENCES users (id) ON DELETE CASCADE
);
