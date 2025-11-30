"use client"

import { AlertTriangle, Wind, TrendingUp, Cloud, Zap, Activity, ThermometerSun } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParaglidingAnalysis, RiskLevel } from "@/lib/types-paragliding"

interface ParaglidingScoreCardProProps {
  analysis: ParaglidingAnalysis
  className?: string
}

const suitabilityConfig = {
  optimal: {
    gradient: "from-emerald-500/30 to-green-500/30",
    border: "border-emerald-500/50",
    glow: "shadow-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  good: {
    gradient: "from-green-500/30 to-lime-500/30",
    border: "border-green-500/50",
    glow: "shadow-green-500/30",
    text: "text-green-400",
    bg: "bg-green-500/20",
  },
  marginal: {
    gradient: "from-yellow-500/30 to-amber-500/30",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/30",
    text: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  poor: {
    gradient: "from-orange-500/30 to-red-500/30",
    border: "border-orange-500/50",
    glow: "shadow-orange-500/30",
    text: "text-orange-400",
    bg: "bg-orange-500/20",
  },
  dangerous: {
    gradient: "from-red-500/30 to-rose-500/30",
    border: "border-red-500/50",
    glow: "shadow-red-500/30",
    text: "text-red-400",
    bg: "bg-red-500/20",
  },
}

const riskLevelColors: Record<RiskLevel, string> = {
  minimal: "text-emerald-400",
  low: "text-green-400",
  moderate: "text-yellow-400",
  high: "text-orange-400",
  extreme: "text-red-400",
}

export function ParaglidingScoreCardPro({ analysis, className }: ParaglidingScoreCardProProps) {
  const config = suitabilityConfig[analysis.suitability]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Score Card */}
      <div
        className={cn(
          "rounded-3xl p-6 backdrop-blur-xl border shadow-2xl transition-all duration-500",
          `bg-gradient-to-br ${config.gradient}`,
          config.border,
          config.glow
        )}
      >
        {/* Header: Score & Suitability */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-6xl font-semibold text-white mb-2">{analysis.score}</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Flight Score</div>
            <div className={cn("text-xl font-bold mt-2", config.text)}>
              {analysis.suitability === "optimal" && "Optimal"}
              {analysis.suitability === "good" && "Gut"}
              {analysis.suitability === "marginal" && "Grenzwertig"}
              {analysis.suitability === "poor" && "Schlecht"}
              {analysis.suitability === "dangerous" && "Gefährlich"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50 mb-1">Pilot Level</div>
            <div className={cn("px-3 py-1 rounded-xl font-semibold", config.bg, config.text)}>
              {analysis.recommendation.pilotLevel === "novice" && "Anfänger"}
              {analysis.recommendation.pilotLevel === "intermediate" && "Fortgeschritten"}
              {analysis.recommendation.pilotLevel === "advanced" && "Erfahren"}
              {analysis.recommendation.pilotLevel === "expert" && "Experte"}
            </div>
            <div className="text-xs text-white/50 mt-2">Wing Class</div>
            <div className="text-lg font-bold text-white">{analysis.recommendation.wingClass}</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
          <p className="text-white leading-relaxed">{analysis.recommendation.summary}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStat
            icon={<ThermometerSun className="h-4 w-4" />}
            label="CAPE"
            value={`${Math.round(analysis.atmosphere.cape.surface)} J/kg`}
            level={analysis.atmosphere.cape.level}
          />
          <QuickStat
            icon={<Cloud className="h-4 w-4" />}
            label="Wolkenbasis"
            value={`${Math.round(analysis.atmosphere.lcl.height)}m`}
            level={analysis.atmosphere.lcl.classification}
          />
          <QuickStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Thermik"
            value={`${analysis.atmosphere.thermal.strength} m/s`}
            level={analysis.atmosphere.thermal.index > 7 ? "strong" : analysis.atmosphere.thermal.index > 4 ? "moderate" : "weak"}
          />
          <QuickStat
            icon={<Wind className="h-4 w-4" />}
            label="Wind"
            value={`${Math.round(analysis.atmosphere.windProfile.avgSpeed)} km/h`}
            level={analysis.atmosphere.windShear.level}
          />
        </div>
      </div>

      {/* Atmospheric Details */}
      <div className="rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          Atmosphärische Parameter
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="CAPE (Instabilität)" value={`${Math.round(analysis.atmosphere.cape.surface)} J/kg`} />
          <DetailRow label="Lifted Index" value={`${analysis.atmosphere.liftedIndex.value.toFixed(1)} °C`} />
          <DetailRow label="LCL (Wolkenbasis)" value={`${analysis.atmosphere.lcl.height}m AGL`} />
          <DetailRow
            label="LFC (Free Convection)"
            value={analysis.atmosphere.lfc.exists ? `${analysis.atmosphere.lfc.height}m` : "Keine"}
          />
          <DetailRow label="Grenzschicht" value={`${analysis.atmosphere.boundaryLayerHeight}m`} />
          <DetailRow label="Spread (T-Td)" value={`${analysis.atmosphere.dewpointSpread.toFixed(1)} °C`} />
        </div>
      </div>

      {/* Thermal Analysis */}
      <div className="rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Thermik-Analyse
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Steigrate (Durchschnitt)</span>
            <span className="text-white font-semibold">{analysis.atmosphere.thermal.strength} m/s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Thermik-Obergrenze</span>
            <span className="text-white font-semibold">{analysis.atmosphere.thermal.tops}m AGL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Bart-Abstände</span>
            <span className="text-white font-semibold">~{Math.round(analysis.atmosphere.thermal.spacing)}m</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Konsistenz</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${analysis.atmosphere.thermal.consistency * 100}%` }}
                />
              </div>
              <span className="text-white font-semibold text-sm">
                {Math.round(analysis.atmosphere.thermal.consistency * 100)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Thermik-Index</span>
            <span className="text-white font-semibold">{analysis.atmosphere.thermal.index}/10</span>
          </div>
        </div>
      </div>

      {/* Wind Shear */}
      <div className="rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wind className="h-5 w-5 text-cyan-400" />
          Windprofil & Scherung
        </h3>
        <div className="space-y-3">
          <WindLayer
            label="Oberflächenwind (10m)"
            speed={analysis.atmosphere.windProfile.surface.speed}
            direction={analysis.atmosphere.windProfile.surface.direction}
          />
          <WindLayer
            label="Grenzschicht (80m)"
            speed={analysis.atmosphere.windProfile.boundary.speed}
            direction={analysis.atmosphere.windProfile.boundary.direction}
          />
          <WindLayer
            label="Mittelschicht (120m)"
            speed={analysis.atmosphere.windProfile.mid.speed}
            direction={analysis.atmosphere.windProfile.mid.direction}
          />
          <div className="pt-3 border-t border-white/10 space-y-2">
            <DetailRow label="Scherung 0-1km" value={`${analysis.atmosphere.windShear.shear_0_1km} m/s/km`} />
            <DetailRow label="Turbulenz-Potential" value={`${analysis.atmosphere.windShear.turbulencePotential}/10`} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Niveau</span>
              <span
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-semibold",
                  analysis.atmosphere.windShear.level === "low" && "bg-emerald-500/20 text-emerald-400",
                  analysis.atmosphere.windShear.level === "moderate" && "bg-yellow-500/20 text-yellow-400",
                  analysis.atmosphere.windShear.level === "high" && "bg-orange-500/20 text-orange-400",
                  analysis.atmosphere.windShear.level === "severe" && "bg-red-500/20 text-red-400"
                )}
              >
                {analysis.atmosphere.windShear.level === "low" && "Gering"}
                {analysis.atmosphere.windShear.level === "moderate" && "Mäßig"}
                {analysis.atmosphere.windShear.level === "high" && "Hoch"}
                {analysis.atmosphere.windShear.level === "severe" && "Extrem"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Soaring Conditions */}
      <div className="rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Soaring-Bedingungen</h3>
        <div className="space-y-3">
          <SoaringType
            type="Hangaufwind"
            suitable={analysis.soaring.ridge.suitable}
            description={analysis.soaring.ridge.conditions}
            icon="🏔️"
          />
          <SoaringType
            type="Thermik-Kreisen"
            suitable={analysis.soaring.thermal.suitable}
            description={analysis.soaring.thermal.conditions}
            icon="🌡️"
          />
          <SoaringType
            type="Leewellen"
            suitable={analysis.soaring.wave.possible}
            description={analysis.soaring.wave.conditions}
            icon="🌊"
          />
        </div>
      </div>

      {/* XC Potential */}
      {analysis.xc.score > 20 && (
        <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-purple-500/30 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Cross-Country Potential
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">XC-Score</span>
              <span className="text-2xl font-bold text-white">{analysis.xc.score}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Geschätzte Distanz</span>
              <span className="text-white font-semibold">{analysis.xc.distance.potential} km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Bewertung</span>
              <span
                className={cn(
                  "px-3 py-1 rounded-xl font-semibold text-sm",
                  analysis.xc.rating === "excellent" && "bg-emerald-500/20 text-emerald-400",
                  analysis.xc.rating === "good" && "bg-green-500/20 text-green-400",
                  analysis.xc.rating === "fair" && "bg-yellow-500/20 text-yellow-400",
                  analysis.xc.rating === "poor" && "bg-orange-500/20 text-orange-400"
                )}
              >
                {analysis.xc.rating === "excellent" && "Hervorragend"}
                {analysis.xc.rating === "good" && "Gut"}
                {analysis.xc.rating === "fair" && "Mäßig"}
                {analysis.xc.rating === "poor" && "Schlecht"}
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-white/80">{analysis.xc.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risks & Warnings */}
      {(analysis.risks.length > 0 || analysis.warnings.length > 0) && (
        <div className="rounded-3xl p-6 bg-red-500/10 backdrop-blur-xl border border-red-500/30 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Risiken & Warnungen
          </h3>
          <div className="space-y-3">
            {analysis.warnings.map((warning, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-xl border flex items-start gap-3",
                  warning.severity === "danger" && "bg-red-500/20 border-red-500/30",
                  warning.severity === "warning" && "bg-orange-500/20 border-orange-500/30",
                  warning.severity === "caution" && "bg-yellow-500/20 border-yellow-500/30",
                  warning.severity === "info" && "bg-blue-500/20 border-blue-500/30"
                )}
              >
                <span className="text-2xl">{warning.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm mb-1">
                    {warning.severity === "danger" && "GEFAHR"}
                    {warning.severity === "warning" && "WARNUNG"}
                    {warning.severity === "caution" && "VORSICHT"}
                    {warning.severity === "info" && "HINWEIS"}
                  </div>
                  <div className="text-sm text-white/90">{warning.message}</div>
                </div>
              </div>
            ))}
            {analysis.risks.map((risk, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{risk.name}</span>
                  <span className={cn("text-sm font-semibold", riskLevelColors[risk.level])}>
                    {risk.level === "minimal" && "Minimal"}
                    {risk.level === "low" && "Niedrig"}
                    {risk.level === "moderate" && "Mäßig"}
                    {risk.level === "high" && "Hoch"}
                    {risk.level === "extreme" && "Extrem"}
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-2">{risk.description}</p>
                {risk.mitigation && <p className="text-xs text-cyan-400">{risk.mitigation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components

interface QuickStatProps {
  icon: React.ReactNode
  label: string
  value: string
  level: string
}

function QuickStat({ icon, label, value, level }: QuickStatProps) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-cyan-400">{icon}</div>
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  )
}

interface WindLayerProps {
  label: string
  speed: number
  direction: number
}

function WindLayer({ label, speed, direction }: WindLayerProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
      <span className="text-sm text-white/70">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-white font-semibold">{Math.round(speed)} km/h</span>
        <span className="text-white/60 text-sm">{Math.round(direction)}°</span>
      </div>
    </div>
  )
}

interface SoaringTypeProps {
  type: string
  suitable: boolean
  description: string
  icon: string
}

function SoaringType({ type, suitable, description, icon }: SoaringTypeProps) {
  return (
    <div className={cn("p-3 rounded-xl border", suitable ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10")}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-white">{type}</span>
        <span className={cn("text-xs ml-auto", suitable ? "text-green-400" : "text-white/50")}>
          {suitable ? "✓ Möglich" : "✗ Nicht geeignet"}
        </span>
      </div>
      <p className="text-sm text-white/70">{description}</p>
    </div>
  )
}
