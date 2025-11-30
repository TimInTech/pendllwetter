/**
 * PARAGLIDING ATMOSPHERIC PROFILE
 * 
 * Wind profile analysis and atmospheric sounding calculations
 */

import type {
  WindProfile,
  WindShearData,
  OpenMeteoParaglidingResponse,
} from "./types-paragliding"

/**
 * Build Wind Profile from Open-Meteo data
 * 
 * Creates multi-layer wind analysis from surface to estimated high altitude.
 * 
 * @param hourlyData Open-Meteo hourly forecast data
 * @param index Array index for specific hour
 * @returns Wind profile with speed (km/h) and direction (degrees) at multiple altitudes
 */
export function buildWindProfile(
  hourlyData: OpenMeteoParaglidingResponse["hourly"],
  index: number
): WindProfile {
  const surface = {
    speed: hourlyData.wind_speed_10m[index] || 0, // km/h at 10m
    direction: hourlyData.wind_direction_10m[index] || 0, // degrees
  }

  const boundary = {
    speed: hourlyData.wind_speed_80m[index] || surface.speed * 1.2, // km/h at 80m
    direction: hourlyData.wind_direction_80m[index] || surface.direction,
  }

  const mid = {
    speed: hourlyData.wind_speed_120m[index] || surface.speed * 1.4, // km/h at 120m
    direction: hourlyData.wind_direction_120m[index] || surface.direction,
  }

  // Estimate high altitude (3000m) - typically 1.8x surface wind
  const high = {
    speed: surface.speed * 1.8, // km/h at ~3000m
    direction: surface.direction + 20, // degrees - typical veering
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

/**
 * Calculate Wind Shear
 * 
 * Wind shear indicates turbulence potential - critical for flight safety.
 * Measures change in wind speed over altitude.
 * 
 * @param windProfile Wind speeds at different altitudes
 * @returns Wind shear analysis with turbulence potential (0-10 scale)
 */
export function calculateWindShear(windProfile: WindProfile): WindShearData {
  // Calculate shear in different layers (m/s per km)
  const shear_0_1km = Math.abs(windProfile.boundary.speed - windProfile.surface.speed) / 3.6 // Convert km/h to m/s
  const shear_1_3km = Math.abs(windProfile.high.speed - windProfile.mid.speed) / 2 / 3.6
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
 * Helper: Convert wind direction degrees to compass label
 * 
 * @param degrees Wind direction (0-360°, 0=North)
 * @returns Compass point (N, NNO, NO, etc.)
 */
export function getWindDirection(degrees: number): string {
  const directions = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const index = Math.round((degrees % 360) / 22.5) % 16
  return directions[index]
}
