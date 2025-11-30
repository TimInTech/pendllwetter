/**
 * PROFESSIONAL PARAGLIDING WEATHER ANALYSIS ENGINE
 * 
 * Based on real meteorological parameters used by:
 * - XC pilots and competition organizers
 * - DHV (Deutscher Hängegleiterverband)
 * - Windy.com professional layers
 * - Open-Meteo atmospheric models
 * 
 * This module provides expert-level flight weather analysis including:
 * - CAPE/LFC/LCL analysis
 * - Thermal strength and consistency
 * - Wind shear and turbulence detection
 * - Ridge/thermal/wave soaring conditions
 * - XC (cross-country) potential
 * - Risk assessment and warnings
 */

import type {
  OpenMeteoParaglidingResponse,
  ParaglidingAnalysis,
  ParaglidingHourlyForecast,
  AtmosphericProfile,
  CAPEData,
  LCLData,
  LFCData,
  LiftedIndexData,
  WindShearData,
  ThermalData,
  WindProfile,
  SoaringAnalysis,
  XCAnalysis,
  RiskFactor,
  FlightWarning,
  RiskLevel,
  FlightSuitability,
  LaunchSite,
  SpotAnalysis,
} from "./types-paragliding"

// ============================================================================
// METEOROLOGICAL CALCULATIONS
// ============================================================================

/**
 * Calculate dewpoint from temperature and relative humidity
 * Magnus-Tetens formula
 */
function calculateDewpoint(temp: number, rh: number): number {
  const a = 17.27
  const b = 237.7
  const alpha = ((a * temp) / (b + temp)) + Math.log(rh / 100)
  return (b * alpha) / (a - alpha)
}

/**
 * Calculate Lifted Condensation Level (LCL) - Cloud Base
 * 
 * Formula: LCL = 125 * (T - Td) meters AGL
 * Where T = temperature, Td = dewpoint
 * 
 * @param temp Temperature in °C
 * @param dewpoint Dewpoint in °C
 * @param elevation Ground elevation in meters MSL
 * @returns LCL data
 */
export function calculateLCL(temp: number, dewpoint: number, elevation: number = 0): LCLData {
  const spread = temp - dewpoint
  const heightAGL = spread * 125 // Classic formula: 125m per degree spread
  
  // Classification based on typical paragliding standards
  let classification: LCLData["classification"]
  if (heightAGL < 800) classification = "very_low"
  else if (heightAGL < 1200) classification = "low"
  else if (heightAGL < 1800) classification = "moderate"
  else if (heightAGL < 2500) classification = "high"
  else classification = "very_high"

  // Estimate temperature at LCL (dry adiabatic lapse rate: -9.8°C/km)
  const tempAtLCL = temp - (heightAGL / 1000) * 9.8
  
  // Estimate pressure at LCL
  const pressureAtLCL = 1013.25 * Math.pow((1 - (heightAGL + elevation) / 44330), 5.255)

  return {
    height: Math.round(heightAGL),
    temperature: Math.round(tempAtLCL * 10) / 10,
    pressure: Math.round(pressureAtLCL * 10) / 10,
    classification,
  }
}

/**
 * Analyze CAPE (Convective Available Potential Energy)
 * 
 * CAPE indicates potential thermal strength:
 * - 0-500 J/kg: Weak convection
 * - 500-1500 J/kg: Moderate thermals
 * - 1500-2500 J/kg: Strong thermals
 * - >2500 J/kg: Very strong (thunderstorm risk)
 * 
 * @param cape CAPE value in J/kg
 * @returns CAPE analysis
 */
export function analyzeCAPE(cape: number): CAPEData {
  let level: CAPEData["level"]
  
  if (cape < 100) level = "none"
  else if (cape < 500) level = "weak"
  else if (cape < 1500) level = "moderate"
  else if (cape < 2500) level = "strong"
  else level = "extreme"

  return {
    surface: cape,
    mucape: cape, // Simplified: use same value
    sbcape: cape,
    level,
  }
}

/**
 * Analyze Lifted Index (LI)
 * 
 * LI indicates atmospheric stability:
 * - LI > 0: Stable (poor thermals)
 * - LI 0 to -2: Slightly unstable
 * - LI -2 to -6: Unstable (good thermals)
 * - LI < -6: Very unstable (strong thermals, possible overdevelopment)
 * 
 * @param li Lifted Index in °C
 * @returns Lifted Index analysis
 */
export function analyzeLiftedIndex(li: number): LiftedIndexData {
  let level: LiftedIndexData["level"]
  
  if (li > 2) level = "very_stable"
  else if (li > 0) level = "stable"
  else if (li > -2) level = "neutral"
  else if (li > -6) level = "unstable"
  else level = "very_unstable"

  return {
    value: li,
    level,
  }
}

