"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Loader2,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Gauge,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  CloudMoon,
  AlertCircle,
  Eye,
  Compass,
  Bike,
  Wind as WindGlider,
} from "lucide-react"
import {
  fetchWeatherData,
  geocodeSearch,
  parseCurrentWeather,
  parseHourlyForecast,
  getRainPrediction,
  type GeoSearchResult,
} from "@/lib/weather-api"
import { getWindDirection, evaluateRideability } from "@/lib/rideability"
import { evaluateParaglidingConditions, calculateThermalIndex, estimateCloudBase } from "@/lib/paragliding"
import { useLocationStore } from "@/lib/location-store"
import { WeatherCard, WeatherCardHeader, WeatherCardContent } from "@/components/ui/weather-card"
import { HourlyTimeline } from "@/components/ui/hourly-timeline"
import { MetricsGrid, MetricTile, WindCompass, PressureGauge } from "@/components/ui/metrics-grid"
import { LocationSearch } from "@/components/ui/location-search"
import { ActivityPreviewCard } from "@/components/ui/activity-preview-card"
import type { Settings, CurrentWeather, HourlyForecast, WeatherSlot } from "@/lib/types"

interface NowViewProps {
  settings: Settings
  onNavigate?: (tab: string) => void
}

export function NowView({ settings, onNavigate }: NowViewProps) {
  const { location, isLoading: gpsLoading, error: locationError, updateFromGPS, updateManual, clearError } = useLocationStore()
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [rainPrediction, setRainPrediction] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commuteCheck, setCommuteCheck] = useState<{
    rideability: ReturnType<typeof evaluateRideability>
    shiftName: string
    direction: string
  } | null>(null)
  const [paraglidingCheck, setParaglidingCheck] = useState<{
    conditions: ReturnType<typeof evaluateParaglidingConditions>
  } | null>(null)

  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeatherData(lat, lon, true)
      const current = parseCurrentWeather(data)
      const hourly = parseHourlyForecast(data, 12)
      if (current) {
        setCurrentWeather(current)
        setHourlyForecast(hourly)
        setRainPrediction(getRainPrediction(hourly))
      }
      return { current, hourly }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Wetterdaten")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (location.lat !== null && location.lon !== null) {
      loadWeather(location.lat, location.lon)
    }
  }, [location.lat, location.lon, loadWeather])

  const getCurrentShift = useCallback(() => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (const shift of settings.shifts) {
      const [hinStartH, hinStartM] = shift.hinStart.split(":").map(Number)
      const [hinEndH, hinEndM] = shift.hinEnd.split(":").map(Number)
      const [rueckStartH, rueckStartM] = shift.rueckStart.split(":").map(Number)
      const [rueckEndH, rueckEndM] = shift.rueckEnd.split(":").map(Number)

      const hinStart = hinStartH * 60 + hinStartM
      const hinEnd = hinEndH * 60 + hinEndM
      const rueckStart = rueckStartH * 60 + rueckStartM
      const rueckEnd = rueckEndH * 60 + rueckEndM

      if (currentMinutes >= hinStart - 120 && currentMinutes <= hinEnd) {
        return { shift, direction: "Hinfahrt" }
      }
      if (currentMinutes >= rueckStart - 120 && currentMinutes <= rueckEnd) {
        return { shift, direction: "Rückfahrt" }
      }
    }
    if (settings.shifts.length > 0) {
      return { shift: settings.shifts[0], direction: "Hinfahrt" }
    }
    return null
  }, [settings.shifts])

  const handleCheckNow = async () => {
    clearError()
    setCommuteCheck(null)
    setParaglidingCheck(null)
    const gpsLocation = await updateFromGPS()
    const lat = gpsLocation?.lat ?? location.lat
    const lon = gpsLocation?.lon ?? location.lon

    if (lat == null || lon == null) return

    const weatherData = await loadWeather(lat, lon)
    const activeWeather = weatherData?.current ?? currentWeather
    const activeHourly = weatherData?.hourly ?? hourlyForecast

    if (lat && lon && activeWeather) {
      // Cycling check
      const shiftInfo = getCurrentShift()
      if (shiftInfo) {
        const slot: WeatherSlot = {
          datetime: new Date().toISOString(),
          date: new Date().toLocaleDateString("de-DE"),
          time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          temp: activeWeather.temp,
          feelsLike: activeWeather.feelsLike,
          pop: 0,
          rain: 0,
          windSpeed: activeWeather.windSpeed,
          windGust: activeWeather.windGust,
          windDeg: activeWeather.windDeg,
          clouds: activeWeather.clouds,
          description: activeWeather.description,
          weatherCode: activeWeather.weatherCode,
          type: shiftInfo.direction === "Hinfahrt" ? "hin" : "rueck",
          shiftName: shiftInfo.shift.name,
          model: "icon_d2",
        }
        const rideability = evaluateRideability(slot)
        setCommuteCheck({
          rideability,
          shiftName: shiftInfo.shift.name,
          direction: shiftInfo.direction,
        })
      }

      // Paragliding check
      if (activeHourly.length > 0) {
        const now = new Date()
        const thermalIndex = calculateThermalIndex(now.getHours(), activeWeather.temp, activeWeather.clouds)
        const cloudBase = estimateCloudBase(activeWeather.temp, activeWeather.humidity)
        const conditions = evaluateParaglidingConditions(activeHourly[0], thermalIndex, cloudBase)
        setParaglidingCheck({ conditions })
      }
    }
  }

  useEffect(() => {
    if (location.lat && location.lon && currentWeather && !commuteCheck) {
      const shiftInfo = getCurrentShift()
      if (shiftInfo) {
        const slot: WeatherSlot = {
          datetime: new Date().toISOString(),
          date: new Date().toLocaleDateString("de-DE"),
          time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          temp: currentWeather.temp,
          feelsLike: currentWeather.feelsLike,
          pop: 0,
          rain: 0,
          windSpeed: currentWeather.windSpeed,
          windGust: currentWeather.windGust,
          windDeg: currentWeather.windDeg,
          clouds: currentWeather.clouds,
          description: currentWeather.description,
          weatherCode: currentWeather.weatherCode,
          type: shiftInfo.direction === "Hinfahrt" ? "hin" : "rueck",
          shiftName: shiftInfo.shift.name,
          model: "icon_d2",
        }
        const rideability = evaluateRideability(slot)
        setCommuteCheck({
          rideability,
          shiftName: shiftInfo.shift.name,
          direction: shiftInfo.direction,
        })
      }
    }
  }, [commuteCheck, currentWeather, getCurrentShift, location])

  const getWeatherIcon = (code: number, isDay: boolean) => {
    if (code === 0) return isDay ? Sun : Moon
    if (code <= 3) return isDay ? CloudSun : CloudMoon
    if (code <= 48) return CloudFog
    if (code <= 57) return CloudDrizzle
    if (code <= 67) return CloudRain
    if (code <= 77) return CloudSnow
    if (code <= 82) return CloudRain
    if (code <= 86) return CloudSnow
    if (code >= 95) return CloudLightning
    return Cloud
  }

  const WeatherIconComponent = currentWeather ? getWeatherIcon(currentWeather.weatherCode, currentWeather.isDay) : Cloud

  const levelColors = {
    gut: "from-emerald-500 to-emerald-600",
    ok: "from-yellow-500 to-yellow-600",
    kritisch: "from-orange-500 to-orange-600",
    schlecht: "from-rose-500 to-rose-600",
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Section - Location & Current Weather */}
      {currentWeather && !loading && (
        <div className="text-center space-y-6">
          {/* Location Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">{location.cityLabel || "Standort"}</h2>
          </div>

          {/* Large Temperature Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              <WeatherIconComponent className="h-20 w-20 text-cyan-400" />
              <p className="text-7xl font-semibold text-white">{Math.round(currentWeather.temp)}°</p>
            </div>
            <p className="text-2xl text-white/90">{currentWeather.description}</p>
            <p className="text-lg text-white/70">
              Gefühlt {Math.round(currentWeather.feelsLike)}° · H: {Math.round(currentWeather.temp + 2)}° T: {Math.round(currentWeather.temp - 3)}°
            </p>
          </div>
        </div>
      )}

      {/* Location Search */}
      <WeatherCard>
        <LocationSearch />
      </WeatherCard>

      {/* GPS Check Button */}
      <Button
        onClick={handleCheckNow}
        disabled={gpsLoading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white min-h-[56px] text-lg font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
        size="lg"
      >
        {gpsLoading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Standort wird ermittelt...
          </>
        ) : (
          <>
            <span className="text-xl mr-3">📍</span>
            Standort per GPS ermitteln
          </>
        )}
      </Button>

      {/* Commute Check Result */}
      {commuteCheck && (
        <WeatherCard
          gradient
          className={`border-${commuteCheck.rideability.level === "gut" ? "emerald" : commuteCheck.rideability.level === "ok" ? "yellow" : commuteCheck.rideability.level === "kritisch" ? "orange" : "rose"}-500/30`}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">{commuteCheck.rideability.emoji}</span>
            <div className="flex-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                {commuteCheck.shiftName} - {commuteCheck.direction}
              </p>
              <p className="text-2xl font-bold text-white mt-1">{commuteCheck.rideability.label}</p>
              <p className="text-sm text-white/80 mt-1">{commuteCheck.rideability.advice}</p>
            </div>
          </div>
        </WeatherCard>
      )}

      {/* Error Messages */}
      {(error || locationError) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error || locationError}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {/* Hourly Timeline */}
      {hourlyForecast.length > 0 && !loading && (
        <WeatherCard>
          <WeatherCardHeader title="Nächste Stunden" />
          <HourlyTimeline forecast={hourlyForecast} />
          {rainPrediction && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 text-sm">{rainPrediction}</p>
            </div>
          )}
        </WeatherCard>
      )}

      {/* Metrics Grid */}
      {currentWeather && !loading && (
        <>
          <WeatherCard>
            <WeatherCardHeader title="Wetter-Details" />
            <MetricsGrid columns={2}>
              <MetricTile
                icon={<Wind className="h-5 w-5" />}
                label="Wind"
                subtitle={getWindDirection(currentWeather.windDeg)}
                value=""
              >
                <WindCompass direction={currentWeather.windDeg} speed={Math.round(currentWeather.windSpeed)} />
              </MetricTile>

              <MetricTile
                icon={<Gauge className="h-5 w-5" />}
                label="Luftdruck"
                subtitle="Aktueller Druck"
                value=""
              >
                <PressureGauge value={currentWeather.pressure} />
              </MetricTile>

              <MetricTile
                icon={<Droplets className="h-5 w-5" />}
                label="Luftfeuchtigkeit"
                value={currentWeather.humidity}
                unit="%"
              />

              <MetricTile
                icon={<Thermometer className="h-5 w-5" />}
                label="Taupunkt"
                subtitle="Kondensationspunkt"
                value={Math.round(currentWeather.temp - ((100 - currentWeather.humidity) / 5))}
                unit="°C"
              />

              <MetricTile
                icon={<Cloud className="h-5 w-5" />}
                label="Bewölkung"
                value={currentWeather.clouds}
                unit="%"
              />

              <MetricTile
                icon={<Eye className="h-5 w-5" />}
                label="Sichtweite"
                subtitle="Geschätzt"
                value={currentWeather.clouds < 30 ? ">10" : currentWeather.clouds < 70 ? "5-10" : "2-5"}
                unit="km"
              />
            </MetricsGrid>
          </WeatherCard>

          {/* Activity Previews */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white px-2">Deine Aktivitäten</h2>
            
            {commuteCheck && (
              <ActivityPreviewCard
                icon={<Bike className="h-6 w-6 text-cyan-400" />}
                title="Radfahren"
                subtitle={`${commuteCheck.shiftName} · ${commuteCheck.direction}`}
                status={{
                  emoji: commuteCheck.rideability.emoji,
                  label: commuteCheck.rideability.label,
                  level: commuteCheck.rideability.level as "gut" | "ok" | "kritisch" | "schlecht",
                }}
                onViewDetails={() => onNavigate?.("aktivitäten")}
              />
            )}

            {paraglidingCheck && (
              <ActivityPreviewCard
                icon={<WindGlider className="h-6 w-6 text-cyan-400" />}
                title="Paragliding"
                subtitle="Aktuelle Flugbedingungen"
                status={{
                  emoji: paraglidingCheck.conditions.emoji,
                  label: paraglidingCheck.conditions.label,
                  level: paraglidingCheck.conditions.level === "optimal" || paraglidingCheck.conditions.level === "gut"
                    ? "gut"
                    : paraglidingCheck.conditions.level === "grenzwertig"
                    ? "ok"
                    : paraglidingCheck.conditions.level === "schlecht"
                    ? "kritisch"
                    : "schlecht",
                }}
                onViewDetails={() => onNavigate?.("aktivitäten")}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
