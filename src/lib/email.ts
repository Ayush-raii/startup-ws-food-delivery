import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@decentralbites.com';

  if (!host || !user || !pass) {
    console.log(`\n=========================================`);
    console.log(`[SMTP Not Configured] Mock Email Sent:`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${html}`);
    console.log(`=========================================\n`);
    return { mock: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"DecentralBites" <${from}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('SMTP email send error:', error);
    // If SMTP fails, log to console so developers can see the code during testing
    console.log(`\n=========================================`);
    console.log(`[SMTP Send Failed] Fallback Log:`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${html}`);
    console.log(`=========================================\n`);
    return { mock: true, error };
  }
}
