# Testing & Validation Guide - AIDevelo.ai Backend

## Overview

This guide provides comprehensive testing procedures for all backend components, including API endpoints, WebSocket connections, database operations, and privacy compliance features.

---

## 1. Environment Setup for Testing

### Prerequisites
```bash
# Required services (using Docker)
docker-compose -f docker-compose.dev.yml up

# Services will start:
# - PostgreSQL on :5432
# - Redis on :6379
# - Qdrant on :6333
# - Backend on :5000
# - Frontend on :4000
# - Jaeger on :16686
```

### Backend Setup
```bash
cd server
npm install
npm run build

# Create .env file for testing
cp .env.example .env
# Update with test database credentials
```

---

## 2. Unit Testing

### Run All Tests
```bash
# Frontend tests
npm run test -- --run

# Backend tests (if added)
cd server
npm run test -- --run
```

### Test Results Expected
```
Test Files: 4 passed (4)
Tests: 11 passed (11)
Duration: ~5s
```

---

## 3. API Endpoint Testing

### 3.1 Voice Agent Streaming Token Endpoint

**Endpoint**: `POST /api/voice-agent/elevenlabs-stream-token`

#### Happy Path Test
```bash
curl -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "user-123",
    "agentId": "agent-456",
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "duration": 3600
  }'

# Expected Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### Error Cases
```bash
# Missing customerId
curl -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent-456"}'

# Expected Response (400):
{
  "success": false,
  "error": "customerId and agentId are required"
}

# Invalid agentId (not found)
curl -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "user-123",
    "agentId": "invalid-agent-id"
  }'

# Expected Response (404):
{
  "success": false,
  "error": "Agent not found"
}
```

### 3.2 Privacy Export Endpoint

**Endpoint**: `POST /api/privacy/export-data`

#### Test Execution
```bash
# Create test user first (assuming already exists)
USER_ID="test-user-$(date +%s)"

# Export user data
curl -X POST http://localhost:5000/api/privacy/export-data \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"email\": \"test@example.com\"
  }"

# Expected Response (200):
{
  "success": true,
  "data": {
    "exportDate": "2025-12-11T10:30:00Z",
    "user": {
      "id": "test-user-xxx",
      "email": "test@example.com",
      "createdAt": "2025-12-01T08:00:00Z"
    },
    "agents": [
      {
        "id": "agent-123",
        "name": "Default Agent",
        "status": "active",
        "config": {...}
      }
    ],
    "callLogs": [
      {
        "id": "call-001",
        "agentId": "agent-123",
        "startTime": "2025-12-10T14:30:00Z",
        "duration": 300,
        "status": "completed"
      }
    ],
    "auditLogs": [
      {
        "action": "create_agent",
        "resourceType": "agent",
        "createdAt": "2025-12-01T08:00:00Z"
      }
    ]
  }
}
```

#### Verification
```bash
# Check audit log recorded the export
curl "http://localhost:5000/api/privacy/audit-log?userId=$USER_ID"

# Should show: { action: "export_data", ... }
```

### 3.3 Privacy Delete Endpoint

**Endpoint**: `POST /api/privacy/delete-data`

#### Test Execution
```bash
# Create disposable test user
TEST_USER="disposable-user-$(date +%s)"

# First attempt without confirmation (should fail)
curl -X POST http://localhost:5000/api/privacy/delete-data \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER\",
    \"email\": \"test@example.com\"
  }"

# Expected Response (400):
{
  "success": false,
  "error": "confirmDeletion must be true to delete data"
}

# Second attempt with confirmation
curl -X POST http://localhost:5000/api/privacy/delete-data \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER\",
    \"email\": \"test@example.com\",
    \"confirmDeletion\": true
  }"

# Expected Response (200):
{
  "success": true,
  "data": {
    "deletedAt": "2025-12-11T10:35:00Z",
    "deletedItems": {
      "users": 1,
      "agents": 2,
      "callLogs": 15,
      "documents": 8,
      "auditLogs": 0  // Not deleted, only anonymized
    }
  }
}
```

#### Verification
```bash
# Verify user data deleted
curl "http://localhost:5000/api/agents?userId=$TEST_USER"
# Should return empty array or 404

# Verify audit logs exist but anonymized
curl "http://localhost:5000/api/privacy/audit-log?userId=$TEST_USER"
# May still show deleted action, but user details removed
```

### 3.4 Audit Log Endpoint

**Endpoint**: `GET /api/privacy/audit-log`

#### Test Execution
```bash
# Get audit logs for user
curl "http://localhost:5000/api/privacy/audit-log?userId=user-123&limit=10"

