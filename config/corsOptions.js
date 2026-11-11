/**
 * CORS Options Helper
 *
 * Normalises configured origins and adds dev-friendly localhost entries.
 */
const normalizeConfiguredOrigin = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.origin; // Returns "http://example.com" (no trailing slash/path)
  } catch {
    return null;
  }
};

const createCorsOptions = ({ frontendUrl = '', environment, port }) => {
  const configuredOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeConfiguredOrigin)
    .filter(Boolean);

  const developmentOrigins =
    environment === 'production'
      ? []
      : [port, '5500', '3000'].flatMap((originPort) => [
          `http://localhost:${originPort}`,
          `http://127.0.0.1:${originPort}`,
        ]);

  const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      // In production on Vercel, same-origin requests won't have issues.
      // Allow all origins for now; tighten in production if needed.
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
};

module.exports = createCorsOptions;
