# Migration from Railway to Supabase (Free PostgreSQL)

## Why Supabase?
- **100% Free** for development and small projects
- **500MB database** storage (free tier)
- **2GB bandwidth** per month
- **No credit card required**
- **Better connection reliability**
- **Built-in connection pooling**

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (free)
4. Create a new project
5. Choose a region close to you
6. Wait 2-3 minutes for setup

## Step 2: Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** format
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password (found in Settings → Database → Database password)

## Step 3: Update Environment Variables

### Option A: Local Development (.env file)
Add to your `server/.env`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Option B: Production (Railway/Other Platform)
1. Go to your hosting platform's environment variables
2. Set `DATABASE_URL` to your Supabase connection string
3. Remove `DATABASE_PRIVATE_URL` (not needed for Supabase)

## Step 4: Update Connection Pooling (Optional but Recommended)

Supabase provides connection pooling via port 6543. Update your connection string:

**Direct connection (port 5432):**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Pooled connection (port 6543) - Recommended:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Step 5: Run Migrations

Your existing migrations will work! Just run:
```bash
cd server
npm run migrate
```

## Step 6: Verify Connection

The improved connection code will automatically:
- Detect Supabase connection strings
- Use proper SSL configuration
- Retry with exponential backoff
- Provide clear error messages

## Troubleshooting

### Connection Timeout
- Check if your IP needs to be whitelisted (Supabase → Settings → Database → Connection Pooling)
- Use the pooled connection (port 6543) instead of direct (port 5432)

### SSL Errors
- Supabase requires SSL - the code handles this automatically
- If issues persist, check Supabase dashboard → Settings → Database → SSL mode

### Password Issues
- Reset password in Supabase → Settings → Database → Database password
- Update connection string with new password

## Free Tier Limits

- **Database size:** 500MB
- **Bandwidth:** 2GB/month
- **API requests:** Unlimited
- **Storage:** 1GB
- **File uploads:** 50MB per file

## Cost Comparison

| Feature | Railway | Supabase Free |
|---------|---------|---------------|
| Database | $5/month | FREE |
| Storage | $0.25/GB | 1GB FREE |
| Bandwidth | Included | 2GB FREE |
| Connection pooling | Manual | Built-in |
| SSL | Manual config | Automatic |

## Next Steps After Migration

1. ✅ Test database connection
2. ✅ Run migrations
3. ✅ Verify agent creation works
4. ✅ Monitor Supabase dashboard for usage
5. ✅ Remove Railway PostgreSQL service (optional)

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase

