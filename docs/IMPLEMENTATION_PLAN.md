# Implementation Plan - Roadmap Revision

**Datum:** 2025-01-XX  
**Status:** Ready for Implementation

---

## 📊 Repo-Analyse

### Was existiert bereits

**Backend:**
- ✅ Supabase Auth Middleware (`server/src/middleware/supabaseAuth.ts`)
- ✅ Phone Controller & Routes (`server/src/controllers/phoneController.ts`, `server/src/routes/phoneRoutes.ts`)
- ✅ Calendar Service (`server/src/services/calendarService.ts`) - aber Tokens in-memory
- ✅ Calendar Routes (`server/src/routes/calendarRoutes.ts`)
- ✅ Calls Controller (`server/src/controllers/callsController.ts`)
- ✅ RAG VectorStore Service (`server/src/voice-agent/rag/vectorStore.ts`)
- ✅ ElevenLabs Streaming Client (`server/src/voice-agent/voice/elevenLabsStreaming.ts`)
- ✅ Twilio Service (`server/src/services/twilioService.ts`)
- ✅ Supabase DB Service (`server/src/services/supabaseDb.ts`) - `ensureDefaultLocation()`, `ensureUserRow()`

**Frontend:**
- ✅ Dashboard Page (`src/pages/DashboardPage.tsx`)
- ✅ Dashboard Overview Hook (`src/hooks/useDashboardOverview.ts`)
- ✅ Status Cards (`src/components/dashboard/StatusCard.tsx`)
- ✅ Calendar Integration Component (`src/components/CalendarIntegration.tsx`)
- ✅ Auth Context (`src/contexts/AuthContext.tsx`)

**Was fehlt:**
- ❌ Dev-Bypass-Auth Middleware
- ❌ Phone Connect Modal
- ❌ Webhook Status Modal
- ❌ Test Call Endpoint & UI
- ❌ Calls Detail Page & Modal
- ❌ Calendar Token DB Persistierung
- ❌ Calendar Token Auto-Refresh
- ❌ RAG Documents API & UI
- ❌ Media Streams Bridge
- ❌ Feature Flags (ENABLE_BILLING, DEV_BYPASS_AUTH)

---

## 🔧 Code-Änderungsvorschläge

### 1. Dev-Bypass-Auth Middleware

**Neue Datei:** `server/src/middleware/devBypassAuth.ts`

**Funktion:**
- Prüft `DEV_BYPASS_AUTH=true` und `NODE_ENV !== 'production'`
- Erstellt Seed-User/Org/Location falls nicht vorhanden
- Setzt `req.supabaseUser` ohne Token-Verifikation

**Integration in `server/src/app.ts`:**
```typescript
import { devBypassAuth } from './middleware/devBypassAuth';
import { verifySupabaseAuth } from './middleware/supabaseAuth';

// Before API routes:
if (process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
  console.log('⚠️  [DevBypassAuth] Dev bypass auth ENABLED');
  app.use('/api', devBypassAuth);
} else {
  app.use('/api', verifySupabaseAuth);
}
```

---

### 2. Environment Variables Update

**Datei:** `server/.env.example` (oder `.env.example` im Root)

**Hinzufügen:**
```env
# Dev Bypass Auth (nur in development/test)
DEV_BYPASS_AUTH=false
DEV_SEED_USER_EMAIL=dev@aidevelo.local
DEV_SEED_USER_ID=00000000-0000-0000-0000-000000000001

# Feature Flags
ENABLE_BILLING=false
ENABLE_DEMO_AGENT=false

# Public Base URL (für Webhooks)
PUBLIC_BASE_URL=http://localhost:5000
```

**Datei:** `.env.example` (Root, für Frontend)

**Hinzufügen:**
```env
# Dev Bypass Auth (nur in development)
VITE_DEV_BYPASS_AUTH=false
```

**Datei:** `server/src/config/env.ts`

**Hinzufügen:**
```typescript
export const config = {
  // ... existing config ...
  devBypassAuth: process.env.DEV_BYPASS_AUTH === 'true',
  devSeedUserEmail: process.env.DEV_SEED_USER_EMAIL || 'dev@aidevelo.local',
  devSeedUserId: process.env.DEV_SEED_USER_ID || '00000000-0000-0000-0000-000000000001',
  enableBilling: process.env.ENABLE_BILLING === 'true',
  enableDemoAgent: process.env.ENABLE_DEMO_AGENT === 'true',
};
```

---

### 3. Calendar Token DB Persistierung

**Datei:** `server/src/services/calendarService.ts`

**Änderungen:**
- `storeToken()`: Speichert in `google_calendar_integrations` Tabelle
- `getToken()`: Lädt aus DB statt in-memory Map
- `refreshTokenIfNeeded()`: Prüft `expiry_ts` und refresht bei Bedarf
- Encryption: `refresh_token_encrypted` mit `TOKEN_ENCRYPTION_KEY`

**Neue Funktionen:**
```typescript
async storeTokenInDb(locationId: string, token: CalendarToken): Promise<void> {
  // Encrypt refresh token
  const encryptedRefreshToken = encrypt(token.refreshToken, process.env.TOKEN_ENCRYPTION_KEY);
  
  // Store in DB
  await supabaseAdmin.from('google_calendar_integrations').upsert({
    location_id: locationId,
    refresh_token_encrypted: encryptedRefreshToken,
    access_token: token.accessToken,
    expiry_ts: new Date(token.expiresAt).toISOString(),
    connected_email: token.email || null,
  });
}

async getTokenFromDb(locationId: string): Promise<CalendarToken | null> {
  // Load from DB
  const { data } = await supabaseAdmin
    .from('google_calendar_integrations')
    .select('*')
    .eq('location_id', locationId)
    .maybeSingle();
  
  if (!data) return null;
  
  // Decrypt refresh token
  const refreshToken = decrypt(data.refresh_token_encrypted, process.env.TOKEN_ENCRYPTION_KEY);
  
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: new Date(data.expiry_ts).getTime(),
    provider: 'google',
  };
}
```

