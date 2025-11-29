# GitHub Copilot Instructions for `pendllwetter`

## Stack & Entry points
- Next.js App Router + React, TypeScript, Tailwind, shadcn/ui, lucide-react.
- Main layout/shell: `components/app-shell.tsx`.
- Core views:
  - `components/views/now-view.tsx` – Sofortcheck (Wetter + Pendeltauglichkeit).
  - `components/views/radar-view.tsx` – Windy-Radar + externe Radar-Links.
  - `components/views/settings-view.tsx` (u. Ä.) – Konfiguration.

## Domain & Data flow
- Wetterdaten: zentral über `lib/weather-api.ts` (DWD ICON-D2 / externe APIs).
  → Neue Requests hier bündeln, nicht direkt aus Components fetchen.
- Standortzustand:
  - `lib/location-store.tsx` stellt einen React-Context (`useLocationStore`) bereit.
  - GPS + manuelle Orte werden hier verwaltet und via `localStorage` persistiert.
  - Parallel-GPS-Aufrufe werden über ein Promise-Ref gedrosselt – diese Logik nicht duplizieren.
- Einstellungen:
  - `lib/storage.ts` + zugehörige Types in `lib/types.ts`.
  - Immer über die vorhandenen Helper lesen/schreiben.

## UI-Patterns
- UI-Bausteine über `@/components/ui/*` (shadcn) verwenden, Icons aus `lucide-react`.
- Neue Client-Components mit `"use client"` am Anfang kennzeichnen.
- Navigation und Header-Buttons in `app-shell.tsx`:
  - ARIA: für Seiten-Navigation `aria-current="page"` bzw. boolesches `aria-selected` nur mit passenden Rollen.

## Radar-spezifische Regeln
- `radar-view.tsx`:
  - Keine eigene Timeline-/Player-Logik mehr; Windy steuert Zeit selbst.
  - Oben: Standort + GPS-Button; Mitte: Windy-`<iframe>`; unten: Niederschlags-Legende + „Weitere Radaransichten“ (externe Links).
  - Externe Radar-URLs nach Möglichkeit mit `location.lat/lon` parametrisieren, aber immer mit `target="_blank"` + `rel="noopener noreferrer"`.

## Workflows
- Development: `pnpm install`, dann `pnpm run dev`.
- Lint: `pnpm lint` (ESLint Flat Config in `eslint.config.mjs`; React-Hooks-Regeln respektieren).
- Build: `pnpm build` (Next.js/Turbopack; `turbopack.root` ist gesetzt).
  → Nach Code-Änderungen immer mindestens `pnpm lint` ausführen.

## Conventions
- Hooks:
  - Side-Effects nur in `useEffect`; Berechnungen mit Abhängigkeiten via `useMemo`/`useCallback`.
  - Keine Inline-Komponenten innerhalb des Render-Bodies definieren.
- Neue Features:
  - Prüfe zuerst bestehende Helpers (z. B. `rideability.ts`, `slot-logic.ts`), bevor neue Business-Logik angelegt wird.
  - Persistierung nur über die vorhandenen Storage-/Context-Layer, nicht direkt im Component.
