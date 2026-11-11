const nodemailer = require('nodemailer');
const { Resend } = require('resend');

/**
 * Sends notification email when a new contact message is received
 */
async function sendContactNotification({ name, email, subject, message, receivedAt }) {
  const toEmail = process.env.NOTIFICATION_EMAIL_TO || 'sajith.dev@example.com';
  const fromEmail = process.env.EMAIL_FROM || 'Portfolio Contact <onboarding@resend.dev>';
  const serviceType = process.env.EMAIL_SERVICE || 'resend';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e2433;">
      <div style="background: linear-gradient(90deg, #6366f1, #a855f7); padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">New Contact Transmission</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">SAJITH // DEV Portfolio System</p>
      </div>
      <div style="padding: 24px;">
        <div style="margin-bottom: 18px; border-bottom: 1px solid #1e2433; padding-bottom: 12px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 4px;">Sender Name</span>
          <strong style="font-size: 16px; color: #f8fafc;">${escapeHtml(name)}</strong>
        </div>
        <div style="margin-bottom: 18px; border-bottom: 1px solid #1e2433; padding-bottom: 12px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 4px;">Sender Email</span>
          <a href="mailto:${escapeHtml(email)}" style="color: #60a5fa; text-decoration: none; font-size: 15px;">${escapeHtml(email)}</a>
        </div>
        <div style="margin-bottom: 18px; border-bottom: 1px solid #1e2433; padding-bottom: 12px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 4px;">Subject</span>
          <span style="font-size: 15px; color: #f8fafc;">${escapeHtml(subject)}</span>
        </div>
        <div style="margin-bottom: 24px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 6px;">Message</span>
          <div style="background: #161a23; padding: 16px; border-radius: 8px; border: 1px solid #232938; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; font-size: 14px;">${escapeHtml(message)}</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">
          Received at: ${new Date(receivedAt).toUTCString()}
        </div>
      </div>
    </div>
  `;

  const textContent = `
New Transmission on SAJITH // DEV Portfolio:
From: ${name} <${email}>
Subject: ${subject}
Date: ${new Date(receivedAt).toUTCString()}

Message:
${message}
  `;

  // 1. Resend API
  if (serviceType === 'resend' && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        reply_to: email,
        subject: `[Portfolio Contact] ${subject} - from ${name}`,
        html: htmlContent,
        text: textContent,
      });
      console.log(`[Email] Resend notification delivered successfully. ID: ${result?.data?.id || 'OK'}`);
      return { success: true, provider: 'resend', id: result?.data?.id };
    } catch (err) {
      console.error(`[Email Error] Resend dispatch failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 2. SMTP fallback
  if (serviceType === 'smtp' && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        replyTo: email,
        subject: `[Portfolio Contact] ${subject} - from ${name}`,
        html: htmlContent,
        text: textContent,
      });
      console.log(`[Email] SMTP notification sent successfully. Message ID: ${info.messageId}`);
      return { success: true, provider: 'smtp', id: info.messageId };
    } catch (err) {
      console.error(`[Email Error] SMTP dispatch failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback Logger for Development
  console.log(`\n======================================================`);
  console.log(`[Email Notification Simulated (No API Key Configured)]`);
  console.log(`To: ${toEmail}`);
  console.log(`From: ${name} <${email}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Message preview: ${message.slice(0, 100)}...`);
  console.log(`Configure RESEND_API_KEY in .env for live transmission.`);
  console.log(`======================================================\n`);
  return { success: true, provider: 'simulated' };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sendContactNotification,
};

