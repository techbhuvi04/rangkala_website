const crypto = require('crypto');

// Secret: SMTP_PASS + FIREBASE_PROJECT_ID se derive karo taaki alag env pe
// tokens apne aap invalidate ho jayein. Fallback dev-only.
const SECRET =
  process.env.BOOKING_ACTION_SECRET ||
  `${process.env.SMTP_PASS || ''}:${process.env.FIREBASE_PROJECT_ID || 'rangkala-dev'}`;

// HMAC token for a booking + action (confirm / cancel)
const sign = (id, action) => {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${id}:${action}`)
    .digest('hex')
    .slice(0, 32);
};

// Timing-safe verify
const verify = (id, action, token) => {
  if (!token) return false;
  const expected = sign(id, action);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
};

module.exports = { sign, verify };
