# Dev-/Copilot-Kodex – wetterpendeln Web App

## Entwicklungsumgebung

- **Paketverwaltung:** **pnpm** (kein npm/yarn)
- **Laufzeit:** Node.js 24 unter **WSL Ubuntu-24.04**

```bash
cd /mnt/c/Users/gummi/Documents/wetterpendelnwebappmain
pnpm run dev
```

## Code-Style

- **TypeScript:** Strikt, alle Types definiert in `lib/types.ts`
- **React:** Function Components, Hooks, kein Class-Components
- **Styling:** Tailwind CSS, `cn()` Utility aus `lib/utils.ts`
- **UI-Komponenten:** shadcn/ui – **nie manuell in `components/ui/*` editieren**, nur via CLI regenerieren:

  ```bash
  npx shadcn@latest add <component-name>
  ```

## Änderungen vorschlagen

- Immer so vorschlagen, dass sie als **kleiner, nachvollziehbarer PR** möglich sind
- Bei größeren Features: Erst Konzept besprechen, dann schrittweise umsetzen
- Diffs mit 3-5 Zeilen Kontext vor/nach der Änderung

## Projekt-Fokus

**Wetterübersicht für Radpendeln** klar, schnell erfassbar und mobil nutzbar machen:

- **Hin-/Rückfahrt:** Schichtbasierte Zeitfenster für Pendelstrecken
- **Radar:** Regenkarte mit Zeitsteuerung
- **Empfehlung:** Visuelle Bewertung „fahrbar oder nicht" (🟢/🟡/🟠/🔴)

## Wichtige Konventionen

### Zeitformate

- **Immer `"HH:mm"` Strings** (z.B. `"05:00"`, `"22:30"`)
- **Timezone:** `Europe/Berlin` (hardcoded in API-Calls)
- **Nachtschicht-Logik:** Wenn `rueckStart < hinStart`, dann Rückfahrt am nächsten Tag

### Wetter-API

- **Provider:** Open-Meteo DWD ICON (`icon_seamless` Model)
- **Geocoding:** Bevorzugt deutsche Ergebnisse (`country_code: "DE"`)
- **WMO Weather Codes:** 0=clear, 61-65=rain, 71-77=snow, etc.

### Fahrbarkeits-Algorithmus (`lib/rideability.ts`)

Schwellwerte für Radfahrer-Sicherheit:

- **Wind:** Böen priorisiert (`windGust * 0.8`)
  - 🔴 > 58 km/h (Sturm)
  - 🟠 43-58 km/h (starker Wind)
  - 🟡 29-43 km/h (mäßiger Wind)
- **Regen:** 🔴 > 5mm/h | 🟠 2-5mm/h | 🟡 0.5-2mm/h
- **Temperatur:** 🔴 ≤ -3°C (Eisgefahr) | 🟠 -3 bis 0°C (Frost)
- **Regenwahrscheinlichkeit:** 🔴 > 80% | 🟠 60-80% | 🟡 20-60%

## Architektur-Überblick

### Datenfluss

1. User wählt Schicht + Zeitraum (`components/views/commute-view.tsx`)
2. Geocoding der Orte (`lib/weather-api.ts` → Open-Meteo API)
3. Wetterdaten fetchen (`fetchWeatherData()` → DWD ICON API)
4. Zeitfenster-Filterung (`lib/slot-logic.ts` → `findRelevantSlots()`)
5. Fahrbarkeits-Bewertung (`lib/rideability.ts` → `evaluateRideability()`)
6. Anzeige der Ergebnisse (`components/weather-results.tsx`)

### State Management

- **Settings:** localStorage via `lib/storage.ts`
- **Location Sharing:** React Context (`lib/location-store.tsx`)
- **Keine externe State-Library:** Nur React useState + localStorage

### Ordnerstruktur

```text
app/              → Next.js App Router (minimal)
components/
  app-shell.tsx   → Tab-Navigation (Jetzt/Pendeln/Radar/Einstellungen)
  views/          → Tab-Inhalte
  ui/             → shadcn/ui (NICHT MANUELL EDITIEREN)
lib/
  types.ts        → Alle TypeScript Interfaces
  weather-api.ts  → Open-Meteo API Calls
  slot-logic.ts   → Zeitfenster-Logik
  rideability.ts  → Bewertungs-Algorithmus
  storage.ts      → localStorage Helpers
```

## Häufige Aufgaben

### UI-Komponente hinzufügen

```bash
npx shadcn@latest add <component-name>
```

### Schicht-Logik ändern

→ `lib/slot-logic.ts` → `findRelevantSlots()`  
Achtung: Nachtschicht-Handling (Rückfahrt nächster Tag), Zeitfenster ±30min Toleranz

### Fahrbarkeits-Schwellwerte anpassen

→ `lib/rideability.ts` → `evaluateRideability()`  
Wind-Thresholds sind in km/h (Kommentare zeigen alte m/s Werte)

### API-Parameter ändern

→ `lib/weather-api.ts` → `fetchWeatherData()`  
Aktuell: `models=icon_seamless`, `forecast_days=7`

## Besonderheiten

- **v0.app Sync:** Repo wird automatisch von v0.app deployments aktualisiert – manuelle Änderungen können überschrieben werden
- **TypeScript Errors ignoriert:** `next.config.mjs` hat `ignoreBuildErrors: true` (v0 Workflow)
- **Keine Tests:** Projekt hat aktuell kein Test-Setup
- **German-First:** Alle UI-Texte, Fehlermeldungen, Default-Locations sind deutsch
- **Nur localStorage:** Kein Backend, alle Settings clientseitig

## Externe Dependencies

- **Open-Meteo API:** Kostenlos, keine Auth. Rate Limit: ~10k requests/day
- **Vercel Analytics:** Integriert via `@vercel/analytics`
- **Buy Me a Coffee:** Support-Link im Header (`app-shell.tsx`)

