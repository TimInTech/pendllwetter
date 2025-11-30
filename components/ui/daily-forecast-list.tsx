"use client"

import { Sun, Moon, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Cloud, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyForecast {
  date: string
  dayLabel: string
  tempMin: number
  tempMax: number
  pop: number
  weatherCode: number
  description: string
}

interface DailyForecastListProps {
  forecasts: DailyForecast[]
  className?: string
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return Sun
  if (code <= 3) return CloudSun
  if (code <= 48) return CloudFog
  if (code <= 57) return CloudDrizzle
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  if (code >= 95) return CloudLightning
  return Cloud
}

export function DailyForecastList({ forecasts, className }: DailyForecastListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {forecasts.map((day, idx) => {
        const Icon = getWeatherIcon(day.weatherCode)
        const hasRain = day.pop > 0.3

        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
              hasRain
                ? "bg-blue-500/10 border border-blue-500/20"
                : "bg-white/5 border border-white/10"
            )}
          >
            {/* Day Label */}
            <div className="w-16 flex-shrink-0">
              <p className="text-sm font-medium text-white">{day.dayLabel}</p>
            </div>

            {/* Rain Probability */}
            <div className="w-12 flex-shrink-0 flex items-center gap-1.5">
              {day.pop > 0.1 && (
                <>
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  <p className="text-xs text-blue-400 font-medium">{Math.round(day.pop * 100)}%</p>
                </>
              )}
            </div>

            {/* Weather Icon */}
            <div className="flex-shrink-0">
              <Icon className={cn("h-6 w-6", hasRain ? "text-blue-400" : "text-cyan-400")} />
            </div>

            {/* Temperature Range */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <p className="text-sm text-white/60">{Math.round(day.tempMin)}°</p>
              <div className="h-1 w-16 bg-gradient-to-r from-cyan-500/30 to-orange-500/30 rounded-full" />
              <p className="text-sm font-semibold text-white">{Math.round(day.tempMax)}°</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
