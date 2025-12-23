#!/usr/bin/env python3
"""
Automatisches FreeSWITCH Setup auf Hetzner Server
Verwendet Hetzner Cloud API und SSH
"""

import subprocess
import sys
import os
import time

# Connection settings (do NOT hard-code secrets in repo)
#
# Required:
#   - Set HETZNER_SERVER_IP (or edit the default) to your server's public IP
#
# Optional:
#   - Set SSH_KEY_PATH to override the default key path
SERVER_IP = os.getenv("HETZNER_SERVER_IP", "91.99.202.18")
SSH_KEY_PATH = os.path.expanduser(os.getenv("SSH_KEY_PATH", "~/.ssh/id_ed25519"))

def run_ssh_command(command):
    """Führt einen Befehl auf dem Hetzner Server aus"""
    ssh_cmd = [
        "ssh",
        "-i", SSH_KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        f"root@{SERVER_IP}",
        command
    ]
    
    try:
        result = subprocess.run(
            ssh_cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timeout"
    except Exception as e:
        return False, "", str(e)

def check_freeswitch():
    """Prüft ob FreeSWITCH läuft"""
    print("🔍 Prüfe FreeSWITCH Status...")
    success, stdout, stderr = run_ssh_command("docker ps | grep freeswitch")
    
    if success and "freeswitch" in stdout:
        print("✅ FreeSWITCH läuft bereits")
        print(stdout)
        return True
    else:
        print("❌ FreeSWITCH läuft NICHT")
        return False

def start_freeswitch():
    """Startet FreeSWITCH auf dem Server"""
    print("\n🚀 Starte FreeSWITCH...")
    
    # Prüfe ob Projekt-Verzeichnis existiert
    print("Prüfe Projekt-Verzeichnis...")
    success, stdout, stderr = run_ssh_command("test -d ~/REAL-AIDevelo.ai && echo 'exists' || echo 'not found'")
    
    if "not found" in stdout:
        print("Projekt nicht gefunden. Klone es...")
        success, stdout, stderr = run_ssh_command(
            "cd ~ && git clone https://github.com/keokukzh/REAL-AIDevelo.ai.git"
        )
        if not success:
            print(f"❌ Fehler beim Klonen: {stderr}")
            return False
    
    # Starte FreeSWITCH
    print("Starte FreeSWITCH Container...")
    success, stdout, stderr = run_ssh_command(
        "cd ~/REAL-AIDevelo.ai && docker compose up -d freeswitch"
    )
    
    if not success:
        print(f"❌ Fehler beim Starten: {stderr}")
        return False
    
    print("✅ FreeSWITCH gestartet")
    print("Warte 30 Sekunden auf Start...")
    time.sleep(30)
    
    # Prüfe Status
    success, stdout, stderr = run_ssh_command("docker ps | grep freeswitch")
    if success and "freeswitch" in stdout:
        print("✅ FreeSWITCH läuft jetzt")
        print(stdout)
        return True
    else:
        print("⚠️  FreeSWITCH Status unklar")
        print("Logs:")
        run_ssh_command("docker logs aidevelo-freeswitch --tail 20")
        return False

def check_port():
    """Prüft ob Port 7443 offen ist"""
    print("\n🔍 Prüfe Port 7443...")
    success, stdout, stderr = run_ssh_command("netstat -tulpn 2>/dev/null | grep 7443 || ss -tulpn 2>/dev/null | grep 7443")
    
    if success and "7443" in stdout:
        print("✅ Port 7443 ist offen")
        print(stdout)
    else:
        print("⚠️  Port 7443 nicht sichtbar (kann normal sein wenn im Container)")

def check_tunnel():
    """Prüft Cloudflare Tunnel"""
    print("\n🔍 Prüfe Cloudflare Tunnel...")
    success, stdout, stderr = run_ssh_command("systemctl is-active cloudflared 2>/dev/null && echo 'active' || echo 'inactive'")
    
    if "active" in stdout:
        print("✅ Cloudflare Tunnel läuft")
    else:
        print("❌ Cloudflare Tunnel läuft NICHT")
        print("Versuche Tunnel zu starten...")
        run_ssh_command("systemctl start cloudflared")
        time.sleep(2)
        success, stdout, stderr = run_ssh_command("systemctl is-active cloudflared 2>/dev/null && echo 'active' || echo 'inactive'")
        if "active" in stdout:
            print("✅ Cloudflare Tunnel gestartet")
        else:
            print("⚠️  Tunnel konnte nicht gestartet werden")

def main():
    print("=" * 50)
    print("FreeSWITCH Setup auf Hetzner Server")
    print("=" * 50)
    print()
    
    # Prüfe SSH-Key
    if not os.path.exists(SSH_KEY_PATH):
        print(f"❌ SSH-Key nicht gefunden: {SSH_KEY_PATH}")
        print("Bitte erstellen Sie einen SSH-Key mit: ssh-keygen -t ed25519")
        sys.exit(1)
    
    print(f"✅ SSH-Key gefunden: {SSH_KEY_PATH}")
    print()
    
    # Prüfe ob FreeSWITCH läuft
    if check_freeswitch():
        print("\n✅ FreeSWITCH läuft bereits - alles OK!")
    else:
        # Starte FreeSWITCH
        if start_freeswitch():
            print("\n✅ FreeSWITCH erfolgreich gestartet!")
        else:
            print("\n❌ FreeSWITCH konnte nicht gestartet werden")
            sys.exit(1)
    
    # Prüfe Port
    check_port()
    
    # Prüfe Tunnel
    check_tunnel()
    
    print("\n" + "=" * 50)
    print("✅ Setup abgeschlossen!")
    print("=" * 50)
    print("\nNächste Schritte:")
    print("1. Warte 1-2 Minuten (DNS-Propagierung)")
    print("2. Teste im Dashboard: https://aidevelo.ai/dashboard/test-call")
    print("3. Klicke auf 'Mit FreeSWITCH verbinden'")
    print()

if __name__ == "__main__":
    main()

