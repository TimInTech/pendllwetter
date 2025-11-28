# Wetterpendeln Web App - Copilot Instructions

## Projekt-Setup

**Tech Stack:**
- Next.js 16, React 19, TypeScript
- Tailwind CSS, shadcn/ui (Radix UI)
- Package Manager: **pnpm** (kein npm/yarn)
- Runtime: Node.js 24 auf **WSL Ubuntu-24.04**
- Projekt-Pfad: `/mnt/c/Users/gummi/Documents/wetterpendelnwebappmain`

**Wichtige Befehle:**
```bash
cd /mnt/c/Users/gummi/Documents/wetterpendelnwebappmain
pnpm run dev      # Dev-Server (localhost:3000)
pnpm run build    # Production Build
pnpm run lint     # ESLint
```

## Verhalten als Coding Agent

- **Sprache:** Antworten in Deutsch, präzise und technisch
- **CodeFirst:** Bevorzuge konkrete Code-Änderungen (Diffs, Funktionen, Components) statt langer Erklärungen
- **Keine Cloud-Tools:** Verwende NICHT @azure oder Cloud-Ressourcen; fokussiere nur auf lokalen Code und Konfiguration
- **Vor Config-Änderungen:** Kurz erklären, was passiert und warum
- **Bei Fehlern:** Erst Stack Trace/Logs lesen, dann minimale, testbare Fixes vorschlagen

## Projekt-Fokus

Diese App bewertet **Wetterbedingungen fürs Radpendeln** (Hin- und Rückfahrt) und zeigt klare visuelle Indikatoren (Icons, Farben, Skalen). Bei neuen Features: UX einfach halten, mobile-first, mit klaren Emojis/Icons und kurzen deutschen Labels.

## Architecture

### Core Data Flow
1. User selects shift + date range in `components/views/commute-view.tsx`
2. Geocode locations via `lib/weather-api.ts` → Open-Meteo Geocoding API
3. Fetch hourly weather for both locations → Open-Meteo DWD ICON API (`fetchWeatherData`)
4. `lib/slot-logic.ts` → `findRelevantSlots()` filters hourly data to shift time windows
5. `lib/rideability.ts` → `evaluateRideability()` scores each slot (🟢 gut / 🟡 ok / 🟠 kritisch / 🔴 schlecht)
6. Results displayed in `components/weather-results.tsx`

### Project Structure
- `app/` - Next.js App Router pages (minimal, main UI is in components)
- `components/` - React components
  - `app-shell.tsx` - Tab navigation wrapper (Jetzt/Pendeln/Radar/Einstellungen)
  - `views/` - Each tab's content (commute-view, now-view, radar-view, settings-view)
  - `ui/` - shadcn/ui components (never edit manually, regenerate with `npx shadcn@latest add`)
- `lib/` - Business logic
  - `types.ts` - TypeScript interfaces (Shift, WeatherSlot, Settings, etc.)
  - `weather-api.ts` - API calls to Open-Meteo (geocoding, DWD ICON weather data)
  - `slot-logic.ts` - Time window filtering logic for shifts
  - `rideability.ts` - Weather scoring algorithm (wind thresholds in km/h, rain in mm/h)
  - `storage.ts` - localStorage helpers for Settings and last location

### State Management
- **Settings** (shifts, locations, routes) stored in localStorage via `lib/storage.ts`
- **Location sharing** via React Context (`lib/location-store.tsx` → `LocationProvider`)
- **No external state library** - React useState + localStorage only

## Development Commands

```bash
pnpm dev      # Start dev server (localhost:3000)
pnpm build    # Production build
pnpm lint     # ESLint (currently permissive)
```

## Key Conventions

### Styling
- **Tailwind CSS** with custom dark theme (`bg-[#0a0f1e]`, cyan/blue accents)
- Use `cn()` utility from `lib/utils.ts` to merge Tailwind classes: `cn("base-class", conditionalClass)`
- **Never edit** `components/ui/*` manually - these are shadcn/ui components. Regenerate with CLI if needed.

