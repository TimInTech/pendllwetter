"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, ChevronDown, ChevronUp, Wind, Droplets, Thermometer, CloudRain } from "lucide-react"

interface RideabilityLegendProps {
  compact?: boolean
}

export function RideabilityLegend({ compact = false }: RideabilityLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const levels = [
    {
      emoji: "🟢",
      label: "Gut fahrbar",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      criteria: "Wind < 29 km/h, Regen < 0,5 mm/h, Regenwahrscheinlichkeit < 20%",
    },
    {
      emoji: "🟡",
      label: "OK mit Vorsicht",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      criteria: "Wind 29-43 km/h oder Regen 0,5-2 mm/h oder Regenwahrsch. 20-60%",
    },
    {
      emoji: "🟠",
      label: "Kritisch",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      criteria: "Wind 43-58 km/h oder Regen 2-5 mm/h oder Regenwahrsch. 60-80% oder Temperatur -3°C bis 0°C",
    },
    {
      emoji: "🔴",
      label: "Nicht empfehlenswert",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      criteria: "Wind > 58 km/h oder Regen > 5 mm/h oder Regenwahrsch. > 80% oder Temperatur ≤ -3°C",
    },
  ]

  if (compact) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="pt-4 pb-4">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-slate-300 hover:text-white hover:bg-white/5 p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium">Legende zur Bewertung</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {levels.map((level) => (
                <div
                  key={level.label}
                  className={`flex items-start gap-3 p-2 rounded-lg ${level.bg}`}
                >
                  <span className="text-lg flex-shrink-0">{level.emoji}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{level.criteria}</p>
                  </div>
                </div>
              ))}

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  Wind: Böengeschwindigkeit × 0,8 wird berücksichtigt
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-200">Bewertungslegende</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {levels.map((level) => (
            <div
              key={level.label}
              className={`flex items-start gap-3 p-3 rounded-xl ${level.bg} border border-white/5`}
            >
              <span className="text-xl flex-shrink-0">{level.emoji}</span>
              <div className="min-w-0">
                <p className={`font-medium ${level.color}`}>{level.label}</p>
                <p className="text-xs text-slate-400 mt-1">{level.criteria}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <p className="text-xs text-cyan-300 mb-2 font-medium">Schwellenwerte:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-cyan-400" />
              <span>Wind (inkl. Böen × 0,8)</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" />
              <span>Regenwahrscheinlichkeit</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudRain className="h-3 w-3 text-blue-400" />
              <span>Niederschlagsmenge</span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span>Temperatur (Frost)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
