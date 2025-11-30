import type { HourlyForecast } from "./types"

// Paragliding-Flugtauglichkeits-Level
export type ParaglidingLevel = "optimal" | "gut" | "grenzwertig" | "schlecht" | "gefährlich"

export interface ParaglidingConditions {
  level: ParaglidingLevel
  score: number // 0-100
  emoji: string
  label: string
  advice: string
  details: {
    wind: "optimal" | "gut" | "grenzwertig" | "zu_stark"
    gusts: "sicher" | "akzeptabel" | "böig" | "gefährlich"
    rain: "trocken" | "leicht" | "nass" | "starkregen"
    clouds: "bluebird" | "gut" | "mittel" | "schlecht"
    thermal: "stark" | "mittel" | "schwach" | "keine"
  }
}

export interface ParaglidingHourlySlot {
  time: string
  conditions: ParaglidingConditions
  weather: {
    temp: number
    windSpeed: number
    windDir: number
    gusts: number
    rain: number
    clouds: number
    thermalIndex: number // Mock: 0-10
    cloudBase: number // Mock: Meter AGL
  }
}

export interface ParaglidingSpot {
  id: string
  name: string
  lat: number
  lon: number
  elevation: number // Meter
  distance?: number // km vom aktuellen Standort
  direction: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"
  suitableWind: string[] // z.B. ["W", "NW", "N"]
  difficulty: "beginner" | "intermediate" | "advanced"
}

// Bekannte Fluggebiete in NRW/Niedersachsen
export const PARAGLIDING_SPOTS: ParaglidingSpot[] = [
  {
    id: "ascheloh",
    name: "Ascheloh",
    lat: 51.8833,
    lon: 8.9167,
    elevation: 280,
    direction: "W",
    suitableWind: ["W", "NW", "SW"],
    difficulty: "intermediate",
  },
  {
    id: "willingen",
    name: "Willingen (Ettelsberg)",
    lat: 51.2944,
    lon: 8.6167,
    elevation: 838,
    direction: "NW",
    suitableWind: ["NW", "W", "N"],
    difficulty: "intermediate",
  },
  {
    id: "kohlberg",
    name: "Kohlberg",
    lat: 51.3333,
    lon: 8.7167,
    elevation: 615,
    direction: "W",
    suitableWind: ["W", "SW", "NW"],
    difficulty: "beginner",
  },
  {
    id: "edersee",
    name: "Edersee",
    lat: 51.1833,
    lon: 9.0167,
    elevation: 400,
    direction: "N",
    suitableWind: ["N", "NE", "NW"],
    difficulty: "advanced",
  },
]

/**
 * Berechnet Paragliding-Tauglichkeit basierend auf Wetterdaten
 * 
 * Kriterien:
 * - Wind: 5-25 km/h ideal, >30 km/h kritisch, >40 km/h gefährlich
 * - Böen: max 1.5x Grundwind, >50 km/h gefährlich
 * - Regen: trocken ideal, >1mm kritisch
 * - Wolken: 20-60% optimal für Thermik
 */
