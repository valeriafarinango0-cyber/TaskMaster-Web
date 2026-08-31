const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export async function enviarEmail({ destinatarioEmail, destinatarioNombre, asunto, mensaje }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Falta configurar BREVO_API_KEY en integraciones/.env' };
  }

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || 'no-reply@taskmaster.local',
        name: process.env.BREVO_SENDER_NAME || 'TaskMaster',
      },
      to: [{ email: destinatarioEmail, name: destinatarioNombre || destinatarioEmail }],
      subject: asunto,
      htmlContent: `<p>${mensaje.replace(/\n/g, '<br>')}</p>`,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, error: data.message || `Brevo respondió ${res.status}` };
  }
  return { success: true, messageId: data.messageId };
}
