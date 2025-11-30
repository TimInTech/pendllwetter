"use client"

import { useState } from "react"
import { Bike, Wind } from "lucide-react"
import { cn } from "@/lib/utils"
import { CommuteView } from "./commute-view"
import { ParaglidingViewPro } from "./paragliding-view-pro"
import type { Settings } from "@/lib/types"

interface ActivitiesViewProps {
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
}

type ActivityTab = "cycling" | "paragliding"

const tabs = [
  { id: "cycling" as const, label: "Radfahren", icon: Bike },
  { id: "paragliding" as const, label: "Paragliding", icon: Wind },
]

export function ActivitiesView({ settings, onSettingsChange }: ActivitiesViewProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>("cycling")

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
              <span className="font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === "cycling" && (
          <CommuteView settings={settings} onSettingsChange={onSettingsChange} />
        )}
        {activeTab === "paragliding" && <ParaglidingViewPro />}
      </div>
    </div>
  )
}
