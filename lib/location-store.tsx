"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"

export type LocationSource = "gps" | "manual"

export interface LocationState {
  lat: number | null
  lon: number | null
  cityLabel: string
  source: LocationSource
  lastUpdated: number
}

interface LocationContextType {
  location: LocationState
  isLoading: boolean
  error: string | null
  updateFromGPS: () => Promise<LocationState | null>
  updateManual: (lat: number, lon: number, label: string) => void
  clearError: () => void
}

const LOCATION_STORAGE_KEY = "wetterpendeln-location-state"

const DEFAULT_LOCATION: LocationState = {
  lat: 52.0167,
  lon: 8.7,
  cityLabel: "Leopoldshöhe, Nordrhein-Westfalen",
  source: "manual",
  lastUpdated: 0,
}

const LocationContext = createContext<LocationContextType | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gpsRequestRef = useRef<Promise<LocationState | null> | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setLocation(parsed)
      }
    } catch {
      console.error("Fehler beim Laden des Standorts")
    }
  }, [])

  // Save to localStorage when location changes
  useEffect(() => {
    if (typeof window === "undefined") return
    if (location.lat !== null && location.lon !== null) {
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
        // Also save in legacy format for compatibility
        localStorage.setItem(
          "wetterpendeln-last-location",
          JSON.stringify({
            lat: location.lat,
            lon: location.lon,
            name: location.cityLabel,
          }),
        )
      } catch {
        console.error("Fehler beim Speichern des Standorts")
      }
    }
  }, [location])

  const updateFromGPS = useCallback(async (): Promise<LocationState | null> => {
    // Prevent duplicate GPS requests
    if (gpsRequestRef.current) {
      return gpsRequestRef.current
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError("Browser-GPS nicht verfügbar. Bitte manuellen Standort eingeben.")
      return null
    }

    setIsLoading(true)
    setError(null)

    gpsRequestRef.current = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          let name = "Aktueller Standort"

          // Reverse geocode via our API route (avoids CORS)
          try {
            const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
            
            if (response.ok) {
              const data = await response.json()
              // Build label from returned data
              const parts = [data.name]
              if (data.admin1) parts.push(data.admin1)
              name = parts.join(", ")
            } else {
              console.warn("Geocoding failed, using default label")
            }
          } catch (error) {
            console.warn("Geocoding error:", error)
            // Fallback to default label
          }

          const newLocation: LocationState = {
            lat: latitude,
            lon: longitude,
            cityLabel: name,
            source: "gps",
            lastUpdated: Date.now(),
          }

          setLocation(newLocation)
          setIsLoading(false)
          gpsRequestRef.current = null
          resolve(newLocation)
        },
        (err) => {
          setIsLoading(false)
          
          // Handle geolocation errors with clear messages
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError(
                "Browser-GPS blockiert. Bitte Standortfreigabe prüfen oder manuellen Ort eingeben.",
              )
              break
            case err.POSITION_UNAVAILABLE:
              setError("GPS-Position nicht verfügbar. Bitte manuellen Ort eingeben.")
              break
            case err.TIMEOUT:
              setError("GPS-Zeitüberschreitung. Bitte erneut versuchen oder manuellen Ort eingeben.")
              break
            default:
              setError("GPS-Fehler aufgetreten. Bitte manuellen Ort eingeben.")
          }
          
          gpsRequestRef.current = null
          resolve(null)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000,
        },
      )
    })

    return gpsRequestRef.current
  }, [])

  const updateManual = useCallback((lat: number, lon: number, label: string) => {
    setLocation({
      lat,
      lon,
      cityLabel: label,
      source: "manual",
      lastUpdated: Date.now(),
    })
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        updateFromGPS,
        updateManual,
        clearError,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationStore() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error("useLocationStore must be used within a LocationProvider")
  }
  return context
}
