# Wetterpendeln – Copilot Leitfaden

## Quick Facts
- Stack: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind/shadcn; pnpm is the only supported package manager (see `pnpm-lock.yaml`).
- Runtime: Node 20/22+ on Linux; repo lives at `/home/gummi/github_repos/pendllwetter`.
- Install & run with `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`; scripts map directly to the Next CLI.
- Deployments sync automatically from v0.app → GitHub → Vercel (`README.md`), so favor incremental diffs to avoid merge noise.

## Architecture & Data Flow
- `app/layout.tsx` wires global styles plus `LocationProvider` and Vercel analytics; actual UI lives in `components/`.
- `components/app-shell.tsx` drives the four-tab layout (Jetzt, Pendeln, Radar, Einstellungen) by embedding the view components under `components/views/*`.
- Commute workflow: `views/commute-view.tsx` collects shift + route → `lib/weather-api.ts` geocodes and calls the DWD ICON endpoint (`fetchWeatherData`) → `lib/slot-logic.ts` (`findRelevantSlots`) slices hourly forecasts into outbound/return slots → `lib/rideability.ts` (`evaluateRideability`) labels each slot (🟢/🟡/🟠/🔴) → `components/weather-results.tsx` renders the grids and status copy.
- `lib/location-store.tsx` keeps the last location (GPS/manual) in React context + `localStorage`; settings such as shifts default to `lib/storage.ts` where values are persisted under `wetterpendeln-*` keys.

## Domain Rules
- Time handling uses HH:mm strings, Berlin timezone, and minute math helpers in `lib/slot-logic.ts`; when `rueckStart < hinStart` the return trip is assumed to be the next day.
- Rideability thresholds (`lib/rideability.ts`): wind uses gusts×0.8 (>58 km/h = 🔴), rain (>5 mm/h = 🔴), temp (≤ -3 °C = 🔴), precipitation probability (>80 % = 🔴). Keep these in sync with UI legends in `weather-results.tsx`.
- Weather descriptions/icons follow WMO codes mapped in `lib/weather-api.ts` (`getWeatherDescription`, `getWeatherIcon`). Hourly parsing skips past timestamps and caps to requested hours.
- All UI copy and surface errors are German; when adding strings, follow the concise tone already used in `components/weather-app.tsx` and `views/*`.

## UI & Styling Patterns
- Tailwind drives layout with a dark palette (`bg-[#0a0f1e]`, cyan gradients). Use `cn()` from `lib/utils.ts` for conditional classes and prefer `components/ui/*` primitives (auto-generated shadcn components—never edit manually; regenerate with `npx shadcn@latest add <name>` if needed).
- Icons come from `lucide-react`; loading states typically show `Loader2` with `animate-spin`; empty/error states lean on `components/ui/empty.tsx` and `use-toast` helpers in `hooks/use-toast.ts`.
- Responsive behavior: `components/app-shell.tsx` + TabContent ensure mobile-first layouts; avoid introducing desktop-only assumptions without feature flags in settings.

## External Interfaces & Constraints
- Geocoding + forecasts hit Open-Meteo endpoints without auth; prefer German matches (`country_code === "DE"`) and handle fetch errors with the existing German messaging templates.
- There is no backend; persistence is 100 % client-side via `localStorage`, so guard all storage access with `typeof window !== "undefined"` as seen in `lib/location-store.tsx`.
- `next.config.mjs` enables `ignoreBuildErrors`; lint is relatively permissive, so manually sanity-check type-heavy changes.
- No automated tests; validate changes by running `pnpm dev` and exercising the affected tab(s) manually before shipping.

## When Editing
- Keep PRs free of v0.app generated noise; if v0 resyncs introduce unexpected changes, coordinate before overwriting.
- When touching commute logic, update both the evaluator (`lib/rideability.ts`) and the UI badges/tooltips in `components/weather-results.tsx` to keep thresholds consistent.
- Any new persisted setting must be added to `lib/storage.ts` (default values + migration) and wired into the settings view to avoid orphaned keys.
