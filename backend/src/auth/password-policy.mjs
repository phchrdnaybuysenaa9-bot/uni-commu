// Initial local blocklist; this is not a complete breached-password corpus.
const commonPasswords = new Set([
  '123456789012345', '1234567890123456', '12345678901234567890',
  'qwertyuiopasdfgh', 'qwertyuiopasdfghjkl', 'qwertyuiop123456',
  'passwordpassword', 'password123456789', 'password12345678',
  'iloveyouiloveyou', 'letmeinletmein123', 'adminadminadmin',
  '111111111111111', '000000000000000', 'aaaaaaaaaaaaaaa',
]);

export function checkRegistrationPassword(value, email, displayName) {
  if (typeof value !== 'string') return { error: 'invalid_password_length' };
  const password = value.normalize('NFC');
  const length = [...password].length;
  if (length < 9 || length > 128) return { error: 'invalid_password_length' };
  const candidate = password.toLowerCase();
  // Compare whole passwords, never reject a word merely appearing in a phrase.
  const contextual = ['unicommu', email, email.split('@')[0], displayName.toLowerCase()];
  const predictable = contextual.some((word) => word &&
    ['', '123', '123456', '123456789', '1234567890', '2026', '!'].some((suffix) => candidate === word + suffix));
  if (commonPasswords.has(candidate) || predictable) return { error: 'password_too_common' };
  return { password };
}
