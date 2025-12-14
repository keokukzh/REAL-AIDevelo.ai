# Dashboard Optimierung – Vorbereitungsdokument

## 1. Aktuelle Dashboard Datenquellen

### 1.1 API Endpoint: `GET /api/dashboard/overview`

**Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 223-399)

**Response Schema:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 51-67)

```typescript
{
  success: true,
  data: {
    user: { id: UUID, email: string | null },
    organization: { id: UUID, name: string },
    location: { id: UUID, name: string, timezone: string },
    agent_config: {
      id: UUID,
      eleven_agent_id: string | null,
      setup_state: string,  // 'needs_persona' | 'needs_business' | 'needs_phone' | 'needs_calendar' | 'ready'
      persona_gender: string | null,  // 'male' | 'female'
      persona_age_range: string | null,  // '18-25' | '25-35' | '35-45' | '45-55' | '55+'
      goals_json: string[],
      services_json: any[],
      business_type: string | null  // 'barber' | 'salon' | 'restaurant' | 'general' | 'unknown'
    },
    status: {
      agent: 'ready' | 'needs_setup',
      phone: 'not_connected' | 'connected' | 'needs_compliance',
      calendar: 'not_connected' | 'connected'
    },
    recent_calls: Array<{
      id: UUID,
      direction: 'inbound' | 'outbound',
      from_e164: string | null,
      to_e164: string | null,
      started_at: ISO8601 string,
      ended_at: ISO8601 string | null,
      duration_sec: number | null,
      outcome: string | null
    }>,
    phone_number?: string | null,  // e164 or customer_public_number
    calendar_provider?: string | null,  // 'google' | null
    last_activity?: string | null  // ISO8601 timestamp (most recent call)
  }
}
```

**Header:** `x-aidevelo-backend-sha` (Git commit SHA für Backend-Version)

### 1.2 Datenquellen-Mapping

#### `agent_config` Felder
- **Quelle:** Tabelle `agent_configs` (1:1 mit `locations`)
- **Referenz:** [`server/db/schema.sql`](server/db/schema.sql) (Zeilen 33-47)
- **Default:** [`server/src/services/supabaseDb.ts`](server/src/services/supabaseDb.ts) (Zeilen 217-287)
  - `setup_state`: DEFAULT 'needs_persona'
  - `persona_gender`: DEFAULT 'female'
  - `persona_age_range`: DEFAULT '25-35'
  - `business_type`: DEFAULT 'general'
  - `goals_json`: DEFAULT '[]'::JSONB
  - `services_json`: DEFAULT '[]'::JSONB

#### `status.agent` Logik
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 137-139, 283-285)
- **Berechnung:** `agentConfig.setup_state === 'ready' ? 'ready' : 'needs_setup'`

#### `status.phone` Logik
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 111-125, 255-270)
- **Quelle:** Tabelle `phone_numbers.status`
- **Mapping:**
  - DB: `'connected'` → API: `'connected'`
  - DB: `'compliance_needed'` → API: `'needs_compliance'`
  - DB: `'not_connected'` oder fehlend → API: `'not_connected'`
- **Schema:** [`server/db/schema.sql`](server/db/schema.sql) (Zeilen 50-60) – Status: `'not_connected' | 'connected'` (DEFAULT 'not_connected')

#### `status.calendar` Logik
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 127-135, 272-281)
- **Quelle:** Tabelle `google_calendar_integrations` (EXISTS check)
- **Berechnung:** `calendarData ? 'connected' : 'not_connected'`

#### `recent_calls` Logik
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 287-302)
- **Quelle:** Tabelle `call_logs`
- **Query:** `SELECT ... WHERE location_id = ? ORDER BY started_at DESC LIMIT 10`
- **Schema:** [`server/db/schema.sql`](server/db/schema.sql) (Zeilen 75-88)

#### `last_activity` Logik
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeilen 299-302)
- **Berechnung:** `recentCalls[0]?.started_at || null`