### Time Handling
- **Time format:** "HH:mm" strings (e.g., "05:00", "22:30")
- **Timezone:** Europe/Berlin (hardcoded in API calls)
- **Shift logic:** If `rueckStart < hinStart`, return trip is next day (e.g., night shifts)
- Convert HH:mm to minutes for comparisons: `timeToMinutes()` in `slot-logic.ts`

### Weather Data
- **API:** Open-Meteo DWD ICON (German weather model, most accurate for Germany)
- **Models:** `icon_seamless` (blends icon_d2, icon_eu, icon_global based on forecast horizon)
- **Geocoding:** Prefers German results (`country_code: "DE"`) in `geocodeSearch()`
- **Weather codes:** WMO standard codes (0=clear, 61-65=rain, 71-77=snow, etc.) - see `getWeatherDescription()` in `weather-api.ts`

### Rideability Algorithm (`lib/rideability.ts`)
**Critical thresholds:**
- Wind: Uses `windGust * 0.8` if available (gusts are dangerous for cyclists)
  - 🔴 > 58 km/h (dangerous storm)
  - 🟠 43-58 km/h (strong wind)
  - 🟡 29-43 km/h (moderate wind)
- Rain: 🔴 > 5mm/h | 🟠 2-5mm/h | 🟡 0.5-2mm/h
- Temp: 🔴 ≤ -3°C (ice danger) | 🟠 -3 to 0°C (frost)
- PoP: 🔴 > 80% | 🟠 60-80% | 🟡 20-60%

### UI Component Patterns
- **Icons:** Use `lucide-react` (already imported widely)
- **Forms:** Combine shadcn `Input`, `Label`, `Select` components
- **Loading states:** Show `Loader2` icon with `animate-spin` class
- **Error handling:** Display errors in user-facing German messages (see `geocodeLocation()` error strings)

## Important Files to Reference

- **Type definitions:** `lib/types.ts` - all interfaces (Shift, WeatherSlot, Settings, etc.)
- **Default shifts:** `lib/storage.ts` → `DEFAULT_SHIFTS` (4 predefined German work shifts)
- **API integration:** `lib/weather-api.ts` → study `fetchWeatherData()` for API params
- **Slot filtering:** `lib/slot-logic.ts` → `findRelevantSlots()` shows time window matching logic

## Common Tasks

### Adding New UI Components
```bash
npx shadcn@latest add <component-name>  # Never manually create in components/ui/
```

### Modifying Shift Logic
Edit `lib/slot-logic.ts` → `findRelevantSlots()`. Be careful with:
- Date handling for night shifts (Rückfahrt on next day)
- Time window matching (currently ±30min tolerance)

### Changing Rideability Thresholds
Edit `lib/rideability.ts` → `evaluateRideability()`. Wind thresholds are in km/h (converted from m/s in comments).

### API Changes
Modify `lib/weather-api.ts`. Current params:
- `models=icon_seamless` (multi-model blend)
- `forecast_days=7`
- Hourly variables: temp, apparent_temp, precipitation_probability, rain, weather_code, wind_speed_10m, wind_gusts_10m, etc.

## Special Notes

- **v0.app sync:** This repo auto-deploys from v0.app chats. Manual changes may be overwritten.
- **TypeScript errors ignored:** `next.config.mjs` has `ignoreBuildErrors: true` (v0 workflow)
- **No tests:** Project has no test suite currently
- **German-first:** All UI text, error messages, and default locations are German
- **localStorage only:** No backend - all settings client-side

## External Dependencies

- **Open-Meteo API:** Free, no auth required. Rate limit: ~10k requests/day (sufficient for personal use)
- **Vercel Analytics:** Integrated via `@vercel/analytics` in root layout
- **Buy Me a Coffee:** Support link in header (`app-shell.tsx`)
