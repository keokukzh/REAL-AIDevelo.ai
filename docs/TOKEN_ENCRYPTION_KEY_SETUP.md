# TOKEN_ENCRYPTION_KEY Setup für Render

## Problem

Wenn du versuchst, den Google Calendar zu verbinden, erhältst du möglicherweise diesen Fehler:

```
calendar.token.store_fatal: TOKEN_ENCRYPTION_KEY missing in production
```

Dies bedeutet, dass die `TOKEN_ENCRYPTION_KEY` Environment Variable in Render nicht gesetzt ist.

## Lösung

### Schritt 1: Generiere einen sicheren Schlüssel

Öffne ein Terminal und führe diesen Befehl aus:

```bash
openssl rand -base64 32
```

Dies generiert einen zufälligen 44-Zeichen-String (base64-kodiert), z.B.:
```
xK9mP2qR7vT3wY5zA8bC1dE4fG6hI9jK0lM3nO5pQ7rS2tU4vW6xY8zA1bC3dE5f
```

**Wichtig:** Speichere diesen Schlüssel sicher! Wenn du ihn verlierst, können bereits verschlüsselte Kalender-Tokens nicht mehr entschlüsselt werden.

### Schritt 2: Setze die Variable in Render

1. Gehe zu [Render Dashboard](https://dashboard.render.com/)
2. Wähle deinen Service: **REAL-AIDevelo.ai**
3. Klicke auf **Environment** im linken Menü
4. Scrolle nach unten zu **Environment Variables**
5. Klicke auf **Add Environment Variable**
6. Fülle aus:
   - **KEY**: `TOKEN_ENCRYPTION_KEY`
   - **VALUE**: Füge den generierten Schlüssel ein (z.B. `xK9mP2qR7vT3wY5zA8bC1dE4fG6hI9jK0lM3nO5pQ7rS2tU4vW6xY8zA1bC3dE5f`)
7. Klicke auf **Save Changes**

### Schritt 3: Service neu starten

Nach dem Speichern startet Render den Service automatisch neu. Du kannst auch manuell neu starten:
1. Gehe zu **Events** im Render Dashboard
2. Klicke auf **Manual Deploy** → **Clear build cache & deploy**

### Schritt 4: Teste die Kalender-Verbindung

1. Gehe zu deinem Dashboard: `https://aidevelo.ai/dashboard`
2. Klicke auf **Kalender verbinden**
3. Führe den Google OAuth-Flow durch
4. Die Verbindung sollte jetzt erfolgreich sein

## Format-Optionen

Der `TOKEN_ENCRYPTION_KEY` kann in verschiedenen Formaten bereitgestellt werden:

- **Base64** (empfohlen): 44 Zeichen, z.B. `xK9mP2qR7vT3wY5zA8bC1dE4fG6hI9jK0lM3nO5pQ7rS2tU4vW6xY8zA1bC3dE5f`
- **Hex**: 64 Zeichen, z.B. `a1b2c3d4e5f6...` (64 hex chars)
- **UTF-8**: Beliebiger String (wird automatisch auf 32 Bytes gehasht)

## Sicherheit

⚠️ **WICHTIG:**
- Der `TOKEN_ENCRYPTION_KEY` ist **kritisch** für die Sicherheit
- **NIEMALS** committe diesen Schlüssel in Git
- **NIEMALS** teile diesen Schlüssel öffentlich
- Wenn der Schlüssel verloren geht, müssen alle Kalender-Verbindungen neu eingerichtet werden
- Wenn der Schlüssel kompromittiert wird, ändere ihn sofort und verbinde alle Kalender neu

## Troubleshooting

### Fehler: "TOKEN_ENCRYPTION_KEY must be 32 bytes"

Dies bedeutet, dass der bereitgestellte Schlüssel nicht das richtige Format hat. Verwende `openssl rand -base64 32` um einen korrekten Schlüssel zu generieren.

### Fehler: "Token encryption required in production"

Dies bedeutet, dass `TOKEN_ENCRYPTION_KEY` nicht gesetzt ist. Folge den Schritten oben, um sie zu setzen.

### Kalender-Verbindung funktioniert nicht nach dem Setzen

1. Überprüfe, ob der Service neu gestartet wurde (siehe Render Events)
2. Überprüfe die Render Logs auf Fehler
3. Stelle sicher, dass der Schlüssel korrekt kopiert wurde (keine Leerzeichen am Anfang/Ende)
