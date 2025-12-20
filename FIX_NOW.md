# 🔴 SOFORT FIXEN - 2 Probleme gefunden!

## Problem 1: Render Environment Variable
**Aktuell:** `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai:7443`  
**Sollte sein:** `FREESWITCH_WSS_URL=wss://freeswitch.aidevelo.ai` (OHNE Port!)

**Fix:**
1. Gehe zu Render Dashboard → Environment Variables
2. Bearbeite `FREESWITCH_WSS_URL`
3. Ändere Wert von `wss://freeswitch.aidevelo.ai:7443` zu `wss://freeswitch.aidevelo.ai`
4. Speichern → Render deployt automatisch neu

---

## Problem 2: Cloudflare DNS - FALSCH KONFIGURIERT! 🔴

**Aktuell:** 
- A-Record: `freeswitch` → `91.99.202.18`
- Status: "DNS only" (graue Wolke) ❌

**Problem:** "DNS only" bedeutet, dass Browser direkt zur IP verbindet, NICHT über Cloudflare Tunnel!

**Sollte sein:**
- CNAME: `freeswitch` → `c7580385-88ce-474b-b8bd-9bea4d52b296.cfargotunnel.com`
- Status: "Proxied" (orange Wolke) ✅

**Fix:**
1. Gehe zu Cloudflare Dashboard → DNS
2. **LÖSCHE** den A-Record `freeswitch` → `91.99.202.18`
3. **ERSTELLE** neuen CNAME-Record:
   - **Type:** CNAME
   - **Name:** `freeswitch`
   - **Target:** `c7580385-88ce-474b-b8bd-9bea4d52b296.cfargotunnel.com`
   - **Proxy status:** ✅ **Proxied** (orange Wolke aktivieren!)
4. Speichern

---

## Nach Fixes:
1. Warte 1-2 Minuten (DNS Propagation)
2. Teste: https://aidevelo.ai/dashboard/test-call
3. Klicke "Mit FreeSWITCH verbinden"

**Warum wichtig:**
- Ohne CNAME zu Tunnel → Browser verbindet direkt zu IP → CSP blockiert
- Mit Port in URL → CSP blockiert Port-Nummern
- Mit CNAME + Proxied → Cloudflare Tunnel leitet korrekt weiter ✅

