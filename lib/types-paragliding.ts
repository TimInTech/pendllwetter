/**
 * PROFESSIONAL PARAGLIDING WEATHER TYPES
 * Based on real meteorological parameters used by XC pilots, DHV, and professional flight weather services.
 */

// ============================================================================
// METEOROLOGICAL PARAMETERS
// ============================================================================

/**
 * Convective Available Potential Energy (CAPE)
 * Measures atmospheric instability and thermal potential
 * Unit: J/kg
 */
export interface CAPEData {
  surface: number // Surface-based CAPE
  mucape: number // Most Unstable CAPE
  sbcape: number // Surface-Based CAPE
  level: "none" | "weak" | "moderate" | "strong" | "extreme"
}

/**
 * Lifted Condensation Level (LCL) - Cloud Base
 * Unit: meters AGL (Above Ground Level)
 */
export interface LCLData {
  height: number // meters AGL
  temperature: number // °C at LCL
  pressure: number // hPa at LCL
  classification: "very_low" | "low" | "moderate" | "high" | "very_high"
}

/**
 * Level of Free Convection (LFC)
 * Height where thermals become self-sustaining
 * Unit: meters AGL
 */
export interface LFCData {
  height: number // meters AGL
  exists: boolean
  reachable: boolean // Based on current conditions
}

/**
 * Lifted Index (LI)
 * Stability indicator: negative = unstable (good for thermals)
 * Unit: °C
 */
export interface LiftedIndexData {
  value: number // °C
  level: "very_stable" | "stable" | "neutral" | "unstable" | "very_unstable"
}

/**
 * Wind Shear Analysis
 * Critical for turbulence and safety
 */
export interface WindShearData {
  shear_0_1km: number // m/s per km
  shear_1_3km: number // m/s per km
  shear_3_6km: number // m/s per km
  level: "low" | "moderate" | "high" | "severe"
  turbulencePotential: number // 0-10
}

/**
 * Thermal Analysis
 */
export interface ThermalData {
  strength: number // m/s average climb rate
  tops: number // meters AGL - thermal tops
  spacing: number // meters - average distance between thermals
  consistency: number // 0-1 (0=choppy, 1=smooth)
  index: number // 0-10 thermal index
}

/**
 * Wind Profile (at different altitudes)
 */
export interface WindProfile {
  surface: { speed: number; direction: number } // 10m
  boundary: { speed: number; direction: number } // 500m
  mid: { speed: number; direction: number } // 1500m
  high: { speed: number; direction: number } // 3000m
  avgSpeed: number
  avgDirection: number
  directionChange: number // degrees of veering
}

/**
 * Complete Atmospheric Sounding Profile
 */
export interface AtmosphericProfile {
  cape: CAPEData
  lcl: LCLData
  lfc: LFCData
  liftedIndex: LiftedIndexData
  windShear: WindShearData
  thermal: ThermalData
  windProfile: WindProfile
  dewpointSpread: number // T - Td in °C
  boundaryLayerHeight: number // meters
  inversionHeight: number | null // meters (null if none)
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export type RiskLevel = "minimal" | "low" | "moderate" | "high" | "extreme"
export type FlightSuitability = "optimal" | "good" | "marginal" | "poor" | "dangerous"

export interface RiskFactor {
  name: string
  level: RiskLevel
  score: number // 0-100
  description: string
  mitigation?: string
}

export interface FlightWarning {
  type: "wind" | "shear" | "thermal" | "weather" | "terrain" | "airspace"
  severity: "info" | "caution" | "warning" | "danger"
  message: string
  icon: string
}

// ============================================================================
// FLIGHT ANALYSIS
// ============================================================================

/**
 * Soaring Conditions (Ridge/Thermal/Wave)
 */
export interface SoaringAnalysis {
  ridge: {
    suitable: boolean
    windAngle: number // degrees relative to ridge
    liftPotential: number // 0-10
    conditions: string
  }
  thermal: {
    suitable: boolean
    strength: number // m/s
    tops: number // meters AGL
    consistency: number // 0-1
    conditions: string
  }
  wave: {
    possible: boolean
    amplitude: number // meters
    conditions: string
  }
}

/**
 * Cross-Country (XC) Flight Potential
 */
export interface XCAnalysis {
  score: number // 0-100
  distance: {
    potential: number // km achievable
    confidence: number // 0-1
  }
  conditions: {
    cloudbase: number // meters AGL
    thermalStrength: number // m/s
    windSpeed: number // km/h
    windDirection: number // degrees
  }
  rating: "excellent" | "good" | "fair" | "poor" | "unsuitable"
  recommendation: string
}

/**
 * Complete Flight Weather Analysis
 */
export interface ParaglidingAnalysis {
  timestamp: string
  location: { lat: number; lon: number; name: string }

