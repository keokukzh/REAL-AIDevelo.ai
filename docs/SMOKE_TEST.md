# Smoke Test Guide

## Prerequisites

1. **Supabase Setup:**
   - Create Supabase project at https://supabase.com
   - Get your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Settings → API
   - Get your `SUPABASE_ANON_KEY` (for frontend)

2. **Apply Database Schema:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `server/db/schema.sql`
   - Paste and run in SQL Editor
   - Verify tables created: `organizations`, `users`, `locations`, `agent_configs`, `phone_numbers`, `google_calendar_integrations`, `call_logs`, `porting_requests`

3. **Environment Variables:**

   **Backend (server/.env):**
   ```env
   NODE_ENV=development
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ELEVENLABS_API_KEY=your-elevenlabs-key
   ELEVENLABS_AGENT_ID_DEFAULT=your-agent-id (optional)
   PORT=5000
   ```

   **Frontend (.env):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Test Steps

### 1. Start Backend
```bash
cd server
npm install
npm run dev
```

Verify:
- Server starts on port 5000
- No errors in console
- `GET http://localhost:5000/api/health` returns `{ok: true}`

### 2. Start Frontend
```bash
npm install
npm run dev
```

Verify:
- Frontend starts on port 4000
- No errors in console
- Can access `http://localhost:4000`

### 3. Register/Login
1. Navigate to `http://localhost:4000/login`
2. Click "Registrieren" (Register)
3. Enter email and password (min 6 chars)
4. Click "Registrieren"
5. Should redirect to `/dashboard`

**Expected:**
- Registration succeeds
- Redirect to dashboard
- Dashboard shows welcome message + agent card

### 4. Test POST /api/agent/default (Idempotency)
Using browser DevTools Network tab or curl:

**First call:**
```bash
curl -X POST http://localhost:5000/api/agent/default \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Second call (same token):**
```bash
curl -X POST http://localhost:5000/api/agent/default \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:**
- Both calls return 200
- Same `user.id`, `organization.id`, `location.id`, `agent_config.id` in both responses
- No duplicate rows in Supabase

### 5. Test GET /api/dashboard/overview
```bash
curl http://localhost:5000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

**Expected:**
- Returns 200
- Response includes:
  - `user`, `organization`, `location`, `agent_config`
  - `status.agent`, `status.phone`, `status.calendar`
  - `recent_calls` (empty array for new account)

### 6. Test 401 Handling
1. Logout from dashboard
2. Try to access `/dashboard` directly
3. Should redirect to `/login` (NOT `/onboarding`)

**Expected:**
- Redirect to `/login`
- No redirect to `/onboarding` for auth errors

### 7. Test CORS
From browser console on `http://localhost:4000`:
```javascript
fetch('http://localhost:5000/api/health', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:**
- No CORS errors
- Returns `{ok: true, timestamp: "..."}`

## Verification Checklist

- [ ] `/api/health` returns `{ok: true}`
- [ ] CORS allows `http://localhost:4000`
- [ ] CORS allows `https://aidevelo.ai`
- [ ] CORS allows `https://*.pages.dev`
- [ ] 401 redirects to `/login` (not `/onboarding`)
- [ ] POST `/api/agent/default` is idempotent (2x same IDs)
- [ ] GET `/api/dashboard/overview` returns data
- [ ] Dashboard shows welcome + agent card (no blank screen)
- [ ] Login → Dashboard flow works

## Troubleshooting

### CORS Errors
- Check `server/src/app.ts` CORS configuration
- Verify origin matches allowed patterns
- Check browser console for exact origin

### 401 Errors
- Verify Supabase Access Token is valid
- Check `verifySupabaseAuth` middleware logs
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Database Errors
- Verify schema is applied in Supabase
- Check table names match schema.sql
- Verify foreign key constraints

### Build Errors
- Run `npm run build` in both `server/` and root
- Check TypeScript errors: `tsc --noEmit`
- Verify all imports are correct


