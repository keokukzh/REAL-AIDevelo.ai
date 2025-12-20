# WebSocket Protocol Header Problem

**Problem**: FreeSWITCH WSS gibt keinen `Sec-WebSocket-Protocol` Header zurück, obwohl SIP.js diesen erwartet.

**Fehler**: `Error during WebSocket handshake: Sent non-empty 'Sec-WebSocket-Protocol' header but no response was received`

**Lösung**: FreeSWITCH unterstützt möglicherweise nicht den `Sec-WebSocket-Protocol: sip` Header. Wir müssen entweder:
1. Den Header in Nginx entfernen/ignorieren
2. Oder FreeSWITCH so konfigurieren, dass es den Header zurückgibt

**Test**: Direkte Verbindung zu FreeSWITCH WSS (ohne Nginx) testen.

