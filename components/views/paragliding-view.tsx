"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle, Wind } from "lucide-react"
import { useLocationStore } from "@/lib/location-store"
import { fetchWeatherData, parseHourlyForecast } from "@/lib/weather-api"
import { WeatherCard, WeatherCardHeader } from "@/components/ui/weather-card"
import { ParaglidingScoreCard } from "@/components/ui/paragliding-score-card"
import { ParaglidingTimeline } from "@/components/ui/paragliding-timeline"
import { SpotList } from "@/components/ui/spot-list"
import {
  evaluateParaglidingConditions,
  calculateThermalIndex,
  estimateCloudBase,
  findNearbySpots,
  type ParaglidingHourlySlot,
  type ParaglidingSpot,
} from "@/lib/paragliding"

export function ParaglidingView() {
  const { location } = useLocationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConditions, setCurrentConditions] = useState<ParaglidingHourlySlot | null>(null)
  const [hourlySlots, setHourlySlots] = useState<ParaglidingHourlySlot[]>([])
  const [nearbySpots, setNearbySpots] = useState<ParaglidingSpot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<ParaglidingHourlySlot | null>(null)

  const loadParaglidingData = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch weather data
      const data = await fetchWeatherData(lat, lon, true)
      const hourlyForecast = parseHourlyForecast(data, 12)

      if (!data.current) {
        throw new Error("Keine aktuellen Wetterdaten verfügbar")
      }

      // Generate paragliding slots
      const slots: ParaglidingHourlySlot[] = hourlyForecast.map((hour, idx) => {
        const time = new Date(hour.time)
        const hourOfDay = time.getHours()

        // Mock data that would come from specialized APIs
        const thermalIndex = calculateThermalIndex(hourOfDay, hour.temp, 50)
        const cloudBase = estimateCloudBase(hour.temp, 70) // Mock humidity

        const conditions = evaluateParaglidingConditions(hour, thermalIndex, cloudBase)

        return {
          time: hour.time,
          conditions,
          weather: {
            temp: hour.temp,
            windSpeed: hour.windSpeed,
            windDir: data.hourly.wind_direction_10m[idx] || 0,
            gusts: data.hourly.wind_gusts_10m[idx] || hour.windSpeed * 1.4,
            rain: hour.rain,
            clouds: data.hourly.cloud_cover[idx] || 50,
            thermalIndex,
            cloudBase,
          },
        }
      })

      // Set current conditions (first slot)
      if (slots.length > 0) {
        setCurrentConditions(slots[0])
      }

      setHourlySlots(slots)

      // Find nearby spots
      const spots = findNearbySpots(lat, lon, 100)
      setNearbySpots(spots)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Flugwetterdaten")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (location.lat !== null && location.lon !== null) {
      loadParaglidingData(location.lat, location.lon)
    }
  }, [location.lat, location.lon, loadParaglidingData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
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
      <div className="p-8 text-center">
        <Wind className="h-12 w-12 mx-auto mb-4 text-cyan-400 opacity-50" />
        <p className="text-white/70 mb-2">Kein Standort verfügbar</p>
        <p className="text-sm text-white/50">Bitte wähle einen Standort aus, um Flugwetter anzuzeigen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero: Current Conditions */}
      {currentConditions && (
        <div>
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Gleitschirmwetter</h2>
            <p className="text-white/70">{location.cityLabel || "Aktueller Standort"}</p>
          </div>

          <ParaglidingScoreCard
            conditions={currentConditions.conditions}
            time="Jetzt"
          />
        </div>
      )}

      {/* Hourly Timeline */}
      {hourlySlots.length > 0 && (
        <WeatherCard>
          <WeatherCardHeader title="Nächste 12 Stunden" subtitle="Flugbedingungen im Verlauf" />
          <ParaglidingTimeline
            slots={hourlySlots}
            onSlotClick={(slot) => setSelectedSlot(slot)}
          />
        </WeatherCard>
      )}

      {/* Selected Slot Detail */}
      {selectedSlot && (
        <WeatherCard>
          <WeatherCardHeader
            title={`Details: ${new Date(selectedSlot.time).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
          />
          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Wind" value={`${Math.round(selectedSlot.weather.windSpeed)} km/h`} />
            <DetailItem
              label="Windrichtung"
              value={getWindDirection(selectedSlot.weather.windDir)}
            />
            <DetailItem label="Böen" value={`${Math.round(selectedSlot.weather.gusts)} km/h`} />
            <DetailItem label="Temperatur" value={`${Math.round(selectedSlot.weather.temp)}°C`} />
            <DetailItem
              label="Wolkenbasis"
              value={`${selectedSlot.weather.cloudBase}m AGL`}
            />
            <DetailItem
              label="Thermik-Index"
              value={`${selectedSlot.weather.thermalIndex}/10`}
            />
            <DetailItem label="Bewölkung" value={`${selectedSlot.weather.clouds}%`} />
            <DetailItem
              label="Niederschlag"
              value={selectedSlot.weather.rain > 0 ? `${selectedSlot.weather.rain.toFixed(1)}mm` : "Trocken"}
            />
          </div>
        </WeatherCard>
      )}

      {/* Nearby Flying Sites */}
      {nearbySpots.length > 0 && (
        <WeatherCard>
          <WeatherCardHeader
            title="Fluggebiete in der Nähe"
            subtitle={`${nearbySpots.length} Spot${nearbySpots.length !== 1 ? "s" : ""} gefunden`}
          />
          <SpotList spots={nearbySpots} />
        </WeatherCard>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <p className="text-xs text-blue-300 leading-relaxed">
          <strong>Hinweis:</strong> Diese Flugwetter-Prognose basiert auf allgemeinen Wetterdaten.
          Für präzise Thermik- und Aufwind-Vorhersagen empfehlen wir die Integration von
          spezialisierten APIs wie{" "}
          <a
            href="https://www.dhv.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-200"
          >
            DHV-Wetter
          </a>
          ,{" "}
          <a
            href="https://www.windy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-200"
          >
            Windy
          </a>
          {" "}oder{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-200"
          >
            Open-Meteo CAPE-Modelle
          </a>
          .
        </p>
      </div>
    </div>
  )
}

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function getWindDirection(deg: number): string {
  const directions = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"]
  const index = Math.round(deg / 45) % 8
  return directions[index]
}
