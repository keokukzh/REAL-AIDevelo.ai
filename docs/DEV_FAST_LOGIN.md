# Dev Fast Login - Schnelles Login für Development & E2E Tests

**Zweck:** Schnelles Login ohne kompliziertes OAuth-Hin-und-Her während Build/Test.

---

## 🎯 Übersicht

Dev-Bypass-Auth ermöglicht:
- **Development:** Sofort ins Dashboard ohne Login
- **E2E Tests:** Kein echtes OAuth nötig
- **Local Testing:** Seed-User/Seed-Location automatisch verfügbar

**Feature Flag:** `DEV_BYPASS_AUTH=true` (nur in dev/test, nie in production)

---

## 🔧 Setup

### 1. Environment Variables

**Backend (`.env` oder `server/.env`):**
```env
# Dev Bypass Auth (nur in development/test)
DEV_BYPASS_AUTH=true

# Seed User (optional, falls nicht gesetzt wird Default verwendet)
DEV_SEED_USER_EMAIL=dev@aidevelo.local
DEV_SEED_USER_ID=00000000-0000-0000-0000-000000000001

# Supabase (weiterhin benötigt für DB-Zugriff)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend (`.env.local`):**
```env
# Dev Bypass Auth (nur in development)
VITE_DEV_BYPASS_AUTH=true
```

**Wichtig:** `DEV_BYPASS_AUTH` wird **NIE** in Production aktiviert. Backend prüft `NODE_ENV !== 'production'`.

---

## 🏗️ Implementation

### Backend: Dev Bypass Auth Middleware

**Datei:** `server/src/middleware/devBypassAuth.ts` (neu)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './supabaseAuth';
import { supabaseAdmin } from '../services/supabaseDb';

/**
 * Dev Bypass Auth Middleware
 * ONLY active when DEV_BYPASS_AUTH=true AND NODE_ENV !== 'production'
 * Sets req.supabaseUser to seed user without token verification
 */
export const devBypassAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Only in development/test
  if (process.env.NODE_ENV === 'production') {
    return next(); // Skip bypass in production
  }

  // Check if bypass is enabled
  if (process.env.DEV_BYPASS_AUTH !== 'true') {
    return next(); // Skip bypass if not enabled
  }

  // Get seed user ID/email from ENV or use defaults
  const seedUserId = process.env.DEV_SEED_USER_ID || '00000000-0000-0000-0000-000000000001';
  const seedUserEmail = process.env.DEV_SEED_USER_EMAIL || 'dev@aidevelo.local';

  // Ensure seed user exists in DB
  try {
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, org_id, supabase_user_id, email')
      .eq('supabase_user_id', seedUserId)
      .maybeSingle();

    if (!existingUser) {
      // Create seed user + org + location
      const { data: newOrg } = await supabaseAdmin
        .from('organizations')
        .insert({ name: 'Dev Organization' })
        .select('id')
        .single();

      if (!newOrg) {
        throw new Error('Failed to create seed organization');
      }

      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({
          org_id: newOrg.id,
          supabase_user_id: seedUserId,
          email: seedUserEmail,
        })
        .select('id, org_id, supabase_user_id, email')
        .single();

      if (!newUser) {
        throw new Error('Failed to create seed user');
      }

      // Create default location
      const { data: newLocation } = await supabaseAdmin
        .from('locations')
        .insert({
          org_id: newOrg.id,
          name: 'Dev Location',
          timezone: 'Europe/Zurich',
        })
        .select('id')
        .single();

      if (!newLocation) {
        throw new Error('Failed to create seed location');
      }

      // Set user in request
      req.supabaseUser = {
        id: newUser.id,
        email: newUser.email || seedUserEmail,
        supabaseUserId: seedUserId,
      };

      console.log('[DevBypassAuth] ✅ Seed user created:', {
        userId: newUser.id,
        email: seedUserEmail,
        orgId: newOrg.id,
        locationId: newLocation.id,
      });
    } else {
      // User exists, set in request
      req.supabaseUser = {
        id: existingUser.id,
        email: existingUser.email || seedUserEmail,
        supabaseUserId: seedUserId,
      };

      console.log('[DevBypassAuth] ✅ Using existing seed user:', {
        userId: existingUser.id,
        email: existingUser.email,
      });
    }
  } catch (error) {
    console.error('[DevBypassAuth] ❌ Error setting up seed user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup dev bypass auth',
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Continue to next middleware
  next();
};
```

### Backend: Middleware Integration

**Datei:** `server/src/app.ts`

```typescript
import { devBypassAuth } from './middleware/devBypassAuth';
import { verifySupabaseAuth } from './middleware/supabaseAuth';

// ... existing code ...

// Auth Middleware: Use dev bypass in dev, otherwise Supabase auth
if (process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
  console.log('⚠️  [DevBypassAuth] Dev bypass auth ENABLED - skipping Supabase token verification');
  app.use('/api', devBypassAuth);
} else {
  app.use('/api', verifySupabaseAuth);
}
```

**Wichtig:** `devBypassAuth` muss **VOR** `verifySupabaseAuth` kommen, wenn aktiv.

---

### Frontend: Dev Quick Login Button

**Datei:** `src/components/auth/DevQuickLogin.tsx` (neu)

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const DevQuickLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Only show in development
  if (import.meta.env.VITE_DEV_BYPASS_AUTH !== 'true') {
    return null;
  }

  const handleQuickLogin = async () => {
    try {
      // Set mock user session
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@aidevelo.local',
      };

      setUser(mockUser);
      
      // Store in localStorage for API client
      localStorage.setItem('dev_user', JSON.stringify(mockUser));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('[DevQuickLogin] Error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleQuickLogin}
        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg shadow-lg font-semibold"
      >
        🚀 Dev Quick Login
      </button>
    </div>
  );
};
```

**Integration:** In `src/App.tsx` oder `src/pages/LoginPage.tsx` einbinden:

```typescript
import { DevQuickLogin } from './components/auth/DevQuickLogin';

