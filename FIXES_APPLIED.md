# ✅ Fixes Applied

## Problem Identified

**FreeSWITCH läuft bereits auf dem Hetzner Server!** ✅

Das Problem war **NICHT** dass FreeSWITCH nicht läuft, sondern:
1. **SIP URI Format war falsch** - Port wurde in die SIP URI eingefügt
2. **Target URI für Calls war falsch** - Port wurde auch hier eingefügt

## Fixes Applied

### 1. SIP URI Format korrigiert
**Vorher:**
```typescript
uri: UserAgent.makeURI(`sip:${sipUsername}@${hostname}:${port}`)
```

**Nachher:**
```typescript
uri: UserAgent.makeURI(`sip:${sipUsername}@${hostname}`)
```

**Warum:** SIP URIs enthalten keinen Port. Der Port wird nur für die WebSocket-Transport-Verbindung verwendet.

### 2. Target URI für Calls korrigiert
**Vorher:**
```typescript
const targetURI = UserAgent.makeURI(`sip:${extension}@${freeswitchWssUrl.replace('wss://', '')}`);
```

**Nachher:**
```typescript
const hostname = freeswitchWssUrl.replace(/^wss?:\/\//, '').split(':')[0].split('/')[0];
const targetURI = UserAgent.makeURI(`sip:${extension}@${hostname}`);
```

**Warum:** Die Target URI muss auch nur den Hostnamen enthalten, nicht den Port.

## Status Check (via Python Script)

✅ **FreeSWITCH läuft auf Server**
- Container Status: Up 41 minutes
- Port 7443: OPEN (LISTEN)
- Cloudflare Tunnel: RUNNING

## Next Steps

1. **Warte auf Render Deploy** (automatisch nach git push)
2. **Teste im Dashboard:** https://aidevelo.ai/dashboard/test-call
3. **Klicke auf "Mit FreeSWITCH verbinden"**

Die Verbindung sollte jetzt funktionieren! 🎯

