"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, AlertCircle, Crosshair, RefreshCw } from "lucide-react"
import { useLocationStore } from "@/lib/location-store"
import type { Settings } from "@/lib/types"

interface RadarViewProps {
  settings: Settings
}

const DEFAULT_CENTER = { lat: 52.0167, lon: 8.7 } // Leopoldshoehe

export function RadarView({ settings: _settings }: RadarViewProps) {
  const { location, isLoading: gpsLoading, error: locationError, updateFromGPS, clearError } = useLocationStore()
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Handle iframe load completion
  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false)
    setIframeError(false)
  }, [])

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    setIframeLoading(false)
    setIframeError(true)
  }, [])

  // Retry loading iframe
  const handleRetry = useCallback(() => {
    setIframeLoading(true)
    setIframeError(false)
    setIframeKey((prev) => prev + 1)
  }, [])

  const currentCenter = {
    lat: location.lat ?? DEFAULT_CENTER.lat,
    lon: location.lon ?? DEFAULT_CENTER.lon,
  }

  const handleCenterOnLocation = async () => {
    clearError()
    setIframeLoading(true)
    await updateFromGPS()
  }

  // Windy embed URL with radar overlay
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${currentCenter.lat}&lon=${currentCenter.lon}&detailLat=${currentCenter.lat}&detailLon=${currentCenter.lon}&width=650&height=450&zoom=9&level=surface&overlay=radar&product=radar&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`

  const latString =
    location.lat != null ? location.lat.toFixed(2) : DEFAULT_CENTER.lat.toFixed(2)
  const lonString =
    location.lon != null ? location.lon.toFixed(2) : DEFAULT_CENTER.lon.toFixed(2)
  const coordString = `${latString},${lonString}`

  const externalLinks = [
    {
      label: "DWD (Website, Radar im Menü)",
      href: "https://www.dwd.de/DE/Home/home_node.html",
    },
    {
      label: "KachelmannRadar",
      href: `https://kachelmannwetter.com/de/radar/deutschland?zoom=7&lat=${latString}&lon=${lonString}`,
    },
    {
      label: "RegenRadar (WetterOnline)",
      href: "https://www.wetteronline.de/niederschlagsradar",
    },
    {
      label: "RainViewer",
      href: `https://www.rainviewer.com/map.html?loc=${coordString},7&oCS=1&oAP=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1`,
    },
  ]

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Location Header */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-cyan-400 min-w-0">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium truncate">
                {location.cityLabel || "Standort waehlen"}
              </span>
            </div>
            <Button
              onClick={handleCenterOnLocation}
              disabled={gpsLoading}
              variant="outline"
              size="sm"
              className="bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 min-h-[44px] px-4"
              aria-label={gpsLoading ? "Standort wird ermittelt" : "Standort per GPS ermitteln"}
            >
              {gpsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Crosshair className="h-4 w-4 mr-2" />
                  <span>GPS</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {locationError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{locationError}</p>
        </div>
      )}

      {/* Windy Radar Map */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
        <CardContent className="p-0">
          <div 
            className="relative w-full" 
            style={{ height: "min(65vh, 500px)" }}
            role="region"
            aria-label="Niederschlagsradar"
          >
            {/* Loading overlay */}
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1e]/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
                <p className="text-sm text-slate-400">Radar wird geladen...</p>
              </div>
            )}

            {/* Error state */}
            {iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1e]/80 z-10 p-4">
                <AlertCircle className="h-8 w-8 text-rose-400 mb-3" />
                <p className="text-sm text-slate-300 text-center mb-4">
                  Radar konnte nicht geladen werden
                </p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            )}

            <iframe
              key={iframeKey}
              src={windyUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Windy Niederschlagsradar - Interaktive Radarkarte"
              aria-label="Niederschlagsradar von Windy"
              loading="lazy"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>

          {/* Legend */}
          <div 
            className="p-3 border-t border-white/10 bg-white/5"
            role="img"
            aria-label="Legende: Niederschlagsintensität von leicht (blau) bis stark (magenta)"
          >
            <p className="text-xs text-slate-400 mb-2" id="legend-label">Niederschlagsintensität</p>
            <div className="flex items-center gap-1" aria-labelledby="legend-label">
              <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-[#88f]" title="Sehr leicht" />
                <div className="flex-1 bg-[#4f4]" title="Leicht" />
                <div className="flex-1 bg-[#ff0]" title="Mäßig" />
                <div className="flex-1 bg-[#f80]" title="Stark" />
                <div className="flex-1 bg-[#f00]" title="Sehr stark" />
                <div className="flex-1 bg-[#f0f]" title="Extrem" />
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>Leicht</span>
              <span>Stark</span>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Weitere Radaransichten */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="pt-3 pb-3 space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide" id="external-links-label">
            Weitere Radaransichten
          </p>
          <nav 
            className="flex flex-wrap gap-2" 
            aria-labelledby="external-links-label"
          >
            {externalLinks.map((link) => (
              <Button
                key={link.label}
                variant="outline"
                className="min-h-[44px] px-3 sm:px-4 bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                asChild
              >
                <a 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`${link.label} (öffnet in neuem Tab)`}
                >
                  {link.label}
                </a>
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  )
}