/**
 * Calculate Level of Free Convection (LFC)
 * 
 * LFC is the height where thermals become self-sustaining
 * Simplified calculation based on CAPE and LCL
 * 
 * @param cape CAPE value
 * @param lcl LCL height
 * @param boundaryLayerHeight Boundary layer height in meters
 * @returns LFC data
 */
export function calculateLFC(
  cape: number,
  lcl: number,
  boundaryLayerHeight: number
): LFCData {
  const exists = cape > 200 // Need minimum CAPE for free convection
  
  // LFC is typically above LCL but below boundary layer top in good conditions
  const heightEstimate = exists ? Math.min(lcl + 300, boundaryLayerHeight) : 0
  
  // Reachable if within reasonable glide from typical launch heights (500-1000m)
  const reachable = exists && heightEstimate < 1500

  return {
    height: Math.round(heightEstimate),
    exists,
    reachable,
  }
}

/**
 * Calculate Wind Shear
 * 
 * Wind shear indicates turbulence potential
 * Critical for safety assessment
 * 
 * @param windProfile Wind speeds at different altitudes
 * @returns Wind shear analysis
 */
export function calculateWindShear(windProfile: WindProfile): WindShearData {
  // Calculate shear in different layers
  const shear_0_1km = Math.abs(windProfile.boundary.speed - windProfile.surface.speed)
  const shear_1_3km = Math.abs(windProfile.high.speed - windProfile.mid.speed) / 2
  const shear_3_6km = 0 // Not typically relevant for paragliding

  // Maximum shear determines level
  const maxShear = Math.max(shear_0_1km, shear_1_3km)
  
  let level: WindShearData["level"]
  if (maxShear < 5) level = "low"
  else if (maxShear < 10) level = "moderate"
  else if (maxShear < 15) level = "high"
  else level = "severe"

  // Turbulence potential (0-10 scale)
  const turbulencePotential = Math.min(10, Math.round((maxShear / 15) * 10))

  return {
    shear_0_1km: Math.round(shear_0_1km * 10) / 10,
    shear_1_3km: Math.round(shear_1_3km * 10) / 10,
    shear_3_6km: Math.round(shear_3_6km * 10) / 10,
    level,
    turbulencePotential,
  }
}

/**
 * Analyze Thermal Conditions
 * 
 * Estimates thermal strength, tops, and consistency
 * Based on CAPE, LCL, boundary layer height, and time of day
 * 
 * @param cape CAPE value
 * @param lcl Cloud base height
 * @param boundaryLayerHeight BLH in meters
 * @param hour Hour of day (0-23)
 * @param temp Surface temperature
 * @returns Thermal analysis
 */
export function analyzeThermalConditions(
  cape: number,
  lcl: number,
  boundaryLayerHeight: number,
  hour: number,
  temp: number
): ThermalData {
  // Thermal strength estimation from CAPE
  // Formula: climb rate (m/s) ≈ sqrt(2 * CAPE / 1000)
  let strength = Math.sqrt((2 * cape) / 1000)
  
  // Time of day factor (thermals peak 12:00-16:00)
  let timeFactor = 0
  if (hour >= 10 && hour <= 17) {
    // Bell curve centered at 14:00
    timeFactor = Math.sin(((hour - 10) / 7) * Math.PI)
  }
  strength *= timeFactor

  // Temperature boost
  if (temp > 20) strength *= 1.1
  if (temp > 25) strength *= 1.2

  // Thermal tops are typically at cloud base or boundary layer top
  const tops = Math.min(lcl, boundaryLayerHeight)

  // Spacing estimation (km between thermals)
  // Rule of thumb: spacing ≈ 1.5 * thermal top height (in km)
  const spacing = (tops / 1000) * 1.5 * 1000

  // Consistency (0-1): higher with moderate CAPE, lower with extreme CAPE
  let consistency = 0.5
  if (cape > 500 && cape < 1500) consistency = 0.8
  else if (cape > 1500 && cape < 2500) consistency = 0.6
  else if (cape > 2500) consistency = 0.3

  // Thermal index (0-10)
  let index = 0
  if (strength > 0.5) index = 3
  if (strength > 1.0) index = 5
  if (strength > 1.5) index = 7
  if (strength > 2.0) index = 9
  if (strength > 2.5 && consistency > 0.5) index = 10

  return {
    strength: Math.round(strength * 10) / 10,
    tops: Math.round(tops),
    spacing: Math.round(spacing),
    consistency: Math.round(consistency * 10) / 10,
    index,
  }
}

