# Professional Paragliding Weather Analysis System

## 🎯 Überblick

Vollständig neu entwickeltes **Expertensystem für Gleitschirmwetter-Analyse** basierend auf echten meteorologischen Parametern, wie sie von XC-Piloten, DHV, Windy und professionellen Flight-Planern verwendet werden.

## 🔬 Meteorologische Parameter (Professional Grade)

### Atmosphärische Stabilität
- **CAPE** (Convective Available Potential Energy, J/kg)
  - Surface-based, MU-CAPE, SB-CAPE
  - Klassifikation: none, weak, moderate, strong, extreme
  - Thermik-Stärke-Schätzung: climb rate ≈ √(2×CAPE/1000) m/s

- **Lifted Index** (LI, °C)
  - Stabilitätsindikator (negativ = instabil = gut für Thermik)
  - Level: very_stable → very_unstable

- **Convective Inhibition** (CIN, J/kg)
  - Energie, die überwunden werden muss für freie Konvektion

### Wolken & Kondensation
- **LCL** (Lifted Condensation Level - Wolkenbasis)
  - Berechnung: 125m × (T - Td) AGL
  - Klassifikation: very_low (<800m) → very_high (>2500m)
  - Temperatur und Druck an LCL

- **LFC** (Level of Free Convection)
  - Höhe, ab der Thermik self-sustaining wird
  - Erreichbarkeit vom typischen Launch-Level

### Wind-Analyse
- **Multi-Layer Wind Profile**
  - Surface (10m), Boundary Layer (80m), Mid (120m), High (3000m est.)
  - Windrichtung pro Layer (Veering-Detection)
  
- **Wind Shear** (m/s pro km)
  - 0-1km, 1-3km, 3-6km Schichten
  - Turbulenz-Potential (0-10 Scale)
  - Level: low → severe

### Thermik-Analyse
- **Thermal Strength** (m/s Steigrate)
- **Thermal Tops** (Obergrenze in m AGL)
- **Thermal Spacing** (Abstände zwischen Bärten)
- **Consistency** (0-1, smooth vs. choppy)
- **Thermal Index** (0-10 kombinierte Bewertung)

### Grenzschicht
- **Boundary Layer Height** (BLH in Metern)
- **Dewpoint Spread** (T - Td in °C)
- **Inversion Height** (falls vorhanden)

## 📊 Flug-Analysen

### Soaring Conditions
1. **Ridge Soaring (Hangaufwind)**
   - Windwinkel relativ zur Hangausrichtung
   - Lift-Potential (0-10)
   - Geeignet: Wind 10-35 km/h, Angle <45°

2. **Thermal Soaring**
   - Thermik-Stärke & Konsistenz
   - Cloud base & Thermal tops
   - Tageszeit-Optimierung

3. **Wave Soaring (Leewellen)**
   - Topografie-abhängig
   - Wind >20 km/h, konstante Richtung
   - Nur für Experten

### XC (Cross-Country) Potential
- **XC Score** (0-100)
  - Faktoren: Cloudbase, Thermal Strength, Consistency, Wind Speed
  
- **Distance Potential** (km)
  - Formel: (Glide Ratio × Cloudbase / 1000) + Thermal Assists
  
- **Rating**: excellent, good, fair, poor, unsuitable

- **Confidence Level** (0-1)
  - Basierend auf Thermal Consistency und Cloudbase

## ⚠️ Risk Assessment

### Risk Factors
Jeder Risikofaktor wird bewertet:
- **Name**: z.B. "Lee-Turbulenz", "Starke Böen"
- **Level**: minimal, low, moderate, high, extreme
- **Score**: 0-100
- **Description**: Detailbeschreibung
- **Mitigation**: Handlungsempfehlung

### Automatic Risk Detection
1. **Lee-Side Turbulence**
   - Wind von Rückseite (>90° Winkel)
   - Rotor-Gefahr bei >15 km/h
   
2. **Gust Risk**
   - Gust Factor >1.6 oder absolut >40 km/h
   - Severity based on gust speed

3. **Thermal Turbulence**
   - CAPE >2000 + niedrige Consistency
   - Overdevelopment-Gefahr, Gewitter-Risiko

4. **Wind Shear**
   - Hohe Scherung (>10 m/s/km)
   - Turbulenz in verschiedenen Höhen

### Flight Warnings
- **Type**: wind, shear, thermal, weather, terrain, airspace
- **Severity**: info, caution, warning, danger
- **Icon & Message**

### Safety Level
- **Overall Score**: 0-100 (kombiniert alle Faktoren)
- **Suitability**: optimal, good, marginal, poor, dangerous
- **Pilot Level Recommendation**: novice, intermediate, advanced, expert
- **Wing Class**: A, B, C, D

