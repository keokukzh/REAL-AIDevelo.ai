# Smoke Test: Scheduled Reports (Phase 4.11)

## Prerequisites

1. **Environment Variables** (required):
   ```bash
   ENABLE_SCHEDULED_REPORTS=true
   CRON_SECRET=<secure-random-secret>
   SMTP_HOST=<smtp-host>
   SMTP_PORT=587
   SMTP_USER=<smtp-user>
   SMTP_PASS=<smtp-password>
   SMTP_FROM=<from-email>
   ```

2. **Database Migration**: Run migration `017_create_scheduled_reports.sql`

3. **Dependencies**: `nodemailer` installed (`npm install`)

## Backend Tests

### 1. Create Scheduled Report (CRUD)

```bash
# Get auth token first
TOKEN="<your-supabase-jwt-token>"

# Create a weekly report
curl -X POST http://localhost:5000/api/reports/scheduled \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "frequency": "weekly",
    "timezone": "Europe/Zurich",
    "recipients": ["test@example.com"],
    "filters": {
      "dateRangePreset": "last7days"
    },
    "enabled": true
  }'
```

**Expected**: `201 Created` with report object including `id`, `next_run_at`, etc.

### 2. List Scheduled Reports

```bash
curl -X GET http://localhost:5000/api/reports/scheduled \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: `200 OK` with array of reports for current location.

### 3. Update Scheduled Report

```bash
REPORT_ID="<report-id-from-create>"

curl -X PATCH http://localhost:5000/api/reports/scheduled/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false,
    "recipients": ["updated@example.com"]
  }'
```

**Expected**: `200 OK` with updated report object.

### 4. Test Report (Send Immediately)

```bash
curl -X POST http://localhost:5000/api/reports/scheduled/$REPORT_ID/test \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 
- `200 OK` with success message
- Email arrives at recipients with PDF attachment
- Check SMTP logs: `[EmailService] sent to=...`

### 5. Cron Endpoint (Run Due Reports)

```bash
CRON_SECRET="<your-cron-secret>"

curl -X POST http://localhost:5000/api/cron/reports/run \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Expected**:
- `200 OK` with `{ success: true, data: { processed, succeeded, failed } }`
- Logs: `[ScheduledReports] runDueReports processed=X ok=Y failed=Z`
- If reports are due: emails sent, `last_run_at` and `next_run_at` updated in DB

### 6. Cron Endpoint Security

```bash
# Missing secret → 401
curl -X POST http://localhost:5000/api/cron/reports/run

# Wrong secret → 401
curl -X POST http://localhost:5000/api/cron/reports/run \
  -H "x-cron-secret: wrong-secret"

# Feature flag disabled → 404
# (Set ENABLE_SCHEDULED_REPORTS=false)
```

**Expected**: Appropriate error responses.

### 7. Delete Scheduled Report

```bash
curl -X DELETE http://localhost:5000/api/reports/scheduled/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: `200 OK` with success message. Report no longer appears in list.

## Frontend Tests

### 1. Analytics Page → Scheduled Reports Section

1. Navigate to `/analytics`
2. Scroll to bottom → "Geplante Reports" section visible
3. Click "Neu" → Form appears
4. Fill:
   - Frequency: "Wöchentlich"
   - Recipients: "test@example.com"
5. Click "Erstellen" → Report appears in list

**Expected**: 
- Toast: "Geplanter Report erstellt"
- Report card shows: frequency, recipients, next_run_at
- Enabled badge shows "Aktiv"

### 2. Toggle Report Enabled/Disabled

1. Click toggle button (✓/○) on report card
2. **Expected**: 
   - Toast: "Report deaktiviert" / "Report aktiviert"
   - Badge updates immediately

### 3. Send Test Report

1. Click "Play" button on report card
2. **Expected**:
   - Toast: "Test-Report gesendet"
   - Email arrives at recipients with PDF attachment

### 4. Delete Report

1. Click "Trash" button on report card
2. Confirm deletion
3. **Expected**:
   - Toast: "Report gelöscht"
   - Report disappears from list

## Database Verification

```sql
-- Check scheduled_reports table
SELECT 
  id,
  location_id,
  enabled,
  frequency,
  recipients,
  last_run_at,
  next_run_at,
  created_at
FROM scheduled_reports
ORDER BY created_at DESC;

-- Verify next_run_at is computed correctly
-- Daily: next day at 8 AM
-- Weekly: next Monday at 8 AM
-- Monthly: first day of next month at 8 AM
```

## Edge Cases

1. **No SMTP configured**: Email service logs warning, returns error
2. **Invalid recipients**: Validation error on create/update
3. **No due reports**: Cron endpoint returns `processed: 0`
4. **PDF generation fails**: Error logged, report not updated
5. **Email send fails**: Error logged, report not updated (but PDF generated)

## Production Setup

1. **External Cron** (e.g., Render Cron Job, GitHub Actions, cron service):
   ```bash
   # Run every hour
   0 * * * * curl -X POST https://your-api.com/api/cron/reports/run \
     -H "x-cron-secret: $CRON_SECRET"
   ```

2. **SMTP Provider**: Use SendGrid, Mailgun, AWS SES, or similar
3. **CRON_SECRET**: Generate secure random string (64+ characters)

## Success Criteria

- ✅ CRUD endpoints work with auth
- ✅ Cron endpoint works with secret (no JWT)
- ✅ Test endpoint sends email immediately
- ✅ Cron runs due reports and sends emails
- ✅ Frontend UI displays and manages reports
- ✅ Feature flag disables functionality when false
- ✅ Database updates `last_run_at` and `next_run_at` correctly
