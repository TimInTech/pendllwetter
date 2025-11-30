"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle, Wind, Mountain, TrendingUp, MapPin } from "lucide-react"
import { useLocationStore } from "@/lib/location-store"
import { fetchMergedParaglidingData } from "@/lib/weather-api"
import { findNearbyLaunchSites } from "@/lib/paragliding-analysis"
import { generateMultiProfileForecast, FORECAST_PROFILES, type ForecastProfile, getProfileSummary } from "@/lib/paragliding-forecast-profiles"
import { WeatherCard, WeatherCardHeader } from "@/components/ui/weather-card"
import { ParaglidingScoreCardPro } from "@/components/ui/paragliding-score-card-pro"
import { ParaglidingParameterMatrix } from "@/components/ui/paragliding-parameter-matrix"
import { SpotList } from "@/components/ui/spot-list"
import { LocationSearch } from "@/components/ui/location-search"
import type { ParaglidingAnalysis, ParaglidingHourlyForecast, LaunchSite, OpenMeteoParaglidingResponse } from "@/lib/types-paragliding"

export function ParaglidingViewPro() {
  const { location } = useLocationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<ForecastProfile>("3h")
  const [profileAnalyses, setProfileAnalyses] = useState<Record<ForecastProfile, ParaglidingAnalysis> | null>(null)
  const [hourlyForecasts, setHourlyForecasts] = useState<ParaglidingHourlyForecast[]>([])
  const [nearbySpots, setNearbySpots] = useState<LaunchSite[]>([])

  const loadParaglidingData = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)

    try {
      const data: OpenMeteoParaglidingResponse = await fetchMergedParaglidingData(lat, lon)

      if (!data.hourly || data.hourly.time.length === 0) {
        throw new Error("Keine Daten verfügbar")
      }

      // Generate multi-profile analyses
      const profiles = generateMultiProfileForecast(
        data,
        { lat, lon, name: location.cityLabel || "Aktueller Standort" },
        270
      )
      setProfileAnalyses(profiles)

      // Generate hourly forecasts for timeline (next 12h)
      const forecasts: ParaglidingHourlyForecast[] = []
      const now = new Date()

      for (let i = 0; i < Math.min(12, data.hourly.time.length); i++) {
        const hourTime = new Date(data.hourly.time[i])
        if (hourTime < now) continue

        forecasts.push({
          time: data.hourly.time[i],
          analysis: profiles["3h"], // Use short-term profile for hourly
          snapshot: {
            temp: data.hourly.temperature_2m[i],
            dewpoint: data.hourly.dewpoint_2m[i],
            windSpeed: data.hourly.wind_speed_10m[i],
            windDir: data.hourly.wind_direction_10m[i],
            gusts: data.hourly.wind_gusts_10m[i],
            cape: data.hourly.cape[i] || 0,
            cloudbase: profiles["3h"].atmosphere.lcl.height,
            thermalIndex: profiles["3h"].atmosphere.thermal.index,
          },
        })
      }

      setHourlyForecasts(forecasts)

      const spots = findNearbyLaunchSites(lat, lon, 100)
      setNearbySpots(spots)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Flugwetterdaten")
      console.error("Paragliding data error:", err)
    } finally {
      setLoading(false)
    }
  }, [location.cityLabel])

  useEffect(() => {
    if (location.lat !== null && location.lon !== null) {
      loadParaglidingData(location.lat, location.lon)
    }
  }, [location.lat, location.lon, loadParaglidingData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-white/70">Lade Flugwetter-Analyse...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Fehler</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!location.lat || !location.lon) {
    return (
      <div className="p-8 text-center space-y-4">
        <Wind className="h-12 w-12 mx-auto mb-4 text-cyan-400 opacity-50" />
        <p className="text-white/70 mb-2">Kein Standort verfügbar</p>
        <p className="text-sm text-white/50 mb-4">PLZ oder Ort eingeben:</p>
        <div className="max-w-md mx-auto">
          <LocationSearch />
        </div>
      </div>
    )
  }

  const currentAnalysis = profileAnalyses?.[selectedProfile]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Location Search */}
      <div className="text-center mb-6 space-y-4">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Mountain className="h-8 w-8 text-cyan-400" />
          Professionelles Flugwetter
        </h2>
        <div className="flex items-center justify-center gap-2 text-white/70">
          <MapPin className="h-4 w-4" />
          <p>{location.cityLabel || "Aktueller Standort"}</p>
        </div>
        <div className="max-w-md mx-auto">
          <LocationSearch placeholder="Anderen Ort suchen..." />
        </div>
        <p className="text-xs text-white/50">Basierend auf CAPE, LCL, LFC, LI & Windprofil</p>
      </div>

      {/* Forecast Profile Toggle */}
      <div className="flex justify-center gap-2 mb-6">
        {(Object.keys(FORECAST_PROFILES) as ForecastProfile[]).map((profileId) => {
          const profile = FORECAST_PROFILES[profileId]
          const isActive = selectedProfile === profileId
          
          return (
            <button
              key={profileId}
              onClick={() => setSelectedProfile(profileId)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50"
                  : "bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-bold">{profile.label}</div>
                <div className="text-xs opacity-70">{profile.description}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Profile Summary */}
      {currentAnalysis && profileAnalyses && (
        <div className="text-center text-sm text-cyan-400 mb-4">
          {getProfileSummary(selectedProfile, currentAnalysis)}
        </div>
      )}

      {/* Current Analysis */}
      {currentAnalysis && <ParaglidingScoreCardPro analysis={currentAnalysis} />}

      {/* Parameter Matrix */}
      {hourlyForecasts.length > 0 && <ParaglidingParameterMatrix forecasts={hourlyForecasts} />}

      {/* Launch Sites */}
      {nearbySpots.length > 0 && (
        <WeatherCard>
          <WeatherCardHeader
            title="Fluggebiete in der Nähe"
            subtitle={`${nearbySpots.length} Spot${nearbySpots.length !== 1 ? "s" : ""} gefunden`}
            icon={<Mountain className="h-5 w-5" />}
          />
          <SpotList spots={nearbySpots} />
        </WeatherCard>
      )}

      {/* API Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Datenquellen & Integration
        </h4>
        <p className="text-xs text-blue-300/80 leading-relaxed mb-2">
          <strong>Aktuell:</strong> Open-Meteo API (CAPE, Lifted Index, Boundary Layer, Windprofil)
        </p>
        <p className="text-xs text-blue-300/80 leading-relaxed">
          <strong>Geplant:</strong> Windy ECMWF/ICON Layer, DHV Flugwetter, Lokale Wetterstationen
        </p>
        <p className="text-xs text-cyan-400 mt-2">
          → Siehe <code className="bg-white/10 px-1 rounded">lib/weather-api.ts</code> für API-Integration
        </p>
      </div>

      {/* Safety Disclaimer */}
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-xs text-red-300 leading-relaxed">
          <strong>⚠️ Wichtiger Hinweis:</strong> Diese Analyse ist ein Planungstool. Vor dem Start immer:
          aktuelle Vor-Ort-Bedingungen prüfen, DHV-Geländeinfos lesen, Luftraum checken (NOTAM), eigene
          Fähigkeiten realistisch einschätzen. Flugwetter kann sich schnell ändern!
        </p>
      </div>
    </div>
  )
}
