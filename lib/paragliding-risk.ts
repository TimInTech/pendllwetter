/**
 * PARAGLIDING RISK ASSESSMENT
 * 
 * Risk detection, warnings, and safety level evaluation
 */

import type {
  RiskFactor,
  FlightWarning,
  RiskLevel,
  FlightSuitability,
  AtmosphericProfile,
  ThermalData,
  WindShearData,
} from "./types-paragliding"

import { getWindDirection } from "./paragliding-profile"

/**
 * Detect Lee-Side Turbulence Risk
 * 
 * Lee-side occurs when wind comes from behind the launch.
 * Creates dangerous rotors and turbulence.
 * 
 * @param windSpeed Surface wind speed in km/h
 * @param windDirection Wind direction in degrees (0-360)
 * @param launchOrientation Launch site facing direction in degrees (0-360)
 * @returns Risk factor or null if no risk
 */
export function detectLeeRisk(
  windSpeed: number,
  windDirection: number,
  launchOrientation: number
): RiskFactor | null {
  const angle = Math.abs(((windDirection - launchOrientation + 180) % 360) - 180)
  
  // Lee-side if wind from back (angle > 90°)
  if (angle > 90 && windSpeed > 15) {
    const severity: RiskLevel = windSpeed > 30 ? "extreme" : windSpeed > 20 ? "high" : "moderate"
    
    return {
      name: "Lee-Turbulenz",
      level: severity,
      score: Math.min(100, Math.round((windSpeed / 40) * 100)),
      description: `Wind aus ${getWindDirection(windDirection)} - Leeseite des Hangs!`,
      mitigation: "Nicht fliegen! Extreme Turbulenzen durch Rotoren möglich.",
    }
  }
  
  return null
}

/**
 * Detect Gust Risk
 * 
 * High gust factor or absolute gust speed indicates dangerous conditions.
 * 
 * @param avgWind Average wind speed in km/h
 * @param gustSpeed Gust speed in km/h
 * @returns Risk factor or null if no risk
 */
export function detectGustRisk(avgWind: number, gustSpeed: number): RiskFactor | null {
  const gustFactor = gustSpeed / Math.max(avgWind, 1)
  
  if (gustFactor > 1.6 || gustSpeed > 40) {
    const severity: RiskLevel = gustSpeed > 50 ? "extreme" : gustSpeed > 40 ? "high" : "moderate"
    
    return {
      name: "Starke Böen",
      level: severity,
      score: Math.min(100, Math.round((gustSpeed / 50) * 100)),
      description: `Böen bis ${Math.round(gustSpeed)} km/h (Faktor ${gustFactor.toFixed(1)})`,
      mitigation: "Nur für sehr erfahrene Piloten. Aktives Fliegen erforderlich.",
    }
  }
  
  return null
}

/**
 * Detect Thermal Turbulence Risk
 * 
 * High CAPE with low consistency indicates choppy, dangerous thermals
 * and potential for overdevelopment (thunderstorms).
 * 
 * @param thermal Thermal data
 * @param cape CAPE value in J/kg
 * @returns Risk factor or null if no risk
 */
export function detectThermalTurbulence(thermal: ThermalData, cape: number): RiskFactor | null {
  if (cape > 2000 && thermal.consistency < 0.5) {
    const severity: RiskLevel = cape > 3000 ? "high" : "moderate"
    
    return {
      name: "Thermische Turbulenz",
      level: severity,
      score: Math.min(100, Math.round((cape / 3000) * 80)),
      description: `Starke, unregelmäßige Thermik (CAPE ${Math.round(cape)} J/kg)`,
      mitigation: "Overdevelopment-Gefahr. Gewitter möglich. Schirmkollaps-Risiko erhöht.",
    }
  }
  
  return null
}

/**
 * Detect Wind Shear Risk
 * 
 * High wind shear creates turbulence at different altitudes.
 * 
 * @param windShear Wind shear data
 * @returns Risk factor or null if no risk
 */
export function detectWindShearRisk(windShear: WindShearData): RiskFactor | null {
  if (windShear.level === "high" || windShear.level === "severe") {
    const severity: RiskLevel = windShear.level === "severe" ? "high" : "moderate"
    
    return {
      name: "Windscherung",
      level: severity,
      score: windShear.turbulencePotential * 10,
      description: `Starke Windscherung (${windShear.shear_0_1km.toFixed(1)} m/s/km)`,
      mitigation: "Turbulenz in verschiedenen Höhen. Schirm aktiv kontrollieren.",
    }
  }
  
  return null
}

/**
 * Generate Flight Warnings
 * 
 * Creates user-facing warnings based on atmospheric conditions and risks.
 * 
 * @param atmosphere Atmospheric profile
 * @param risks Detected risk factors
 * @returns Array of flight warnings
 */
export function generateFlightWarnings(
  atmosphere: AtmosphericProfile,
  risks: RiskFactor[]
): FlightWarning[] {
  const warnings: FlightWarning[] = []

  // High-risk warnings
  risks.forEach((risk) => {
    if (risk.level === "extreme" || risk.level === "high") {
      warnings.push({
        type: risk.name.includes("Lee") ? "terrain" : risk.name.includes("Böen") ? "wind" : "thermal",
        severity: risk.level === "extreme" ? "danger" : "warning",
        message: risk.description,
        icon: "⚠️",
      })
    }
  })

  // Overdevelopment warning
  if (atmosphere.cape.level === "extreme") {
    warnings.push({
      type: "weather",
      severity: "warning",
      message: "Gewittergefahr durch sehr hohe CAPE-Werte!",
      icon: "⛈️",
    })
  }

  // Low cloud base warning
  if (atmosphere.lcl.classification === "very_low") {
    warnings.push({
      type: "weather",
      severity: "caution",
      message: `Niedrige Wolkenbasis (${atmosphere.lcl.height}m) - eingeschränkte Flughöhe`,
      icon: "☁️",
    })
  }

  // Strong wind shear
  if (atmosphere.windShear.turbulencePotential > 7) {
    warnings.push({
      type: "wind",
      severity: "warning",
      message: "Starke Windscherung - erhöhtes Turbulenzrisiko",
      icon: "💨",
    })
  }

  return warnings
}

/**
 * Evaluate Overall Safety Level
 * 
 * Combines all risk factors to determine overall flight suitability.
 * 
 * @param risks Array of risk factors
 * @param atmosphere Atmospheric profile
 * @returns Safety level (suitability, score 0-100)
 */
export function evaluateSafetyLevel(
  risks: RiskFactor[],
  atmosphere: AtmosphericProfile
): { level: FlightSuitability; score: number } {
  let score = 100

  // Deduct for each risk
  risks.forEach((risk) => {
    if (risk.level === "extreme") score -= 50
    else if (risk.level === "high") score -= 30
    else if (risk.level === "moderate") score -= 15
    else if (risk.level === "low") score -= 5
  })

  // Bonus for good conditions
  if (atmosphere.thermal.index > 7 && atmosphere.windShear.level === "low") {
    score += 10
  }

  score = Math.max(0, Math.min(100, score))

  let level: FlightSuitability
  if (score >= 80) level = "optimal"
  else if (score >= 60) level = "good"
  else if (score >= 40) level = "marginal"
  else if (score >= 20) level = "poor"
  else level = "dangerous"

  return { level, score }
}
