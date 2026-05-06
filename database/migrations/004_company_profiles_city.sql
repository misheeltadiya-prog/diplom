USE zeel_platform;

ALTER TABLE company_profiles
  ADD COLUMN city VARCHAR(120) NOT NULL DEFAULT 'Ulaanbaatar' AFTER description;
