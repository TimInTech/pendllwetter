"use client"

import { cn } from "@/lib/utils"
import type { ParaglidingHourlyForecast } from "@/lib/types-paragliding"

interface ParaglidingParameterMatrixProps {
  forecasts: ParaglidingHourlyForecast[]
  className?: string
}

export function ParaglidingParameterMatrix({ forecasts, className }: ParaglidingParameterMatrixProps) {
  return (
    <div className={cn("rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg overflow-x-auto", className)}>
      <h3 className="text-lg font-semibold text-white mb-4">Parameter-Matrix (12h)</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-white/70 pb-2 pr-4">Zeit</th>
            <th className="text-right text-white/70 pb-2 px-2">CAPE</th>
            <th className="text-right text-white/70 pb-2 px-2">LCL</th>
            <th className="text-right text-white/70 pb-2 px-2">Wind</th>
            <th className="text-right text-white/70 pb-2 px-2">Thermik</th>
            <th className="text-center text-white/70 pb-2 pl-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.slice(0, 12).map((forecast, idx) => {
            const time = new Date(forecast.time)
            const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
            const scoreColor = 
              forecast.analysis.score >= 75 ? "text-emerald-400" :
              forecast.analysis.score >= 50 ? "text-green-400" :
              forecast.analysis.score >= 30 ? "text-yellow-400" : "text-red-400"
            
            return (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 pr-4 text-white font-medium">{timeStr}</td>
                <td className="py-2 px-2 text-right text-white/80">{Math.round(forecast.snapshot.cape)}</td>
                <td className="py-2 px-2 text-right text-white/80">{Math.round(forecast.snapshot.cloudbase)}m</td>
                <td className="py-2 px-2 text-right text-white/80">{Math.round(forecast.snapshot.windSpeed)} km/h</td>
                <td className="py-2 px-2 text-right text-white/80">{forecast.snapshot.thermalIndex}/10</td>
                <td className={cn("py-2 pl-2 text-center font-bold", scoreColor)}>{forecast.analysis.score}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
