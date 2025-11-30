/**
 * PARAGLIDING FORECAST PROFILES
 * 
 * Different time horizons for flight planning:
 * - Profile 3: Next 3 hours (Launch window / Immediate planning)
 * - Profile 4: Next 12 hours (Day planning)
 * - Profile 5: Next 24 hours (XC / Travel planning)
 */

import type { OpenMeteoParaglidingResponse, ParaglidingAnalysis } from "./types-paragliding"
import { generateParaglidingAnalysis } from "./paragliding-analysis"

export type ForecastProfile = "3h" | "12h" | "24h"

export interface ForecastProfileConfig {
  id: ForecastProfile
  label: string
  description: string
  hours: number
  focus: string
}

export const FORECAST_PROFILES: Record<ForecastProfile, ForecastProfileConfig> = {
  "3h": {
    id: "3h",
    label: "3 Stunden",
    description: "Startfenster",
    hours: 3,
    focus: "Unmittelbare Flugbedingungen und Sicherheit",
  },
  "12h": {
    id: "12h",
    label: "12 Stunden",
    description: "Tagesplanung",
    hours: 12,
    focus: "Optimales Zeitfenster für längere Flüge",
  },
  "24h": {
    id: "24h",
    label: "24 Stunden",
    description: "XC-Planung",
    hours: 24,
    focus: "Streckenflug- und Reiseplanung",
  },
}

/**
 * Generate Multi-Profile Forecast
 * 
 * Analyzes weather for different time horizons.
 * 
 * @param data Open-Meteo paragliding data
 * @param location Current location
 * @param launchOrientation Launch site orientation
 * @returns Analysis for each profile
 */
export function generateMultiProfileForecast(
  data: OpenMeteoParaglidingResponse,
  location: { lat: number; lon: number; name: string },
  launchOrientation: number = 270
): Record<ForecastProfile, ParaglidingAnalysis> {
  const profiles: Partial<Record<ForecastProfile, ParaglidingAnalysis>> = {}

  // Profile 3h: Current + next 2 hours (best immediate window)
  const best3h = findBestWindow(data, 0, 3)
  profiles["3h"] = generateParaglidingAnalysis(data, best3h, location, launchOrientation)

  // Profile 12h: Best window in next 12 hours
  const best12h = findBestWindow(data, 0, 12)
  profiles["12h"] = generateParaglidingAnalysis(data, best12h, location, launchOrientation)

  // Profile 24h: Best window in next 24 hours
  const best24h = findBestWindow(data, 0, 24)
  profiles["24h"] = generateParaglidingAnalysis(data, best24h, location, launchOrientation)

  return profiles as Record<ForecastProfile, ParaglidingAnalysis>
}

/**
 * Find Best Flight Window
 * 
 * Scans time range for optimal flying conditions based on:
 * - CAPE (thermal potential)
 * - Wind speed (safe range)
 * - Wind direction (suitable for launch)
 * 
 * @param data Weather data
 * @param startHour Starting hour index
 * @param durationHours Number of hours to scan
 * @returns Index of best hour
 */
function findBestWindow(
  data: OpenMeteoParaglidingResponse,
  startHour: number,
  durationHours: number
): number {
  let bestIndex = startHour
  let bestScore = -1

  const endHour = Math.min(startHour + durationHours, data.hourly.time.length)

  for (let i = startHour; i < endHour; i++) {
    const time = new Date(data.hourly.time[i])
    const hour = time.getHours()

    // Skip night hours (no thermals)
    if (hour < 9 || hour > 19) continue

    const cape = data.hourly.cape[i] || 0
    const wind = data.hourly.wind_speed_10m[i] || 0
    const gust = data.hourly.wind_gusts_10m[i] || 0
    const temp = data.hourly.temperature_2m[i] || 0
    const rain = data.hourly.precipitation[i] || 0

    // Simple scoring
    let score = 0

    // CAPE: moderate is best (500-1500 J/kg)
    if (cape > 500 && cape < 1500) score += 30
    else if (cape >= 1500 && cape < 2500) score += 20
    else if (cape >= 2500) score += 5 // Too strong

    // Wind: 10-25 km/h ideal
    if (wind >= 10 && wind <= 25) score += 30
    else if (wind > 25 && wind <= 35) score += 10

    // Gusts: penalty if too high
    if (gust < 35) score += 20
    else if (gust < 45) score += 10

    // Temperature: bonus for warm (thermals)
    if (temp > 15) score += 10
    if (temp > 20) score += 10

    // Rain: heavy penalty
    if (rain > 0) score -= 50

    // Daytime bonus (11:00-16:00 = best thermal hours)
    if (hour >= 11 && hour <= 16) score += 15

    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestIndex
}

/**
 * Get Profile Summary
 * 
 * Quick overview text for each profile.
 */
export function getProfileSummary(
  profile: ForecastProfile,
  analysis: ParaglidingAnalysis
): string {
  const time = new Date(analysis.timestamp).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  })

  switch (profile) {
    case "3h":
      return `Bestes Fenster: ${time} Uhr`
    case "12h":
      return `Optimales Zeitfenster heute: ${time} Uhr`
    case "24h":
      return `Beste Bedingungen: ${time} Uhr`
  }
}
