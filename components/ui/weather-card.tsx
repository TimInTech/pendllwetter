import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface WeatherCardProps {
  children: ReactNode
  className?: string
  gradient?: boolean
  blur?: boolean
}

export function WeatherCard({ children, className, gradient = false, blur = true }: WeatherCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 shadow-lg border border-white/10",
        blur && "backdrop-blur-xl",
        gradient ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-white/5",
        className
      )}
    >
      {children}
    </div>
  )
}

interface WeatherCardHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function WeatherCardHeader({ title, subtitle, icon, action }: WeatherCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="text-cyan-400">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface WeatherCardContentProps {
  children: ReactNode
  className?: string
}

export function WeatherCardContent({ children, className }: WeatherCardContentProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}
