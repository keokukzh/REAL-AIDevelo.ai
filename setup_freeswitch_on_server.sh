#!/bin/bash
# Automatisches Setup-Script für FreeSWITCH auf Hetzner Server
# Führt alle notwendigen Schritte aus

set -e  # Exit on error

echo "=========================================="
echo "FreeSWITCH Setup auf Hetzner Server"
echo "=========================================="
echo ""

# 1. Prüfe ob im richtigen Verzeichnis
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml nicht gefunden!"
    echo "Wechsle zu Projekt-Verzeichnis..."
    if [ -d "~/REAL-AIDevelo.ai" ]; then
        cd ~/REAL-AIDevelo.ai
    elif [ -d "/root/REAL-AIDevelo.ai" ]; then
        cd /root/REAL-AIDevelo.ai
    else
        echo "Projekt nicht gefunden. Klone es..."
        git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git
        cd REAL-AIDevelo.ai
    fi
fi

echo "✅ Im Projekt-Verzeichnis: $(pwd)"
echo ""

# 2. Prüfe ob Docker läuft
echo "2. Prüfe Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nicht installiert!"
    echo "Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi
echo "✅ Docker installiert: $(docker --version)"
echo ""

# 3. Prüfe ob Docker Compose läuft
echo "3. Prüfe Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose nicht installiert!"
    echo "Installiere Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi
echo "✅ Docker Compose verfügbar"
echo ""

# 4. Prüfe ob FreeSWITCH läuft
echo "4. Prüfe FreeSWITCH Container..."
if docker ps | grep -q freeswitch; then
    echo "✅ FreeSWITCH läuft bereits"
    docker ps | grep freeswitch
else
    echo "❌ FreeSWITCH läuft NICHT"
    echo "Starte FreeSWITCH..."
    docker compose up -d freeswitch
    echo "Warte 30 Sekunden auf Start..."
    sleep 30
    if docker ps | grep -q freeswitch; then
        echo "✅ FreeSWITCH gestartet"
    else
        echo "❌ FreeSWITCH konnte nicht gestartet werden"
        echo "Logs:"
        docker logs aidevelo-freeswitch --tail 30
        exit 1
    fi
fi
echo ""

# 5. Prüfe Port 7443
echo "5. Prüfe Port 7443..."
if netstat -tulpn 2>/dev/null | grep -q ":7443" || ss -tulpn 2>/dev/null | grep -q ":7443"; then
    echo "✅ Port 7443 ist offen"
    netstat -tulpn 2>/dev/null | grep 7443 || ss -tulpn 2>/dev/null | grep 7443
else
    echo "⚠️  Port 7443 nicht sichtbar (kann normal sein wenn im Container)"
fi
echo ""

# 6. Prüfe FreeSWITCH Status
echo "6. Prüfe FreeSWITCH Status..."
if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
    echo "✅ FreeSWITCH antwortet"
    docker exec aidevelo-freeswitch fs_cli -x "status" | head -3
else
    echo "⚠️  FreeSWITCH antwortet nicht (kann normal sein beim Start)"
    echo "Versuche nochmal in 10 Sekunden..."
    sleep 10
    if docker exec aidevelo-freeswitch fs_cli -x "status" 2>/dev/null | grep -q "UP"; then
        echo "✅ FreeSWITCH antwortet jetzt"
    else
        echo "⚠️  FreeSWITCH antwortet immer noch nicht (kann OK sein)"
    fi
fi
echo ""

# 7. Prüfe Cloudflare Tunnel
echo "7. Prüfe Cloudflare Tunnel..."
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "✅ Cloudflare Tunnel läuft"
    systemctl status cloudflared --no-pager | head -3
else
    echo "❌ Cloudflare Tunnel läuft NICHT"
    echo "Starte Tunnel..."
    if systemctl start cloudflared 2>/dev/null; then
        sleep 2
        if systemctl is-active --quiet cloudflared; then
            echo "✅ Cloudflare Tunnel gestartet"
        else
            echo "⚠️  Tunnel konnte nicht gestartet werden (prüfe manuell)"
        fi
    else
        echo "⚠️  Tunnel-Service nicht gefunden (kann OK sein wenn manuell gestartet)"
    fi
fi
echo ""

# 8. Finale Zusammenfassung
echo "=========================================="
echo "Zusammenfassung:"
echo "=========================================="
echo "FreeSWITCH Container: $(docker ps | grep -q freeswitch && echo '✅ LÄUFT' || echo '❌ LÄUFT NICHT')"
echo "Cloudflare Tunnel: $(systemctl is-active --quiet cloudflared 2>/dev/null && echo '✅ LÄUFT' || echo '❌ LÄUFT NICHT')"
echo ""
echo "Nächste Schritte:"
echo "1. Warte 1-2 Minuten (DNS-Propagierung)"
echo "2. Teste im Dashboard: https://aidevelo.ai/dashboard/test-call"
echo "3. Klicke auf 'Mit FreeSWITCH verbinden'"
echo ""
echo "=========================================="