/**
 * Build Wind Profile from Open-Meteo data
 * 
 * @param hourlyData Hour data from API
 * @param index Array index
 * @returns Wind profile at different altitudes
 */
export function buildWindProfile(
  hourlyData: OpenMeteoParaglidingResponse["hourly"],
  index: number
): WindProfile {
  const surface = {
    speed: hourlyData.wind_speed_10m[index] || 0,
    direction: hourlyData.wind_direction_10m[index] || 0,
  }

  const boundary = {
    speed: hourlyData.wind_speed_80m[index] || surface.speed * 1.2,
    direction: hourlyData.wind_direction_80m[index] || surface.direction,
  }

  const mid = {
    speed: hourlyData.wind_speed_120m[index] || surface.speed * 1.4,
    direction: hourlyData.wind_direction_120m[index] || surface.direction,
  }

  // Estimate high altitude (3000m) - typically 1.8x surface wind
  const high = {
    speed: surface.speed * 1.8,
    direction: surface.direction + 20, // Typical veering
  }

  const avgSpeed = (surface.speed + boundary.speed + mid.speed) / 3
  const avgDirection = (surface.direction + boundary.direction + mid.direction) / 3
  const directionChange = Math.abs(high.direction - surface.direction)

  return {
    surface,
    boundary,
    mid,
    high,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    avgDirection: Math.round(avgDirection),
    directionChange: Math.round(directionChange),
  }
}

// ============================================================================
// FLIGHT ANALYSIS
// ============================================================================

/**
 * Analyze Soaring Conditions (Ridge/Thermal/Wave)
 * 
 * @param windProfile Wind at different altitudes
 * @param thermal Thermal analysis
 * @param launchOrientation Launch site orientation in degrees
 * @returns Soaring analysis
 */
