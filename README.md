# PendlerWetter - Intelligente Wetter- & Aktivitäts-App

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/baumanntimc-2723s-projects/v0-wetterpendeln-web-app)
[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

## 🎯 Überblick

**PendlerWetter** ist eine moderne Web-App für Pendler und Outdoor-Sportler, die präzise Wettervorhersagen mit Aktivitätsbewertungen kombiniert. Die App analysiert Wetterdaten speziell für:
- **Radfahren/Pendeln**: Bewertung der Bedingungen für Hin- und Rückfahrt
- **Paragliding (Professional)**: Expertensystem für Flugwetter-Analyse

### Features

#### 🌦️ Wetter-Grundfunktionen
- **Aktuelle Bedingungen**: Temperatur, Niederschlag, Wind, Wolkendecke
- **Stündliche Vorhersage**: 24h-Timeline mit Regen-Wahrscheinlichkeit
- **7-Tage-Übersicht**: Tages-Min/Max, Niederschlag, Wetter-Icons
- **Regenradar**: Integration von Windy.com Niederschlagskarten
- **Standortverwaltung**: GPS-Lokalisierung oder manuelle Ortseingabe

#### 🚴 Pendel-/Radfahranalyse
- Automatische Bewertung basierend auf:
  - Niederschlagsmenge & -wahrscheinlichkeit
  - Windgeschwindigkeit & -böen
  - Temperatur (mit Komfortbereich)
- Farbcodierte Zeitfenster (🟢 Gut, 🟡 Grenzwertig, 🔴 Schlecht)
- Konfigurierbare Pendelzeiten (Hinfahrt/Rückfahrt)

#### 🪂 Paragliding Pro - Professionelles Flugwetter
Vollständig neu entwickeltes **Expertensystem** basierend auf echten meteorologischen Parametern:

**Atmosphärische Analyse:**
- **CAPE** (Convective Available Potential Energy, J/kg) - Thermik-Potential
- **LCL** (Lifted Condensation Level) - Wolkenbasis in m AGL
- **LFC** (Level of Free Convection) - Selbsttragende Thermik-Höhe
- **Lifted Index** (LI, °C) - Stabilitätsindikator
- **Wind Shear** (0-1km, 1-3km) - Turbulenzpotential
- **Multi-Layer Windprofil** (10m, 80m, 120m, 3000m)
- **Boundary Layer Height** - Grenzschichthöhe
- **Dewpoint Spread** (T-Td) - Temperatur-Taupunkt-Differenz

**Flug-Analysen:**
- **Soaring Conditions**: Ridge (Hangaufwind), Thermal (Thermik), Wave (Leewellen)
- **XC-Potential**: Cross-Country Score (0-100), Distanz-Schätzung (km)
- **Thermal Analysis**: Steigrate (m/s), Tops (m AGL), Konsistenz (0-1)

**Risikobewertung:**
- **Automatic Risk Detection**: Lee-Turbulenz, Böen, Thermische Turbulenz, Windscherung
- **Flight Warnings**: Color-coded (Info, Caution, Warning, Danger)
- **Safety Level**: Overall Score (0-100), Suitability (optimal → dangerous)
- **Pilot Recommendation**: Level (novice → expert), Wing Class (A-D)

**Fluggebiete:**
- 4 vordefinierte Launch Sites (Ascheloh, Willingen, Wasserkuppe, Tegelberg)
- Automatische Distanzberechnung vom aktuellen Standort
- Windwinkel-Analyse relativ zur Hangausrichtung
- Spot-spezifische Einschränkungen (Min-Lizenz, Max-Wind, Luftraum)

**Datenquellen:**
- ✅ **Live**: Open-Meteo API (CAPE, LI, BLH, Multi-Layer Wind Profile)
- 🔜 **Geplant**: Windy API (ECMWF/ICON), DHV Flugwetter

*Hinweis: Paragliding-Analyse ist ein Planungstool. Vor dem Start immer aktuelle Vor-Ort-Bedingungen prüfen, DHV-Geländeinfos lesen, Luftraum checken (NOTAM), eigene Fähigkeiten realistisch einschätzen.*

#### 🎨 Design
- **Night-Sky Theme**: Dunkler Blau/Violett-Verlauf (`#131F49` → `#04102B`)
- **Glassmorphism**: Transparente Karten mit Backdrop-Blur
- **iOS-Wetter-Stil**: Große Typografie, sanfte Animationen
- **Mobile-First**: Optimiert für Smartphones und Tablets

## 🚀 Entwicklung

### Setup

```bash
# Dependencies installieren
pnpm install

# Development Server starten
pnpm dev

# Lint ausführen
pnpm lint

# Production Build
pnpm build
```

App läuft unter: `http://localhost:3000`

### Projekt-Struktur

```
pendllwetter/
├── app/
│   ├── api/
│   │   └── geocode/route.ts       # Reverse Geocoding API (CORS-frei)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                        # Wiederverwendbare UI-Komponenten
│   │   ├── weather-card.tsx
│   │   ├── hourly-timeline.tsx
│   │   ├── daily-forecast-list.tsx
│   │   ├── metrics-grid.tsx
│   │   ├── paragliding-score-card-pro.tsx
│   │   ├── paragliding-parameter-matrix.tsx
│   │   └── spot-list.tsx
│   └── views/                     # Screen-Components
│       ├── now-view.tsx           # Übersicht
│       ├── activities-view.tsx    # Aktivitäten (Radfahren, Paragliding)
│       ├── paragliding-view-pro.tsx
│       ├── radar-view.tsx
│       └── settings-view.tsx
├── lib/
│   ├── types.ts                   # Basis-Types
│   ├── types-paragliding.ts       # Paragliding-Types (umfassend)
│   ├── weather-api.ts             # Open-Meteo Integration
│   ├── location-store.tsx         # GPS & Standortverwaltung
│   ├── paragliding-analysis.ts    # Main Entry Point
│   ├── paragliding-profile.ts     # Wind & Atmospheric Profile
│   ├── paragliding-thermals.ts    # CAPE, LCL, Thermik
│   ├── paragliding-risk.ts        # Risk Assessment
│   └── paragliding-pro.ts         # Launch Sites Database
└── docs/
    ├── PARAGLIDING-PRO.md         # Vollständige Doku
    └── PARAGLIDING-QUICKSTART.md  # Developer Guide
```

### API-Routen

#### `/api/geocode`
Reverse Geocoding (Server-seitig, vermeidet CORS-Probleme)

**GET** `?lat=52.0&lon=8.7`

**Response:**
```json
{
  "name": "Leopoldshöhe",
  "admin1": "Nordrhein-Westfalen",
  "country": "Deutschland"
}
```

**Fehlerbehandlung:**
- Fehlende Parameter: `400 Bad Request`
- Service nicht verfügbar: `503 Service Unavailable`
- Fallback: `"Unbekannter Ort"` bei fehlenden Daten

### Wichtige Hinweise

#### API Rate Limits
- **Open-Meteo**: Kostenlos, 10.000 Requests/Tag
- Keine API-Keys im Client-Code!
- Server-seitige Proxy-Routes nutzen (`/api/geocode`)

#### Browser-Geolocation
- Benötigt HTTPS (außer localhost)
- User muss Standortfreigabe erteilen
- Fallback auf manuelle Ortseingabe bei Permission Denied

#### TypeScript
Alle meteorologischen Parameter sind in `lib/types-paragliding.ts` typisiert:
- `ParaglidingAnalysis` - Vollständige Analyse
- `AtmosphericProfile` - CAPE, LCL, LFC, Wind Shear, etc.
- `SoaringAnalysis` - Ridge/Thermal/Wave Conditions
- `XCAnalysis` - Cross-Country Potential
- `RiskFactor`, `FlightWarning` - Safety Assessment

## 📚 Dokumentation

- **Paragliding Pro**: `docs/PARAGLIDING-PRO.md`
- **Quickstart**: `docs/PARAGLIDING-QUICKSTART.md`
- **Code-Kommentare**: Alle Funktionen mit JSDoc, Einheiten dokumentiert

## ⚖️ Sicherheit & Haftung

**Wichtiger Disclaimer:**

Diese App ist ein **Planungstool** und dient zur Unterstützung bei der Entscheidungsfindung. Sie ersetzt NICHT:
- Offizielle Flugwetter-Prognosen (DHV, Deutscher Wetterdienst)
- NOTAM-Check (Luftraumbeschränkungen)
- Vor-Ort-Beurteilung der Wetterbedingungen
- Eigene Erfahrung und fliegerisches Können
- Geländeinfos und lokale Besonderheiten

**Paragliding-spezifisch:**
- Wetterbedingungen können sich schnell ändern
- Thermik entwickelt sich im Tagesverlauf
- Lokale Effekte (Talwinde, Föhn, etc.) nicht berücksichtigt
- Bei Zweifeln: NICHT fliegen!

**Keine Haftung** für Schäden, die durch Nutzung dieser App entstehen.

## 🛠️ Technologie-Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Weather API**: Open-Meteo (DWD ICON-D2)
- **Maps**: Windy.com (Radar)

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten.

---

**Version**: 2.0 Professional  
**Letzte Aktualisierung**: November 2024
