# OTP daily quota

- Each normalized email (trimmed and lowercase) may request 10 OTPs per Thailand calendar day (UTC+7). Initial registration and resends share this allowance, including local test codes.
- The backend persists counts in `otp_daily_requests`, keyed by SHA-256 email hash and date. Deleting an account or restarting the server does not clear its allowance.
- A conditional increment and the OTP change run in one transaction. Concurrent requests cannot exceed 10. Duplicate registrations and cooldown rejections roll back the increment. An actual SMTP delivery attempt consumes a request even if delivery fails.
- The eleventh request returns HTTP 429 with `otp_daily_limit`. It does not replace the last valid OTP. The existing 60-second resend cooldown, 10-minute validity and five verification attempts remain in effect.
- This is a limit per email, not a global email-service budget or a guarantee of one account per human.

## Database setup

For PostgreSQL/Supabase apply `supabase/migrations/20261112090000_otp_daily_limit.sql` before deploying the backend. RLS is enabled and no client access policy is granted; requests go through the backend database connection.

For the optional local MySQL backend apply `database/migrations/004_otp_daily_limit.sql` instead.

Restart the backend after updating the code. Unit tests: `npm --prefix backend test`. To also run database integration tests, open PowerShell in `backend`, set `$env:RUN_DB_TESTS='true'`, then run `node --env-file=.env --test tests/otp-quota.integration.test.mjs`. These tests create and remove uniquely named test rows without sending email.
