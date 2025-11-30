# Paragliding-Wetter Integration

Diese Dokumentation beschreibt die neue **Paragliding/Gleitschirm-Wetter** Funktionalität in der Pendel-Wetter-App.

## 🎯 Übersicht

Die App wurde um eine vollständige Paragliding-Wetter-Analyse erweitert, die Piloten bei der Flugplanung unterstützt. Die Integration folgt dem iOS-Wetter-Design mit Night-Sky-Theme, Glassmorphism-Karten und mobil-optimierter UX.

## 📁 Neue Dateien

### Core Logic
- **`lib/paragliding.ts`** - Hauptlogik für Flugtauglichkeits-Bewertung
  - `evaluateParaglidingConditions()` - Bewertet Flugbedingungen (0-100 Score)
  - `calculateThermalIndex()` - Thermik-Potential (0-10)
  - `estimateCloudBase()` - Wolkenbasis/LCL in Metern AGL
  - `findNearbySpots()` - Findet Fluggebiete in der Nähe
  - `PARAGLIDING_SPOTS[]` - Vordefinierte Spots (Ascheloh, Willingen, etc.)

### UI Components
- **`components/ui/paragliding-score-card.tsx`** - Hauptkarte mit Score & Details
- **`components/ui/paragliding-timeline.tsx`** - 12h-Vorschau Timeline
- **`components/ui/spot-list.tsx`** - Liste nahegelegener Fluggebiete
- **`components/ui/activity-preview-card.tsx`** - Preview-Karten für Startseite

### Views
- **`components/views/paragliding-view.tsx`** - Haupt-Paragliding-Screen
- **`components/views/activities-view.tsx`** - Tab-Container (Radfahren + Paragliding)

## 🎨 Design-Features

### Night-Sky Theme
```tsx
// Hauptverlauf
bg-gradient-to-b from-[#131F49] to-[#04102B]

// Glassmorphism-Karten
backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl
```

### Ampel-System
- 🟢 **Optimal/Gut** - Score 60-100, grüner Gradient
- 🟡 **Grenzwertig** - Score 40-59, gelber Gradient
- 🔴 **Schlecht/Gefährlich** - Score 0-39, roter Gradient

### Mobile-First Layout
- Große Touch-Targets (min 48px)
- Horizontales Scrollen für Timeline
- Responsive Grids (1/2 Spalten)
- Smooth Animations & Transitions

## ⚙️ Bewertungs-Parameter

### Wind
- **Optimal**: 5-15 km/h
- **Gut**: 15-25 km/h
- **Grenzwertig**: 25-30 km/h
- **Zu stark**: >30 km/h

### Böen
- **Sicher**: <25 km/h, Faktor <1.5x
- **Akzeptabel**: 25-35 km/h
- **Böig**: 35-50 km/h, Faktor >1.7x
- **Gefährlich**: >50 km/h

### Regen
- **Trocken**: <0.1 mm
- **Leicht**: 0.1-1 mm
- **Nass**: 1-5 mm
- **Starkregen**: >5 mm

### Thermik
- **Stark**: Index 7-10 (Sonne, Cu-Wolken)
- **Mittel**: Index 4-6
- **Schwach**: Index 2-3
- **Keine**: Index 0-1 (Abend/Nacht)

## 🗺️ Fluggebiete

### Vordefinierte Spots (NRW/Hessen)
1. **Ascheloh** (280m) - Intermediate, W/NW/SW
2. **Willingen Ettelsberg** (838m) - Intermediate, NW/W/N
3. **Kohlberg** (615m) - Beginner, W/SW/NW
4. **Edersee** (400m) - Advanced, N/NE/NW

### Anzeige
- Distanz vom aktuellen Standort (km)
- Himmelsrichtung
- Höhe (Meter)
- Schwierigkeitsgrad (Beginner/Intermediate/Advanced)
- Geeignete Windrichtungen

## 🔌 API-Integration (TODO)

### Aktuelle Mock-Daten
Die App verwendet derzeit **vereinfachte Berechnungen**:
- Thermik-Index basiert auf Uhrzeit + Temperatur
- Wolkenbasis via Temperatur-Taupunkt-Spread
- Böen als 1.4x Grundwind approximiert

### Empfohlene Integrationen

#### 1. Open-Meteo CAPE/Thermik
```typescript
// API: https://open-meteo.com/en/docs
params: {
  hourly: [
    "cape",              // Convective Available Potential Energy
    "lifted_index",      // Thermik-Stabilität
    "cloudbase",         // Tatsächliche Wolkenbasis
    "boundary_layer_height" // Mischungsschicht
  ]
}
```

#### 2. DHV Flugwetter
```typescript
// https://www.dhv.de/web/piloteninfos/wetter/
// XML/JSON-Feed für deutsche Fluggebiete
```

#### 3. Windy API
```typescript
// https://api.windy.com
// Echtzeit-Wind-Daten, Modellvorhersagen
```

