const nodemailer = require('nodemailer');
const { sign } = require('./booking-token');

// Emails me absolute URLs chahiye
const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// SMTP transport env vars se banao. Agar credentials missing hain to
// mailer disabled rahega (koi crash nahi).
let transporter = null;

const initMailer = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('Mailer disabled — SMTP credentials missing hain');
    return null;
  }

  const port = Number(SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  console.log('Mailer ready hai');
  return transporter;
};

// Module load pe init
initMailer();

const STUDIO_NAME = 'RangKala Creations';

// Status-wise email content
const buildStatusEmail = (booking, status) => {
  const name = booking.name || 'there';
  const service = booking.service || 'your project';
  const date = booking.preferredDate || 'the date you requested';
  const studioPhone = process.env.STUDIO_PHONE || '';

  if (status === 'confirmed') {
    return {
      subject: `Your booking is confirmed — ${STUDIO_NAME}`,
      text:
        `Hi ${name},\n\n` +
        `Good news! Your booking request for "${service}" on ${date} has been CONFIRMED.\n\n` +
        `Our team will reach out shortly to finalise the details.\n` +
        (studioPhone ? `\nQuestions? Call us at ${studioPhone}.\n` : '') +
        `\nThank you for choosing ${STUDIO_NAME}.\n`,
      html:
        `<p>Hi ${name},</p>` +
        `<p>Good news! Your booking request for <strong>${service}</strong> on <strong>${date}</strong> has been <strong style="color:#27AE60">CONFIRMED</strong>.</p>` +
        `<p>Our team will reach out shortly to finalise the details.</p>` +
        (studioPhone ? `<p>Questions? Call us at <strong>${studioPhone}</strong>.</p>` : '') +
        `<p>Thank you for choosing ${STUDIO_NAME}.</p>`,
    };
  }

  if (status === 'cancelled') {
    return {
      subject: `Update on your booking — ${STUDIO_NAME}`,
      text:
        `Hi ${name},\n\n` +
        `We're sorry to let you know that your booking request for "${service}" on ${date} could not be confirmed at this time.\n` +
        (studioPhone ? `\nPlease call us at ${studioPhone} to reschedule.\n` : '') +
        `\n${STUDIO_NAME}\n`,
      html:
        `<p>Hi ${name},</p>` +
        `<p>We're sorry to let you know that your booking request for <strong>${service}</strong> on <strong>${date}</strong> could not be confirmed at this time.</p>` +
        (studioPhone ? `<p>Please call us at <strong>${studioPhone}</strong> to reschedule.</p>` : '') +
        `<p>${STUDIO_NAME}</p>`,
    };
  }

  return null; // 'pending' / 'done' pe koi mail nahi
};

// Booking status email bhejo. Fail hone par throw nahi karta —
// sirf warn karta hai, taaki status update block na ho.
const sendBookingStatusEmail = async (booking, status) => {
  const t = initMailer();
  if (!t) return { sent: false, reason: 'mailer-disabled' };
  if (!booking || !booking.email) return { sent: false, reason: 'no-email' };

  const content = buildStatusEmail(booking, status);
  if (!content) return { sent: false, reason: 'no-template' };

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: booking.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    console.log(`Booking email sent to ${booking.email} (${status})`, info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Booking email fail:', err.message);
    return { sent: false, reason: err.message };
  }
};

// Nayi booking aane par admin ko alert bhejo
const sendNewBookingAdminAlert = async (booking) => {
  const t = initMailer();
  if (!t) return { sent: false, reason: 'mailer-disabled' };

  const to = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!to) return { sent: false, reason: 'no-admin-email' };

  const rows = [
    ['Name', booking.name],
    ['Phone', booking.phone],
    ['Email', booking.email || '—'],
    ['Service', booking.service || '—'],
    ['Preferred Date', booking.preferredDate || '—'],
    ['Address', booking.address || '—'],
    ['Details', booking.message || '—'],
  ];

  const confirmUrl = `${SITE_URL}/booking-action/${booking.id}/confirm?token=${sign(booking.id, 'confirm')}`;
  const cancelUrl = `${SITE_URL}/booking-action/${booking.id}/cancel?token=${sign(booking.id, 'cancel')}`;
  const panelUrl = `${SITE_URL}/admin/bookings`;

  const text =
    `New booking request received:\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nConfirm this booking:  ${confirmUrl}\n` +
    `Cancel this booking:   ${cancelUrl}\n\n` +
    `Or open the admin panel: ${panelUrl}\n`;

  const btn = (url, bg, label) =>
    `<a href="${url}" style="display:inline-block;padding:12px 22px;margin:6px 8px 6px 0;` +
    `background:${bg};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-family:sans-serif">${label}</a>`;

  const html =
    `<h2 style="font-family:sans-serif">New booking request</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="font-weight:600;color:#555">${k}</td><td>${String(v).replace(/</g, '&lt;')}</td></tr>`
      )
      .join('') +
    `</table>` +
    `<p style="margin-top:18px">` +
    btn(confirmUrl, '#27AE60', '✓ Confirm booking') +
    btn(cancelUrl, '#E74C3C', '✕ Cancel booking') +
    `</p>` +
    `<p style="font-family:sans-serif;color:#888;font-size:13px">` +
    `One click confirms and emails the customer automatically. ` +
    `Or <a href="${panelUrl}">open the admin panel</a>.</p>`;

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      replyTo: booking.email || undefined,
      subject: `New booking — ${booking.name} (${booking.service || 'service'})`,
      text,
      html,
    });
    console.log(`Admin alert sent for booking by ${booking.name}`, info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Admin alert email fail:', err.message);
    return { sent: false, reason: err.message };
  }
};

module.exports = {
  sendBookingStatusEmail,
  sendNewBookingAdminAlert,
  initMailer,
};
