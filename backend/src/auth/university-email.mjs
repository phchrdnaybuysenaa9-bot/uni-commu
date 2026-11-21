const universityEmail = /^[a-z0-9_+%-]+(?:\.[a-z0-9_+%-]+)*@rmutp\.ac\.th$/;

export function normalizeUniversityEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 76 && universityEmail.test(email) ? email : null;
}