---

### 4. Phone Connect Modal

**Neue Datei:** `src/components/dashboard/PhoneConnectModal.tsx`

**Features:**
- `usePhoneNumbers()` Hook für `GET /api/phone/numbers`
- Nummer auswählen (Dropdown)
- Connect Button (`POST /api/phone/connect`)
- Loading/Error States
- Success Toast → Dashboard Refresh

**Hook:** `src/hooks/usePhoneNumbers.ts` (neu)
```typescript
export function usePhoneNumbers(country = 'CH') {
  return useQuery({
    queryKey: ['phone', 'numbers', country],
    queryFn: () => apiRequest<PhoneNumber[]>('/phone/numbers?country=' + country),
  });
}
```

---

### 5. Webhook Status Modal

**Neue Datei:** `src/components/dashboard/WebhookStatusModal.tsx`

**Features:**
- `useWebhookStatus()` Hook für `GET /api/phone/webhook-status`
- Voice URL anzeigen
- Status Callback URL anzeigen
- Copy-Buttons für beide URLs

**Hook:** `src/hooks/useWebhookStatus.ts` (neu)

---

### 6. Test Call Endpoint & UI

**Datei:** `server/src/controllers/dashboardController.ts` (neu oder erweitern)

**Neuer Endpoint:**
```typescript
export const testCall = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Get location_id from user
  const locationId = await getLocationIdForUser(req.supabaseUser!.id);
  
  // Get agent config for admin_test_number
  const { data: agentConfig } = await supabaseAdmin
    .from('agent_configs')
    .select('admin_test_number')
    .eq('location_id', locationId)
    .single();
  
  if (!agentConfig?.admin_test_number) {
    return next(new BadRequestError('Admin test number not configured'));
  }
  
  // Get phone number for location
  const { data: phoneNumber } = await supabaseAdmin
    .from('phone_numbers')
    .select('e164')
    .eq('location_id', locationId)
    .eq('status', 'connected')
    .single();
  
  if (!phoneNumber) {
    return next(new BadRequestError('No phone number connected'));
  }
  
  // Make Twilio call
  const call = await twilioService.makeCall(
    phoneNumber.e164,
    agentConfig.admin_test_number,
    `${process.env.PUBLIC_BASE_URL}/api/twilio/voice/inbound`
  );
  
  res.json({ success: true, callSid: call.sid });
};
```

**UI:** `src/components/dashboard/TestCallModal.tsx` (neu)

---

### 7. Calls Detail Page

**Neue Datei:** `src/pages/CallsPage.tsx`

**Features:**
- Tabelle mit Calls (`useCallLogs()` Hook)
- Filter: Datum, Status, Richtung
- Pagination
- Call Details Modal öffnen

**Hook:** `src/hooks/useCallLogs.ts` (neu oder erweitern)

---

### 8. Feature Flag für Billing

**Datei:** `server/src/config/env.ts`

**Hinzufügen:**
```typescript
enableBilling: process.env.ENABLE_BILLING === 'true',
```

**Verwendung:**
```typescript
if (config.enableBilling) {
  // Billing routes
  app.use('/api/billing', billingRoutes);
}
```

**Frontend:** Conditional Rendering
```typescript
{config.enableBilling && <BillingPage />}
```

---

## 📝 Next Steps

### Sofort starten (Phase 1.1):

1. **Dev-Bypass-Auth implementieren**
   - `server/src/middleware/devBypassAuth.ts` erstellen
   - In `server/src/app.ts` integrieren
   - `.env.example` aktualisieren
   - Test: Backend starten, API ohne Token aufrufen

2. **Phone Connect Modal**
   - `src/components/dashboard/PhoneConnectModal.tsx` erstellen
   - `src/hooks/usePhoneNumbers.ts` erstellen
   - In Dashboard integrieren
   - Test: Modal öffnen, Nummer auswählen, Connect

3. **Webhook Status Modal**
   - `src/components/dashboard/WebhookStatusModal.tsx` erstellen
   - `src/hooks/useWebhookStatus.ts` erstellen
   - In Dashboard integrieren
   - Test: Modal öffnen, URLs anzeigen, Copy testen

### Nach Phase 1:

4. **Test Call Endpoint & UI**
5. **Calls Detail Page**
6. **Phase 2: Calendar Tokens**
7. **Phase 3: RAG Knowledge Base**
8. **Phase 4: Media Streams Bridge**

---

## ✅ Definition of Done Checklist

Für jede Story:

- [ ] UI Flow fertig (Modal/Seite)
- [ ] Loading/Error States implementiert
- [ ] Backend Endpoint fertig
- [ ] Postman/curl Beispiel dokumentiert
- [ ] Status/Cache Refresh im Dashboard
- [ ] Minimal Logging
- [ ] Klare Fehlermeldungen
- [ ] Keine Stripe-Abhängigkeiten
- [ ] E2E Test oder manueller Test dokumentiert

---

## 🔗 Referenzen

- [ROADMAP_REVISED.md](ROADMAP_REVISED.md) - Vollständige Roadmap
- [DEV_FAST_LOGIN.md](DEV_FAST_LOGIN.md) - Dev-Bypass-Auth Setup
- [API_DOCUMENTATION.md](../server/API_DOCUMENTATION.md) - API Docs
