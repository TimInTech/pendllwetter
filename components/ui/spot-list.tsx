"use client"

import { MapPin, Navigation, Mountain, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LaunchSite } from "@/lib/types-paragliding"

interface SpotListProps {
  spots: (LaunchSite & { distance?: number })[]
  onSpotClick?: (spot: LaunchSite & { distance?: number }) => void
  className?: string
}

const difficultyConfig = {
  beginner: { label: "Anfänger", color: "text-green-400", bg: "bg-green-500/20" },
  intermediate: { label: "Fortgeschritten", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  advanced: { label: "Erfahren", color: "text-orange-400", bg: "bg-orange-500/20" },
  expert: { label: "Experten", color: "text-red-400", bg: "bg-red-500/20" },
}

export function SpotList({ spots, onSpotClick, className }: SpotListProps) {
  if (spots.length === 0) {
    return (
      <div className="p-6 text-center text-white/60">
        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Keine Fluggebiete in der Nähe gefunden</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {spots.map((spot, idx) => {
        const difficulty = difficultyConfig[spot.difficulty]
        const windDirections = spot.suitableWindDirections.map(deg => getWindDirectionLabel(deg)).join(", ")

        return (
          <button
            key={`${spot.name}-${idx}`}
            onClick={() => onSpotClick?.(spot)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl",
              "bg-white/5 border border-white/10",
              "hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300",
              "text-left"
            )}
          >
            {/* Icon */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <Mountain className="h-5 w-5 text-cyan-400" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white truncate">{spot.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-white/60">{spot.elevation}m MSL</span>
                {spot.distance !== undefined && (
                  <span className="text-xs text-cyan-400">{spot.distance.toFixed(1)} km</span>
                )}
                <span className={cn("text-xs px-2 py-0.5 rounded-md", difficulty.bg, difficulty.color)}>
                  {difficulty.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Navigation
                  className="h-3 w-3 text-white/40"
                  style={{ transform: `rotate(${spot.orientation}deg)` }}
                />
                <span className="text-xs text-white/50">
                  Ausrichtung {getWindDirectionLabel(spot.orientation)} · Wind: {windDirections}
                </span>
              </div>
              {spot.restrictions && (
                <div className="text-xs text-white/40 mt-1">
                  {spot.restrictions.minPilotLevel && `Min. Lizenz ${spot.restrictions.minPilotLevel}`}
                  {spot.restrictions.maxWind && ` · Max. Wind ${spot.restrictions.maxWind} km/h`}
                </div>
              )}
            </div>

            {/* Distance Badge */}
            {spot.distance !== undefined && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-cyan-400">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function getWindDirectionLabel(degrees: number): string {
  const directions = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  const index = Math.round((degrees % 360) / 22.5) % 16
  return directions[index]
}
