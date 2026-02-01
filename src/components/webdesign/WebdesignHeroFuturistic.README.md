# WebdesignHeroFuturistic

Futuristischer Hero-Header im Stil von Vercel Ship & Lusion für die Aidevelo.ai Webdesign-Landingpage.

## Features

- **2-spaltiges Layout**: Text links, 3D-Device-Frame rechts
- **Neon-Glow-Effekte**: Cyan/Violett-Akzente mit Glow-Effekten
- **Animierte Hintergrund-Blobs**: Langsame, subtile Animationen
- **3D-Device-Frame**: Mit Mouse-Parallax und Floating-Animation
- **Entry-Animationen**: Stagger-Animationen für Headline, Bullets, CTAs
- **Hover-Interaktionen**: Neon-Glow-Pulse, Gradient-Shift, Badge-Shine
- **Performance-optimiert**: GPU-Transforms, Reduced Motion Support
- **Responsive**: Mobile Stack-Layout, Desktop 2-Spalten

## Verwendung

```tsx
import { WebdesignHeroFuturistic } from './components/webdesign';

<WebdesignHeroFuturistic
  t={{
    heroHeadline: 'Premium Webdesign, das messbare Ergebnisse liefert – für Schweizer KMU, die online wachsen wollen.',
    heroSubheadline: 'Websites mit 100/100 Lighthouse-Score, die Conversion um durchschnittlich 25% steigern. Individuelles Design, Schweizer Qualität, transparente Festpreise – in 2-3 Wochen live.',
    heroBullets: [
      '100/100 Lighthouse-Score – messbar schneller als 95% der Konkurrenz',
      'Ladezeiten unter 1 Sekunde – steigert Conversion um bis zu 20%',
      'Individuelles Design statt Templates – Ihre Marke, nicht ein Baukasten',
      'Persönliche 1:1 Betreuung aus der Schweiz – von Strategie bis Launch',
    ],
    ctaPrimary: 'Projekt unverbindlich anfragen',
    ctaSecondary: 'Beispiele ansehen',
    heroTrustLighthouse: '100/100 Lighthouse-Score',
    heroTrustLoadTime: '< 1 Sekunde Ladezeit',
    heroTrustGdpr: 'DSGVO-konform & sicher gehostet',
    scrollExplore: 'Scrollen zum Entdecken',
  }}
/>
```

## Komponenten-Struktur

- `WebdesignHeroFuturistic.tsx` - Hauptkomponente
- `NeonBackgroundBlobs.tsx` - Animierte Hintergrund-Blobs
- `GridOverlay.tsx` - Subtiles Grid-Pattern mit Parallax
- `AnimatedHeadline.tsx` - Headline mit Neon-Glow-Effekten
- `HeroDeviceFrame.tsx` - 3D-Device-Frame mit Parallax

## Animationen

### Entry-Animationen
- **Headline**: Stagger-Animation mit Neon-Glow auf Line 2
- **Bullets**: Stagger mit 0.06s Delay zwischen Einträgen
- **CTAs**: Scale 0.9->1 mit Shadow-Fade (delay 0.8s)
- **Device**: Scale 0.9->1, y 24->0 (delay 0.4s)

### Interaktionen
- **Primary CTA**: Scale 1.03, Neon-Glow-Pulse, Gradient-Shift
- **Secondary CTA**: Underline-Wipe from Center
- **Badge**: Shine/Gradient-Wipe über Badge
- **Device**: Mouse-Parallax (rotateX/rotateY, max ±8-10 Grad)

### Background
- **Blobs**: Langsame Animation (10-20s Loop, scale + position)
- **Grid**: Parallax Scrolling (translateY -10px beim Scroll)

## Performance

- GPU-freundliche Transforms (translate, scale, rotate)
- `willChange` für optimierte Rendering-Performance
- Reduced Motion Support für Accessibility
- Keine unendlichen, hektischen Animationen
- Optimierte Animation-Loops

## Responsive

- **Mobile**: Stack-Layout (grid-cols-1)
- **Desktop**: 2-Spalten (lg:grid-cols-2)
- Angepasste Schriftgrößen (text-5xl sm:text-6xl lg:text-7xl xl:text-8xl)