export function evaluateParaglidingConditions(
  hourData: HourlyForecast,
  thermalIndex: number = 5, // Mock: 0-10
  cloudBase: number = 1500 // Mock: Meter AGL
): ParaglidingConditions {
  const { windSpeed, rain, temp } = hourData
  const gusts = windSpeed * 1.4 // Approximation wenn keine Böen-Daten
  const clouds = 50 // Mock, könnte aus weatherCode abgeleitet werden

  let score = 100
  const details = {
    wind: "optimal" as const,
    gusts: "sicher" as const,
    rain: "trocken" as const,
    clouds: "gut" as const,
    thermal: "mittel" as const,
  }

  // Wind-Bewertung
  if (windSpeed < 5) {
    details.wind = "optimal"
    score -= 10 // zu wenig Wind für Soaring
  } else if (windSpeed <= 15) {
    details.wind = "optimal"
  } else if (windSpeed <= 25) {
    details.wind = "gut"
    score -= 10
  } else if (windSpeed <= 30) {
    details.wind = "grenzwertig"
    score -= 30
  } else {
    details.wind = "zu_stark"
    score -= 60
  }

  // Böen-Bewertung
  const gustFactor = gusts / Math.max(windSpeed, 1)
  if (gusts > 50) {
    details.gusts = "gefährlich"
    score -= 70
  } else if (gusts > 35 || gustFactor > 2.0) {
    details.gusts = "böig"
    score -= 40
  } else if (gusts > 25 || gustFactor > 1.7) {
    details.gusts = "akzeptabel"
    score -= 15
  } else {
    details.gusts = "sicher"
  }

  // Regen-Bewertung
  if (rain > 5) {
    details.rain = "starkregen"
    score -= 90
  } else if (rain > 1) {
    details.rain = "nass"
    score -= 50
  } else if (rain > 0.1) {
    details.rain = "leicht"
    score -= 20
  } else {
    details.rain = "trocken"
  }

  // Wolken/Thermik
  if (clouds < 20) {
    details.clouds = "bluebird"
    details.thermal = thermalIndex > 6 ? "stark" : "schwach"
  } else if (clouds < 60) {
    details.clouds = "gut"
    details.thermal = thermalIndex > 5 ? "stark" : "mittel"
  } else if (clouds < 80) {
    details.clouds = "mittel"
    details.thermal = "schwach"
    score -= 15
  } else {
    details.clouds = "schlecht"
    details.thermal = "keine"
    score -= 25
  }

  // Temperatur-Check (Thermik-Potential)
  if (temp < 5) {
    score -= 10 // schwache Thermik
  } else if (temp > 25) {
    score += 5 // gute Thermik
  }

  // Wolkenbasis-Check
  if (cloudBase < 800) {
    score -= 20 // niedrige Basis
  }

  // Level bestimmen
  let level: ParaglidingLevel
  let emoji: string
  let label: string
  let advice: string

  if (score >= 80) {
    level = "optimal"
    emoji = "🟢"
    label = "Optimale Bedingungen"
    advice = "Perfekt zum Fliegen! Gute Thermik und stabile Bedingungen."
  } else if (score >= 60) {
    level = "gut"
    emoji = "🟢"
    label = "Gute Flugbedingungen"
    advice = "Gute Bedingungen für alle Könnerstufen."
  } else if (score >= 40) {
    level = "grenzwertig"
    emoji = "🟡"
    label = "Nur für Erfahrene"
    advice = details.wind === "zu_stark"
      ? "Wind etwas stark. Nur für fortgeschrittene Piloten."
      : details.gusts === "böig"
      ? "Böig und wechselhaft. Vorsicht geboten."
      : "Bedingungen akzeptabel, aber anspruchsvoll."
  } else if (score >= 20) {
    level = "schlecht"
    emoji = "🔴"
    label = "Nicht empfohlen"
    advice = details.rain !== "trocken"
      ? "Regen macht Fliegen gefährlich. Besser warten."
      : "Bedingungen zu schwierig. Besser nicht fliegen."
  } else {
    level = "gefährlich"
    emoji = "🔴"
    label = "Gefährlich!"
    advice = gusts > 50
      ? "Extreme Böen! Absolut nicht fliegen."
      : "Gefährliche Bedingungen. Flugverbot empfohlen."
  }

  return {
    level,
    score: Math.max(0, Math.min(100, score)),
    emoji,
    label,
    advice,
    details,
  }
}

/**
 * Mock: Berechnet Thermik-Index basierend auf Tageszeit und Temperatur
 * TODO: Integration echter Thermik-Modelle (z.B. Open-Meteo CAPE)
 */
export function calculateThermalIndex(hour: number, temp: number, clouds: number): number {
  // Beste Thermik zwischen 11-16 Uhr
  let index = 0

  if (hour >= 11 && hour <= 16) {
    index = 8
  } else if (hour >= 9 && hour <= 18) {
    index = 5
  } else {
    index = 1
  }

  // Temperatur-Einfluss
  if (temp > 20) index += 1
  if (temp > 25) index += 1

  // Wolken-Einfluss (Cu-Wolken fördern Thermik)
  if (clouds > 20 && clouds < 60) index += 1

  return Math.max(0, Math.min(10, index))
}

/**
 * Mock: Schätzt Wolkenbasis (LCL - Lifting Condensation Level)
 * TODO: Integration echter LCL-Berechnung aus Temperatur/Taupunkt
 */
export function estimateCloudBase(temp: number, humidity: number): number {
  // Vereinfachte Formel: (Temperatur - Taupunkt) * 125m
  const dewPoint = temp - ((100 - humidity) / 5)
  const spreadDegrees = temp - dewPoint
  return Math.round(spreadDegrees * 125)
}

/**
 * Berechnet Entfernung zwischen zwei Koordinaten (Haversine)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Erdradius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Berechnet Himmelsrichtung zwischen zwei Punkten
 */
export function calculateDirection(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): ParaglidingSpot["direction"] {
  const dLon = lon2 - lon1
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  const normalized = (brng + 360) % 360

  if (normalized < 22.5 || normalized >= 337.5) return "N"
  if (normalized < 67.5) return "NE"
  if (normalized < 112.5) return "E"
  if (normalized < 157.5) return "SE"
  if (normalized < 202.5) return "S"
  if (normalized < 247.5) return "SW"
  if (normalized < 292.5) return "W"
  return "NW"
}

/**
 * Findet nahegelegene Fluggebiete und sortiert nach Entfernung
 */
export function findNearbySpots(
  currentLat: number,
  currentLon: number,
  maxDistance: number = 100
): ParaglidingSpot[] {
  return PARAGLIDING_SPOTS.map((spot) => ({
    ...spot,
    distance: calculateDistance(currentLat, currentLon, spot.lat, spot.lon),
    direction: calculateDirection(currentLat, currentLon, spot.lat, spot.lon),
  }))
    .filter((spot) => spot.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!)
}
