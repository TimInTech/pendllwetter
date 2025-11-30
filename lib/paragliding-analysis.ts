/**
 * PARAGLIDING ANALYSIS - Main Entry Point
 * 
 * Professional flight weather analysis system combining all meteorological parameters.
 * 
 * Public API:
 * - generateParaglidingAnalysis() - Main entry point
 * - findNearbyLaunchSites() - Find spots near location
 * - LAUNCH_SITES - Database of known launch sites
 */

import type {
  OpenMeteoParaglidingResponse,
  ParaglidingAnalysis,
  AtmosphericProfile,
  SoaringAnalysis,
  XCAnalysis,
  RiskFactor,
  LaunchSite,
} from "./types-paragliding"

import {
  buildWindProfile,
  calculateWindShear,
} from "./paragliding-profile"

import {
  calculateLCL,
  analyzeCAPE,
  analyzeLiftedIndex,
  calculateLFC,
  analyzeThermalConditions,
} from "./paragliding-thermals"

import {
  detectLeeRisk,
  detectGustRisk,
  detectThermalTurbulence,
  detectWindShearRisk,
  generateFlightWarnings,
  evaluateSafetyLevel,
} from "./paragliding-risk"

// Re-export launch sites database
export { LAUNCH_SITES, findNearbyLaunchSites } from "./paragliding-pro"

// ============================================================================
// ATMOSPHERIC PROFILE
// ============================================================================

/**
 * Build Complete Atmospheric Profile
 * 
 * @param data Open-Meteo paragliding response
 * @param index Hour index (0 = current hour)
 * @param elevation Ground elevation in meters MSL
 * @returns Complete atmospheric profile with all parameters
 */
export function buildAtmosphericProfile(
  data: OpenMeteoParaglidingResponse,
  index: number,
  elevation: number = 0
): AtmosphericProfile {
  const temp = data.hourly.temperature_2m[index]
  const dewpoint = data.hourly.dewpoint_2m[index]
  const cape = data.hourly.cape[index] || 0
  const liftedIndex = data.hourly.lifted_index[index] || 0
  const boundaryLayerHeight = data.hourly.boundary_layer_height[index] || 1500
  
  const time = new Date(data.hourly.time[index])
  const hour = time.getHours()

  const lcl = calculateLCL(temp, dewpoint, elevation)
  const capeData = analyzeCAPE(cape)
  const liData = analyzeLiftedIndex(liftedIndex)
  const lfcData = calculateLFC(cape, lcl.height, boundaryLayerHeight)
  const windProfile = buildWindProfile(data.hourly, index)
  const windShear = calculateWindShear(windProfile)
  const thermal = analyzeThermalConditions(cape, lcl.height, boundaryLayerHeight, hour, temp)

  return {
    cape: capeData,
    lcl,
    lfc: lfcData,
    liftedIndex: liData,
    windShear,
    thermal,
    windProfile,
    dewpointSpread: temp - dewpoint,
    boundaryLayerHeight,
    inversionHeight: null, // TODO: Detect from temperature profile
  }
}

// ============================================================================
// SOARING & XC ANALYSIS
// ============================================================================

/**
 * Analyze Soaring Conditions (Ridge/Thermal/Wave)
 * 
 * @param atmosphere Atmospheric profile
 * @param launchOrientation Launch site orientation in degrees (0-360)
 * @returns Soaring analysis for ridge, thermal, and wave flying
 */
