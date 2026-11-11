# SAJITH // DEV Portfolio Backend

Production-grade, secure REST API backend built with Node.js, Express, MongoDB Atlas, and Mongoose for the **SAJITH // DEV** Portfolio.

---

## 🚀 Features

* **Real Contact Form API (`POST /api/contact`)**:
  * Server-side input validation and HTML sanitization (express-validator).
  * Anti-spam invisible honeypot trap.
  * Rate limiting (5 transmissions per 15 minutes per IP).
  * MongoDB message persistence.
  * Resend API email notifications (with SMTP and console simulation fallbacks).
* **Privacy-Conscious Visitor Analytics**:
  * Real visitor counting replacing third-party dependencies.
  * Zero plain-text IP storage: SHA-256 salted hashes of visitor signature.
  * Prevents double-counting duplicate page refreshes on the same day.
  * Public counter endpoint (`GET /api/analytics/visitors`) and visit recorder (`POST /api/analytics/visit`).
* **Dedicated Cyberpunk Admin Dashboard (`/admin`)**:
  * Authenticated with secure JSON Web Tokens (JWT) & HTTP-only cookies.
  * Overview metrics: Total visits, Today's visits, Total messages, Unread inquiries.
  * Search, filter (All / Unread / Read), and pagination.
  * Read message drawer modal, mark as read/unread toggle, and message deletion.
  * Initial admin account creation through environment-based seed script (`npm run seed:admin`).
* **Security & Hardening**:
  * Helmet security HTTP headers.
  * CORS whitelist configuration.
  * Passwords hashed using bcrypt (12 salt rounds).
  * Rate limiting on login (5 attempts per 15 minutes) and API endpoints.
  * Centralized error handling.

---

## 🛠️ Project Structure

```
portfolio/
├── index.html                   # Portfolio frontend (untouched styles & animations, connected to backend)
└── backend/
    ├── config/
    │   └── db.js                # MongoDB connection handler
    ├── controllers/
    │   ├── contactController.js # Contact form submission & notification
    │   ├── analyticsController.js # Visitor tracking and public stats
    │   ├── authController.js    # Admin login, token issuance, logout, session check
    │   └── adminController.js   # Admin CRUD for messages & analytics overview
    ├── middleware/
    │   ├── auth.js              # JWT verification & admin guard
    │   ├── rateLimiter.js       # Express rate limiters
    │   ├── validator.js         # Input sanitization and honeypot validation
    │   └── errorHandler.js      # Centralized HTTP error handler
    ├── models/
    │   ├── ContactMessage.js    # Mongoose schema for contact messages
    │   ├── Admin.js             # Mongoose schema for admin account
    │   ├── Visit.js             # Mongoose schema for unique daily visits
    │   └── DailyStat.js         # Daily & cumulative visitor aggregations
    ├── routes/
    │   ├── contactRoutes.js     # /api/contact
    │   ├── analyticsRoutes.js   # /api/analytics/*
    │   ├── adminRoutes.js       # /api/admin/*
    │   └── healthRoutes.js      # /api/health
    ├── services/
    │   └── emailService.js      # Resend API & SMTP notification service
    ├── utils/
    │   └── visitorHash.js       # SHA-256 anonymization generator
    ├── scripts/
    │   ├── createAdmin.js       # Secure admin account seed script
    │   └── testApi.js           # Automated end-to-end API test suite
    ├── public/
    │   └── admin/               # Admin Dashboard SPA (/admin)
    │       ├── index.html
    │       ├── admin.css
    │       └── admin.js
    ├── .env.example
    ├── .env
    ├── package.json
    └── server.js                # Express entrypoint
```

---

## ⚙️ Quick Start

### 1. Configure Environment Variables
Inside `backend/`, copy `.env.example` to `.env` if not already present:
```bash
cd backend
cp .env.example .env
```
Fill in your configuration:
* `MONGODB_URI`: Your MongoDB Atlas connection string (or local MongoDB).
  * Example: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sajith_portfolio?retryWrites=true&w=majority`
* `FRONTEND_URL`: Comma-separated list of allowed frontend origins, without paths. Development also allows localhost and 127.0.0.1 on ports 5000, 5500, and 3000. Production allows only origins explicitly listed here.
* `JWT_SECRET`: A strong 32+ character random string.
* `RESEND_API_KEY`: Your key from [Resend](https://resend.com) (`re_...`). (If omitted during local development, transmissions will log to terminal safely).
* `NOTIFICATION_EMAIL_TO`: The email where you want to receive new portfolio inquiries.
* `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Your desired admin credentials.

