USE `unicommu_dev`;

ALTER TABLE `users`
  ADD COLUMN `email_verification_challenge_hash` BINARY(32) NULL,
  ADD COLUMN `email_verification_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `uq_users_verification_challenge` (`email_verification_challenge_hash`);
