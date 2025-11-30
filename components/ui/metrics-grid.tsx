"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MetricTileProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
  children?: ReactNode
}

export function MetricTile({ icon, label, value, unit, subtitle, className, children }: MetricTileProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg",
        "hover:bg-white/10 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-cyan-400">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-white/70 font-medium">{label}</p>
          {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      
      {children || (
        <div className="mt-4">
          <p className="text-3xl font-bold text-white">
            {value}
            {unit && <span className="text-xl text-white/70 ml-1">{unit}</span>}
          </p>
        </div>
      )}
    </div>
  )
}

interface MetricsGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

export function MetricsGrid({ children, columns = 2, className }: MetricsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

interface WindCompassProps {
  direction: number
  speed: number
  className?: string
}

export function WindCompass({ direction, speed, className }: WindCompassProps) {
  const cardinalPoints = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"]
  const getCardinal = (deg: number) => {
    const index = Math.round(deg / 45) % 8
    return cardinalPoints[index]
  }

  return (
    <div className={cn("relative w-32 h-32 mx-auto", className)}>
      {/* Compass Circle */}
      <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
      
      {/* Cardinal Points */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {cardinalPoints.map((point, idx) => {
            const angle = idx * 45
            const rad = (angle - 90) * (Math.PI / 180)
            const x = 50 + 42 * Math.cos(rad)
            const y = 50 + 42 * Math.sin(rad)
            return (
              <div
                key={point}
                className="absolute text-xs font-medium text-white/60"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {point}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wind Arrow */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
        style={{ transform: `rotate(${direction}deg)` }}
      >
        <div className="w-1 h-12 bg-gradient-to-t from-cyan-400 to-transparent rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-cyan-400" />
        </div>
      </div>

      {/* Center Info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-white">{speed}</p>
        <p className="text-xs text-white/60">km/h</p>
        <p className="text-xs text-cyan-400 font-medium mt-0.5">{getCardinal(direction)}</p>
      </div>
    </div>
  )
}

interface PressureGaugeProps {
  value: number
  className?: string
}

export function PressureGauge({ value, className }: PressureGaugeProps) {
  const normalizedValue = Math.max(0, Math.min(100, ((value - 960) / (1040 - 960)) * 100))

  return (
    <div className={cn("relative w-32 h-20 mx-auto", className)}>
      {/* Semicircle Background */}
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="url(#pressureGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="157"
          strokeDashoffset={157 - (157 * normalizedValue) / 100}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="pressureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Value Display */}
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs text-white/60">mbar</p>
        </div>
      </div>
    </div>
  )
}
