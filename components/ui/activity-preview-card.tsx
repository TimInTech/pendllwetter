"use client"

import { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityPreviewCardProps {
  icon: ReactNode
  title: string
  subtitle: string
  status: {
    emoji: string
    label: string
    level: "gut" | "ok" | "kritisch" | "schlecht"
  }
  onViewDetails?: () => void
  className?: string
}

const levelConfig = {
  gut: {
    gradient: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  ok: {
    gradient: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  kritisch: {
    gradient: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  schlecht: {
    gradient: "from-red-500/20 to-rose-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
  },
}

export function ActivityPreviewCard({
  icon,
  title,
  subtitle,
  status,
  onViewDetails,
  className,
}: ActivityPreviewCardProps) {
  const config = levelConfig[status.level]

  return (
    <button
      onClick={onViewDetails}
      className={cn(
        "w-full rounded-3xl p-6 backdrop-blur-xl border shadow-lg",
        "hover:scale-[1.02] transition-all duration-300",
        `bg-gradient-to-br ${config.gradient}`,
        config.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/70">{subtitle}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-white/40" />
      </div>

      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
        <span className="text-4xl">{status.emoji}</span>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-semibold", config.text)}>{status.label}</p>
        </div>
      </div>
    </button>
  )
}
