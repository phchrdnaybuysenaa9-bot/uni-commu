# Registration password policy

New registrations use a project-specific minimum of 9 characters, as requested. This minimum is below the 15 characters required by NIST SP 800-63B-4 for single-factor passwords. Other selection rules are informed by section 3.1.1.2:

- Require 9–128 Unicode code points, after NFC normalization, in both real and local test modes.
- Accept spaces and Unicode without requiring uppercase, numbers or punctuation.
- Compare the entire password against a small initial local blocklist and context-specific values; do not reject individual words within a passphrase.
- Preserve the whole normalized password when hashing with the existing salted scrypt format. Do not trim or truncate it.

This change addresses registration password selection only, not certification of the entire authentication system against NIST. The local blocklist is a starting list, not a comprehensive breach check. Before production, expand the blocklist and implement real login with failed-attempt throttling, TLS, and the same NFC normalization when verifying passwords. Current login remains a prototype flow. Existing account hashes are not changed by this update.

Reference: https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver
