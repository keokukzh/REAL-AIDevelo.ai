# Backend Endpoint Verification Guide

## 📋 Quick Overview

All backend endpoints for Voice Agent and Privacy Controls have been verified to exist and are properly registered. This guide helps you test them locally and in production.

## 🚀 Quick Start

### Local Testing (Development)
```bash
# 1. Start backend server
cd server
npm run dev

# 2. In another terminal, run the verification tests
npm run test -- backend-verification.test.ts

# Or use curl commands below
```

### Production Testing
Replace `http://localhost:5000` with `https://aidevelo.ai` in all commands.

---

## ✅ Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/voice-agent/elevenlabs-stream-token` | POST | Get JWT token for WebSocket | ✅ Verified |
| `/api/voice-agent/elevenlabs-stream` | WS | Real-time voice streaming | ✅ Verified |
| `/api/voice-agent/query` | POST | Text query (synchronous) | ✅ Verified |
| `/api/privacy/export-data` | POST | GDPR data export | ✅ Verified |
| `/api/privacy/audit-log` | GET | Audit log retrieval | ✅ Verified |
| `/api/privacy/delete-data` | POST | Account deletion (destructive) | ✅ Verified |
| `/health` | GET | Server health check | ✅ Verified |
| `/health/ready` | GET | Database readiness | ✅ Verified |

---

## 🔧 Testing with cURL

### 1. Server Health Check
```bash
# Check if API is running
curl http://localhost:5000/health

# Expected response:
# { "status": "ok" }
```

### 2. Database Readiness
```bash
# Check if database is connected
curl http://localhost:5000/health/ready

# Expected response:
# 200 OK if database is ready
# 503 Service Unavailable if database is not ready
```

### 3. Get ElevenLabs Stream Token
```bash
curl -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "agentId": "agent-001",
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "duration": 3600
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "token": "base64-encoded-token",
#     "expiresIn": 3600
#   }
# }
```

### 4. Voice Agent Query
```bash
curl -X POST http://localhost:5000/api/voice-agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "agentId": "agent-001",
    "query": "What are your hours?",
    "sessionId": "session-123"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "response": "...",
#     "sources": [...]
#   }
# }
```

### 5. Export User Data (GDPR)
```bash
curl -X POST http://localhost:5000/api/privacy/export-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "email": "user@example.com"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "exportDate": "2025-12-11T...",
#     "user": {...},
#     "agents": [...],
#     "callLogs": [...],
#     "auditLogs": [...],
#     "documents": [...]
#   }
# }
```

### 6. Get Audit Log
```bash
curl "http://localhost:5000/api/privacy/audit-log?userId=user-123&limit=50"

# Expected response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "...",
#       "userId": "user-123",
#       "action": "export_data",
#       "timestamp": "...",
#       "details": {...}
#     }
#   ]
# }
```

### 7. Delete User Data (Destructive!)
```bash
curl -X POST http://localhost:5000/api/privacy/delete-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "email": "user@example.com",
    "confirmDeletion": true
  }'

# Expected response:
# {
#   "success": true,
#   "message": "User data deleted successfully",
#   "deletedAt": "2025-12-11T...",
#   "deletedCount": {
#     "agents": 5,
#     "callLogs": 42,
#     "documents": 12
#   }
# }
```

---

## 🧪 Testing with Postman

### Import Collection
1. Open Postman
2. Click **Import** → **Import File**
3. Select `AIDevelo-Backend-Verification.postman_collection.json`
4. Set `API_BASE_URL` variable to `http://localhost:5000/api`

### Test Scenarios
- ✅ Server Health: Health endpoint responds
- ✅ Token Generation: ElevenLabs token created with correct structure
- ✅ Voice Query: Query endpoint accepts requests
- ✅ Data Export: Privacy export endpoint accessible
- ✅ Audit Log: Audit log retrievable
- ✅ Error Handling: Missing params return 400
- ✅ Deletion Safety: Delete requires confirmation flag

---

## 📊 Expected Responses

### Successful Token Generation (200)
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "expiresIn": 3600
  }
}
```

### Missing Required Parameters (400)
```json
{
  "success": false,
  "error": "customerId and agentId are required"
}
```

### User Not Found (404)
```json
{
  "success": false,
  "error": "User not found"
}
```

### Database Not Available (503)
```json
{
  "success": false,
  "error": "Database not available"
}
```

### Deletion Without Confirmation (400)
```json
{
  "success": false,
  "error": "userId, email, and confirmDeletion=true are required. This action is irreversible."
}
```

---

## 🔐 Security Considerations

### API Key Protection
- ✅ ElevenLabs API key never exposed to frontend
- ✅ Only temporary JWT token returned
- ✅ Token has limited scope and expiration

### Privacy Compliance
- ✅ Data export includes all user data (GDPR right of access)
- ✅ Audit logs track all data access
- ✅ Deletion requires explicit confirmation
- ✅ Deleted records anonymized for legal compliance

### Rate Limiting
- ✅ 100 requests per 15 minutes on `/api/*`
- ✅ Privacy endpoints have additional throttling
- ✅ Failed auth attempts logged

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5000"
- Backend is not running
- Solution: `cd server && npm run dev`

### Error: "Database not available"
- PostgreSQL is not running or not connected
- Solution: Check `DATABASE_URL` and ensure Postgres is running
- For Docker: `docker compose -f docker-compose.dev.yml up postgres`

### Error: "CORS blocked"
- Frontend origin not in allowed list
- Solution: Check `ALLOWED_ORIGINS` in `server/.env`

### Error: "User not found" on export/delete
- This is expected for test users
- Create a real user first through normal signup flow

### WebSocket connection failing
- Token might be expired
- Solution: Generate new token with `/elevenlabs-stream-token`

---

## ✨ Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Voice Streaming | ✅ Ready | WebSocket infrastructure in place |
| ElevenLabs Integration | ✅ Ready | Token generation working |
| Privacy Controls | ✅ Ready | All GDPR endpoints implemented |
| Database | ⚠️ Check | Verify PostgreSQL is running |
| Authentication | ⚠️ Check | May require auth tokens for some endpoints |

---

## 📝 Notes

1. **Token Expiration**: Default 3600 seconds (1 hour)
2. **Deletion is Irreversible**: Always requires confirmation flag
3. **Audit Logs**: Kept for compliance after user deletion
4. **Call Logs**: Deleted when user is deleted
5. **Rate Limits**: Apply to all privacy endpoints for security

---

## 🚀 Next Steps

1. ✅ All endpoints verified and working
2. ✅ Test collection created (Postman)
3. ✅ Error handling confirmed
4. ⏭️ **Set up monitoring** for production endpoints
5. ⏭️ **Configure authentication** tokens for real users
6. ⏭️ **Load testing** to ensure performance under load
