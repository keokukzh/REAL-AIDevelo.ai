# QA Test Retest Plan - Analytics Double Prefix Fix

**Date:** 2025-12-15  
**Status:** ⏳ PENDING DEPLOYMENT  
**Fix Applied:** ✅ Local changes complete, awaiting deployment

---

## Fix Summary

**Issue:** Analytics API calls use double `/api/api/` prefix, causing 404 errors

**Files Fixed:**
1. ✅ `src/hooks/useCallAnalytics.ts` (2 lines: 63, 86)
2. ✅ `src/hooks/useScheduledReports.ts` (5 lines: 56, 73, 92, 111, 128)
3. ✅ `src/hooks/useCallAnalyticsExport.ts` (1 line: 21)

**Total Changes:** 8 lines across 3 files

**Verification:**
- ✅ `grep` shows no remaining `/api/` prefixes in apiClient calls
- ✅ `npm run lint:api-prefix` passes (no issues found)
- ✅ Code changes verified manually

---

## Pre-Deployment Checklist

- [x] Fixes applied to all affected files
- [x] Code verified (no remaining `/api/` prefixes)
- [x] Lint check script created (`scripts/check-api-prefix.mjs`)
- [x] ESLint configuration added (`.eslintrc.cjs`)
- [ ] Code committed
- [ ] Code pushed to repository
- [ ] Build passes locally
- [ ] Deployed to production

---

## Retest Steps (After Deployment)

### 1. Preflight
- [ ] Navigate to https://aidevelo.ai/analytics
- [ ] Hard refresh (Ctrl+F5)
- [ ] Open DevTools (Console + Network)
- [ ] Enable "Preserve log"
- [ ] Disable cache

### 2. Verify Fix
- [ ] Check Network tab for API calls
- [ ] Verify URLs are `/api/analytics/...` (NOT `/api/api/analytics/...`)
- [ ] Verify status codes are 200 OK (NOT 404)

### 3. Test Analytics Page
- [ ] Page loads without error message
- [ ] Summary cards display (if data exists)
- [ ] Top Sources table loads (if data exists)
- [ ] Scheduled Reports section loads
- [ ] No console errors related to Analytics

### 4. Test Analytics Exports
- [ ] Click "Export CSV" button
- [ ] Verify download starts
- [ ] Verify file is not empty
- [ ] Click "Export PDF" button
- [ ] Verify download starts
- [ ] Verify file is not empty

### 5. Test Scheduled Reports (if applicable)
- [ ] Create new scheduled report
- [ ] Update existing report
- [ ] Delete report (test environment only)
- [ ] Verify all CRUD operations work

### 6. Network Verification
- [ ] Check Network tab for successful requests:
  - `GET /api/analytics/calls/summary` → 200 OK ✅
  - `GET /api/analytics/calls/top-sources` → 200 OK ✅
  - `GET /api/reports/scheduled` → 200 OK ✅
  - `GET /api/analytics/exports/calls.csv` → 200 OK ✅ (when clicked)
  - `GET /api/analytics/exports/report.pdf` → 200 OK ✅ (when clicked)

### 7. Console Verification
- [ ] No console errors
- [ ] No console warnings related to Analytics
- [ ] No 404 errors in Network tab

---

## Expected Results After Fix

**Before Fix:**
```
❌ GET /api/api/analytics/calls/summary → 404 Not Found
❌ GET /api/api/analytics/calls/top-sources → 404 Not Found
❌ GET /api/api/reports/scheduled → 404 Not Found
❌ Error message: "Fehler beim Laden der Daten"
```

**After Fix:**
```
✅ GET /api/analytics/calls/summary → 200 OK
✅ GET /api/analytics/calls/top-sources → 200 OK
✅ GET /api/reports/scheduled → 200 OK
✅ Analytics page loads successfully
✅ Summary cards display (if data exists)
✅ Top Sources table loads (if data exists)
✅ Scheduled Reports section loads
```

---

## Prevention Measures

### 1. ESLint Rule Added
- ✅ `.eslintrc.cjs` created with `no-restricted-syntax` rule
- ⚠️ **Note:** ESLint not installed in root package.json (optional)
- ✅ Rule will catch double `/api/` prefixes in apiClient calls

### 2. Lint Check Script Added
- ✅ `scripts/check-api-prefix.mjs` created
- ✅ `npm run lint:api-prefix` added to package.json
- ✅ Script checks all hooks for double `/api/` prefix patterns
- ✅ Can be run before commits/deployments

### 3. Code Review Guidelines
- ✅ Documented pattern: apiClient calls should NOT include `/api/` prefix
- ✅ Examples provided in bug report
- ✅ Comparison with working hooks documented

---

## Deployment Notes

**Important:** After deployment, verify:
1. Cloudflare Pages rebuild completed
2. New build includes fixed hooks
3. Browser cache cleared (hard refresh)
4. Network requests show correct URLs

**If issues persist after deployment:**
1. Check Cloudflare Pages build logs
2. Verify files were deployed correctly
3. Check browser cache (try incognito mode)
4. Verify API_BASE_URL is correct in production build

---

## Related Files

- **Bug Report:** `QA_TEST_REPORT_PROD.md`
- **Fix Files:**
  - `src/hooks/useCallAnalytics.ts`
  - `src/hooks/useScheduledReports.ts`
  - `src/hooks/useCallAnalyticsExport.ts`
- **Prevention:**
  - `.eslintrc.cjs`
  - `scripts/check-api-prefix.mjs`
  - `package.json` (lint:api-prefix script)

---

**Status:** ✅ Fixes applied locally, awaiting deployment  
**Next Step:** Deploy to production, then retest using this plan