  // Overall Assessment
  suitability: FlightSuitability
  score: number // 0-100
  confidence: number // 0-1

  // Meteorological Data
  atmosphere: AtmosphericProfile
  
  // Flight-Specific Analysis
  soaring: SoaringAnalysis
  xc: XCAnalysis

  // Risk Assessment
  risks: RiskFactor[]
  warnings: FlightWarning[]

  // Time Windows
  flyableWindows: {
    start: string
    end: string
    quality: "excellent" | "good" | "marginal"
  }[]

  // Recommendations
  recommendation: {
    summary: string
    pilotLevel: "novice" | "intermediate" | "advanced" | "expert"
    wingClass: "A" | "B" | "C" | "D"
    details: string[]
  }
}

// ============================================================================
// HOURLY FORECAST
// ============================================================================

export interface ParaglidingHourlyForecast {
  time: string
  analysis: ParaglidingAnalysis
  snapshot: {
    temp: number
    dewpoint: number
    windSpeed: number
    windDir: number
    gusts: number
    cape: number
    cloudbase: number
    thermalIndex: number
  }
}

// ============================================================================
// SPOT ANALYSIS
// ============================================================================

export interface LaunchSite {
  name: string
  lat: number
  lon: number
  elevation: number // meters MSL
  orientation: number // degrees (direction facing)
  suitableWindDirections: number[] // degrees
  difficulty: "beginner" | "intermediate" | "advanced" | "expert"
  features: {
    topLanding: boolean
    bottomLanding: boolean
    ridgeSoaring: boolean
    thermalSoaring: boolean
    crossCountry: boolean
  }
  restrictions?: {
    minPilotLevel: "A" | "B" | "C"
    maxWind: number // km/h
    timeRestrictions?: string
    airspace?: string
  }
}

export interface SpotAnalysis {
  site: LaunchSite
  current: {
    windAngle: number // degrees relative to launch
    suitability: FlightSuitability
    risks: string[]
    recommendation: string
  }
  forecast: ParaglidingHourlyForecast[]
  distance?: number // km from current location
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Open-Meteo Extended Forecast Response
 * Includes CAPE, boundary layer, and atmospheric parameters
 */
export interface OpenMeteoParaglidingResponse {
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  
  hourly: {
    time: string[]
    
    // Temperature & Moisture
    temperature_2m: number[]
    temperature_80m: number[]
    temperature_950hPa: number[]
    dewpoint_2m: number[]
    relative_humidity_2m: number[]
    
    // Wind Profile
    wind_speed_10m: number[]
    wind_speed_80m: number[]
    wind_speed_120m: number[]
    wind_direction_10m: number[]
    wind_direction_80m: number[]
    wind_direction_120m: number[]
    wind_gusts_10m: number[]
    
    // Atmospheric Stability
    cape: number[] // J/kg
    lifted_index: number[] // °C
    convective_inhibition: number[] // J/kg
    
    // Boundary Layer
    boundary_layer_height: number[] // meters
    
    // Clouds & Precipitation
    cloud_cover: number[] // %
    cloud_cover_low: number[] // %
    cloud_cover_mid: number[] // %
    cloud_cover_high: number[] // %
    precipitation: number[] // mm
    
    // Pressure
    surface_pressure: number[] // hPa
    pressure_msl: number[] // hPa
  }
}

/**
 * Windy API Response (prepared for integration)
 * TODO: Integrate Windy API for ECMWF/ICON layers
 */
export interface WindyForecastResponse {
  // To be implemented when Windy API key is available
  model: "ecmwf" | "gfs" | "icon"
  data: unknown
}

/**
 * DHV Flugwetter Response (prepared for integration)
 * TODO: Parse DHV HTML or use API if available
 */
export interface DHVFlugwetterResponse {
  region: string
  conditions: string
  warnings: string[]
  // To be extended based on DHV data structure
}
