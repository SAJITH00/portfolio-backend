/**
 * Vercel Serverless Entry Point
 *
 * Vercel imports this file and passes each incoming HTTP request
 * through the Express app. No app.listen() is needed — Vercel
 * handles the HTTP server.
 */
const app = require('../app');

module.exports = app;
