CREATE TABLE IF NOT EXISTS unicommu.otp_daily_requests (
  email_hash varchar(64) NOT NULL CHECK (length(email_hash) = 64),
  request_day date NOT NULL,
  request_count smallint NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 10),
  PRIMARY KEY (email_hash, request_day)
);
ALTER TABLE unicommu.otp_daily_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON unicommu.otp_daily_requests FROM PUBLIC, anon, authenticated;
-- No FK to users: deleting an account must not reset the daily send quota.
