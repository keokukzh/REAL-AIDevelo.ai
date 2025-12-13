# Task 1 & 2 Status Report

## Task 1: Supabase Project Switch ✅

### Configuration Check
- ✅ Frontend `.env.local`: All VITE_* vars SET
- ✅ Backend `server/.env`: All required vars SET
- ✅ `SUPABASE_URL` format: CORRECT (points to `.supabase.co`)
- ✅ Code uses correct env var names

### Documentation Updates
- ✅ Updated `docs/DEPLOY_ENV_MAP.md` with format warnings
- ✅ Created `docs/SUPABASE_PROJECT_SWITCH.md`

**Files Changed:**
- `docs/DEPLOY_ENV_MAP.md`
- `docs/SUPABASE_PROJECT_SWITCH.md`

**Commit:** `3c27745` - "docs: clarify SUPABASE_URL format and add project switch guide"

---

## Task 2: Schema Apply ⚠️ BLOCKED

### Current Status
**MCP Connection:** Still pointing to OLD project (`pdxdgfxhpyefqyouotat.supabase.co`)

**Legacy Tables Detected:**
- `users` (OLD schema: id, name, email, created_at - MISSING org_id, supabase_user_id)
- `agents` (legacy)
- `purchases` (legacy)
- `call_history` (legacy)
- `rag_documents` (legacy)
- `phone_numbers` (legacy, different structure)
- `call_logs` (legacy, different structure)

**Schema Apply Attempt:**
- ❌ Failed: `ERROR: column "org_id" does not exist`
- Reason: `users` table exists with old schema

### Required Actions

**For NEW Project "aidevelo.prod":**

1. **Update MCP Configuration:**
   - Point MCP to aidevelo.prod project
   - Get project-ref from Supabase Dashboard

2. **If aidevelo.prod is CLEAN (no tables):**
   - Apply schema directly via MCP or SQL Editor
   - Should work without conflicts

3. **If aidevelo.prod has Legacy Tables:**
   - Rename legacy tables first (see `docs/SCHEMA_CONFLICT_RESOLUTION.md`)
   - Then apply schema

**Files Created:**
- `docs/SCHEMA_APPLY_INSTRUCTIONS.md`
- `docs/SCHEMA_CONFLICT_RESOLUTION.md`

**Commit:** `c77c6b8` - "docs: add schema apply instructions and conflict resolution guide"

---

## Next Steps

1. **Switch MCP to aidevelo.prod** (or confirm Env-Vars point to new project)
2. **Verify aidevelo.prod is clean** (no legacy tables)
3. **Apply schema** via MCP or SQL Editor
4. **Verify tables exist** (8 required tables)
5. **Run preflight check** (`GET /api/db/preflight`)

---

## Blockers

1. ⚠️ **MCP still points to old project** - Need to switch to aidevelo.prod
2. ⚠️ **Schema not applied** - Waiting for clean project or legacy table resolution
