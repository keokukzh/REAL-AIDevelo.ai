# Supabase Migration: goals_json Array Default

## Problem
The `goals_json` column in `agent_configs` table was changed from default `'{}'::JSONB` (object) to `'[]'::JSONB` (array) to match the new API contract.

## Migration SQL

Run this in Supabase SQL Editor:

```sql
-- Step 1: Update existing rows where goals_json is object or null -> []
UPDATE agent_configs
SET goals_json = '[]'::JSONB
WHERE goals_json IS NULL 
   OR jsonb_typeof(goals_json) = 'object'
   OR jsonb_typeof(goals_json) = 'null';

-- Step 2: Alter column to set default to '[]'::JSONB
ALTER TABLE agent_configs
ALTER COLUMN goals_json SET DEFAULT '[]'::JSONB;

-- Step 3: Ensure NOT NULL constraint (if not already set)
ALTER TABLE agent_configs
ALTER COLUMN goals_json SET NOT NULL;

-- Step 4: Update any remaining NULL values (safety check)
UPDATE agent_configs
SET goals_json = '[]'::JSONB
WHERE goals_json IS NULL;
```

## Verification Queries

### Check for any remaining object types:
```sql
SELECT 
  id,
  location_id,
  jsonb_typeof(goals_json) as goals_json_type,
  goals_json
FROM agent_configs
WHERE jsonb_typeof(goals_json) = 'object';
```

**Expected result:** 0 rows

### Count rows with array type:
```sql
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN jsonb_typeof(goals_json) = 'array' THEN 1 END) as array_rows,
  COUNT(CASE WHEN jsonb_typeof(goals_json) = 'object' THEN 1 END) as object_rows,
  COUNT(CASE WHEN goals_json IS NULL THEN 1 END) as null_rows
FROM agent_configs;
```

**Expected result:**
- `array_rows` = `total_rows`
- `object_rows` = 0
- `null_rows` = 0

### Verify default constraint:
```sql
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_configs' 
  AND column_name = 'goals_json';
```

**Expected result:**
- `column_default` = `'[]'::jsonb`
- `is_nullable` = `NO`

## Rollback (if needed)

If you need to rollback to object default:

```sql
-- Revert default to object
ALTER TABLE agent_configs
ALTER COLUMN goals_json SET DEFAULT '{}'::JSONB;

-- Convert arrays back to objects (if needed)
UPDATE agent_configs
SET goals_json = '{}'::JSONB
WHERE jsonb_typeof(goals_json) = 'array';
```

