import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailConfiguration, otpMessage } from '../email-delivery.mjs';

test('email diagnostics name missing settings without exposing values', () => {
  const result = emailConfiguration({ SMTP_HOST: 'smtp.example.com', SMTP_PASSWORD: 'private-value', SMTP_PORT: 'wrong' });
  assert.deepEqual(result.missing, ['SMTP_USER', 'SMTP_FROM', 'SMTP_PORT']);
  assert.ok(!JSON.stringify(result).includes('private-value'));
});

test('leading-zero OTP is identical in text and HTML, and message explains expiry', () => {
  const message = otpMessage('student@example.com', '001234', 'UniCommu <sender@example.com>');
  assert.equal(message.to, 'student@example.com');
  assert.equal(message.cc, undefined);
  assert.equal(message.bcc, undefined);
  assert.ok(message.text.includes('001234'));
  assert.ok(message.html.includes('001234'));
  assert.ok(message.text.includes('10 นาที'));
  assert.ok(message.html.includes('ครั้งเดียว'));
});

test('message rejects non-six-digit codes and markup instead of interpolating it', () => {
  for (const code of ['12345', '1234567', '<img>', '12a456']) {
    assert.throws(() => otpMessage('student@example.com', code, 'sender@example.com'));
  }
});
