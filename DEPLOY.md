# Deployment Guide (Cloudflare + Backend)

## 1. Frontend: Cloudflare Pages (Recommended)

This project is optimized for **Cloudflare Pages** as a Single Page Application (SPA).

### Prerequisites
- Cloudflare Account
- GitHub Repository connected
- Node.js & npm (for local development)

### Option A: Git Integration (Easiest)
1. Push your code to GitHub.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
3. Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
4. Select `REAL-AIDevelo.ai`.
5. **Build Settings**:
   - **Framework**: `React` (or `Vite`)
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: URL of your backend (e.g., `https://api.yourdomain.com/api`)
7. Click **Save and Deploy**.

> **Note**: Routing is handled automatically by `public/_redirects`.

### Option B: CLI Deployment (Advanced)
If you prefer deploying from your terminal:

1. **Install Wrangler**: `npm install -D wrangler` (Already done)
2. **Set Secrets** (locally or in CI):
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `CF_PAGES_PROJECT_NAME` (e.g., `aidevelo-web`)
3. **Run Deployment**:
   ```bash
   npm run deploy:cf
   ```
   *This builds the project and uploads the `dist` folder directly to Cloudflare.*

### Option C: GitHub Actions (CI/CD)
A workflow is already set up in `.github/workflows/cloudflare-pages.yml`.
1. Go to your GitHub Repo > **Settings** > **Secrets and variables** > **Actions**.
2. Add the following Repository Secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (Template: Edit Cloudflare Workers)
   - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID (found in Cloudflare URL/Dashboard)
3. Push to `main` to trigger auto-deployment.

---

## 2. Backend (Node.js/Express)

The backend requires a persistent environment (container) and cannot run as a standard Edge Worker.

### Deployment Options

#### Docker (Universal)
A `server/Dockerfile` is ready for use.
1. Build: `docker build -t aidevelo-api ./server`
2. Run: `docker run -p 5000:5000 --env-file ./server/.env aidevelo-api`

#### Render / Railway / Fly.io
1. Connect your repo.
2. Set **Root Directory** to `server`.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `ELEVENLABS_API_KEY`: Your key.

---

## 3. Development Check
- **Build**: `npm run build` creates the `dist/` folder.
- **Routing**: `public/_redirects` ensures all paths route to `index.html` (SPA behavior).
- **Vite Config**: Default `base: '/'` is set for root domain deployment.
