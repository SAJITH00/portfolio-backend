/**
 * Express Application Setup
 * 
 * This file configures the Express app WITHOUT calling app.listen().
 * - For LOCAL development:  server.js imports this and starts listening.
 * - For VERCEL deployment:  api/index.js imports this as a serverless function.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/healthRoutes');
const contactRoutes = require('./routes/contactRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const { serveUpload } = require('./controllers/uploadController');

const app = express();

/* ── Trust proxy (Vercel / Render terminate TLS at the proxy) ── */
app.set('trust proxy', 1);

/* ── Connect to MongoDB (non-blocking — allows static files even if DB is down) ── */
connectDB();

/* ── 1. Security Headers ── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/* ── 2. CORS Configuration ── */
const allowedOrigins = new Set();

// Add configured frontend URLs
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        allowedOrigins.add(parsed.origin);
      } catch {
        // Skip invalid URLs
      }
    }
  });
}

// In development, allow common local origins
if (process.env.NODE_ENV !== 'production') {
  ['5000', '5500', '3000'].forEach(p => {
    allowedOrigins.add(`http://localhost:${p}`);
    allowedOrigins.add(`http://127.0.0.1:${p}`);
  });
}

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // In production, you may want to restrict this
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/* ── 3. Body Parsers & Cookies ── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ── 4. Global Rate Limiting ── */
app.use('/api', apiLimiter);

/* ── 5. API Routes ── */
app.use('/api/health', healthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portfolio', portfolioRoutes);

/* ── 6. File Uploads (served from MongoDB) ── */

const uploadsPath = path.join(__dirname, 'public', 'uploads');

// Allow portfolio images to load from GitHub Pages
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Serve uploaded images from MongoDB
app.get('/uploads/:filename', serveUpload);

// Serve static uploads if available
app.use('/uploads', express.static(uploadsPath));

/* ── 7. Admin Dashboard Static Files ── */
// On Vercel these are also served via rewrites → serverless function,
// so we need the static middleware in both environments.
const adminStaticPath = path.join(__dirname, 'public', 'admin');
app.use('/admin', express.static(adminStaticPath));
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(adminStaticPath, 'index.html'));
});

/* ── 8. Portfolio Frontend ── */
// Frontend is hosted separately on Vercel.
// Render backend serves API endpoints only.

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sajith Portfolio Backend API is running!',
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ── 9. 404 for undefined API routes ── */
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

/* ── 10. Centralized Error Handler ── */
app.use(errorHandler);

module.exports = app;
