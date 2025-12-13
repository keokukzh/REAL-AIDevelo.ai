# Cloudflare Pages Setup

## Build Settings

### Framework Preset
- **Framework**: Vite
- **Build command**: `npm ci && npm run build`
- **Output directory**: `dist`
- **Root directory**: `/` (root of repo)

### Node Version
- Set via `.nvmrc` file (Node 20)
- Or in `package.json` engines: `"node": ">=20.0.0"`

### SPA Routing
- File: `public/_redirects`
- Content: `/* /index.html 200`
- This ensures React Router works on Cloudflare Pages (no 404 on refresh)

## Environment Variables

### Production Environment
Set these in Cloudflare Pages Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://real-aidevelo-ai.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Preview Environment (for PR previews)
Same variables as Production, but can use different values for testing.

**Important:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend (server-only)
- Only `VITE_` prefixed variables are available in client bundle
- All other env vars are server-side only

## Deployment

### Automatic Deployments
- Connect GitHub repository to Cloudflare Pages
- Automatic deployments on push to `main` branch
- Preview deployments for pull requests

### Manual Deployment
```bash
npm run build
wrangler pages deploy dist --project-name aidevelo-ai
```

## CORS Configuration

Backend (Render) must allow:
- `https://aidevelo.ai` (production)
- `https://*.pages.dev` (Cloudflare Pages previews)
- `http://localhost:4000` (local dev)

Already configured in `server/src/app.ts`.

## Troubleshooting

### Build Fails
- Check Node version (should be 20+)
- Verify `package.json` engines
- Check build logs in Cloudflare Pages dashboard

### SPA Routing 404
- Ensure `public/_redirects` exists with `/* /index.html 200`
- Verify file is in `public/` directory (not `src/public/`)

### Environment Variables Not Working
- Variables must start with `VITE_` to be available in client
- Rebuild after adding new variables
- Check browser console for undefined values

### CORS Errors
- Verify backend CORS allows Cloudflare Pages origin
- Check `Access-Control-Allow-Origin` header in network tab
- Ensure `Authorization` header is allowed