export function analyzeSoaringConditions(
  windProfile: WindProfile,
  thermal: ThermalData,
  launchOrientation: number = 270 // Default: west-facing
): SoaringAnalysis {
  // Ridge soaring analysis
  const windAngle = Math.abs(
    ((windProfile.surface.direction - launchOrientation + 180) % 360) - 180
  )
  const ridgeSuitable = windAngle < 45 && windProfile.surface.speed > 10 && windProfile.surface.speed < 35
  const liftPotential = ridgeSuitable ? Math.min(10, Math.round((windProfile.surface.speed / 25) * 10)) : 0

  let ridgeConditions = ""
  if (ridgeSuitable) {
    ridgeConditions = `Gute Hangaufwinde bei ${Math.round(windProfile.surface.speed)} km/h ${getWindDirection(windProfile.surface.direction)}`
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
 * @param thermal Thermal conditions
 * @param windProfile Wind profile
 * @param cloudbase Cloud base height
 * @returns XC analysis
 */
export function analyzeXCPotential(
  thermal: ThermalData,
  windProfile: WindProfile,
  cloudbase: number
): XCAnalysis {
  let score = 0
  let distancePotential = 0
  let confidence = 0

  // Score factors
  if (thermal.strength > 1.5) score += 30
  else if (thermal.strength > 1.0) score += 20
  else if (thermal.strength > 0.5) score += 10

  if (cloudbase > 1800) score += 25
  else if (cloudbase > 1400) score += 15
  else if (cloudbase > 1000) score += 5

  if (windProfile.avgSpeed < 25) score += 20
  else if (windProfile.avgSpeed < 35) score += 10

  if (thermal.consistency > 0.7) score += 25
  else if (thermal.consistency > 0.5) score += 15

  // Distance estimation (simplified)
  // Glide ratio * cloudbase / 1000 + thermal assists
  const glideRatio = 8 // Typical paraglider
  distancePotential = (glideRatio * cloudbase) / 1000 + (thermal.strength * 10)

  // Confidence based on consistency and cloud base
  confidence = (thermal.consistency * 0.6) + (Math.min(cloudbase / 2000, 1) * 0.4)

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
      cloudbase,
      thermalStrength: thermal.strength,
      windSpeed: windProfile.avgSpeed,
      windDirection: windProfile.avgDirection,
    },
    rating,
    recommendation,
  }
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Detect Lee-Side Turbulence Risk
 * 
 * @param windSpeed Surface wind speed
 * @param windDirection Wind direction
 * @param launchOrientation Launch site orientation
 * @returns Risk factor
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
 * @param avgWind Average wind speed
 * @param gustSpeed Gust speed
 * @returns Risk factor
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
 * @param thermal Thermal data
 * @param cape CAPE value
 * @returns Risk factor
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
 * @param windShear Wind shear data
 * @returns Risk factor
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

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

/**
 * Build complete atmospheric profile from API data
 * 
 * @param data Open-Meteo paragliding response
 * @param index Hour index
 * @param elevation Ground elevation
 * @returns Atmospheric profile
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

/**
 * Generate flight warnings based on conditions
 * 
 * @param atmosphere Atmospheric profile
 * @param risks Risk factors
 * @returns Array of warnings
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
 * Evaluate overall safety level
 * 
 * @param risks Risk factors
 * @param atmosphere Atmospheric profile
 * @returns Safety level and score
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

/**
 * Generate comprehensive paragliding analysis
 * 
 * @param data Open-Meteo response
 * @param index Hour index
 * @param location Location data
 * @param launchOrientation Launch site orientation (default: 270° = west)
 * @returns Complete analysis
 */
export function generateParaglidingAnalysis(
  data: OpenMeteoParaglidingResponse,
  index: number,
  location: { lat: number; lon: number; name: string },
  launchOrientation: number = 270
): ParaglidingAnalysis {
  const atmosphere = buildAtmosphericProfile(data, index, data.elevation)
  const soaring = analyzeSoaringConditions(atmosphere.windProfile, atmosphere.thermal, launchOrientation)
  const xc = analyzeXCPotential(atmosphere.thermal, atmosphere.windProfile, atmosphere.lcl.height)

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

  return {
    timestamp: data.hourly.time[index],
    location,
    suitability: safety.level,
    score: safety.score,
    confidence: 0.85, // Based on data quality
    atmosphere,
    soaring,
    xc,
    risks,
    warnings,
    flyableWindows: [], // TODO: Calculate from hourly data
    recommendation: {
      summary: generateRecommendationSummary(safety.level, atmosphere, xc),
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
  suitability: FlightSuitability,
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

/**
 * Helper: Get wind direction as compass point
 */
function getWindDirection(degrees: number): string {
  const directions = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const index = Math.round((degrees % 360) / 22.5) % 16
  return directions[index]
}

// ============================================================================
// KNOWN LAUNCH SITES (Germany - Paragliding Hotspots)
// ============================================================================

export const LAUNCH_SITES: LaunchSite[] = [
  {
    name: "Ascheloh",
    lat: 51.8833,
    lon: 8.9167,
    elevation: 280,
    orientation: 270, // West
    suitableWindDirections: [240, 270, 300],
    difficulty: "intermediate",
    features: {
      topLanding: true,
      bottomLanding: true,
      ridgeSoaring: true,
      thermalSoaring: true,
      crossCountry: true,
    },
    restrictions: {
      minPilotLevel: "B",
      maxWind: 30,
    },
  },
  {
    name: "Willingen (Ettelsberg)",
    lat: 51.2944,
    lon: 8.6167,
    elevation: 838,
    orientation: 310, // NW
    suitableWindDirections: [270, 300, 330],
    difficulty: "intermediate",
    features: {
      topLanding: true,
      bottomLanding: true,
      ridgeSoaring: true,
      thermalSoaring: true,
      crossCountry: true,
    },
    restrictions: {
      minPilotLevel: "B",
      maxWind: 35,
      airspace: "Achtung Luftraum D",
    },
  },
  {
    name: "Wasserkuppe",
    lat: 50.4978,
    lon: 9.9450,
    elevation: 950,
    orientation: 270, // West
    suitableWindDirections: [240, 270, 300, 330],
    difficulty: "beginner",
    features: {
      topLanding: true,
      bottomLanding: true,
      ridgeSoaring: true,
      thermalSoaring: true,
      crossCountry: true,
    },
    restrictions: {
      minPilotLevel: "A",
      maxWind: 30,
      timeRestrictions: "Kein Nachtflug",
    },
  },
  {
    name: "Tegelberg",
    lat: 47.5556,
    lon: 10.7556,
    elevation: 1720,
    orientation: 210, // SW
    suitableWindDirections: [180, 210, 240],
    difficulty: "advanced",
    features: {
      topLanding: false,
      bottomLanding: true,
      ridgeSoaring: true,
      thermalSoaring: true,
      crossCountry: true,
    },
    restrictions: {
      minPilotLevel: "B",
      maxWind: 25,
      airspace: "TMZ Füssen beachten",
    },
  },
]

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
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
 * Find nearby launch sites
 * 
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param maxDistance Maximum distance in km
 * @returns Sorted array of launch sites
 */
export function findNearbyLaunchSites(
  currentLat: number,
  currentLon: number,
  maxDistance: number = 100
): LaunchSite[] {
  return LAUNCH_SITES.map((site) => ({
    ...site,
    distance: calculateDistance(currentLat, currentLon, site.lat, site.lon),
  }))
    .filter((site) => site.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!) as LaunchSite[]
}
