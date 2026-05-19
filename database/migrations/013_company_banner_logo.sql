-- Migration: Add banner_url and logo_url columns to company_profiles
-- Purpose: Enable companies to upload custom banner and logo images

USE zeel_platform;

ALTER TABLE company_profiles
  ADD COLUMN banner_url VARCHAR(512) NOT NULL DEFAULT '' AFTER city,
  ADD COLUMN logo_url VARCHAR(512) NOT NULL DEFAULT '' AFTER banner_url;