export function analyzeSoaringConditions(
  atmosphere: AtmosphericProfile,
  launchOrientation: number = 270
): SoaringAnalysis {
  const { windProfile, thermal } = atmosphere

  // Ridge soaring analysis
  const windAngle = Math.abs(
    ((windProfile.surface.direction - launchOrientation + 180) % 360) - 180
  )
  const ridgeSuitable = windAngle < 45 && windProfile.surface.speed > 10 && windProfile.surface.speed < 35
  const liftPotential = ridgeSuitable ? Math.min(10, Math.round((windProfile.surface.speed / 25) * 10)) : 0

  let ridgeConditions = ""
  if (ridgeSuitable) {
    ridgeConditions = `Gute Hangaufwinde bei ${Math.round(windProfile.surface.speed)} km/h`
  } else if (windAngle > 90) {
    ridgeConditions = "Lee-Seite - Hangaufwinde nicht möglich"
  } else {
    ridgeConditions = "Wind zu schräg oder zu schwach für Hangaufwinde"
  }

  // Thermal soaring analysis
  const thermalSuitable = thermal.strength > 0.8 && thermal.index >= 5
  let thermalConditions = ""
  if (thermalSuitable) {
    thermalConditions = `Gute Thermik (${thermal.strength} m/s), Basis ~${Math.round(thermal.tops / 100) * 100}m`
  } else if (thermal.index < 3) {
    thermalConditions = "Schwache oder keine Thermik"
  } else {
    thermalConditions = "Mäßige Thermik, unregelmäßig"
  }

  // Wave soaring (simplified - requires mountain topography)
  const wavePossible = windProfile.avgSpeed > 20 && windProfile.directionChange < 30
  const waveAmplitude = wavePossible ? Math.round(windProfile.avgSpeed * 30) : 0
  const waveConditions = wavePossible
    ? "Leewellen möglich - nur für erfahrene Piloten"
    : "Keine Leewellen erwartet"

  return {
    ridge: {
      suitable: ridgeSuitable,
      windAngle,
      liftPotential,
      conditions: ridgeConditions,
    },
    thermal: {
      suitable: thermalSuitable,
      strength: thermal.strength,
      tops: thermal.tops,
      consistency: thermal.consistency,
      conditions: thermalConditions,
    },
    wave: {
      possible: wavePossible,
      amplitude: waveAmplitude,
      conditions: waveConditions,
    },
  }
}

/**
 * Analyze XC (Cross-Country) Potential
 * 
 * @param atmosphere Atmospheric profile
 * @returns XC analysis with score, distance potential, rating
 */
