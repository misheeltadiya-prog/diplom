-- Normalize freelancer hourly wage display for all cards/profiles.
-- Applies to both public job seeker cards and registered freelancer profiles.

UPDATE job_seeker_profiles
SET price_label = '15,000 - 30,000₮/цаг'
WHERE price_label IS NULL OR price_label <> '15,000 - 30,000₮/цаг';

UPDATE freelancer_profiles
SET price_label = '15,000 - 30,000₮/цаг'
WHERE price_label IS NULL OR price_label <> '15,000 - 30,000₮/цаг';

