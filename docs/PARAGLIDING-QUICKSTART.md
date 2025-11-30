# Paragliding Pro - Developer Quickstart

## 🚀 Quick Integration

### 1. Import & Use
```typescript
// In any React component
import { ParaglidingViewPro } from "@/components/views/paragliding-view-pro"

export function MyApp() {
  return <ParaglidingViewPro />
}
```

### 2. Manual Analysis
```typescript
import { 
  fetchParaglidingWeather, 
  generateParaglidingAnalysis 
} from "@/lib/paragliding-pro"

// Fetch data
const data = await fetchParaglidingWeather(51.5, 8.9, 24)

// Generate analysis
const analysis = generateParaglidingAnalysis(
  data,
  0, // hour index (0 = now)
  { lat: 51.5, lon: 8.9, name: "Leopoldshöhe" },
  270 // launch orientation in degrees (270 = west)
)

// Use results
console.log(analysis.score) // 0-100
console.log(analysis.suitability) // "optimal" | "good" | "marginal" | "poor" | "dangerous"
console.log(analysis.atmosphere.cape.surface) // CAPE in J/kg
console.log(analysis.xc.distance.potential) // XC potential in km
```

## 📊 Key Functions

### Core Analysis
```typescript
// Main entry point - generates complete analysis
generateParaglidingAnalysis(
  data: OpenMeteoParaglidingResponse,
  index: number,
  location: { lat, lon, name },
  launchOrientation: number = 270
): ParaglidingAnalysis

// Build atmospheric profile
buildAtmosphericProfile(
  data: OpenMeteoParaglidingResponse,
  index: number,
  elevation: number = 0
): AtmosphericProfile

// Analyze soaring conditions
analyzeSoaringConditions(
  windProfile: WindProfile,
  thermal: ThermalData,
  launchOrientation: number = 270
): SoaringAnalysis

// Analyze XC potential
analyzeXCPotential(
  thermal: ThermalData,
  windProfile: WindProfile,
  cloudbase: number
): XCAnalysis
```

### Meteorological Calculations
```typescript
// Cloud base (LCL)
calculateLCL(
  temp: number, 
  dewpoint: number, 
  elevation: number = 0
): LCLData

// CAPE analysis
analyzeCAPE(cape: number): CAPEData

// Lifted Index
analyzeLiftedIndex(li: number): LiftedIndexData

// Wind shear
calculateWindShear(windProfile: WindProfile): WindShearData

// Thermal conditions
analyzeThermalConditions(
  cape: number,
  lcl: number,
  boundaryLayerHeight: number,
  hour: number,
  temp: number
): ThermalData
```

### Risk Detection
```typescript
// Detect lee-side turbulence
detectLeeRisk(
  windSpeed: number,
  windDirection: number,
  launchOrientation: number
): RiskFactor | null

// Detect gust risk
detectGustRisk(
  avgWind: number,
  gustSpeed: number
): RiskFactor | null

// Detect thermal turbulence
detectThermalTurbulence(
  thermal: ThermalData,
  cape: number
): RiskFactor | null

// Detect wind shear risk
detectWindShearRisk(
  windShear: WindShearData
): RiskFactor | null
```

## 🗺️ Launch Sites

### Find Nearby Sites
```typescript
import { findNearbyLaunchSites } from "@/lib/paragliding-pro"

const sites = findNearbyLaunchSites(
  51.5, // current lat
  8.9,  // current lon
  100   // max distance in km
)

// Returns: LaunchSite[] sorted by distance
```

### Add Custom Site
```typescript
import { LAUNCH_SITES } from "@/lib/paragliding-pro"

LAUNCH_SITES.push({
  name: "My Spot",
  lat: 51.5,
  lon: 8.9,
  elevation: 500,
  orientation: 270, // west-facing
  suitableWindDirections: [240, 270, 300],
  difficulty: "intermediate",
  features: {
    topLanding: true,
    bottomLanding: true,
    ridgeSoaring: true,
    thermalSoaring: true,
    crossCountry: true,
  },
  restrictions: {
    minPilotLevel: "B",
    maxWind: 30,
  },
})
```

## 🎨 UI Components

### Main Score Card
```tsx
import { ParaglidingScoreCardPro } from "@/components/ui/paragliding-score-card-pro"

<ParaglidingScoreCardPro analysis={analysis} />
```

### Parameter Matrix
```tsx
import { ParaglidingParameterMatrix } from "@/components/ui/paragliding-parameter-matrix"

<ParaglidingParameterMatrix forecasts={hourlyForecasts} />
```

### Spot List
```tsx
import { SpotList } from "@/components/ui/spot-list"

<SpotList spots={nearbySpots} />
```

## 🔌 API Integration

### Add Windy API
```typescript
// In lib/weather-api.ts
export async function fetchWindyForecast(
  lat: number,
  lon: number,
  model: "ecmwf" | "gfs" | "icon" = "ecmwf"
) {
  const apiKey = process.env.NEXT_PUBLIC_WINDY_API_KEY
  const url = `https://api.windy.com/api/point-forecast/v2?lat=${lat}&lon=${lon}&model=${model}&key=${apiKey}`
  
  const response = await fetch(url)
  return response.json()
}

// Then merge in fetchMergedParaglidingData()
```

### Add DHV Parser
```typescript
// In lib/weather-api.ts
export async function fetchDHVFlugwetter(region: string = "nrw") {
  const url = `https://www.dhv.de/web/piloteninfos/wetter/${region}/`
  const response = await fetch(url)
  const html = await response.text()
  
  // Parse HTML or use cheerio/jsdom
  // Extract warnings, conditions, etc.
  
  return {
    region,
    conditions: "...",
    warnings: [],
  }
}
```

## 📊 TypeScript Types

All types are in `lib/types-paragliding.ts`:

```typescript
import type {
  ParaglidingAnalysis,
  AtmosphericProfile,
  SoaringAnalysis,
  XCAnalysis,
  RiskFactor,
  FlightWarning,
  LaunchSite,
  // ... and many more
} from "@/lib/types-paragliding"
```

## ⚡ Performance Tips

1. **Cache API responses** (24h forecast lasts for hours)
2. **Debounce location changes** (avoid spamming API)
3. **Use React.memo** for expensive components
4. **Lazy load** Parameter Matrix (only when needed)

## 🧪 Testing

```typescript
// Test LCL calculation
const lcl = calculateLCL(20, 14, 0)
expect(lcl.height).toBe(750) // 6°C spread × 125m

// Test CAPE analysis
const cape = analyzeCAPE(1200)
expect(cape.level).toBe("moderate")

// Test risk detection
const risk = detectGustRisk(20, 45)
expect(risk).toBeTruthy()
expect(risk.level).toBe("high")
```

## 📚 Further Reading

- Full Documentation: `docs/PARAGLIDING-PRO.md`
- Type Definitions: `lib/types-paragliding.ts`
- Core Logic: `lib/paragliding-pro.ts`
- API Integration: `lib/weather-api.ts`

## 🐛 Troubleshooting

**API Error**: Check network, CORS, API limits  
**Wrong scores**: Verify launch orientation (0-360°)  
**No thermals**: Check time of day (best 11-16h)  
**Missing spots**: Add to `LAUNCH_SITES` array

## 📞 Support

Check existing code comments marked with:
- `TODO`: Features to implement
- `FIXME`: Known issues
- `NOTE`: Important information
