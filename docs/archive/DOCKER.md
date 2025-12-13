# Docker Setup für AIDevelo.ai

Dieses Projekt kann mit Docker gebaut und ausgeführt werden.

## Voraussetzungen

- Docker (Version 20.10 oder höher)
- Docker Compose (optional, aber empfohlen)

## Umgebungsvariablen

Erstelle eine `.env` Datei im Hauptordner mit folgenden Variablen:

```env
NODE_ENV=production
PORT=5000
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
FRONTEND_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:5000,https://aidevelo.ai,https://www.aidevelo.ai

# Stripe wird später integriert - erstmal nicht benötigt
# STRIPE_SECRET_KEY=your_stripe_secret_key_here
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Docker Build

### Einfacher Build

```bash
docker build -t aidevelo:latest .
```

### Build mit Docker Compose

```bash
docker-compose build
```

## Docker Run

### Einfacher Run

```bash
docker run -p 5000:5000 --env-file .env aidevelo:latest
```

### Run mit Docker Compose

```bash
docker-compose up -d
```

Die Anwendung ist dann unter `http://localhost:5000` erreichbar.

## Docker Compose Befehle

- **Start**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **Logs anzeigen**: `docker-compose logs -f`
- **Neustart**: `docker-compose restart`
- **Rebuild**: `docker-compose up -d --build`

## Health Check

Der Container hat einen Health Check, der alle 30 Sekunden läuft:
- Endpoint: `http://localhost:5000/health`
- Status kann mit `docker ps` überprüft werden

## Produktions-Deployment

Für Produktions-Deployment:

1. Stelle sicher, dass alle Umgebungsvariablen gesetzt sind
2. Verwende ein Reverse Proxy (z.B. Nginx) vor dem Container
3. Setze `NODE_ENV=production`
4. Konfiguriere SSL/TLS für HTTPS
5. Verwende ein Volume für persistente Daten (falls benötigt)

## Troubleshooting

### Container startet nicht

- Prüfe die Logs: `docker-compose logs`
- Stelle sicher, dass die `.env` Datei existiert und korrekt ist
- Prüfe, ob Port 5000 bereits belegt ist

### Frontend wird nicht angezeigt

- Stelle sicher, dass `NODE_ENV=production` gesetzt ist
- Prüfe, ob das Frontend korrekt gebaut wurde
- Überprüfe die Logs auf Fehler

### API funktioniert nicht

- Prüfe die Umgebungsvariablen (besonders `ELEVENLABS_API_KEY`)
- Überprüfe die CORS-Einstellungen in `ALLOWED_ORIGINS`
- Prüfe die Logs für detaillierte Fehlermeldungen

