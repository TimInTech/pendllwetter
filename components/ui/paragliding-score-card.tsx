"use client"

import { Wind, Navigation, Droplets, Cloud, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParaglidingConditions } from "@/lib/paragliding"

interface ParaglidingScoreCardProps {
  conditions: ParaglidingConditions
  time?: string
  className?: string
}

const levelConfig = {
  optimal: {
    gradient: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  gut: {
    gradient: "from-green-500/20 to-lime-500/20",
    border: "border-green-500/30",
    glow: "shadow-green-500/20",
  },
  grenzwertig: {
    gradient: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/20",
  },
  schlecht: {
    gradient: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
  },
  gefährlich: {
    gradient: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
  },
}

export function ParaglidingScoreCard({ conditions, time, className }: ParaglidingScoreCardProps) {
  const config = levelConfig[conditions.level]

  return (
    <div
      className={cn(
        "rounded-3xl p-6 backdrop-blur-xl border shadow-2xl transition-all duration-500",
        `bg-gradient-to-br ${config.gradient}`,
        config.border,
        config.glow,
        className
      )}
    >
      {/* Header mit Score */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{conditions.emoji}</span>
          <div>
            <p className="text-2xl font-bold text-white">{conditions.label}</p>
            {time && <p className="text-sm text-white/70 mt-1">{time}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white">{conditions.score}</div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Score</div>
        </div>
      </div>

      {/* Advice */}
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
        <p className="text-white/90 leading-relaxed">{conditions.advice}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <DetailBadge
          icon={<Wind className="h-4 w-4" />}
          label="Wind"
          value={conditions.details.wind}
          valueMap={{
            optimal: "Optimal",
            gut: "Gut",
            grenzwertig: "Grenzwertig",
            zu_stark: "Zu stark",
          }}
        />
        <DetailBadge
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Böen"
          value={conditions.details.gusts}
          valueMap={{
            sicher: "Sicher",
            akzeptabel: "OK",
            böig: "Böig",
            gefährlich: "Gefährlich",
          }}
        />
        <DetailBadge
          icon={<Droplets className="h-4 w-4" />}
          label="Niederschlag"
          value={conditions.details.rain}
          valueMap={{
            trocken: "Trocken",
            leicht: "Leicht",
            nass: "Nass",
            starkregen: "Stark",
          }}
        />
        <DetailBadge
          icon={<TrendingUp className="h-4 w-4" />}
          label="Thermik"
          value={conditions.details.thermal}
          valueMap={{
            stark: "Stark",
            mittel: "Mittel",
            schwach: "Schwach",
            keine: "Keine",
          }}
        />
      </div>
    </div>
  )
}

interface DetailBadgeProps {
  icon: React.ReactNode
  label: string
  value: string
  valueMap: Record<string, string>
}

function DetailBadge({ icon, label, value, valueMap }: DetailBadgeProps) {
  const displayValue = valueMap[value] || value

  const badgeColor = () => {
    if (value.includes("optimal") || value === "sicher" || value === "trocken" || value === "stark") {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    }
    if (value.includes("gut") || value === "akzeptabel" || value === "mittel") {
      return "bg-green-500/20 text-green-300 border-green-500/30"
    }
    if (value.includes("grenzwertig") || value === "böig" || value === "leicht" || value === "schwach") {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    }
    return "bg-red-500/20 text-red-300 border-red-500/30"
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="text-cyan-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60">{label}</p>
        <div className={cn("inline-block px-2 py-0.5 rounded-md border text-xs font-medium mt-1", badgeColor())}>
          {displayValue}
        </div>
      </div>
    </div>
  )
}
