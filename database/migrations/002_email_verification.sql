USE `unicommu_dev`;

ALTER TABLE `users`
  ADD COLUMN `email_verification_token_hash` BINARY(32) NULL,
  ADD COLUMN `email_verification_expires_at` DATETIME NULL,
  ADD UNIQUE KEY `uq_users_verification_token` (`email_verification_token_hash`);