## 🗺️ Launch Sites (Fluggebiete)

### Vordefinierte Spots
```typescript
LAUNCH_SITES = [
  {
    name: "Ascheloh",
    lat: 51.8833, lon: 8.9167,
    elevation: 280m,
    orientation: 270° (West),
    suitableWindDirections: [240°, 270°, 300°],
    difficulty: "intermediate",
    features: { topLanding, ridgeSoaring, thermal, XC },
    restrictions: { minPilotLevel: "B", maxWind: 30 }
  },
  // Willingen, Wasserkuppe, Tegelberg
]
```

### Spot Analysis
- Windwinkel relativ zum Launch
- Aktuelle Eignung
- Risiken & Empfehlungen
- Distanz vom aktuellen Standort

## 🔌 API-Integration

### Aktuell: Open-Meteo (LIVE)
```typescript
await fetchParaglidingWeather(lat, lon, hours)
```
**Parameter (hourly)**:
- `cape`, `lifted_index`, `convective_inhibition`
- `boundary_layer_height`
- `temperature_2m`, `temperature_80m`, `temperature_950hPa`
- `dewpoint_2m`, `relative_humidity_2m`
- `wind_speed_10m/80m/120m`, `wind_direction_*`, `wind_gusts_10m`
- `cloud_cover`, `cloud_cover_low/mid/high`
- `precipitation`, `surface_pressure`

**Quelle**: https://api.open-meteo.com/v1/forecast

### Geplant: Windy API
```typescript
// TODO: Requires API Key
await fetchWindyForecast(lat, lon, model)
```
**Models**: ECMWF, GFS, ICON  
**Zusätzliche Daten**: Turbulence layers, high-res wind profiles

**API**: https://api.windy.com

### Geplant: DHV Flugwetter
```typescript
// TODO: HTML Parser oder API
await fetchDHVFlugwetter(region)
```
**Quelle**: https://www.dhv.de/web/piloteninfos/wetter/  
**Daten**: Regionale Bedingungen, Warnungen, Empfehlungen

## 📁 Dateistruktur

```
lib/
├── types-paragliding.ts          # TypeScript Types (alle Interfaces)
├── weather-api.ts                # API-Aufrufe (erweitert)
│   ├── fetchParaglidingWeather() # Open-Meteo extended
│   ├── fetchWindyForecast()      # TODO
│   ├── fetchDHVFlugwetter()      # TODO
│   └── fetchMergedParaglidingData() # Merging-Logik
│
└── paragliding-pro.ts            # Kern-Analyse-Engine
    ├── calculateLCL()
    ├── analyzeCAPE()
    ├── analyzeLiftedIndex()
    ├── calculateLFC()
    ├── calculateWindShear()
    ├── analyzeThermalConditions()
    ├── buildWindProfile()
    ├── analyzeSoaringConditions()
    ├── analyzeXCPotential()
    ├── detectLeeRisk()
    ├── detectGustRisk()
    ├── detectThermalTurbulence()
    ├── detectWindShearRisk()
    ├── generateParaglidingAnalysis() # Main Entry
    └── findNearbyLaunchSites()

components/ui/
├── paragliding-score-card-pro.tsx       # Haupt-Score-Karte
│   ├── Overall Score & Suitability
│   ├── Atmospheric Parameters Detail
│   ├── Thermal Analysis
│   ├── Wind Shear Profile
│   ├── Soaring Conditions
│   ├── XC Potential
│   └── Risks & Warnings
│
├── paragliding-parameter-matrix.tsx     # 12h Matrix-Tabelle
│   └── Zeit, CAPE, LCL, Wind, Thermik, Score
│
└── spot-list.tsx                        # Launch Sites (bestehend)

components/views/
└── paragliding-view-pro.tsx             # Haupt-View
    ├── Header & Location
    ├── Current Analysis (ParaglidingScoreCardPro)
    ├── Parameter Matrix (12h)
    ├── Launch Sites List
    └── API Info & Disclaimer
```

## 🎨 UI-Design (iOS-Wetter-Stil)

### Night-Sky Glassmorphism
```css
/* Hintergrund */
bg-gradient-to-b from-[#131F49] to-[#04102B]

/* Cards */
bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg

/* Suitability Colors */
optimal:   from-emerald-500/30 to-green-500/30
good:      from-green-500/30 to-lime-500/30
marginal:  from-yellow-500/30 to-amber-500/30
poor:      from-orange-500/30 to-red-500/30
dangerous: from-red-500/30 to-rose-500/30
```

### Typography
- **Score**: `text-6xl font-semibold`
- **Headers**: `text-lg font-semibold`
- **Values**: `font-semibold text-white`
- **Labels**: `text-sm text-white/70`

