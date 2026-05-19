-- Keep freelancer hourly wages in four fixed buckets:
-- 15,000 / 20,000 / 25,000 / 30,000 MNT per hour.

UPDATE job_seeker_profiles
SET price_label = CONCAT(
  FORMAT(
    CASE MOD(id, 4)
      WHEN 0 THEN 15000
      WHEN 1 THEN 20000
      WHEN 2 THEN 25000
      ELSE 30000
    END,
    0
  ),
  '₮/цаг'
);

UPDATE freelancer_profiles
SET price_label = CONCAT(
  FORMAT(
    CASE MOD(user_id, 4)
      WHEN 0 THEN 15000
      WHEN 1 THEN 20000
      WHEN 2 THEN 25000
      ELSE 30000
    END,
    0
  ),
  '₮/цаг'
);

