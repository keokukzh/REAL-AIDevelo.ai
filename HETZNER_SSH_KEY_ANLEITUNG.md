# SSH-Key für Hetzner - Anleitung

## 🔑 SSH-Key erstellen (Windows)

### Schritt 1: Prüfen ob bereits ein SSH-Key existiert

Öffnen Sie PowerShell und führen Sie aus:

```powershell
# Prüfe ob SSH-Key existiert
Test-Path $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Wenn `True`:** SSH-Key existiert bereits ✅
**Wenn `False`:** SSH-Key muss erstellt werden

---

### Schritt 2: SSH-Key erstellen (falls nicht vorhanden)

```powershell
# Erstelle neuen SSH-Key (Ed25519 - empfohlen)
ssh-keygen -t ed25519 -C "aidevelo-hetzner" -f "$env:USERPROFILE\.ssh\id_ed25519"
```

**Wichtig:** 
- Drücken Sie einfach `Enter` wenn nach Passphrase gefragt wird (oder geben Sie ein Passwort ein)
- Der Key wird erstellt in: `C:\Users\IhrBenutzername\.ssh\id_ed25519`

---

### Schritt 3: Öffentlichen SSH-Key anzeigen

```powershell
# Zeige öffentlichen Key an
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Kopieren Sie die gesamte Ausgabe!** (beginnt mit `ssh-ed25519 ...`)

---

## 📋 SSH-Key in Hetzner einfügen

### Option A: Während Server-Erstellung

1. **Im Hetzner Dashboard** (wo Sie gerade sind):
   - Klicken Sie auf **"+ SSH-Key hinzufügen"**
   - **Name:** z.B. "Mein Laptop" oder "Windows PC"
   - **Public Key:** Fügen Sie den kopierten Key ein (die gesamte Zeile)
   - Klicken Sie auf **"Hinzufügen"**

2. **Wählen Sie den Key aus:**
   - Der SSH-Key sollte jetzt in der Liste erscheinen
   - Wählen Sie ihn aus (Radio-Button aktivieren)

---

### Option B: Später im Hetzner Dashboard

1. **Gehen Sie zu:** https://console.hetzner.cloud/
2. **Klicken Sie auf:** "Security" → "SSH Keys" (links im Menü)
3. **Klicken Sie auf:** "Add SSH Key"
4. **Füllen Sie aus:**
   - **Name:** z.B. "Mein Laptop"
   - **Public Key:** Fügen Sie den kopierten Key ein
5. **Klicken Sie auf:** "Add SSH Key"

---

## ✅ Testen der SSH-Verbindung

**Nachdem der Server erstellt wurde:**

```powershell
# Verbinden Sie sich mit dem Server
ssh root@IHR_SERVER_IP
```

**Erwartetes Ergebnis:**
- Sie werden ohne Passwort-Eingabe verbunden (wenn SSH-Key korrekt eingefügt wurde)
- Oder Sie sehen: "Are you sure you want to continue connecting (yes/no)?" → Tippen Sie `yes`

---

## 🔍 SSH-Key Speicherort

**Windows:**
```
C:\Users\IhrBenutzername\.ssh\id_ed25519      (privater Key - NIEMALS teilen!)
C:\Users\IhrBenutzername\.ssh\id_ed25519.pub  (öffentlicher Key - für Hetzner)
```

**Wichtig:**
- **Privater Key** (`id_ed25519`) → NIEMALS teilen oder hochladen!
- **Öffentlicher Key** (`id_ed25519.pub`) → Sicher zu teilen, für Hetzner verwenden

---

## 🆘 Troubleshooting

### Problem: "ssh-keygen: command not found"

**Lösung:** Windows 10/11 hat OpenSSH standardmäßig installiert. Falls nicht:

1. **Windows Settings** → **Apps** → **Optional Features**
2. Suchen Sie nach "OpenSSH Client"
3. Installieren falls nicht vorhanden

### Problem: "Permission denied (publickey)"

**Lösung:**
1. Prüfen Sie ob der SSH-Key korrekt in Hetzner eingefügt wurde
2. Prüfen Sie ob Sie den richtigen Key verwenden:
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
   ```
3. Stellen Sie sicher, dass der Key in Hetzner dem Server zugewiesen ist

### Problem: "Key wird nicht erkannt"

**Lösung:**
1. Prüfen Sie ob der gesamte Key kopiert wurde (eine Zeile, beginnt mit `ssh-ed25519` oder `ssh-rsa`)
2. Prüfen Sie ob keine Leerzeichen am Anfang/Ende sind
3. Erstellen Sie einen neuen Key falls nötig

---

## 📝 Zusammenfassung

1. ✅ SSH-Key erstellen: `ssh-keygen -t ed25519 -C "aidevelo-hetzner"`
2. ✅ Öffentlichen Key anzeigen: `Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub`
3. ✅ Key kopieren (die gesamte Zeile)
4. ✅ In Hetzner einfügen: "+ SSH-Key hinzufügen"
5. ✅ Key auswählen beim Server erstellen

**Ihr SSH-Key ist jetzt bereit für Hetzner!** 🎉