// In LoginPage or App component:
{import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' && <DevQuickLogin />}
```

### Frontend: API Client Dev Bypass

**Datei:** `src/services/apiClient.ts`

```typescript
// Add dev bypass token if enabled
if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
  // In dev bypass mode, we don't need a real token
  // Backend will use dev bypass auth middleware
  config.headers.Authorization = 'Bearer dev-bypass-token';
}
```

---

## 🧪 E2E Tests mit Dev Bypass

**Datei:** `tests/e2e/helpers/auth.ts` (neu oder erweitern)

```typescript
import { Page } from '@playwright/test';

export async function devQuickLogin(page: Page) {
  // Set dev bypass flag in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('dev_user', JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@aidevelo.local',
    }));
  });

  // Navigate to dashboard (backend will use dev bypass auth)
  await page.goto('/dashboard');
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
}
```

**Verwendung in Tests:**

```typescript
import { test, expect } from '@playwright/test';
import { devQuickLogin } from '../helpers/auth';

test('Dashboard loads with dev bypass auth', async ({ page }) => {
  await devQuickLogin(page);
  
  // Test dashboard content
  await expect(page.locator('h1')).toContainText('Willkommen');
});
```

---

## 🔒 Security

**Wichtig:**
- `DEV_BYPASS_AUTH` wird **NIE** in Production aktiviert
- Backend prüft `NODE_ENV !== 'production'` vor Bypass
- Frontend zeigt Dev-Button nur wenn `VITE_DEV_BYPASS_AUTH === 'true'`
- Seed-User hat keine Admin-Rechte (nur normale User-Rechte)

**Production Check:**
```typescript
if (process.env.NODE_ENV === 'production' && process.env.DEV_BYPASS_AUTH === 'true') {
  console.error('🚨 SECURITY: DEV_BYPASS_AUTH cannot be enabled in production!');
  process.exit(1);
}
```

---

## 📝 Seed Data

**Automatisch erstellt:**
- Organization: "Dev Organization"
- User: `dev@aidevelo.local` (oder `DEV_SEED_USER_EMAIL`)
- Location: "Dev Location" (Europe/Zurich)
- Agent Config: Default Config (setup_state: 'needs_persona')

**Manuell seeden (optional):**
```sql
-- In Supabase SQL Editor
INSERT INTO organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Dev Organization')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, org_id, supabase_user_id, email)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'dev@aidevelo.local'
)
ON CONFLICT DO NOTHING;
```

---

## ✅ Verification

### Backend Test (curl)

**1. Set Environment Variables:**
```bash
export DEV_BYPASS_AUTH=true
export NODE_ENV=development
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**2. Start Server:**
```bash
cd server
npm run dev
```

**3. Test API (ohne Authorization Header):**
```bash
# Test dashboard overview (should work without token)
curl http://localhost:5000/api/dashboard/overview

# Expected: JSON response with dashboard data (seed user)
# Backend logs should show: [DevBypassAuth] ✅ Using dev bypass auth
```

**4. Test Phone Numbers API:**
```bash
curl http://localhost:5000/api/phone/numbers?country=CH

# Expected: JSON response with available phone numbers
```

### Frontend Test (UI)

**1. Set Environment Variables:**
```bash
# In .env.local or .env
VITE_DEV_BYPASS_AUTH=true
VITE_API_URL=http://localhost:5000/api
```

**2. Start Frontend:**
```bash
npm run dev
```

**3. Test Flow:**
- Open http://localhost:4000
- You should see "🚀 Dev Quick Login" button in bottom-right corner
- Click button → Should redirect to `/dashboard` immediately
- Dashboard should load without login screen
- All API calls should work (no 401 errors)

**4. Test Phone Connect:**
- Click "Telefon verbinden" button in Dashboard
- Modal should open and show available phone numbers
- Select a number and click "Nummer zuweisen"
- Should show success toast and refresh dashboard

### E2E Test (Playwright)

**1. Set Environment Variables in test setup:**
```typescript
// tests/e2e/helpers/auth.ts
process.env.DEV_BYPASS_AUTH = 'true';
process.env.NODE_ENV = 'test';
```

**2. Use dev bypass in tests:**
```typescript
// Tests can navigate directly to /dashboard without login
await page.goto('/dashboard');
// Backend will use dev bypass auth automatically
```

---

## 🐛 Troubleshooting

**Problem:** Dev Bypass Auth funktioniert nicht

**Lösung:**
1. Prüfe `DEV_BYPASS_AUTH=true` in `.env`
2. Prüfe `NODE_ENV !== 'production'`
3. Prüfe Backend-Logs: `[DevBypassAuth] ✅ Seed user created`
4. Prüfe Frontend: Dev-Button sichtbar?

**Problem:** Seed User wird nicht erstellt

**Lösung:**
1. Prüfe Supabase Connection (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. Prüfe Backend-Logs für Fehler
3. Prüfe DB: `SELECT * FROM users WHERE supabase_user_id = '00000000-0000-0000-0000-000000000001'`

---

## 📚 Referenzen

- [ROADMAP_REVISED.md](ROADMAP_REVISED.md) - Roadmap mit Dev-Bypass-Integration
- [SMOKE_TEST.md](SMOKE_TEST.md) - Smoke Test Guide
