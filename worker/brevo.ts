// Sends one transactional email through Brevo to the site owner.

export type Mail = { subject: string; text: string; html: string };

export async function sendMail(env: { EMAIL_TO?: string; EMAIL_FROM?: string }, apiKey: string, mail: Mail) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Miss Leila website', email: env.EMAIL_FROM || 'noreply@englishkids.ir' },
      to: [{ email: env.EMAIL_TO || 'admin@englishkids.ir' }],
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
  });
  if (!res.ok) console.error('Brevo error', res.status, await res.text());
  return res.ok;
}
