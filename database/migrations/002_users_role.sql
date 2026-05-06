-- Хуучин users хүснэгтэд role багана нэмэх (аль хэдийн байвал алгасна).
USE zeel_platform;

ALTER TABLE users
  ADD COLUMN role ENUM('client', 'freelancer', 'company', 'admin') NOT NULL DEFAULT 'client';
