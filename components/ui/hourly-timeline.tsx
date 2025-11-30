"use client"

import { Sun, Moon, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface HourlyTimelineProps {
  forecast: {
    time: string
    temp: number
    pop: number
    rain: number
    weatherCode: number
    description: string
  }[]
  className?: string
}

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

export function HourlyTimeline({ forecast, className }: HourlyTimelineProps) {
  return (
    <div className={cn("overflow-x-auto -mx-6 px-6", className)}>
      <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
        {forecast.map((hour, idx) => {
          const time = new Date(hour.time)
          const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
          const isDay = time.getHours() >= 6 && time.getHours() < 20
          const Icon = getWeatherIcon(hour.weatherCode, isDay)
          const hasRain = hour.rain > 0.1 || hour.pop > 0.5

          return (
            <div
              key={idx}
              className={cn(
                "flex flex-col items-center p-3 rounded-2xl min-w-[70px] transition-all duration-300",
                hasRain
                  ? "bg-blue-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                  : "bg-white/5 border border-white/10"
              )}
            >
              <p className="text-xs text-white/70 mb-2 font-medium">{timeStr}</p>
              <Icon className={cn("h-7 w-7 mb-2", hasRain ? "text-blue-400" : "text-cyan-400")} />
              <p className="text-sm font-semibold text-white mb-1">{Math.round(hour.temp)}°</p>
              {hour.pop > 0.1 && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  <p className="text-xs text-blue-400 font-medium">{Math.round(hour.pop * 100)}%</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
