# Deployment Guide (Cloudflare + Backend)

## 1. Frontend (Cloudflare Pages) - **Recommended**

Your frontend is optimized for **Cloudflare Pages**. 

### Steps:
1. **Push your code** to GitHub.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
3. Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
4. Select this repository.
5. **Build Settings**:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend (see below). Example: `https://my-backend-app.onrender.com/api`

> **Note**: A `public/_redirects` file has been created to handle routing automatically (SPA support).

---

## 2. Backend (Node.js/Express)

Since your backend uses a long-running process (Express) and in-memory state, it **cannot** be deployed strictly as a standard Cloudflare Worker without significant refactoring (e.g., preventing data loss).

**Optimal Options:**

### Option A: Render (Easiest)
1. Provide your repo to [Render.com](https://render.com).
2. Create a **Web Service**.
3. **Root Directory**: `server`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`
6. Add Environment Variable: `ELEVENLABS_API_KEY`.

### Option B: Docker (Universal)
A `Dockerfile` has been enabled in the `server` folder for deploying to Fly.io, DigitalOcean, or Google Cloud Run.

```bash
cd server
docker build -t aidevelo-api .
docker run -p 5000:5000 aidevelo-api
```