export function analyzeXCPotential(atmosphere: AtmosphericProfile): XCAnalysis {
  const { thermal, windProfile, lcl } = atmosphere
  
  let score = 0
  let distancePotential = 0
  let confidence = 0

  // Score factors
  if (thermal.strength > 1.5) score += 30
  else if (thermal.strength > 1.0) score += 20
  else if (thermal.strength > 0.5) score += 10

  if (lcl.height > 1800) score += 25
  else if (lcl.height > 1400) score += 15
  else if (lcl.height > 1000) score += 5

  if (windProfile.avgSpeed < 25) score += 20
  else if (windProfile.avgSpeed < 35) score += 10

  if (thermal.consistency > 0.7) score += 25
  else if (thermal.consistency > 0.5) score += 15

  // Distance estimation (simplified)
  // Glide ratio * cloudbase / 1000 + thermal assists
  const glideRatio = 8 // Typical paraglider
  distancePotential = (glideRatio * lcl.height) / 1000 + (thermal.strength * 10)

  // Confidence based on consistency and cloud base
  confidence = (thermal.consistency * 0.6) + (Math.min(lcl.height / 2000, 1) * 0.4)

  let rating: XCAnalysis["rating"]
  if (score > 80) rating = "excellent"
  else if (score > 60) rating = "good"
  else if (score > 40) rating = "fair"
  else if (score > 20) rating = "poor"
  else rating = "unsuitable"

  const recommendation =
    rating === "excellent"
      ? "Hervorragende XC-Bedingungen! Große Strecken möglich."
      : rating === "good"
      ? "Gute XC-Bedingungen für erfahrene Piloten."
      : rating === "fair"
      ? "XC möglich, aber anspruchsvoll."
      : "Nicht empfohlen für Streckenflüge."

  return {
    score,
    distance: {
      potential: Math.round(distancePotential),
      confidence: Math.round(confidence * 100) / 100,
    },
    conditions: {
      cloudbase: lcl.height,
      thermalStrength: thermal.strength,
      windSpeed: windProfile.avgSpeed,
      windDirection: windProfile.avgDirection,
    },
    rating,
    recommendation,
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Generate Professional Paragliding Analysis
 * 
 * Main entry point for flight weather analysis. Combines all meteorological
 * parameters, soaring conditions, XC potential, and risk assessment.
 * 
 * @param data Open-Meteo paragliding forecast data
 * @param index Hour index (0 = current/first hour)
 * @param location Location data (lat, lon, name)
 * @param launchOrientation Launch site facing direction in degrees (default: 270 = west)
 * @returns Complete paragliding analysis
 */
export function generateParaglidingAnalysis(
  data: OpenMeteoParaglidingResponse,
  index: number,
  location: { lat: number; lon: number; name: string },
  launchOrientation: number = 270
): ParaglidingAnalysis {
  const atmosphere = buildAtmosphericProfile(data, index, data.elevation)
  const soaring = analyzeSoaringConditions(atmosphere, launchOrientation)
  const xc = analyzeXCPotential(atmosphere)

  // Collect all risks
  const risks: RiskFactor[] = []
  
  const leeRisk = detectLeeRisk(
    atmosphere.windProfile.surface.speed,
    atmosphere.windProfile.surface.direction,
    launchOrientation
  )
  if (leeRisk) risks.push(leeRisk)

  const gustRisk = detectGustRisk(
    atmosphere.windProfile.surface.speed,
    data.hourly.wind_gusts_10m[index]
  )
  if (gustRisk) risks.push(gustRisk)

  const thermalTurbRisk = detectThermalTurbulence(atmosphere.thermal, atmosphere.cape.surface)
  if (thermalTurbRisk) risks.push(thermalTurbRisk)

  const shearRisk = detectWindShearRisk(atmosphere.windShear)
  if (shearRisk) risks.push(shearRisk)

  const warnings = generateFlightWarnings(atmosphere, risks)
  const safety = evaluateSafetyLevel(risks, atmosphere)

  // Determine pilot level recommendation
  let pilotLevel: ParaglidingAnalysis["recommendation"]["pilotLevel"] = "novice"
  let wingClass: ParaglidingAnalysis["recommendation"]["wingClass"] = "A"
  
  if (safety.score < 40 || risks.some(r => r.level === "extreme")) {
    pilotLevel = "expert"
    wingClass = "D"
  } else if (safety.score < 60 || atmosphere.windShear.level === "high") {
    pilotLevel = "advanced"
    wingClass = "C"
  } else if (safety.score < 75) {
    pilotLevel = "intermediate"
    wingClass = "B"
  }

  const details: string[] = []
  if (atmosphere.thermal.index > 5) details.push(`Thermik: ${atmosphere.thermal.strength} m/s`)
  if (soaring.ridge.suitable) details.push("Hangaufwind möglich")
  if (xc.rating === "excellent" || xc.rating === "good") details.push(`XC-Potential: ${xc.distance.potential} km`)

  const summary = generateRecommendationSummary(safety.level, atmosphere, xc)

  return {
    timestamp: data.hourly.time[index],
    location,
    suitability: safety.level,
    score: safety.score,
    confidence: 0.85,
    atmosphere,
    soaring,
    xc,
    risks,
    warnings,
    flyableWindows: [],
    recommendation: {
      summary,
      pilotLevel,
      wingClass,
      details,
    },
  }
}

/**
 * Generate recommendation summary text
 */
function generateRecommendationSummary(
  suitability: ParaglidingAnalysis["suitability"],
  atmosphere: AtmosphericProfile,
  xc: XCAnalysis
): string {
  if (suitability === "dangerous") {
    return "Nicht fliegen! Gefährliche Bedingungen."
  } else if (suitability === "poor") {
    return "Nur für sehr erfahrene Piloten bei vorsichtiger Beurteilung."
  } else if (suitability === "marginal") {
    return `Grenzwertige Bedingungen. ${atmosphere.thermal.index > 5 ? "Thermik vorhanden, aber" : ""} Vorsicht geboten.`
  } else if (suitability === "good") {
    return `Gute Flugbedingungen. ${xc.rating === "good" ? "XC möglich." : "Soaring empfohlen."}`
  } else {
    return `Optimale Bedingungen! ${xc.rating === "excellent" ? "Hervorragend für XC-Flüge." : "Perfekt zum Fliegen."}`
  }
}
