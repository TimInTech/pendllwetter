"use client"

import { Card, CardContent } from "@/components/ui/card"
import { evaluateRideability, getClothingAdvice, getWindDirection, getWeatherEmoji } from "@/lib/rideability"
import type { WeatherSlot } from "@/lib/types"
import { ArrowRight, Droplets, Wind, Thermometer, CloudRain, Gauge } from "lucide-react"

interface WeatherResultsProps {
  results: WeatherSlot[]
  startOrt: string
  zielOrt: string
}

export function WeatherResults({ results, startOrt, zielOrt }: WeatherResultsProps) {
  // Group by date
  const groupedByDate: Record<string, WeatherSlot[]> = {}
  results.forEach((slot) => {
    const dateKey = slot.date
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = []
    }
    groupedByDate[dateKey].push(slot)
  })

  return (
    <div className="space-y-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-slate-200 flex items-center gap-2 sm:gap-3">
        <CloudRain className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
        Wettervorhersage
      </h2>

      {Object.entries(groupedByDate).map(([date, slots]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-slate-300 border-b border-white/10 pb-2 sm:pb-3">{formatDateHeader(date)}</h3>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, idx) => (
              <WeatherCard key={`${date}-${slot.type}-${idx}`} slot={slot} startOrt={startOrt} zielOrt={zielOrt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function WeatherCard({
  slot,
  startOrt,
  zielOrt,
}: {
  slot: WeatherSlot
  startOrt: string
  zielOrt: string
}) {
  const rideability = evaluateRideability(slot)
  const clothingAdvice = getClothingAdvice(slot.temp)
  const windDir = getWindDirection(slot.windDeg)
  const weatherEmoji = getWeatherEmoji(slot.clouds, slot.pop, slot.rain)

  const from = slot.type === "hin" ? startOrt : zielOrt
  const to = slot.type === "hin" ? zielOrt : startOrt
  const typeLabel = slot.type === "hin" ? "Hinfahrt" : "Rückfahrt"

  const cardStyles = {
    gut: "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/15",
    ok: "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/15",
    kritisch: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/15",
    schlecht: "bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/15",
  }[rideability.level]

  const accentColor = {
    gut: "text-emerald-400",
    ok: "text-yellow-400",
    kritisch: "text-orange-400",
    schlecht: "text-rose-400",
  }[rideability.level]

  const displayTime = slot.time

  return (
    <Card className={`${cardStyles} backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-xl group`}>
      <CardContent className="pt-4 pb-4 px-4 sm:pt-5 sm:pb-5 sm:px-5 space-y-3 sm:space-y-4">
        {/* Route Header - kompakter */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-200 text-sm sm:text-base font-medium">
          <span className="text-emerald-400 truncate">{from}</span>
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
          <span className="text-rose-400 truncate">{to}</span>
        </div>

        {/* Shift & Type */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">{slot.shiftName}</span>
          <span
            className={`text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
              slot.type === "hin" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Zeit - kompakter */}
        <div className="text-xs sm:text-sm text-slate-400">Zeit: {displayTime} Uhr</div>

        {/* Wetter-Box - kompakter */}
        <div className="bg-white/5 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 border border-white/5">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl leading-none">{weatherEmoji}</span>
            <div className="min-w-0">
              <p className="font-medium text-slate-200 text-sm sm:text-lg leading-tight">
                {slot.description}, {slot.temp.toFixed(1)} °C
              </p>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                <Thermometer className="h-3 w-3" />
                gefühlt {slot.feelsLike.toFixed(1)} °C
              </p>
            </div>
          </div>

          {/* Metrics Grid - kompakter auf Mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
              <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
              <span className="truncate">{Math.round(slot.pop * 100)}% Regen</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
              <CloudRain className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
              <span className="truncate">{slot.rain.toFixed(1)} mm/h</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
              <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{slot.windSpeed.toFixed(0)} km/h {windDir}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
              <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
              <span className="truncate">Böen {slot.windGust?.toFixed(0) ?? "-"}</span>
            </div>
          </div>
        </div>

        {/* Rideability - kompakter */}
        <div className="flex items-start gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-white/10">
          <span className="text-xl sm:text-2xl leading-none">{rideability.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm sm:text-base ${accentColor}`}>{rideability.label}</p>
            {rideability.advice && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">
                {rideability.advice}
              </p>
            )}
            {clothingAdvice && (
              <p className="text-xs text-slate-500 mt-1 sm:mt-2 italic line-clamp-1">
                {clothingAdvice}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const weekdays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  const weekday = weekdays[date.getDay()]

  const formatted = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  if (isToday) return `Heute - ${weekday}, ${formatted}`
  if (isTomorrow) return `Morgen - ${weekday}, ${formatted}`
  return `${weekday}, ${formatted}`
}
