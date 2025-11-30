"use client"

import { Bike } from "lucide-react"
import { cn } from "@/lib/utils"

interface BikeSlot {
  time: string
  level: "gut" | "ok" | "kritisch" | "schlecht"
  label: string
  temp: number
  rain: number
  wind: number
}

interface BikePanelProps {
  direction: "Hinfahrt" | "Rückfahrt"
  shiftName: string
  slots: BikeSlot[]
  className?: string
  onSlotClick?: (slot: BikeSlot) => void
}

const levelConfig = {
  gut: {
    color: "bg-emerald-500",
    ringColor: "ring-emerald-500/30",
    textColor: "text-emerald-400",
    emoji: "✅",
  },
  ok: {
    color: "bg-yellow-500",
    ringColor: "ring-yellow-500/30",
    textColor: "text-yellow-400",
    emoji: "⚠️",
  },
  kritisch: {
    color: "bg-orange-500",
    ringColor: "ring-orange-500/30",
    textColor: "text-orange-400",
    emoji: "⚠️",
  },
  schlecht: {
    color: "bg-rose-500",
    ringColor: "ring-rose-500/30",
    textColor: "text-rose-400",
    emoji: "❌",
  },
}

export function BikePanel({ direction, shiftName, slots, className, onSlotClick }: BikePanelProps) {
  return (
    <div className={cn("rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
          <Bike className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Radfahren</h3>
          <p className="text-sm text-white/70">
            {shiftName} · {direction}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {slots.map((slot, idx) => {
          const config = levelConfig[slot.level]
          return (
            <button
              key={idx}
              onClick={() => onSlotClick?.(slot)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              {/* Time */}
              <div className="w-16 flex-shrink-0">
                <p className="text-sm font-medium text-white">{slot.time}</p>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full ring-4 transition-all duration-300",
                    config.color,
                    config.ringColor,
                    "group-hover:scale-110"
                  )}
                />
              </div>

              {/* Label */}
              <div className="flex-1 text-left">
                <p className={cn("text-sm font-medium", config.textColor)}>{slot.label}</p>
              </div>

              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-white/60">
                <span>{Math.round(slot.temp)}°</span>
                {slot.rain > 0.1 && <span className="text-blue-400">{slot.rain.toFixed(1)}mm</span>}
                <span>{Math.round(slot.wind)} km/h</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-4 flex-wrap">
        {(Object.keys(levelConfig) as Array<keyof typeof levelConfig>).map((level) => {
          const config = levelConfig[level]
          return (
            <div key={level} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", config.color)} />
              <span className="text-xs text-white/60 capitalize">{level}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