### 1.3 Frontend Hook

**Referenz:** [`src/hooks/useDashboardOverview.ts`](src/hooks/useDashboardOverview.ts)

- **Query Key:** `['dashboard', 'overview']`
- **Stale Time:** 30 Sekunden
- **Retry:** 1x (außer bei 401)
- **Auth Check:** Supabase Session vor Query-Enable

---

## 2. Definitionen: "Agent aktiv" Kriterien + Edge Cases

### 2.1 Primäres Kriterium

**Referenz:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeile 118)

```typescript
const isAgentActive = overview.agent_config.setup_state === 'ready';
```

**Status-Mapping:**
- `setup_state === 'ready'` → `status.agent = 'ready'` → UI: "Agent: Aktiv" (grün)
- `setup_state !== 'ready'` → `status.agent = 'needs_setup'` → UI: "Agent: Einrichtung nötig" (gelb)

### 2.2 Setup State Werte

**Referenz:** [`server/src/controllers/agentConfigController.ts`](server/src/controllers/agentConfigController.ts) (Zeile 19)

**Gültige Werte:**
- `'needs_persona'` (DEFAULT)
- `'needs_business'`
- `'needs_phone'`
- `'needs_calendar'`
- `'ready'`

**Wizard-Flow:** [`src/components/dashboard/SetupWizard.tsx`](src/components/dashboard/SetupWizard.tsx) (Zeilen 53-93)
- `persona` → `needs_business`
- `business` → `needs_phone`
- `services` → `needs_calendar`
- `goals` → `needs_calendar`
- `confirm` → `ready`

### 2.3 Edge Cases

#### Edge Case 1: `setup_state` ist `null` oder `undefined`
- **Aktuelles Verhalten:** TypeScript erwartet `string`, DB DEFAULT ist `'needs_persona'`
- **Risiko:** Niedrig (DB Constraint)
- **Empfehlung:** Fallback `|| 'needs_persona'` im Frontend

#### Edge Case 2: `setup_state === 'ready'` aber `eleven_agent_id === null`
- **Aktuelles Verhalten:** Agent gilt als aktiv, auch ohne ElevenLabs Agent ID
- **Referenz:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeile 157)
- **Risiko:** Mittel (Agent kann nicht funktionieren ohne ElevenLabs Agent)
- **Empfehlung:** Zusätzliche Validierung: `setup_state === 'ready' && eleven_agent_id !== null`

#### Edge Case 3: `setup_state === 'ready'` aber Phone/Calendar nicht verbunden
- **Aktuelles Verhalten:** Agent gilt als aktiv, auch wenn Telefon/Kalender fehlen
- **Referenz:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeilen 118-124)
- **Risiko:** Niedrig (Agent kann trotzdem funktionieren, nur eingeschränkt)
- **Empfehlung:** Optional: "Warnung" Status wenn `ready` aber Phone/Calendar fehlen

#### Edge Case 4: Race Condition bei gleichzeitigen Updates
- **Aktuelles Verhalten:** Supabase Row-Level Locking
- **Referenz:** [`server/src/services/supabaseDb.ts`](server/src/services/supabaseDb.ts) (Zeilen 265-286)
- **Risiko:** Niedrig (Unique Constraint + Retry-Logic vorhanden)

#### Edge Case 5: `setup_state` manuell auf `'ready'` gesetzt ohne Wizard
- **Aktuelles Verhalten:** Möglich via PATCH `/api/dashboard/agent/config`
- **Referenz:** [`server/src/routes/dashboardRoutes.ts`](server/src/routes/dashboardRoutes.ts) (Zeile 18)
- **Risiko:** Niedrig (Admin-Feature)
- **Empfehlung:** Validierung: Mindestens `persona_gender` und `business_type` müssen gesetzt sein

---

## 3. UI Struktur-Vorschlag

### 3.1 Aktuelle Struktur

**Referenz:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeilen 150-348)

