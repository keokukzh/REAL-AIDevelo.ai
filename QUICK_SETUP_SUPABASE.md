# Quick Setup: Supabase (5 Minutes)

## Step 1: Create Supabase Account (2 min)
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (one click)
4. Click **"New Project"**
5. Fill in:
   - **Name:** `aidevelo-db` (or any name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to you
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup

## Step 2: Get Connection String (1 min)
1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **Database** in left sidebar
3. Scroll to **Connection string** section
4. Click **URI** tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   **OR** for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Step 3: Update Environment Variables (1 min)

### If using Railway:
1. Go to Railway dashboard → Your service → **Variables**
2. **Delete** `DATABASE_PRIVATE_URL` (not needed)
3. **Update** `DATABASE_URL` with your Supabase connection string
4. **Save** - Railway will redeploy automatically

### If using local development:
1. Open `server/.env` file
2. Add/update:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` with your actual password

## Step 4: Run Migrations (1 min)
```bash
cd server
npm run migrate
```

## Step 5: Verify (30 sec)
1. Check server logs - should see:
   ```
   [Database] ✅ Connection successful!
   ```
2. Try creating an agent in dashboard
3. Check Supabase dashboard → **Table Editor** - should see your tables

## ✅ Done!

Your database is now running on Supabase (100% free).

## Troubleshooting

**Connection timeout?**
- Use the **pooled connection** (port 6543) instead of direct (port 5432)
- Check Supabase → Settings → Database → Connection Pooling

**Password error?**
- Reset password: Supabase → Settings → Database → Database password
- Update connection string

**SSL error?**
- Code handles this automatically
- If issues persist, check Supabase SSL settings

## Next Steps

- ✅ Remove Railway PostgreSQL service (optional - saves $5/month)
- ✅ Monitor usage in Supabase dashboard
- ✅ Set up backups (Supabase → Settings → Database → Backups)

## Free Tier Limits

- **500MB** database storage
- **2GB** bandwidth/month
- **Unlimited** API requests
- **1GB** file storage

**This is enough for development and small production apps!**

