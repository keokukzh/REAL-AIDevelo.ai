# Analytics Export Smoke Test

## Prerequisites
- Server running on `http://localhost:5000` (or configured `API_BASE_URL`)
- Valid authentication token (Supabase or Dev Bypass)
- At least 1 call with transcript/RAG data in `call_logs` table

## Environment Variables
- `ENABLE_ANALYTICS_EXPORT=true` (default: true, set to `false` to disable exports)

## Backend Tests

### CSV Export
```bash
# Basic export
curl -L -o calls.csv \
  "http://localhost:5000/api/analytics/exports/calls.csv?dateFrom=2024-01-01" \
  -H "Authorization: Bearer $TOKEN"

# Verify file
file calls.csv
# Expected: "calls.csv: CSV text"

# Check header
head -1 calls.csv
# Expected: callSid,direction,outcome,startedAt,endedAt,durationSec,from,to,transcriptLen,ragEnabled,ragTotalQueries,ragTotalResults,ragTotalInjectedChars,elevenConversationId

# Check rows
head -5 calls.csv
```

### PDF Export
```bash
# Basic export
curl -L -o report.pdf \
  "http://localhost:5000/api/analytics/exports/report.pdf?dateFrom=2024-01-01" \
  -H "Authorization: Bearer $TOKEN"

# Verify file
file report.pdf
# Expected: "report.pdf: PDF document"

# Open PDF and verify:
# - Title: "Analytics Report"
# - Location ID displayed
# - Summary section with totals
# - Top Sources table (if RAG data exists)
```

### With Filters
```bash
# CSV with filters
curl -L -o calls_filtered.csv \
  "http://localhost:5000/api/analytics/exports/calls.csv?dateFrom=2024-01-01&dateTo=2024-12-31&direction=inbound&outcome=completed&limit=1000" \
  -H "Authorization: Bearer $TOKEN"

# PDF with filters
curl -L -o report_filtered.pdf \
  "http://localhost:5000/api/analytics/exports/report.pdf?dateFrom=2024-01-01&dateTo=2024-12-31&limitSources=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Error Cases
```bash
# Missing auth
curl "http://localhost:5000/api/analytics/exports/calls.csv"
# Expected: 401 Unauthorized

# Export disabled
# Set ENABLE_ANALYTICS_EXPORT=false
curl "http://localhost:5000/api/analytics/exports/calls.csv" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 with "Export disabled" message
```

## Frontend Tests

1. Navigate to `/analytics`
2. Set filters (dateFrom, dateTo, direction, outcome)
3. Click "Export CSV" button
   - Button shows "Exportiere..." while loading
   - File downloads with name like `calls_<locationId>_<dateFrom>_<dateTo>.csv`
   - Toast shows "CSV Export erfolgreich"
4. Click "Export PDF" button
   - Button shows "Exportiere..." while loading
   - File downloads with name like `analytics_report_<locationId>_<dateFrom>_<dateTo>.pdf`
   - Toast shows "PDF Export erfolgreich"
5. Verify exported files match current filter settings

## Expected Logs

```
[AnalyticsExport] CSV: resolved locationId=xxx from source=devFallback
[AnalyticsExport] CSV locationId=xxx rowsExported=150 duration=45ms
[AnalyticsExport] PDF: resolved locationId=xxx from source=devFallback
[AnalyticsExport] PDF locationId=xxx duration=120ms
```

## Edge Cases

- **No calls**: CSV contains only header row, PDF shows "No data available"
- **No RAG data**: CSV has `ragEnabled=false`, PDF shows "No RAG sources found"
- **Large dataset**: CSV limit enforced (max 10000 rows), PDF handles gracefully
- **Special characters in CSV**: Properly escaped (quotes, commas, newlines)
