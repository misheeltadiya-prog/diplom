-- Give each freelancer a stable pseudo-random hourly wage between 15,000 and 30,000 MNT.
-- Stable formula is used instead of RAND() because this project re-runs migration files.

UPDATE job_seeker_profiles
SET price_label = CONCAT(FORMAT(15000 + MOD(id * 7919, 15001), 0), '₮/цаг');

UPDATE freelancer_profiles
SET price_label = CONCAT(FORMAT(15000 + MOD(user_id * 7919, 15001), 0), '₮/цаг');

