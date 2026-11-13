import { emailConfiguration, createEmailTransport } from '../src/email/email-delivery.mjs';

// Diagnostics only: never sends a message or prints credentials.
const { missing } = emailConfiguration();
if (missing.length) {
  console.error(`Email configuration incomplete: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  const transport = createEmailTransport();
  try {
    await transport.verify();
    console.log('SMTP connection and authentication succeeded. No email was sent.');
    console.log('The From address must also be verified in Brevo; inbox delivery still needs an end-to-end test.');
  } catch (error) {
    console.error('SMTP check failed:', error.code ?? error.name);
    if (error.code === 'EAUTH') console.error('Check SMTP_USER and the SMTP key (not the Brevo account password).');
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}
