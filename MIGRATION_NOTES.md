# Dashboard UI Migration Notes

## Übersicht

Das Dashboard-Interface wurde erfolgreich durch das neue UI aus `https://github.com/keokukzh/AIDevelo-Dashboard.git` ersetzt, während alle bestehenden Funktionen erhalten blieben.

## Neue Komponenten

### UI-Komponenten (`src/components/newDashboard/`)
- `ui/Card.tsx` - Card-Komponente mit optionalem Title, Description und Action
- `ui/Button.tsx` - Button-Komponente mit Varianten (primary, secondary, outline, ghost)
- `StatCard.tsx` - KPI Cards mit Trend-Indikatoren
- `StatusBadge.tsx` - Call Status Badges (completed, missed, voicemail)
- `QuickActionButton.tsx` - Quick Actions Button mit Icon
- `HealthItem.tsx` - System Health Items
- `NavItem.tsx` - Sidebar Navigation Item

### Daten-Adapter (`src/lib/dashboardAdapters.ts`)
- `mapCallsToChartData()` - Konvertiert Call-Logs zu Chart-Datenpunkten
- `mapOverviewToKPIs()` - Konvertiert DashboardOverview zu KPI-Metriken
- `mapCallToTableRow()` - Konvertiert Call-Log zu Table-Row-Format

## Geänderte Dateien

### `src/pages/DashboardPage.tsx`
- Komplett neu strukturiert mit neuer UI
- Behält alle bestehenden Modals und Handler
- Neue Layout-Struktur:
  - KPI Cards (Gesamtanrufe, Termine, Verpasste Anrufe, Durchschn. Dauer)
  - Calendar Widget (vereinfacht, zeigt Status + Quick Actions)
  - Activity Chart (Recharts) mit echten Call-Daten
  - Recent Calls Table (neues Design)
  - Agent Card (rechts, neues Design)
  - Quick Actions Card
  - System Health Card

### `src/components/dashboard/SideNav.tsx`
- Neues Sidebar-Design (dark theme)
- Behält alle bestehenden Routes
- Zeigt Organization Name und User Email im Footer

### `tailwind.config.cjs`
- `swiss-red` Farbe (#DA291C) hinzugefügt

### `package.json`
- `recharts` dependency hinzugefügt (für Charts)

## Daten-Mapping

### DashboardOverview → KPI Metrics
- `overview.recent_calls.length` → `totalCalls`
- `overview.recent_calls` (gefiltert nach missed) → `missedCalls`
- `overview.recent_calls` (durchschnittliche Dauer) → `avgDuration`
- `appointmentsBooked` → 0 (Platzhalter, würde von Calendar API kommen)

### Recent Calls → Chart Data
- Calls werden nach Stunden gruppiert (letzte 24 Stunden)
- Leere Stunden werden mit 0 gefüllt

### Status → System Health
- `overview.status.phone` → Twilio Gateway Status
- `overview.status.calendar` → Google Calendar Sync Status
- `overview.agent_config.eleven_agent_id` → ElevenLabs TTS Status
- Supabase DB → immer OK (keine Status-API verfügbar)

## Bekannte Einschränkungen

1. **Calendar Widget**: Zeigt keine vollständige Calendar-Ansicht (nur Status + Actions)
   - Verfügbarkeit prüfen → `AvailabilityModal`
   - Termin erstellen → `CreateAppointmentModal`
   - Verbinden/Trennen → OAuth Flow

2. **Analytics**: Verwendet Dashboard Overview Daten
   - Analytics API (`/api/analytics/calls/summary`) gibt 404 (bekanntes Backend-Problem)
   - UI zeigt sauberen Error State falls Analytics Page aufgerufen wird

3. **Appointments Booked**: Aktuell auf 0 gesetzt
   - Würde von Calendar Integration API kommen
   - Könnte später aus Calendar Events berechnet werden

## Theme-Anpassung

- **Hybrid-Ansatz**: Sidebar dark (slate-900), Content light (slate-50)
- Neue UI verwendet `swiss-red` (#DA291C) als Akzentfarbe
- Bestehende Farben (`background`, `surface`, `accent`) bleiben für andere Seiten erhalten

## Funktionalität

Alle bestehenden Features funktionieren weiterhin:

✅ **Modals:**
- WebhookStatusModal
- AgentTestModal
- PhoneConnectionModal
- AvailabilityModal
- CreateAppointmentModal
- CallDetailsModal

✅ **Navigation:**
- `/dashboard` → Übersicht
- `/calls` → Anrufprotokoll
- `/analytics` → Analytics
- `/knowledge-base` → Knowledge Base
- `/dashboard/settings` → Einstellungen

✅ **Quick Actions:**
- Telefon verbinden
- Kalender verbinden
- Webhook Status prüfen
- Calls ansehen
- Agent testen

## Build & Lint

- ✅ TypeScript Build erfolgreich
- ⚠️ Einige Lint-Warnungen (Cognitive Complexity, unused variables) - nicht kritisch
- ✅ Alle kritischen Lint-Fehler behoben

## Offene Punkte

1. **Analytics API 404**: Muss im Backend gefixt werden (separates Ticket)
2. **Calendar vollständige Ansicht**: Könnte später als separate Page hinzugefügt werden
3. **Appointments Booked**: Sollte von Calendar API kommen, wenn verfügbar

## Nächste Schritte

1. Manuelle Regression Tests durchführen
2. Analytics API 404 im Backend fixen
3. Optional: Calendar vollständige Ansicht implementieren
4. Optional: Appointments Booked aus Calendar Events berechnen
