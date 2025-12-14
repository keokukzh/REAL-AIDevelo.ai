# Browser Test Checklist - Dashboard Overview

**Purpose:** Capture production behavior of GET /api/dashboard/overview after login

---

## Pre-Test Setup

1. âœ… Open **Incognito/Private** browser window (clears cached auth)
2. âœ… Open **DevTools** (F12)
3. âœ… Go to **Network** tab
4. âœ… Enable **Preserve log** checkbox

---

## Test Steps

### Step 1: Login

1. Navigate to: https://aidevelo.ai/login
2. Complete login flow (email/password or magic link)
3. Wait for redirect to /dashboard

### Step 2: Capture Dashboard Request

1. In Network tab, find request: GET /api/dashboard/overview
2. Click on the request to view details

### Step 3: Record Request Details

**Request Headers:**
- [ ] Authorization: Bearer <token> (should be present)
- [ ] Content-Type: application/json
- [ ] Accept: application/json

### Step 4: Record Response Details

**Response Status:**
- [ ] Status Code: ___ (200, 401, 500, etc.)

**Response Headers:**
- [ ] x-aidevelo-proxy: 1 (should be present if proxy is active)
- [ ] x-aidevelo-auth-present: ___ (0 or 1)
- [ ] x-aidevelo-backend-sha: ___ (commit hash)

**Response Body:**
- [ ] Copy full response body (JSON)
- [ ] If error, note: error, step, equestId fields

---

## Test Results Template

Paste your results below:

\\\
=== BROWSER TEST RESULTS ===

Date: ___________
Browser: ___________
Status Code: ___________

Response Headers:
x-aidevelo-proxy: ___________
x-aidevelo-auth-present: ___________
x-aidevelo-backend-sha: ___________

Response Body:
<PASTE JSON HERE>

Additional Notes:
___________
\\\

---

## Expected Results

### âœ… Success Case (200 OK)

**Headers:**
\\\
x-aidevelo-proxy: 1
x-aidevelo-auth-present: 1
x-aidevelo-backend-sha: <commit-hash>
\\\

**Body:**
\\\json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "organization": { "id": "...", "name": "..." },
    "location": { "id": "...", "name": "...", "timezone": "..." },
    "agent_config": { "id": "...", "setup_state": "..." },
    "status": { "agent": "...", "phone": "...", "calendar": "..." },
    "recent_calls": []
  }
}
\\\

### âŒ 401 Unauthorized

**If x-aidevelo-auth-present: 0:**
- Problem: Proxy not forwarding Authorization header
- See: STEP 2.A in DASHBOARD_FIX_PLAN.md

**If x-aidevelo-auth-present: 1:**
- Problem: Backend rejecting token (Supabase env mismatch)
- See: STEP 2.B in DASHBOARD_FIX_PLAN.md

### âŒ 500 Internal Server Error

**Response should include:**
\\\json
{
  "error": "Failed to get dashboard overview",
  "step": "ensureUserRow|ensureOrgForUser|ensureDefaultLocation|ensureAgentConfig",
  "requestId": "req-1234567890-abc123"
}
\\\

**Next Steps:**
- Use equestId to find logs in Render Dashboard
- See: STEP 3 in DASHBOARD_FIX_PLAN.md

---

## Troubleshooting

### Request Not Appearing in Network Tab

1. Check if page loaded successfully
2. Check Console tab for JavaScript errors
3. Verify you're logged in (check Application â†’ Cookies â†’ sb-<project>-auth-token)

### Authorization Header Missing

1. Check Application â†’ Local Storage â†’ Supabase auth
2. Verify token exists: sb-<project>-auth-token
3. If missing, re-login

### Proxy Not Active (x-aidevelo-proxy missing)

1. Verify Cloudflare Pages Function is deployed
2. Check unctions/api/[[splat]].ts exists
3. Verify public/_routes.json includes /api/* route

---

## Next Steps After Test

1. **If 200 OK:** âœ… Dashboard is working - proceed to verification (STEP 4)
2. **If 401:** Follow STEP 2 in DASHBOARD_FIX_PLAN.md
3. **If 500:** Follow STEP 3 in DASHBOARD_FIX_PLAN.md
4. **If other:** Document error and check Render logs
