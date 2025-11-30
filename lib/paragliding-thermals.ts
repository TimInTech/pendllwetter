/**
 * PARAGLIDING THERMAL ANALYSIS
 * 
 * CAPE, LCL, LFC, Lifted Index calculations and thermal strength estimation
 */

import type {
  CAPEData,
  LCLData,
  LFCData,
  LiftedIndexData,
  ThermalData,
} from "./types-paragliding"

/**
 * Calculate Lifted Condensation Level (LCL) - Cloud Base
 * 
 * Formula: LCL = 125 * (T - Td) meters AGL
 * Where T = temperature (°C), Td = dewpoint (°C)
 * 
 * @param temp Surface temperature in °C
 * @param dewpoint Dewpoint temperature in °C
 * @param elevation Ground elevation in meters MSL (default: 0)
 * @returns LCL data with height (m AGL), temperature (°C), pressure (hPa), classification
 */
export function calculateLCL(temp: number, dewpoint: number, elevation: number = 0): LCLData {
  const spread = temp - dewpoint // °C
  const heightAGL = spread * 125 // meters AGL - classic formula
  
  // Classification based on typical paragliding standards
  let classification: LCLData["classification"]
  if (heightAGL < 800) classification = "very_low"
  else if (heightAGL < 1200) classification = "low"
  else if (heightAGL < 1800) classification = "moderate"
  else if (heightAGL < 2500) classification = "high"
  else classification = "very_high"

  // Estimate temperature at LCL (dry adiabatic lapse rate: -9.8°C/km)
  const tempAtLCL = temp - (heightAGL / 1000) * 9.8
  
  // Estimate pressure at LCL (barometric formula)
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
 * @param cape CAPE value in J/kg (Joules per kilogram)
 * @returns CAPE analysis with classification
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
 * LFC is the height where thermals become self-sustaining.
 * Simplified calculation based on CAPE and LCL.
 * 
 * @param cape CAPE value in J/kg
 * @param lcl LCL height in meters AGL
 * @param boundaryLayerHeight Boundary layer height in meters AGL
 * @returns LFC data with height (m AGL), existence, reachability
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
 * Analyze Thermal Conditions
 * 
 * Estimates thermal strength, tops, and consistency based on CAPE, LCL,
 * boundary layer height, and time of day.
 * 
 * @param cape CAPE value in J/kg
 * @param lcl Cloud base height in meters AGL
 * @param boundaryLayerHeight BLH in meters AGL
 * @param hour Hour of day (0-23)
 * @param temp Surface temperature in °C
 * @returns Thermal analysis with strength (m/s), tops (m), spacing (m), consistency (0-1), index (0-10)
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
  let strength = Math.sqrt((2 * cape) / 1000) // m/s
  
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
  const tops = Math.min(lcl, boundaryLayerHeight) // meters AGL

  // Spacing estimation (km between thermals)
  // Rule of thumb: spacing ≈ 1.5 * thermal top height (in km)
  const spacing = (tops / 1000) * 1.5 * 1000 // meters

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
