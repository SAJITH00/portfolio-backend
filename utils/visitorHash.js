const crypto = require('crypto');

/**
 * Generates an anonymous, irreversible SHA-256 hash
 * based on client IP, User-Agent, and an environment salt.
 * Ensures zero storage of plain text IP addresses.
 */
function generateVisitorHash(req) {
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'unknown-client';
  const salt = process.env.VISITOR_SALT || 'sajith_default_visitor_salt';

  return crypto
    .createHash('sha256')
    .update(`${clientIp}-${userAgent}-${salt}`)
    .digest('hex');
}

/**
 * Generates an anonymous IP hash for spam tracking on contact forms
 */
function generateIpHash(req) {
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const salt = process.env.VISITOR_SALT || 'sajith_default_visitor_salt';

  return crypto
    .createHash('sha256')
    .update(`${clientIp}-${salt}`)
    .digest('hex');
}

/**
 * Parse User-Agent to determine high-level device category
 */
function parseDevice(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

/**
 * Parse User-Agent to determine browser category
 */
function parseBrowser(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera/')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  return 'Other';
}

/**
 * Categorize referrer origin
 */
function sanitizeReferrer(referrer) {
  if (!referrer || referrer.trim() === '') return 'Direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('google')) return 'Google';
    if (host.includes('github')) return 'GitHub';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('instagram')) return 'Instagram';
    return host.replace(/^www\./, '');
  } catch {
    return 'Other';
  }
}

module.exports = {
  generateVisitorHash,
  generateIpHash,
  parseDevice,
  parseBrowser,
  sanitizeReferrer,
};

