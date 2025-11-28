"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

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
    if (!navigator.geolocation) {
      setError("Geolocation wird von Ihrem Browser nicht unterstützt.")
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          let name = "Aktueller Standort"

          try {
            const response = await fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=de`,
            )
            const data = await response.json()
            name = data.results?.[0]?.name || name
          } catch {
            // ignore lookup errors, fall back to default label
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
          resolve(newLocation)
        },
        (err) => {
          setIsLoading(false)
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError(
                "Standortzugriff wurde verweigert. Bitte Standortfreigabe im Browser aktivieren oder PLZ/Ort eingeben.",
              )
              break
            case err.POSITION_UNAVAILABLE:
              setError("Standortinformationen sind nicht verfügbar.")
              break
            case err.TIMEOUT:
              setError("Zeitüberschreitung bei der Standortabfrage.")
              break
            default:
              setError("Ein unbekannter Fehler ist aufgetreten.")
          }
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
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