### 2. Seed Initial Admin Account
Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and a unique `JWT_SECRET` (at least 32 characters) in `.env`. The sample values in `.env.example` are placeholders; replace them before use.

Run the seed script to create your hashed administrator profile in MongoDB:
```bash
npm run seed:admin
```

To inspect the legacy portfolio import without writing anything, run the migration in its default dry-run mode:
```bash
npm run migrate:portfolio
```

The preview reports the database name and how many records would be added or preserved. It imports the original profile only when no profile exists; for projects, skills, education, and experience it uses their identifying fields to add only missing records. Existing records are never updated or deleted. If an identity is duplicated in MongoDB, the migration stops before writing anything.

After checking the preview and confirming that the database name is the one you intend to use, apply the migration:
```bash
npm run migrate:portfolio -- --apply
```
The apply command requires an explicit database name in the `MONGODB_URI` path. The current example log reports `test` because the configured URI has no database path; if that is the database containing your current content, add `/test` to the URI path to keep using it. Do not switch to a different database until you have migrated or backed up the existing records. The command is idempotent and safe to rerun. `npm run seed:portfolio` also performs the additive import directly. Back up MongoDB before applying migrations.

For local development with VS Code Live Server, the default development CORS policy allows both `http://localhost:5500` and `http://127.0.0.1:5500`. Restart the backend after changing environment variables.

### 3. Start the Backend Server
```bash
# Production start:
npm start

# Development mode (auto-restart on file change):
npm run dev
```
The server will start on port `5000`:
* API Root: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`
* Admin Dashboard: `http://localhost:5000/admin`

Use the username/email and password configured in `.env` to sign in. Edit profile details, projects, skills, and experience/education from the dashboard; saved changes appear on the public page. Analytics show unique visitors (counted once per day), page views, visitor trends, devices, browsers, sources, and viewed sections. The app stores visitor identifiers only as salted hashes.

### 4. Verify Admin / Portfolio Synchronization
1. Confirm the startup log's database name matches the database selected in `MONGODB_URI`.
2. Run `npm run migrate:portfolio` and review the dry-run counts; apply it only after confirming the target database.
3. Open `http://localhost:5000/api/portfolio` and check its profile, projects, skills, education, and experience data.
4. Open `/admin`, make a small edit, save, then verify the changed value in the API response and refresh the public portfolio.
5. If testing from Live Server, use `http://localhost:5500` or `http://127.0.0.1:5500`.

### 5. Run Automated Tests
```bash
npm run test:migration
npm run test:cors
npm run test:api
```

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health & uptime check |
| `POST` | `/api/contact` | Submit contact form (rate limited, honeypot protected) |
| `POST` | `/api/analytics/visit` | Record unique visit for today |
| `GET` | `/api/analytics/visitors` | Get total visitor count |

### Admin Endpoints (Protected by JWT)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | None | Login with username/email & password (rate-limited) |
| `GET` | `/api/admin/me` | Bearer Token / Cookie | Get authenticated admin profile |
| `POST` | `/api/admin/logout` | Bearer Token / Cookie | Clear admin session |
| `GET` | `/api/admin/messages` | Bearer Token / Cookie | List contact messages (pagination, search, filter) |
| `GET` | `/api/admin/messages/:id` | Bearer Token / Cookie | View single message detail |
| `PATCH` | `/api/admin/messages/:id/read` | Bearer Token / Cookie | Toggle or mark message as read |
| `DELETE` | `/api/admin/messages/:id` | Bearer Token / Cookie | Delete contact message |
| `GET` | `/api/admin/analytics` | Bearer Token / Cookie | Overview metrics & visitor statistics |

---

## 🌐 Deployment Guide

### Deploying to Render / Railway / DigitalOcean

1. Push your repository to GitHub.
2. In your cloud provider dashboard:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
3. Add Environment Variables in the provider dashboard:
   * `NODE_ENV=production`
   * `PORT=5000` (or leave default assigned by provider)
   * `MONGODB_URI` (your MongoDB Atlas connection string)
   * `JWT_SECRET` (secure random string)
   * `RESEND_API_KEY` (Resend API key)
   * `NOTIFICATION_EMAIL_TO` (your direct inbox email)
   * `FRONTEND_URL` (your deployed portfolio domain, e.g. `https://sajith.dev`)
4. Access the admin dashboard at `https://your-api-domain.com/admin`.