#### 4. Spot-Datenbank
```typescript
// Integration von dhv.de Geländedatenbank
// Oder paraglidingearth.com API
```

### Integration-Template

```typescript
// lib/paragliding-api.ts
export async function fetchParaglidingWeather(
  lat: number,
  lon: number
): Promise<ParaglidingData> {
  const [openMeteo, dhv] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?...&hourly=cape,cloudbase`),
    fetch(`https://dhv.de/api/flugwetter?lat=${lat}&lon=${lon}`)
  ])
  
  // Combine real CAPE, cloudbase, wind data
  return {
    thermalIndex: calculateFromCAPE(data.cape),
    cloudBase: data.cloudbase_agl,
    // ...
  }
}
```

## 🎯 Usage

### In App-Shell
Navigation zu "Aktivitäten" → Tab "Paragliding"

```tsx
<ActivitiesView settings={settings} onSettingsChange={...} />
```

### Standalone
```tsx
import { ParaglidingView } from "@/components/views/paragliding-view"

<ParaglidingView />
```

### Custom Components
```tsx
import { ParaglidingScoreCard } from "@/components/ui/paragliding-score-card"
import { evaluateParaglidingConditions } from "@/lib/paragliding"

const conditions = evaluateParaglidingConditions(hourlyData, thermalIndex, cloudBase)

<ParaglidingScoreCard conditions={conditions} time="14:00" />
```

## 🧪 Testdaten

### Optimale Bedingungen
```typescript
{
  windSpeed: 12,      // km/h
  rain: 0,           // mm
  temp: 22,          // °C
  clouds: 40,        // %
  thermalIndex: 8,   // 0-10
  cloudBase: 1800    // m AGL
}
// → Score: 90-100, Level: "optimal"
```

### Grenzwertig
```typescript
{
  windSpeed: 28,
  rain: 0.5,
  temp: 15,
  clouds: 70,
  thermalIndex: 4,
  cloudBase: 1200
}
// → Score: 40-59, Level: "grenzwertig"
```

### Gefährlich
```typescript
{
  windSpeed: 35,
  gusts: 55,
  rain: 3,
  temp: 10,
  clouds: 90,
  thermalIndex: 1,
  cloudBase: 600
}
// → Score: 0-20, Level: "gefährlich"
```

## 🎨 Styling-Konventionen

### Farb-Schema
```typescript
// Glassmorphism Base
"bg-white/5 backdrop-blur-xl border border-white/10"

// Level-Gradienten
optimal:      "from-emerald-500/20 to-green-500/20"
gut:          "from-green-500/20 to-lime-500/20"
grenzwertig:  "from-yellow-500/20 to-amber-500/20"
schlecht:     "from-orange-500/20 to-red-500/20"
gefährlich:   "from-red-500/20 to-rose-500/20"

// Akzente
primary:   "text-cyan-400"
secondary: "text-white/70"
danger:    "text-red-400"
```

### Border Radius
- Cards: `rounded-3xl` (24px)
- Buttons: `rounded-2xl` (16px)
- Badges: `rounded-xl` (12px)

### Shadows
```typescript
"shadow-lg shadow-cyan-500/20"  // Hover
"shadow-2xl"                     // Hero Cards
```

## 🚀 Roadmap

### Phase 1 ✅ (Aktuell)
- [x] Grundlegende Bewertungslogik
- [x] UI-Komponenten (Score Card, Timeline, Spots)
- [x] Integration in Activities-View
- [x] Mock-Daten für Thermik/Wolkenbasis

### Phase 2 (Nächste Schritte)
- [ ] Open-Meteo CAPE-Integration
- [ ] Echte Wolkenbasis-Daten (LCL)
- [ ] DHV Flugwetter-Feed
- [ ] Erweiterte Spot-Datenbank (paraglidingearth.com)

### Phase 3 (Future)
- [ ] XC-Potential-Analyse (Streckenflug-Bewertung)
- [ ] Wetterstation-Integration (lokale Live-Daten)
- [ ] Push-Notifications bei guten Bedingungen
- [ ] Community-Features (Spot-Bewertungen, Live-Tracking)

## 📝 Hinweise

⚠️ **Wichtig**: Diese App ist ein **Unterstützungstool**, kein Ersatz für:
- Offizielle Flugwetter-Briefings
- Vor-Ort-Beurteilung der Bedingungen
- Pilot-Erfahrung und -Ausbildung

Immer zusätzlich prüfen:
- DHV Geländeinfos
- Aktuelle Luftraumbeschränkungen (NOTAM)
- Lokale Flugregeln
- Eigene Fähigkeiten & Tagesform

## 🤝 Contributing

Verbesserungsvorschläge für Bewertungs-Algorithmen, neue Spots oder API-Integrationen sind willkommen!

## 📄 License

Teil der Pendel-Wetter-App. Siehe Haupt-README.
