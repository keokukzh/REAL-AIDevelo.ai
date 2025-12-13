# Accessibility & CORB Fixes

## Issues Fixed

### 1. Missing Autocomplete Attributes

**Problem:** Form fields with recognizable `id` or `name` attributes (like `email`, `password`, `tel`) were missing `autocomplete` attributes, preventing browser autofill from working correctly.

**Solution:** Added appropriate `autocomplete` attributes to all form fields:

- **Email fields:** `autocomplete="email"`
- **Password fields:** 
  - Login: `autocomplete="current-password"`
  - Registration: `autocomplete="new-password"`
- **Phone fields:** `autocomplete="tel"`
- **Name fields:** `autocomplete="name"`

**Files Updated:**
- `src/pages/LoginPage.tsx` - Email + password fields
- `src/components/EnterpriseContactForm.tsx` - Name, email, phone
- `src/pages/OnboardingPage.tsx` - Email, phone
- `src/pages/AgentEditPage.tsx` - Email, phone
- `src/components/agent/AgentInlineEditor.tsx` - Name, email, phone
- `src/components/agent/ConfigurationTab.tsx` - Email, phone
- `src/components/LeadCaptureForm.tsx` - Email
- `src/pages/CheckoutPage.tsx` - Email

### 2. CORB (Cross-Origin Read Blocking) Issue

**Problem:** Browser was blocking cross-origin responses due to missing or incorrect `Content-Type` headers.

**Solution:** Added middleware to ensure `Content-Type: application/json; charset=utf-8` is always set for JSON responses.

**File Updated:** `server/src/app.ts`

**Code Added:**
```typescript
// Ensure Content-Type is set for JSON responses (prevents CORB issues)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to always set Content-Type
  res.json = function(body: any) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return originalJson(body);
  };
  
  next();
});
```

**Why This Works:**
- Express's `res.json()` usually sets `Content-Type` automatically, but this middleware ensures it's always set
- CORB blocks responses that don't have proper `Content-Type` headers
- Setting `Content-Type: application/json; charset=utf-8` explicitly prevents CORB blocking

## Verification

### Autocomplete Attributes

**Test:** Open any form (login, contact, etc.) and check browser DevTools:
- Inspect email input → should have `autocomplete="email"`
- Inspect password input → should have `autocomplete="current-password"` or `autocomplete="new-password"`
- Inspect phone input → should have `autocomplete="tel"`

**Expected:** Browser autofill should work correctly.

### CORB Fix

**Test:** Check API responses in browser DevTools Network tab:
- Response headers should include: `Content-Type: application/json; charset=utf-8`
- No CORB errors in Console
- API responses are readable

**Expected:** No "Response was blocked by CORB" errors.

## Git Commits

```
86fde53 fix(a11y): add autocomplete attributes to form fields and fix CORB by ensuring Content-Type header
```

