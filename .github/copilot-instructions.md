# GitHub Copilot Instructions for `pendllwetter`

Diese Datei steuert, wie Copilot Code für dieses Projekt erzeugen soll (VS Code / Copilot Chat).

## 1. Projektüberblick

- PWA für:
  - Pendelwetter (Fahrrad Hinfahrt/Rückfahrt).
  - Gleitschirm-/Paragliding-Wetter (Flugtauglichkeit).
- Stack: **Next.js App Router**, **TypeScript**, **TailwindCSS**, **shadcn/ui**, **lucide-react**.
- Design-Referenz: **Apple Wetter** + Screenshots von Tim.
- Dark-Theme, mobile-first, fokussiert auf wenige, sehr klare Screens.

## 2. Architektur & Datenfluss

- Wetterdaten:
  - Zentral in `lib/weather-api.ts` kapseln (DWD ICON-D2 / Open-Meteo / Windy o. Ä.).
  - Components sollen keine direkten `fetch`-Aufrufe machen, sondern Helper aus `weather-api.ts` nutzen.
- Standort:
  - `lib/location-store.tsx` stellt Context/Hook bereit (`useLocationStore`).
  - GPS + manuelle Orte + Persistenz via `localStorage` laufen **nur** über diesen Store.
  - Parallele GPS-Abfragen sind dort bereits gedrosselt → keine zweite, eigene Lösung bauen.
- Einstellungen / Storage:
  - Types in `lib/types.ts`, Persistenz in `lib/storage.ts`.
  - Neue Settings immer dort einhängen, nicht direkt in `localStorage` schreiben.
- Pendel-Logik:
  - Bestehende Logik in `rideability.ts` und `slot-logic.ts` wiederverwenden/erweitern, statt neue Regeln anderswo zu duplizieren.

## 3. Kern-Views & Screens

- Shell/Layout:
  - `components/app-shell.tsx`:
    - Navigation, Seitenheader, Dark-Background, zentrale Platzierung der Cards.
    - ARIA korrekt setzen (`aria-current="page"` etc.).
- Pendel-Ansichten:
  - `components/views/now-view.tsx` – aktuelles Wetter + Pendeltauglichkeits-Check.
  - `components/views/radar-view.tsx` – Windy/ Radar-Ansicht + externe Links (immer `target="_blank"`, `rel="noopener noreferrer"`).
  - `components/views/settings-view.tsx` – Konfiguration (Orte, Schwellenwerte, Einheiten).
- Gleitschirm-Ansicht (neu/zu erweitern):
  - Eigene View-Komponente z. B. `components/views/paragliding-view.tsx`.
  - Nutzt dieselben Datenquellen wie Pendel-Views, ergänzt um:
    - Wind (ideal 5–20 km/h, Böenlimit), Thermik/Updraft, Regen (0 mm für 🟢), Wolkenbasis (LCL), Turbulenzindikatoren.
  - Berechnet einen **Flugscore** (🟢 gut / 🟡 grenzwertig / 🔴 schlecht) ähnlich der Pendeltauglichkeit.
  - Nutzt die gleichen UI-Bausteine (Cards, Timelines, Tiles) wie die Pendel-Ansicht.

## 4. UI-, Layout- & Style-Regeln

- Allgemein:
  - **Tailwind zuerst**, nur bei Bedarf `clsx`.
  - Keine neuen globalen CSS-Regeln ohne Not.
  - Dark-Theme mit Glas-Effekt:
    - Hintergrund: dunkelblauer Gradient (`#131F49` → `#04102B`), ggf. animierte Wolken/Overlay.
    - Karten: halbtransparenter „Glass“-Look
      `bg-[rgba(10,20,50,0.55)] rounded-[24px] shadow-lg backdrop-blur-[20px] p-4`.
    - Primärfarbe: `#1B2B5A`, Akzent: `#FFD34F`.
- Typische Bausteine (bitte wiederverwenden):
  - **Section-Card** (Wettereinheiten, Listen, Panel-Vorschauen).
  - **HourlyTimeline**: horizontale Scroll-Liste mit Zeit, Icon, Temperatur, Regen-%.
  - **DailyForecastList**: vertikale Liste mit Tag, Symbol, Regen%, Min/Max.
  - **MetricTile** für Kennzahlen (Luftdruck, Feuchte, Sichtweite, Taupunkt, Wind).
  - **BikePanel**: zeigt Pendeltauglichkeits-Slots als farbige Punkte/Kreise.
  - Für Gleitschirm:
    - **FlightScoreCard**: Score-Anzeige + kurze Begründung.
    - **WindCompass**: Windrichtung + -stärke als Kompass.
    - **RiskGauge**: Balken- oder Halbkreis-Anzeige (grün → gelb → rot).

## 5. Komponenten- & Hooks-Konventionen

- Jede neue Client-Komponente mit `"use client"`-Directive beginnen (falls nötig).
- Keine Komponenten im Render-Body definieren (nicht `function X()` in JSX).
- Hooks:
  - Side-Effects in `useEffect`, berechnete Werte via `useMemo`/`useCallback`.
  - Dependencies in Hooks vollständig halten; keine Lint-Warnungen ignorieren.
- Persistenz:
  - Nur über `location-store` und `storage`-Helper, nie direkt `window.localStorage` in UI-Komponenten.

## 6. Radar-spezifische Regeln

- `radar-view.tsx`:
  - Zeitsteuerung über Windy/eingebetteten Player, **keine eigene Timeline** implementieren.
  - Layout:
    - Oben: Standort + GPS-Button.
    - Mitte: eingebettetes Radar (Windy/iFrame).
    - Unten: Legende und externe Radar-Links (z. B. DWD/WetterOnline).
  - Externe Links immer geöffnet in neuem Tab mit Sicherheits-Attributen.

## 7. Workflows (für generierte Scripts/Docs)

- Development: `pnpm install` → `pnpm run dev`.
- Lint: `pnpm lint` (Flat-Config in `eslint.config.mjs`, React-Hooks-Regeln respektieren).
- Build: `pnpm build` (Turbopack; mehrere Lockfiles vermeiden).

> Wenn du neuen Code generierst, halte dich strikt an:
> - zentrale Daten-Layer (`weather-api`, `location-store`, `storage`),
> - bestehende Rideability-/Slot-Logik,
> - Apple-Wetter-ähnliches UI mit dunklem Glas-Design und wiederverwendbaren Karten-/Timeline-Komponenten.
