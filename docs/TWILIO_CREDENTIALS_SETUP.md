# Twilio Credentials Setup Guide

## Overview

This guide explains how to configure Twilio credentials for the AIDevelo platform. The system supports two authentication methods:

1. **Account SID + Auth Token** (Master credentials - full account access)
2. **API Key SID + API Key Secret** (Recommended - more secure, limited permissions)

## Required Environment Variables

### Option 1: Using Account SID + Auth Token (Simpler)

Set these in your Render environment:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_STREAM_TOKEN=<generate-a-secure-random-token>
```

### Option 2: Using API Key (Recommended - More Secure)

Set these in your Render environment:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret_here
TWILIO_STREAM_TOKEN=<generate-a-secure-random-token>
```

**Note:** Even when using API Keys, `TWILIO_ACCOUNT_SID` is still required for API endpoint URLs. The API Key credentials are used for authentication.

## Where to Set Environment Variables

### Render (Backend API)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service (e.g., "REAL-AIDevelo.ai")
3. Navigate to **Environment** tab
4. Add or update the following variables:

   - `TWILIO_ACCOUNT_SID` = Your Twilio Account SID (starts with `AC...`)
   - `TWILIO_AUTH_TOKEN` = Your Twilio Auth Token (if not using API Keys)
   - `TWILIO_API_KEY_SID` = Your Twilio API Key SID (starts with `SK...`, if using API Keys)
   - `TWILIO_API_KEY_SECRET` = Your Twilio API Key Secret (if using API Keys)
   - `TWILIO_STREAM_TOKEN` = Generate a secure random token (see below)

5. Click **Save Changes**
6. The service will automatically restart

### Generating TWILIO_STREAM_TOKEN

The `TWILIO_STREAM_TOKEN` is a custom security token for WebSocket connections. Generate a secure random token:

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

## Finding Your Credentials

### Account Information
Find these in your [Twilio Console](https://console.twilio.com/):
- **Account SID:** Found in Account Info section (starts with `AC...`)
- **Auth Token:** Found in Account Info section (click "Show" to reveal)
- **Phone Number:** Your Twilio phone number (e.g., `+1...`)

### API Key (Recommended)
Create an API Key in [Twilio Console → Account → API Keys & Tokens](https://console.twilio.com/us1/develop/api-keys):
- **API Key SID:** Starts with `SK...`
- **API Key Secret:** Shown only once when created (save it securely!)

### Test Credentials (Optional)
For development/testing, you can use test credentials from Twilio Console → Test Credentials section.

## Authentication Priority

The system uses the following priority:

1. **If `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` are set:**
   - Uses API Key authentication (more secure)
   - Username: `TWILIO_API_KEY_SID`
   - Password: `TWILIO_API_KEY_SECRET`

2. **Otherwise, if `TWILIO_AUTH_TOKEN` is set:**
   - Uses Account Auth Token authentication
   - Username: `TWILIO_ACCOUNT_SID`
   - Password: `TWILIO_AUTH_TOKEN`

## Verification

After setting the environment variables:

1. **Check Backend Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for successful Twilio API calls

2. **Test Phone Number Connection:**
   - Go to Dashboard → Settings → Phone Connection
   - Try to connect a phone number
   - Should show available Twilio numbers

3. **Test Agent Call:**
   - Go to Dashboard → Agent Testen
   - Try making a test call
   - Should connect successfully

## Security Best Practices

1. **Use API Keys instead of Auth Token:**
   - API Keys can be revoked independently
   - API Keys have limited permissions
   - More secure for production

2. **Never commit credentials to Git:**
   - All credentials should be in environment variables only
   - Use `.env.example` for documentation (with placeholder values)

3. **Rotate credentials regularly:**
   - Change API Key Secret periodically
   - Revoke old API Keys when creating new ones

4. **Use different credentials for dev/prod:**
   - Test credentials for development
   - Production credentials for production

## Troubleshooting

### "TWILIO_ACCOUNT_SID not configured"
- Ensure `TWILIO_ACCOUNT_SID` is set in Render environment variables
- Restart the service after adding variables

### "Failed to fetch phone numbers from Twilio"
- Check that `TWILIO_AUTH_TOKEN` or `TWILIO_API_KEY_SECRET` is set
- Verify credentials are correct in Twilio Dashboard
- Check Twilio account status (not suspended)

### "TWILIO_STREAM_TOKEN not configured"
- Generate a secure random token (see above)
- Set it in Render environment variables
- Restart the service

### "Agent test fails"
- Ensure ElevenLabs Agent ID is configured (see `ELEVENLABS_AGENT_ID_SETUP.md`)
- Check that Twilio credentials are correct
- Verify phone number is connected in Dashboard

## Additional Resources

- [Twilio API Documentation](https://www.twilio.com/docs/usage/api)
- [Twilio API Keys Guide](https://www.twilio.com/docs/iam/keys/api-key)
- [Render Environment Variables](https://render.com/docs/environment-variables)
