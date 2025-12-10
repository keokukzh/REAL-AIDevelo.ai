# Railway Postgres Setup Guide

## Connecting Postgres to Your Backend Service

### Step 1: Get Postgres Credentials

1. Go to your Railway project dashboard
2. Click on the **Postgres** service
3. Navigate to the **Database** tab
4. Click on **Credentials** sub-tab
5. You'll see:
   - **Username**: `postgres`
   - **Password**: (masked, click show to reveal)
   - **Connection URL**: Available in the "Connect" modal

### Step 2: Connect via Private Network (Recommended)

**Why Private Network?**
- No egress costs
- Faster connection
- More secure (internal network)

**Steps:**
1. In Railway, go to your **REAL-AIDevelo.ai** backend service
2. Navigate to **Variables** tab
3. Click **+ New Variable**
4. Set:
   - **Variable Name**: `DATABASE_PRIVATE_URL`
   - **Value**: `${{ Postgres.DATABASE_PRIVATE_URL }}`
5. Click **Add**

**Note**: Railway will automatically resolve `${{ Postgres.DATABASE_PRIVATE_URL }}` to the actual connection string.

### Step 3: Connect via Public Network (Alternative)

**When to use:**
- If you need to connect from outside Railway
- For local development (if using Railway's public endpoint)

**Steps:**
1. In Railway, go to your **Postgres** service
2. Click **Connect** button
3. Select **Public Network** tab
4. Copy the **Connection URL** (it will look like):
   ```
   postgresql://postgres:password@mainline.proxy.rlwy.net:33442/railway
   ```
5. In your **REAL-AIDevelo.ai** backend service → **Variables** tab
6. Add new variable:
   - **Variable Name**: `DATABASE_URL`
   - **Value**: (paste the connection URL you copied)

### Step 4: Verify Connection

The backend will automatically:
1. Initialize the database connection pool on startup
2. Test the connection
3. Log connection status:
   - ✅ `[Database] Connected successfully` - Connection working
   - ⚠️ `[Database] Connection test failed` - Check your variables

### Step 5: Run Migrations

Migrations run automatically if you use the `wait-and-migrate` script:

```bash
npm run wait-and-migrate
```

Or manually:
```bash
npm run migrate
```

## Environment Variables Summary

### Required for Database:
- `DATABASE_PRIVATE_URL` (recommended) OR `DATABASE_URL` (public network)

### Backend will use:
- `DATABASE_PRIVATE_URL` (if set) - takes priority
- `DATABASE_URL` (if `DATABASE_PRIVATE_URL` not set)

## Troubleshooting

### Connection Failed
1. **Check Variable Name**: Must be exactly `DATABASE_PRIVATE_URL` or `DATABASE_URL`
2. **Check Value**: For private network, must be `${{ Postgres.DATABASE_PRIVATE_URL }}`
3. **Check Service Status**: Ensure Postgres service is "Online"
4. **Check Logs**: Look for database connection errors in Railway logs

### Migrations Not Running
1. Ensure `DATABASE_URL` or `DATABASE_PRIVATE_URL` is set
2. Check that Postgres is accessible
3. Verify migrations exist in `server/db/migrations/`
4. Check Railway logs for migration errors

### Using In-Memory Storage
If `DATABASE_URL` is not set, the backend will use in-memory storage (MockDatabase). This is fine for development but not for production.

## Example Railway Variables

```
DATABASE_PRIVATE_URL=${{ Postgres.DATABASE_PRIVATE_URL }}
ELEVENLABS_API_KEY=your_key_here
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Next Steps

After setting up the database:
1. ✅ Verify connection in logs
2. ✅ Run migrations
3. ✅ Test API endpoints that use the database
4. ✅ Monitor Railway metrics for database usage