**Sections (Top-to-Bottom):**
1. **Welcome Header** (Zeilen 152-156)
2. **SystemHealth** (Zeilen 158-164)
3. **SetupWizard** (conditional, Zeilen 166-171)
4. **Status Cards Row** (4 Cards, Zeilen 173-328)
   - Agent Card
   - Phone/Twilio Card
   - Calendar Card
   - Calls/Logs Card
5. **Quick Actions** (Zeilen 330-342)
6. **Recent Calls Table** (Zeilen 344-347)

### 3.2 Vorschlag: Optimierte Struktur

```
┌─────────────────────────────────────────────────────────┐
│ Welcome Header + SystemHealth (kompakt, 1 Zeile)        │
├─────────────────────────────────────────────────────────┤
│ SetupWizard (conditional, nur wenn setup_state !== ready)│
├─────────────────────────────────────────────────────────┤
│ Status Cards Grid (4 Cards, responsive)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Agent    │ │ Phone    │ │ Calendar │ │ Calls    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────┤
│ Quick Actions (horizontal, kompakt)                     │
├─────────────────────────────────────────────────────────┤
│ Recent Calls Table (expandable, pagination)              │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Komponentenliste (aktuell + Vorschlag)

#### Bestehende Komponenten
- **StatusCard** [`src/components/dashboard/StatusCard.tsx`](src/components/dashboard/StatusCard.tsx)
  - Props: `title`, `status`, `statusText`, `children`, `actions`
  - Status: `'active' | 'warning' | 'inactive'`
- **SystemHealth** [`src/components/dashboard/SystemHealth.tsx`](src/components/dashboard/SystemHealth.tsx)
  - Props: `backendSha`, `lastRefresh`
- **QuickActions** [`src/components/dashboard/QuickActions.tsx`](src/components/dashboard/QuickActions.tsx)
  - Props: `actions: Array<{ label, onClick, disabled?, tooltip? }>`
- **RecentCallsTable** [`src/components/dashboard/RecentCallsTable.tsx`](src/components/dashboard/RecentCallsTable.tsx)
  - Props: `calls: Call[]`
- **SetupWizard** [`src/components/dashboard/SetupWizard.tsx`](src/components/dashboard/SetupWizard.tsx)
  - Props: `onComplete`

#### Vorschlag: Neue Komponenten
1. **StatusCardEnhanced** (erweitert StatusCard)
   - Props: `icon?`, `metrics?: { label, value }[]`, `onClick?`
   - Features: Hover-Effekte, Click-to-Expand
2. **MetricsWidget**
   - Props: `title`, `value`, `change?`, `trend?`
   - Features: Anzeige von Trends (↑/↓), Prozent-Änderungen
3. **CallStatsCard**
   - Props: `totalCalls`, `avgDuration`, `successRate`
   - Features: Mini-Charts (optional)
4. **ConnectionStatusBadge**
   - Props: `type: 'phone' | 'calendar'`, `status`, `lastSync?`
   - Features: Auto-Refresh-Indicator, Last-Sync-Timestamp
5. **EmptyState**
   - Props: `icon?`, `title`, `description`, `action?`
   - Features: Für leere Calls-Liste, keine Phone-Nummer, etc.

### 3.4 Responsive Layout

**Aktuell:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeile 174)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Vorschlag:** Beibehalten, aber:
- Mobile: 1 Spalte
- Tablet: 2 Spalten
- Desktop: 4 Spalten
- Optional: 5. Card für "System Metrics" (nur Desktop)

---

## 4. API Vorschlag: Extra `/api/dashboard/status` Endpoint?

### 4.1 Aktuelle Situation

**Endpoint:** `GET /api/dashboard/overview`
- **Payload:** ~2-3 KB (inkl. recent_calls, agent_config, etc.)
- **Stale Time:** 30 Sekunden (Frontend)
- **Query-Zeit:** ~200-500ms (abhängig von DB-Load)

**Referenz:** [`src/hooks/useDashboardOverview.ts`](src/hooks/useDashboardOverview.ts) (Zeile 114)

### 4.2 Option A: Kein separater Status-Endpoint (EMPFOHLEN)

**Begründung:**
- `overview` enthält bereits alle Status-Informationen
- `status` Objekt ist kompakt (~50 Bytes)
- Keine Redundanz nötig
- Einfacheres Caching (1 Query Key)

**Optimierung statt neuer Endpoint:**
- **Polling-Intervall erhöhen:** 30s → 60s für Status-Cards
- **Separate Query für Calls:** `useRecentCalls()` mit längerem Stale Time
- **Optimistic Updates:** Bei PATCH `/api/dashboard/agent/config` sofort UI updaten

**Referenz:** TanStack Query `staleTime` kann pro Query unterschiedlich sein

### 4.3 Option B: Separater Status-Endpoint (NUR bei Bedarf)

**Endpoint:** `GET /api/dashboard/status`
- **Payload:** Nur `status` Objekt (~100 Bytes)
- **Use Case:** Polling für Status-Badges ohne Full Reload
- **Nachteil:** Zusätzliche Route, mehr Komplexität

**Nur sinnvoll wenn:**
- Status-Updates sehr häufig (alle 5-10 Sekunden)
- `overview` Payload zu groß wird (>10 KB)
- Separate Caching-Strategien nötig

### 4.4 Empfehlung

**KEIN separater Status-Endpoint nötig.**

**Stattdessen:**
1. **Query Splitting:** `useDashboardOverview()` für Basis-Daten, `useRecentCalls()` für Calls (längerer Stale Time)
2. **Optimistic Updates:** Bei Config-Updates sofort UI updaten
3. **Background Refetch:** TanStack Query `refetchInterval` für Status-Cards (optional)

---

## 5. Feature-Liste

### 5.1 Quick Win Features (5)

#### 1. **Call-Details Modal**
- **Beschreibung:** Klick auf Call-Row öffnet Modal mit Details (Dauer, Outcome, Notes)
- **Aufwand:** 2-3 Stunden
- **Komponenten:** Neues `CallDetailsModal.tsx`
- **API:** Keine Änderung (Daten bereits in `recent_calls`)

#### 2. **Status Card Hover-Tooltips**
- **Beschreibung:** Hover über Status-Badge zeigt zusätzliche Info (z.B. "Letzte Sync: vor 5 Min")
- **Aufwand:** 1 Stunde
- **Komponenten:** Erweitere `StatusCard.tsx`

#### 3. **Phone Number Formatierung**
- **Beschreibung:** E.164 → lesbares Format (z.B. `+41 44 123 45 67`)
- **Referenz:** [`src/components/dashboard/RecentCallsTable.tsx`](src/components/dashboard/RecentCallsTable.tsx) (Zeilen 26-30)
- **Aufwand:** 1 Stunde
- **Library:** `libphonenumber-js` (optional)

#### 4. **Last Activity Badge mit Relativ-Zeit**
- **Beschreibung:** "Letzte Aktivität: vor 2 Stunden" statt absoluter Zeit
- **Referenz:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeilen 141-148)
- **Aufwand:** 1 Stunde
- **Library:** `date-fns` `formatDistanceToNow`

#### 5. **Quick Actions Keyboard Shortcuts**
- **Beschreibung:** `Ctrl+K` öffnet Command Palette für Quick Actions
- **Aufwand:** 3-4 Stunden
- **Library:** `cmdk` oder `kbar`

### 5.2 Später Features (5)

#### 1. **Call Analytics Dashboard**
- **Beschreibung:** Charts für Call-Volume, Success-Rate, Avg Duration (letzte 30 Tage)
- **Aufwand:** 1-2 Tage
- **API:** Neuer Endpoint `GET /api/dashboard/analytics`
- **Library:** `recharts` oder `chart.js`

#### 2. **Real-time Status Updates (WebSocket)**
- **Beschreibung:** Status-Cards updaten live bei Call-Events (ohne Polling)
- **Aufwand:** 2-3 Tage
- **Backend:** WebSocket Server (z.B. `ws` oder `socket.io`)
- **Frontend:** WebSocket Hook

#### 3. **Agent Test Call Feature**
- **Beschreibung:** Button "Agent testen" startet echten Test-Call
- **Referenz:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx) (Zeilen 77-80) – aktuell Placeholder
- **Aufwand:** 3-4 Tage
- **API:** Neuer Endpoint `POST /api/dashboard/test-call`
- **Integration:** Twilio Outbound Call API

#### 4. **Multi-Location Support**
- **Beschreibung:** Dropdown für Location-Wechsel, separate Status pro Location
- **Aufwand:** 1 Woche
- **API:** `GET /api/dashboard/overview?location_id=...`
- **DB:** Bereits vorhanden (Multi-Tenant Schema)

#### 5. **Export Call Logs (CSV/PDF)**
- **Beschreibung:** Button "Export" in Recent Calls Table
- **Aufwand:** 2-3 Tage
- **Library:** `papaparse` (CSV), `jspdf` (PDF)
- **API:** Optional: `GET /api/dashboard/calls/export?format=csv`

---

## 6. Risiken/Abhängigkeiten (ENV Variablen)

### 6.1 Kritische ENV Variablen (Dashboard-abhängig)

#### Backend
- **`SUPABASE_URL`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 36)
  - **Risiko:** KRITISCH – Ohne → Keine Daten
  - **Fallback:** Kein Fallback
- **`SUPABASE_SERVICE_ROLE_KEY`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 37)
  - **Risiko:** KRITISCH – Ohne → Keine DB-Zugriffe
  - **Fallback:** Kein Fallback
- **`RENDER_GIT_COMMIT` / `GIT_COMMIT`** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts) (Zeile 16)
  - **Risiko:** NIEDRIG – Nur für SystemHealth-Anzeige
  - **Fallback:** `'unknown'`

#### Frontend
- **`VITE_SUPABASE_URL`** (implizit via Supabase Client)
  - **Risiko:** KRITISCH – Ohne → Keine Auth
  - **Referenz:** [`src/lib/supabase.ts`](src/lib/supabase.ts) (vermutlich)
- **`VITE_SUPABASE_ANON_KEY`** (implizit via Supabase Client)
  - **Risiko:** KRITISCH – Ohne → Keine Auth
  - **Referenz:** [`src/lib/supabase.ts`](src/lib/supabase.ts) (vermutlich)

### 6.2 Optionale ENV Variablen (Feature-abhängig)

#### Phone Status
- **`TWILIO_AUTH_TOKEN`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 38)
  - **Risiko:** MITTEL – Ohne → Phone Status kann nicht validiert werden
  - **Fallback:** Status bleibt `'not_connected'`
- **`TWILIO_ACCOUNT_SID`** [`server/src/voice-agent/config.ts`](server/src/voice-agent/config.ts) (Zeile 72)
  - **Risiko:** MITTEL – Ohne → Keine Phone-Operationen
  - **Fallback:** Phone Status bleibt `'not_connected'`

#### Calendar Status
- **`GOOGLE_OAUTH_CLIENT_ID`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 55)
  - **Risiko:** MITTEL – Ohne → Calendar Connect funktioniert nicht
  - **Fallback:** Calendar Status bleibt `'not_connected'`
- **`GOOGLE_OAUTH_CLIENT_SECRET`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 56)
  - **Risiko:** MITTEL – Ohne → Calendar Connect funktioniert nicht
  - **Fallback:** Calendar Status bleibt `'not_connected'`

#### ElevenLabs Agent
- **`ELEVENLABS_API_KEY`** [`server/src/config/env.ts`](server/src/config/env.ts) (Zeile 83)
  - **Risiko:** MITTEL – Ohne → Agent kann nicht erstellt/aktualisiert werden
  - **Fallback:** `eleven_agent_id` bleibt `null`
- **`ELEVENLABS_AGENT_ID_DEFAULT`** [`server/src/services/supabaseDb.ts`](server/src/services/supabaseDb.ts) (Zeile 248)
  - **Risiko:** NIEDRIG – Nur für Default-Agent-Erstellung
  - **Fallback:** `null`

### 6.3 Risiko-Matrix

| ENV Variable | Kritikalität | Dashboard-Impact | Fallback vorhanden? |
|-------------|--------------|------------------|---------------------|
| `SUPABASE_URL` | KRITISCH | Dashboard lädt nicht | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | KRITISCH | Dashboard lädt nicht | ❌ |
| `TWILIO_AUTH_TOKEN` | MITTEL | Phone Status zeigt "nicht verbunden" | ✅ (Status bleibt `'not_connected'`) |
| `GOOGLE_OAUTH_CLIENT_ID` | MITTEL | Calendar Connect funktioniert nicht | ✅ (Status bleibt `'not_connected'`) |
| `ELEVENLABS_API_KEY` | MITTEL | Agent kann nicht erstellt werden | ✅ (`eleven_agent_id = null`) |
| `RENDER_GIT_COMMIT` | NIEDRIG | SystemHealth zeigt "unknown" | ✅ (`'unknown'`) |

### 6.4 Empfehlungen

1. **ENV Validation beim Start:** Backend sollte prüfen, dass kritische ENV-Variablen gesetzt sind
2. **Graceful Degradation:** Dashboard sollte auch mit fehlenden optionalen ENV-Variablen funktionieren
3. **Error Messages:** Klare Fehlermeldungen wenn ENV-Variablen fehlen (z.B. "Calendar Connect nicht verfügbar: GOOGLE_OAUTH_CLIENT_ID nicht gesetzt")

---

## 7. Referenzen (Dateipfade + Zeilenbereiche)

### Backend
- **Controller:** [`server/src/controllers/defaultAgentController.ts`](server/src/controllers/defaultAgentController.ts)
  - `getDashboardOverview`: Zeilen 223-399
  - `createDefaultAgent`: Zeilen 76-221
  - Status-Logik: Zeilen 137-139, 283-285
- **Routes:** [`server/src/routes/dashboardRoutes.ts`](server/src/routes/dashboardRoutes.ts)
- **Schema:** [`server/db/schema.sql`](server/db/schema.sql)
  - `agent_configs`: Zeilen 33-47
  - `phone_numbers`: Zeilen 50-60
  - `google_calendar_integrations`: Zeilen 62-73
  - `call_logs`: Zeilen 75-88
- **Services:** [`server/src/services/supabaseDb.ts`](server/src/services/supabaseDb.ts)
  - `ensureAgentConfig`: Zeilen 217-287
- **Config:** [`server/src/config/env.ts`](server/src/config/env.ts)

### Frontend
- **Page:** [`src/pages/DashboardPage.tsx`](src/pages/DashboardPage.tsx)
  - Status-Berechnung: Zeilen 118-148
  - UI-Struktur: Zeilen 150-348
- **Hook:** [`src/hooks/useDashboardOverview.ts`](src/hooks/useDashboardOverview.ts)
  - Query-Config: Zeilen 78-115
- **Components:**
  - [`src/components/dashboard/StatusCard.tsx`](src/components/dashboard/StatusCard.tsx)
  - [`src/components/dashboard/SystemHealth.tsx`](src/components/dashboard/SystemHealth.tsx)
  - [`src/components/dashboard/QuickActions.tsx`](src/components/dashboard/QuickActions.tsx)
  - [`src/components/dashboard/RecentCallsTable.tsx`](src/components/dashboard/RecentCallsTable.tsx)
  - [`src/components/dashboard/SetupWizard.tsx`](src/components/dashboard/SetupWizard.tsx)

---

**Erstellt:** 2025-01-XX  
**Zweck:** Vorbereitung für Dashboard-Optimierung  
**Status:** READY für Review
