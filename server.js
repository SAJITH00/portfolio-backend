/**
 * Local Development Server
 * 
 * This file is ONLY used for local development (npm start / npm run dev).
 * On Vercel, the api/index.js serverless entry point is used instead.
 */
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` [SAJITH // DEV] Backend running on port ${PORT}`);
  console.log(` Environment:     ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check:    http://localhost:${PORT}/api/health`);
  console.log(` Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[System] SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('[System] Server closed.');
    process.exit(0);
  });
});
