# Site Audit Report

**Generated:** 2025-12-20T00:40:23.380Z
**Base URL:** http://localhost:4173

## Summary

- **Total Routes Tested:** 18
- **Routes with Errors:** 7
- **Total Errors:** 48
- **Network Failures:** 24

## Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Routes | 18 | 18 | +0 |
| Routes with Errors | 7 | 7 | +0 |
| Total Errors | 48 | 48 | +0 |

## Routes with Errors

### /dashboard

- **Status:** error
- **Console Errors:** 2
- **Network Failures:** 2

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/dashboard/overview - Status: 0

### /calls

- **Status:** error
- **Console Errors:** 4
- **Network Failures:** 4

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
3. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
4. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/calls?limit=20&offset=0 - Status: 0
2. GET http://localhost:5000/api/dashboard/overview - Status: 0
3. GET http://localhost:5000/api/calls?limit=20&offset=0 - Status: 0
4. GET http://localhost:5000/api/dashboard/overview - Status: 0

### /analytics

- **Status:** error
- **Console Errors:** 8
- **Network Failures:** 8

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
3. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
4. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
5. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
6. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
7. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
8. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/analytics/calls/summary? - Status: 0
3. GET http://localhost:5000/api/analytics/calls/top-sources?limit=10 - Status: 0
4. GET http://localhost:5000/api/reports/scheduled - Status: 0
5. GET http://localhost:5000/api/dashboard/overview - Status: 0
6. GET http://localhost:5000/api/analytics/calls/summary? - Status: 0
7. GET http://localhost:5000/api/analytics/calls/top-sources?limit=10 - Status: 0
8. GET http://localhost:5000/api/reports/scheduled - Status: 0

### /knowledge-base

- **Status:** error
- **Console Errors:** 4
- **Network Failures:** 4

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
3. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
4. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/rag/documents - Status: 0
3. GET http://localhost:5000/api/dashboard/overview - Status: 0
4. GET http://localhost:5000/api/rag/documents - Status: 0

### /dashboard/calendar

- **Status:** error
- **Console Errors:** 2
- **Network Failures:** 2

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/dashboard/overview - Status: 0

### /dashboard/settings

- **Status:** error
- **Console Errors:** 2
- **Network Failures:** 2

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/dashboard/overview - Status: 0

### /auth/callback

- **Status:** error
- **Console Errors:** 2
- **Network Failures:** 2

**Console Error Messages:**
1. `Failed to load resource: net::ERR_EMPTY_RESPONSE`
2. `Failed to load resource: net::ERR_EMPTY_RESPONSE`

**Network Failures:**
1. GET http://localhost:5000/api/dashboard/overview - Status: 0
2. GET http://localhost:5000/api/dashboard/overview - Status: 0

## All Routes Status

| Route | Status | Errors | Page Errors | Network Failures |
|-------|--------|-------|-------------|------------------|
| / | ✅ success | 0 | 0 | 0 |
| /webdesign | ✅ success | 0 | 0 | 0 |
| /enterprise | ✅ success | 0 | 0 | 0 |
| /impressum | ✅ success | 0 | 0 | 0 |
| /datenschutz | ✅ success | 0 | 0 | 0 |
| /agb | ✅ success | 0 | 0 | 0 |
| /login | ✅ success | 0 | 0 | 0 |
| /onboarding | ✅ success | 0 | 0 | 0 |
| /checkout | ✅ success | 0 | 0 | 0 |
| /payment-success | ✅ success | 0 | 0 | 0 |
| /dashboard | ❌ error | 2 | 0 | 2 |
| /calls | ❌ error | 4 | 0 | 4 |
| /analytics | ❌ error | 8 | 0 | 8 |
| /knowledge-base | ❌ error | 4 | 0 | 4 |
| /dashboard/calendar | ❌ error | 2 | 0 | 2 |
| /dashboard/settings | ❌ error | 2 | 0 | 2 |
| /voice-edit | ✅ success | 0 | 0 | 0 |
| /auth/callback | ❌ error | 2 | 0 | 2 |