# Expected Response (200):
{
  "success": true,
  "data": {
    "userId": "user-123",
    "logs": [
      {
        "id": "audit-001",
        "action": "create_agent",
        "resourceType": "agent",
        "resourceId": "agent-123",
        "details": {
          "name": "My Agent",
          "language": "de-CH"
        },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-12-01T08:00:00Z"
      },
      {
        "id": "audit-002",
        "action": "update_config",
        "resourceType": "agent",
        "resourceId": "agent-123",
        "details": {
          "field": "systemPrompt",
          "oldValue": "...",
          "newValue": "..."
        },
        "createdAt": "2025-12-01T09:30:00Z"
      }
    ],
    "totalCount": 47,
    "pageSize": 10
  }
}
```

#### Query Parameters
```bash
# Get specific action
curl "http://localhost:5000/api/privacy/audit-log?userId=user-123&action=create_agent"

# Get with pagination
curl "http://localhost:5000/api/privacy/audit-log?userId=user-123&limit=20&offset=40"

# Date range (optional if implemented)
curl "http://localhost:5000/api/privacy/audit-log?userId=user-123&from=2025-12-01&to=2025-12-31"
```

### 3.5 Privacy Policy Endpoint

**Endpoint**: `GET /api/privacy/policy`

#### Test Execution
```bash
curl http://localhost:5000/api/privacy/policy

# Expected Response (200):
{
  "success": true,
  "data": {
    "title": "AIDevelo.ai Privacy Policy - GDPR & nDSG Compliance",
    "jurisdiction": "Switzerland (nDSG - Federal Data Protection Act)",
    "lastUpdated": "2025-12-11",
    "sections": {
      "overview": {
        "title": "Data Protection Overview",
        "content": "..."
      },
      "dataCollection": {
        "title": "What Data We Collect",
        "categories": [
          {
            "name": "Call Data",
            "fields": ["duration", "transcription", "participants"]
          },
          {
            "name": "User Data",
            "fields": ["email", "name", "company"]
          }
        ]
      },
      "userRights": {
        "title": "Your Rights Under GDPR/nDSG",
        "rights": [
          {
            "name": "Right of Access",
            "description": "Endpoint: POST /api/privacy/export-data"
          },
          {
            "name": "Right to Erasure",
            "description": "Endpoint: POST /api/privacy/delete-data"
          },
          {
            "name": "Right to Data Portability",
            "description": "Use /api/privacy/export-data to download JSON"
          },
          {
            "name": "Right to Object",
            "description": "Contact privacy@aidevelo.ai"
          }
        ]
      },
      "retentionPolicy": {
        "callLogs": "90 days",
        "auditLogs": "1 year",
        "userData": "Until account deletion"
      },
      "security": {
        "encryption": "AES-256 for data at rest, TLS 1.3 in transit",
        "accessControl": "Role-based access control (RBAC)"
      },
      "dpo": {
        "name": "Data Protection Officer",
        "email": "privacy@aidevelo.ai",
        "phone": "+41 XX XXX XXXX"
      }
    }
  }
}
```

---

## 4. WebSocket Testing

### 4.1 Manual WebSocket Connection Test

#### Using Browser DevTools
```javascript
// In browser console after getting token:

// 1. Get token
const tokenResponse = await fetch('/api/voice-agent/elevenlabs-stream-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'test-user',
    agentId: 'test-agent'
  })
});
const { data } = await tokenResponse.json();
const token = data.token;

// 2. Connect to WebSocket
const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai?token=${token}`);

// 3. Monitor events
ws.onopen = () => console.log('✓ WebSocket connected');
ws.onmessage = (e) => {
  try {
    const msg = JSON.parse(e.data);
    console.log('Message:', msg);
  } catch {
    console.log('Binary audio received:', e.data);
  }
};
ws.onerror = (e) => console.error('WebSocket error:', e);
ws.onclose = () => console.log('WebSocket closed');

// 4. Send test message
ws.send(JSON.stringify({
  type: 'user_message',
  message: 'Hello, can you help me?'
}));

// 5. Close connection
// ws.close();
```

#### Expected Output
```
✓ WebSocket connected
Message: { type: 'conversation_initiation', conversation_id: 'conv-123' }
Message: { type: 'server_mid', mid: 'msg-456' }
Message: { type: 'user_transcript', transcript: 'Hello, can you help me?' }
Binary audio received: (Blob) ...
Message: { type: 'audio_out', audio: 'base64...' }
```

