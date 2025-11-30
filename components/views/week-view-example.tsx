/**
 * BEISPIEL-INTEGRATION: 7-Tage-Vorschau
 * 
 * Diese Datei zeigt, wie die neuen UI-Komponenten 
 * für eine vollständige Wochenansicht verwendet werden können.
 */

"use client"

import { WeatherCard, WeatherCardHeader } from "@/components/ui/weather-card"
import { DailyForecastList } from "@/components/ui/daily-forecast-list"
import { BikePanel } from "@/components/ui/bike-panel"

// Beispiel-Daten für 7-Tage-Vorschau
const exampleDailyForecast = [
  { date: "2024-01-15", dayLabel: "Heute", tempMin: 7, tempMax: 10, pop: 0.65, weatherCode: 61, description: "Regen" },
  { date: "2024-01-16", dayLabel: "So.", tempMin: 5, tempMax: 9, pop: 0.45, weatherCode: 3, description: "Bewölkt" },
  { date: "2024-01-17", dayLabel: "Mo.", tempMin: 6, tempMax: 11, pop: 0.20, weatherCode: 2, description: "Teilweise bewölkt" },
  { date: "2024-01-18", dayLabel: "Di.", tempMin: 4, tempMax: 8, pop: 0.55, weatherCode: 51, description: "Nieselregen" },
  { date: "2024-01-19", dayLabel: "Mi.", tempMin: 3, tempMax: 7, pop: 0.70, weatherCode: 63, description: "Starker Regen" },
  { date: "2024-01-20", dayLabel: "Do.", tempMin: 5, tempMax: 10, pop: 0.30, weatherCode: 1, description: "Überwiegend klar" },
  { date: "2024-01-21", dayLabel: "Fr.", tempMin: 6, tempMax: 12, pop: 0.15, weatherCode: 0, description: "Klar" },
]

// Beispiel-Daten für Radfahr-Panel
const exampleBikeSlots = [
  { time: "06:00", level: "ok" as const, label: "Leichter Regen", temp: 8, rain: 0.5, wind: 12 },
  { time: "07:00", level: "kritisch" as const, label: "Regen + Wind", temp: 8, rain: 2.3, wind: 25 },
  { time: "08:00", level: "schlecht" as const, label: "Starkregen", temp: 9, rain: 4.1, wind: 28 },
  { time: "09:00", level: "ok" as const, label: "Nachlassend", temp: 9, rain: 0.8, wind: 18 },
  { time: "10:00", level: "gut" as const, label: "Trocken", temp: 10, rain: 0, wind: 10 },
]

export function WeekViewExample() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 7-Tage-Übersicht */}
      <WeatherCard>
        <WeatherCardHeader title="7-Tage-Vorhersage" subtitle="Wochenübersicht" />
        <DailyForecastList forecasts={exampleDailyForecast} />
      </WeatherCard>

      {/* Radfahr-Eignung */}
      <BikePanel
        direction="Hinfahrt"
        shiftName="Frühschicht"
        slots={exampleBikeSlots}
        onSlotClick={(slot) => console.log("Slot clicked:", slot)}
      />
    </div>
  )
}
