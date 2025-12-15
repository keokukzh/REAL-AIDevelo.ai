# Dashboard UI Replacement - Baseline & Inventory

## PHASE 0: Baseline & Inventory

### Dashboard Cards/Widgets (vorher)
1. **StatusCard** (4x): Agent, Telefon, Kalender, Calls/Logs
   - Zeigt Status (active/warning/inactive)
   - Enthält Actions (Buttons)
   - Zeigt Details (Nummer, Email, etc.)

2. **SystemHealth**: Backend SHA, Last Refresh
3. **SetupWizard**: Wird angezeigt wenn `setup_state !== 'ready'`
4. **QuickActions**: Button-Liste mit Actions
5. **RecentCallsTable**: Tabelle mit letzten Anrufen

### Quick Actions (vorher)
- Telefon verbinden → `PhoneConnectionModal`
- Kalender verbinden → `handleConnectCalendar()` (OAuth)
- Webhook Status prüfen → `WebhookStatusModal`
- Letzte Calls ansehen → `navigate('/calls')`
- Agent testen → `AgentTestModal`

### Modals (vorher & nachher - unverändert)
1. **WebhookStatusModal**: Webhook Status prüfen
2. **AgentTestModal**: Agent Test Call starten
3. **PhoneConnectionModal**: Telefonnummer verbinden
4. **AvailabilityModal**: Kalender Verfügbarkeit prüfen
5. **CreateAppointmentModal**: Termin erstellen
6. **CallDetailsModal**: Call Details anzeigen

### Routes
- `/dashboard` → DashboardPage (ProtectedRoute)
- `/calls` → CallsPage (ProtectedRoute)
- `/analytics` → AnalyticsPage (ProtectedRoute)
- `/knowledge-base` → KnowledgeBasePage (ProtectedRoute)
- `/dashboard/settings` → (Route vorhanden, Page möglicherweise nicht implementiert)

### Hooks (Datenlieferanten)
1. **useDashboardOverview**: Hauptdatenquelle für Dashboard
   - `overview.agent_config` → Agent Status
   - `overview.status` → Phone/Calendar Status
   - `overview.recent_calls` → Recent Calls
   - `overview.phone_number` → Phone Number
   - `overview.calendar_connected_email` → Calendar Email

2. **useWebhookStatus**: Webhook Status Daten
3. **useCallLogs**: Call Logs für /calls Page
4. **useCallAnalytics**: Analytics Daten für /analytics Page
5. **useCallDetails**: Call Details für Modal
6. **useRagDocuments**: Knowledge Base Documents
7. **useScheduledReports**: Scheduled Reports für Analytics

### Feature-Parity Snapshot (UI Elemente die erreichbar bleiben müssen)

#### Dashboard Page
- ✅ Agent Status Card (mit ElevenLabs ID Indikator)
- ✅ Telefon Status Card
- ✅ Kalender Status Card (mit connected_email)
- ✅ Calls/Logs Status Card
- ✅ KPI Cards (Gesamtanrufe, Termine, Verpasste Anrufe, Durchschn. Dauer)
- ✅ Activity Chart (Anrufvolumen)
- ✅ Recent Calls Table
- ✅ Quick Actions Card
- ✅ System Health Card
- ✅ Setup Wizard (wenn setup_state !== 'ready')

#### Navigation
- ✅ SideNav mit Links zu: /dashboard, /calls, /analytics, /knowledge-base, /dashboard/settings
- ✅ Active Route Highlighting

#### Modals (alle müssen funktionieren)
- ✅ WebhookStatusModal (Loading/Error/Empty, Copy-Buttons, Mismatch Badges)
- ✅ AgentTestModal (Statusanzeige, Fehlermeldung bei fehlender ElevenLabs Konfig)
- ✅ PhoneConnectionModal
- ✅ AvailabilityModal (Slots laden, "keine Slots" anzeigen)
- ✅ CreateAppointmentModal (Event erstellen, Link/ID anzeigen)
- ✅ CallDetailsModal (Transcript, Recording Link, ElevenLabs Conversation ID, RAG Stats)

#### Pages
- ✅ /calls: Liste + Filter + Pagination + Row click → Modal
- ✅ /analytics: Summary + Top Sources + Export (CSV/PDF) + Scheduled Reports UI
- ✅ /knowledge-base: Liste + Upload + Preview + Re-embed + Delete + Filter/Search

## Alte Dashboard Komponenten (können entfernt werden)

### Nicht mehr verwendet (ersetzt durch neue UI)
1. **StatusCard.tsx** → Ersetzt durch `StatCard.tsx` (neues Design)
2. **QuickActions.tsx** → Ersetzt durch `QuickActionButton.tsx` (neues Design)
3. **RecentCallsTable.tsx** → Ersetzt durch neue Table in DashboardPage
4. **SystemHealth.tsx** → Ersetzt durch `HealthItem.tsx` (neues Design)
5. **KPIOverview.tsx** → Ersetzt durch `StatCard` Grid

### Noch verwendet (behalten)
1. **SetupWizard.tsx** - Wird noch verwendet
2. **SideNav.tsx** - Wurde bereits aktualisiert (neues Design)
3. **AgentTestModal.tsx** - Wird noch verwendet
4. **WebhookStatusModal.tsx** - Wird noch verwendet
5. **PhoneConnectionModal.tsx** - Wird noch verwendet
6. **AvailabilityModal.tsx** - Wird noch verwendet
7. **CreateAppointmentModal.tsx** - Wird noch verwendet
8. **CallDetailsModal.tsx** - Wird noch verwendet
9. **AgentCard.tsx** - Möglicherweise von anderen Pages verwendet
10. **DashboardToolbar.tsx** - Möglicherweise von anderen Pages verwendet
11. **PhoneConnectModal.tsx** - Möglicherweise Duplikat von PhoneConnectionModal?
12. **PrivacyControls.tsx** - Möglicherweise von anderen Pages verwendet
13. **VoiceAgentStreamingUI.tsx** - Möglicherweise von anderen Pages verwendet

## Prüfung: Werden alte Komponenten noch verwendet?

Zu prüfen:
- StatusCard.tsx
- QuickActions.tsx
- RecentCallsTable.tsx
- SystemHealth.tsx
- KPIOverview.tsx
