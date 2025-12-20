# ElevenLabs Affiliate Program Setup

## Übersicht

Das ElevenLabs Affiliate-Programm bietet **22% Provision für 12 Monate** auf alle Zahlungen von geworbenen Kunden.

## Vorteile

- **22% Provision** für 12 Monate pro geworbenem Kunden
- **Passives Einkommen** durch Empfehlungen
- **Kostenreduzierung** durch Affiliate-Einnahmen
- **Skalierbares Geschäftsmodell**

## Setup-Schritte

### 1. Affiliate-Account erstellen

1. Gehe zu: https://elevenlabs.io/affiliates
2. Melde dich mit deinem ElevenLabs-Account an
3. Fülle das Affiliate-Formular aus
4. Warte auf Genehmigung (meist innerhalb von 24-48 Stunden)

### 2. Affiliate-Link generieren

Nach Genehmigung erhältst du:
- **Affiliate-Link**: z.B. `https://elevenlabs.io/?ref=YOUR_AFFILIATE_ID`
- **Tracking-Parameter**: `?ref=YOUR_AFFILIATE_ID` oder `?utm_source=YOUR_SOURCE`

### 3. Integration in AIDevelo

**Option A: Direkter Link in Dashboard**
- Zeige Affiliate-Link im Dashboard für Kunden
- "Upgrade dein ElevenLabs-Account über unseren Link"

**Option B: Automatische Weiterleitung**
- Wenn Kunde ElevenLabs-Account benötigt → Weiterleitung mit Affiliate-Link
- Tracking über `utm_source=aidevelo`

**Option C: Subaccount-System (später)**
- Automatische Erstellung von ElevenLabs-Accounts für Kunden
- Affiliate-Link wird automatisch verwendet

## Konfiguration

### Environment Variables

```bash
# Optional: Affiliate Link für Kunden-Upgrades
ELEVENLABS_AFFILIATE_LINK=https://elevenlabs.io/?ref=YOUR_AFFILIATE_ID
ELEVENLABS_AFFILIATE_ID=YOUR_AFFILIATE_ID
```

### Dashboard-Integration

1. **Settings Page**: Zeige Affiliate-Status
2. **Onboarding Flow**: Empfehle ElevenLabs-Upgrade mit Affiliate-Link
3. **Billing Page**: Link zu ElevenLabs mit Affiliate-Parameter

## Tracking

### Erfolgsmessung

- **Conversions**: Anzahl Kunden, die über Affiliate-Link ElevenLabs abonnieren
- **Provision**: 22% der ersten 12 Monate Zahlungen
- **ROI**: Vergleich Affiliate-Einnahmen vs. eigene ElevenLabs-Kosten

### Dashboard-Metriken (später)

- Anzahl geworbener Kunden
- Gesamt-Provision (geschätzt)
- Top-Kunden nach ElevenLabs-Verbrauch

## Best Practices

1. **Transparenz**: Informiere Kunden über Affiliate-Partnerschaft
2. **Wert bieten**: Nur empfehlen, wenn ElevenLabs wirklich passt
3. **Tracking**: Nutze UTM-Parameter für besseres Tracking
4. **Monitoring**: Prüfe regelmäßig Affiliate-Dashboard

## Nächste Schritte

1. ✅ Affiliate-Account beantragen
2. ⏳ Affiliate-Link in Environment Variables setzen
3. ⏳ Dashboard-Integration (Affiliate-Status anzeigen)
4. ⏳ Onboarding-Flow erweitern (Affiliate-Link einbauen)
5. ⏳ Tracking-System implementieren

## Links

- **Affiliate-Programm**: https://elevenlabs.io/affiliates
- **Affiliate-Dashboard**: (wird nach Genehmigung verfügbar)
- **Support**: support@elevenlabs.io
