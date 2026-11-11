const assert = require('node:assert/strict');
const express = require('express');
const cors = require('cors');
const request = require('supertest');
const createCorsOptions = require('../config/corsOptions');
const errorHandler = require('../middleware/errorHandler');

const isAllowed = (options, origin) => new Promise((resolve, reject) => {
  options.origin(origin, (error, allowed) => {
    if (error) reject(error);
    else resolve(allowed);
  });
});

async function run() {
  const development = createCorsOptions({
    frontendUrl: 'http://localhost:5000/, http://localhost:5500',
    environment: 'development',
    port: 5000,
  });
  assert.equal(await isAllowed(development, 'http://127.0.0.1:5500'), true);
  assert.equal(await isAllowed(development, 'http://localhost:5000'), true);
  await assert.rejects(isAllowed(development, 'https://unlisted.example'), /CORS origin policy blocked/);

  const production = createCorsOptions({
    frontendUrl: 'https://portfolio.example/',
    environment: 'production',
    port: 5000,
  });
  assert.equal(await isAllowed(production, 'https://portfolio.example'), true);
  await assert.rejects(isAllowed(production, 'http://127.0.0.1:5500'), /CORS origin policy blocked/);
  await assert.rejects(isAllowed(production, 'https://unlisted.example'), /CORS origin policy blocked/);
  assert.equal(await isAllowed(production, undefined), true);

  const productionWithoutOrigins = createCorsOptions({
    frontendUrl: '',
    environment: 'production',
    port: 5000,
  });
  await assert.rejects(
    isAllowed(productionWithoutOrigins, 'https://any-origin.example'),
    /CORS origin policy blocked/
  );

  const app = express();
  app.use(cors(development));
  app.get('/api/portfolio', (req, res) => res.json({ success: true, data: { projects: [] } }));
  app.use(errorHandler);
  const allowedRequest = await request(app)
    .options('/api/portfolio')
    .set('Origin', 'http://127.0.0.1:5500')
    .set('Access-Control-Request-Method', 'PUT');
  assert.equal(allowedRequest.status, 204);
  assert.equal(allowedRequest.headers['access-control-allow-origin'], 'http://127.0.0.1:5500');
  assert.match(allowedRequest.headers['access-control-allow-methods'], /PUT/);

  const blockedRequest = await request(app)
    .get('/api/portfolio')
    .set('Origin', 'https://unlisted.example');
  assert.equal(blockedRequest.status, 403);
  assert.equal(blockedRequest.headers['access-control-allow-origin'], undefined);

  console.log('CORS tests passed: local dev origins allowed; production remains explicit-only.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
