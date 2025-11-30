"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { useLocationStore } from "@/lib/location-store"
import type { GeocodeDEResult } from "@/app/api/geocode-de/route"

interface LocationSearchProps {
  placeholder?: string
  className?: string
}

/**
 * Location Search with German Postal Code Autocomplete
 * 
 * Features:
 * - Debounced search (300ms)
 * - Autocomplete suggestions (max 5)
 * - Updates global location via useLocationStore
 * - Works for both cycling and paragliding views
 */
export function LocationSearch({ placeholder = "PLZ oder Ort eingeben...", className = "" }: LocationSearchProps) {
  const { updateManual } = useLocationStore()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<GeocodeDEResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/geocode-de?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.results || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error("Location search error:", error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = useCallback((result: GeocodeDEResult) => {
    const label = result.postal_code 
      ? `${result.postal_code} ${result.name}`
      : result.state
      ? `${result.name}, ${result.state}`
      : result.name

    updateManual(result.latitude, result.longitude, label)
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
  }, [updateManual])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a2744]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.map((result, index) => {
            const displayLabel = result.postal_code
              ? `${result.postal_code} ${result.name}`
              : result.name
            const displaySub = result.state || result.country

            return (
              <button
                key={`${result.latitude}-${result.longitude}-${index}`}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-cyan-500/10 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{displayLabel}</div>
                  <div className="text-white/60 text-sm truncate">{displaySub}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