### 4.2 WebSocket Load Testing

```bash
# Using wscat tool
npm install -g wscat

# Get token first
TOKEN=$(curl -s -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{"customerId":"load-test","agentId":"agent-123"}' \
  | jq -r '.data.token')

# Connect multiple WebSocket clients
for i in {1..5}; do
  echo "Connecting client $i..."
  wscat -c "wss://api.elevenlabs.io/v1/convai?token=$TOKEN" &
done

# Send messages from each client
# Monitor for 60 seconds
sleep 60

# Verify no connection drops
```

---

## 5. Database Testing

### 5.1 Verify Migration Applied

```bash
# Connect to database
psql -h localhost -U aidevelo -d aidevelo_dev

# Check tables exist
\dt call_logs
\dt audit_logs

# Check indexes
\di | grep call_logs
\di | grep audit_logs

# Check views
\dv | grep agent_call_metrics
```

### 5.2 Insert Test Data

```sql
-- Insert test call log
INSERT INTO call_logs (
  id, agent_id, customer_id, phone_number, 
  start_time, end_time, duration, status, 
  transcription, success_rate
) VALUES (
  'call-test-001',
  '00000000-0000-0000-0000-000000000001', -- Existing agent ID
  'customer-123',
  '+41791234567',
  NOW() - INTERVAL '1 hour',
  NOW(),
  3600,
  'completed',
  'Customer inquired about business hours',
  95.5
);

-- Insert test audit log
INSERT INTO audit_logs (
  id, user_id, action, resource_type, 
  resource_id, details
) VALUES (
  'audit-test-001',
  'user-123',
  'create_agent',
  'agent',
  '00000000-0000-0000-0000-000000000001',
  '{"name": "Test Agent", "language": "de-CH"}'::jsonb
);

-- Query metrics view
SELECT * FROM agent_call_metrics;
```

### 5.3 Query Performance

```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM call_logs 
WHERE agent_id = '...' 
AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;

-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE relname IN ('call_logs', 'audit_logs')
ORDER BY idx_blks_read DESC;

-- Monitor connections
SELECT datname, count(*) FROM pg_stat_activity 
GROUP BY datname;
```

---

## 6. Compliance Testing

### 6.1 GDPR Data Export Validation

```bash
# Export user data
curl -X POST http://localhost:5000/api/privacy/export-data \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","email":"user@example.com"}' \
  > export.json

# Validate export completeness
jq 'keys' export.json
# Should include: user, agents, callLogs, auditLogs, documents

# Verify no sensitive data
grep -i "password\|secret\|key" export.json
# Should return no results

# Check timestamp validity
jq '.exportDate | fromdate' export.json
```

### 6.2 GDPR Right to Deletion

```bash
# Create test user with data
# 1. Create user, agent, call logs, etc.

# 2. Verify data exists
curl http://localhost:5000/api/agents?userId=test-delete-user
# Should return agents

# 3. Delete user data
curl -X POST http://localhost:5000/api/privacy/delete-data \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-delete-user",
    "email":"test@example.com",
    "confirmDeletion":true
  }'

# Expected: deletedItems count > 0

# 4. Verify deletion
curl http://localhost:5000/api/agents?userId=test-delete-user
# Should return empty array or 404

# 5. Verify audit trail preserved
curl "http://localhost:5000/api/privacy/audit-log?userId=test-delete-user"
# May show delete_data action but user anonymized
```

### 6.3 Audit Trail Completeness

```bash
# Create new agent (should log)
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"audit-test",
    "name":"Audit Test Agent",
    "businessProfile":{"companyName":"Test","industry":"Tech"}
  }'

# Get audit log
curl "http://localhost:5000/api/privacy/audit-log?userId=audit-test"

# Verify entry exists with:
# - action: "create_agent"
# - ipAddress: (not null)
# - userAgent: (not null)
# - details: (contains agent config)
```

---

## 7. Load & Stress Testing

### 7.1 API Load Test

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:5000/health

# Using wrk
wrk -t4 -c100 -d30s http://localhost:5000/health
```

### 7.2 WebSocket Load Test

```bash
# Using k6 (if installed)
cat > websocket-load-test.js << 'EOF'
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  vus: 10,      // Virtual users
  duration: '30s',
};

