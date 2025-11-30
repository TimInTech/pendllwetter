"use client"

import { Navigation, MapPin, Mountain } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParaglidingHourlySlot } from "@/lib/paragliding"

interface ParaglidingTimelineProps {
  slots: ParaglidingHourlySlot[]
  onSlotClick?: (slot: ParaglidingHourlySlot) => void
  className?: string
}

export function ParaglidingTimeline({ slots, onSlotClick, className }: ParaglidingTimelineProps) {
  return (
    <div className={cn("overflow-x-auto -mx-6 px-6 pb-2", className)}>
      <div className="flex gap-3" style={{ minWidth: "max-content" }}>
        {slots.map((slot, idx) => {
          const time = new Date(slot.time)
          const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
          const { conditions, weather } = slot

          const levelColors = {
            optimal: "bg-emerald-500/30 border-emerald-500/50",
            gut: "bg-green-500/30 border-green-500/50",
            grenzwertig: "bg-yellow-500/30 border-yellow-500/50",
            schlecht: "bg-orange-500/30 border-orange-500/50",
            gefährlich: "bg-red-500/30 border-red-500/50",
          }

          return (
            <button
              key={idx}
              onClick={() => onSlotClick?.(slot)}
              className={cn(
                "flex flex-col items-center p-4 rounded-2xl min-w-[90px] transition-all duration-300 border",
                "hover:scale-105 hover:shadow-lg",
                levelColors[conditions.level]
              )}
            >
              {/* Time */}
              <p className="text-xs text-white/70 font-medium mb-2">{timeStr}</p>

              {/* Status Emoji */}
              <div className="text-3xl mb-2">{conditions.emoji}</div>

              {/* Score */}
              <div className="text-lg font-bold text-white mb-1">{conditions.score}</div>

              {/* Wind */}
              <div className="flex items-center gap-1 mb-1">
                <Navigation
                  className="h-3 w-3 text-cyan-400"
                  style={{ transform: `rotate(${weather.windDir}deg)` }}
                />
                <span className="text-xs text-white/80">{Math.round(weather.windSpeed)} km/h</span>
              </div>

              {/* Temperature */}
              <div className="text-xs text-white/60">{Math.round(weather.temp)}°</div>

              {/* Thermal Indicator */}
              {weather.thermalIndex > 5 && (
                <div className="mt-1 text-xs text-amber-400 flex items-center gap-0.5">
                  <Mountain className="h-3 w-3" />
                  {weather.thermalIndex}/10
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
