type VerificationEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

export async function sendVerificationEmail({ to, name, verificationUrl }: VerificationEmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "admitus <onboarding@resend.dev>";

  if (!resendKey) {
    console.info(`[admitus] Verification email for ${to}: ${verificationUrl}`);
    return { delivered: false, devUrl: verificationUrl };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Verify your admitus email",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#022226">
          <h1>Verify your email</h1>
          <p>Hi ${escapeHtml(name)},</p>
          <p>Click the button below to verify your admitus account.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;background:#022226;color:#F7E28B;padding:12px 18px;text-decoration:none;border-radius:6px">Verify email</a></p>
          <p>If the button does not work, paste this link into your browser:</p>
          <p style="word-break:break-all">${verificationUrl}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${text}`);
  }

  return { delivered: true };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