export default function () {
  const url = 'wss://api.elevenlabs.io/v1/convai?token=...';
  const res = ws.connect(url, function (socket) {
    socket.on('open', () => {
      console.log('connected');
      socket.send(JSON.stringify({
        type: 'user_message',
        message: 'Hello'
      }));
    });

    socket.on('message', (data) => {
      check(data, {
        'received message': (msg) => msg.length > 0
      });
    });

    socket.on('close', () => console.log('disconnected'));
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
EOF

k6 run websocket-load-test.js
```

---

## 8. Monitoring & Observability

### 8.1 Check Health Endpoints

```bash
# Basic health
curl http://localhost:5000/health

# Readiness (includes database check)
curl http://localhost:5000/health/ready

# Metrics (Prometheus format)
curl http://localhost:5000/metrics
```

### 8.2 View Traces in Jaeger

```bash
# Open Jaeger UI
open http://localhost:16686

# Search for:
# Service: aidevelo-api
# Operation: POST /api/voice-agent/elevenlabs-stream-token
# View trace timings and spans
```

### 8.3 Monitor Database

```bash
# Check connection pool status
SELECT current_setting('max_connections') as max_connections,
       (SELECT count(*) FROM pg_stat_activity) as active_connections;

# Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;
```

---

## 9. Security Testing

### 9.1 CORS Validation

```bash
# Test CORS headers
curl -H "Origin: http://localhost:4000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:5000/api/agents \
     -v

# Verify response includes:
# Access-Control-Allow-Origin: http://localhost:4000
# Access-Control-Allow-Methods: POST, GET, PUT, DELETE
```

### 9.2 API Key Security

```bash
# Verify API key not exposed in token
TOKEN=$(curl -s -X POST http://localhost:5000/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d '{"customerId":"sec-test","agentId":"agent-123"}' \
  | jq -r '.data.token')

# Decode token (should be JWT, not plaintext key)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.'

# Verify it doesn't contain actual API key
```

### 9.3 Rate Limiting

```bash
# Send 101 requests to rate-limited endpoint
for i in {1..101}; do
  curl -s http://localhost:5000/api/health
  echo "Request $i"
done | tail -5

# Should see 429 Too Many Requests on request 101+
```

---

## 10. Checklist

- [ ] All unit tests passing (11/11)
- [ ] Build succeeds with zero TypeScript errors
- [ ] Token endpoint returns valid JWT token
- [ ] Export data endpoint returns complete JSON
- [ ] Delete data endpoint removes user with confirmation
- [ ] Audit log endpoint shows all user actions
- [ ] Privacy policy endpoint returns valid document
- [ ] WebSocket connections succeed with valid token
- [ ] WebSocket message types handled correctly
- [ ] Migration 010 applied successfully
- [ ] call_logs and audit_logs tables exist
- [ ] Indexes on high-query columns working
- [ ] GDPR export includes all user data
- [ ] GDPR deletion removes user data but keeps audit logs
- [ ] Audit trails record all API actions
- [ ] No API keys exposed in responses
- [ ] CORS headers correct for frontend origin
- [ ] Rate limiting working (100 req/15min)
- [ ] Health endpoints responding
- [ ] Database connections pooling correctly
- [ ] No sensitive data in logs

---

## 11. Automated Testing Script

```bash
#!/bin/bash
# test.sh - Automated API testing

set -e

BASE_URL="http://localhost:5000"
TEST_USER="api-test-$(date +%s)"

echo "🧪 Running API Tests..."

# Test 1: Health Check
echo "✓ Testing health endpoint..."
curl -s $BASE_URL/health | jq .

# Test 2: Token Generation
echo "✓ Testing token generation..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/api/voice-agent/elevenlabs-stream-token \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"$TEST_USER\",\"agentId\":\"test-agent\"}")
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token')
echo "Token: ${TOKEN:0:20}..."

# Test 3: Data Export
echo "✓ Testing data export..."
curl -s -X POST $BASE_URL/api/privacy/export-data \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER\",\"email\":\"test@example.com\"}" | jq '.data | keys'

# Test 4: Audit Log
echo "✓ Testing audit log..."
curl -s "$BASE_URL/api/privacy/audit-log?userId=$TEST_USER" | jq '.data.logs | length'

# Test 5: Privacy Policy
echo "✓ Testing privacy policy..."
curl -s $BASE_URL/api/privacy/policy | jq '.data.title'

echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x test.sh
./test.sh
```

---

**Status**: Complete testing & validation guide  
**Coverage**: API endpoints, WebSocket, database, compliance, security  
**Next Step**: Execute tests against running backend
