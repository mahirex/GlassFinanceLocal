# Glass Finance - Glass ERP Pro

An all-in-one local finance, banking, and business management application built for **Glass Antigravity**.

## 🚀 Live Deployment

The project is deployed on **Vercel** and connected via GitHub:
- **Production Domain:** [https://glass-finance-local.vercel.app](https://glass-finance-local.vercel.app)
- **Deployment URL:** [https://glass-finance-local-acmdas7bf-shahnawaz-glass.vercel.app](https://glass-finance-local-acmdas7bf-shahnawaz-glass.vercel.app)
- **Status:** Ready 🟢
- **Source Branch:** `main`

---

## 🛠️ Features
- **Dashboard:** Premium financial overview and insights.
- **Banking:** Integrated local banking management.
- **Projects:** Track project budgets and allocations.
- **Reports:** Generate and export financial statements.
- **Hybrid Cloud Sync:** Bidirectional, self-healing state synchronization across **Supabase** and **Turso** databases.
- **Realtime DB Bulb Indicators:** Interactive live connection health check indicators for both databases.

---

## 🗄️ Hybrid Database Configuration

The application utilizes a hybrid database sync mechanism. To configure your local development environment, add the following variables to your [`.env.local`](file:///d:/code%201/new%20finance%20hr%20localag/.env.local) file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Turso (libSQL) Configuration
VITE_TURSO_URL=libsql://your-turso-database.turso.io
VITE_TURSO_AUTH_TOKEN=your-turso-auth-token
```

---

## 💻 Local Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
By default, the server runs on [http://localhost:3000/](http://localhost:3000/).

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```
