USE unicommu_dev;
CREATE TABLE IF NOT EXISTS otp_daily_requests (
  email_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_day DATE NOT NULL,
  request_count SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (email_hash, request_day),
  CONSTRAINT ck_otp_daily_count CHECK (request_count BETWEEN 0 AND 10)
) ENGINE=InnoDB;