### Komponenten
- QuickStat Cards (CAPE, LCL, Thermik, Wind)
- DetailRow (Parameter-Zeilen)
- WindLayer (Windprofil-Layer)
- SoaringType (Ridge/Thermal/Wave)
- Risk Cards mit Severity-Farben

## 🧪 Verwendung

### Basic Usage
```typescript
import { generateParaglidingAnalysis } from "@/lib/paragliding-pro"
import { fetchParaglidingWeather } from "@/lib/weather-api"

const data = await fetchParaglidingWeather(lat, lon, 24)
const analysis = generateParaglidingAnalysis(
  data,
  0, // current hour
  { lat, lon, name: "Leopoldshöhe" },
  270 // launch orientation (west-facing)
)

console.log(analysis.score) // 0-100
console.log(analysis.suitability) // "optimal" | "good" | ...
console.log(analysis.atmosphere.cape) // CAPE data
console.log(analysis.warnings) // Flight warnings
```

### In React Component
```tsx
import { ParaglidingViewPro } from "@/components/views/paragliding-view-pro"

<ParaglidingViewPro />
```

## 📊 Beispiel-Output

```typescript
{
  suitability: "good",
  score: 72,
  confidence: 0.85,
  
  atmosphere: {
    cape: { surface: 850, level: "moderate" },
    lcl: { height: 1450, classification: "moderate" },
    liftedIndex: { value: -3.2, level: "unstable" },
    thermal: { strength: 1.8, index: 7, consistency: 0.75 },
    windShear: { level: "low", turbulencePotential: 3 }
  },
  
  soaring: {
    ridge: { suitable: true, liftPotential: 6 },
    thermal: { suitable: true, strength: 1.8, tops: 1450 }
  },
  
  xc: {
    score: 68,
    distance: { potential: 45 },
    rating: "good"
  },
  
  risks: [
    {
      name: "Starke Böen",
      level: "moderate",
      score: 35,
      description: "Böen bis 35 km/h"
    }
  ],
  
  warnings: [
    {
      type: "wind",
      severity: "caution",
      message: "Böig am Nachmittag",
      icon: "💨"
    }
  ],
  
  recommendation: {
    summary: "Gute Flugbedingungen. XC möglich.",
    pilotLevel: "intermediate",
    wingClass: "B"
  }
}
```

## 🔐 Sicherheitshinweise

**⚠️ WICHTIG**: Diese Analyse ist ein **Planungstool**, kein Ersatz für:
- Aktuelle Vor-Ort-Beurteilung
- DHV-Geländeinfos und Flugregeln
- Luftraum-Check (NOTAM, CTR, TMZ)
- Eigene Fähigkeiten & Erfahrung
- Wettercheck am Startplatz

**Immer beachten**:
- Bedingungen können sich schnell ändern
- Thermik entwickelt sich tagsüber
- Lokale Effekte (Talwinde, Föhn, etc.)
- Andere Piloten & Flugverkehr

## 🚀 Roadmap

### ✅ Phase 1 (Fertig)
- Professional meteorological parameter analysis
- CAPE, LCL, LFC, LI, Wind Shear
- Thermal strength & consistency calculation
- Multi-layer wind profile
- Soaring analysis (ridge/thermal/wave)
- XC potential scoring
- Risk detection & warnings
- Launch site database (4 spots)
- Open-Meteo API integration
- Professional UI components
- Parameter matrix view

### 📋 Phase 2 (Next)
- [ ] Windy API integration (ECMWF/ICON layers)
- [ ] DHV Flugwetter scraper/API
- [ ] Erweiterte Spot-Datenbank (50+ Spots)
- [ ] Spot-spezifische Wind-Analyse (Lee-Check pro Hang)
- [ ] Historical data & statistics
- [ ] NOAA GFS integration (optional)

### 🔮 Phase 3 (Future)
- [ ] Live weather station data
- [ ] Webcam integration (Startplätze)
- [ ] Push notifications (good conditions alert)
- [ ] Flight planning tools (route optimization)
- [ ] Community features (pilot reports, live tracking)
- [ ] Machine Learning (pattern recognition)
- [ ] Airspace integration (NOTAM, airspace warnings)

## 🤝 Contributing

Verbesserungsvorschläge willkommen für:
- Algorithmus-Optimierung
- Neue Launch Sites
- API-Integrationen
- UI/UX Verbesserungen

## 📄 License

Teil der PendlerWetter-App.

---

**Built with**: Next.js, TypeScript, Open-Meteo API, TailwindCSS  
**Developed by**: Meteorologie- & Paragliding-Experten  
**Version**: 2.0 Professional
