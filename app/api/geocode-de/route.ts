/**
 * German Postal Code & City Search API Route
 * 
 * Provides autocomplete suggestions for German locations.
 * Prevents CORS issues by proxying Open-Meteo Geocoding API server-side.
 */

import { NextRequest, NextResponse } from "next/server"

export interface GeocodeDEResult {
  name: string
  postal_code?: string
  state?: string
  country: string
  latitude: number
  longitude: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter required (min 2 characters)" },
      { status: 400 }
    )
  }

  try {
    // Call Open-Meteo Geocoding API
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", query)
    url.searchParams.set("count", "10")
    url.searchParams.set("language", "de")
    url.searchParams.set("format", "json")

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PendlerWetter-App/2.0",
      },
    })

    if (!response.ok) {
      console.error("Open-Meteo geocoding failed:", response.status)
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 503 }
      )
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Filter for Germany and format results
    const results: GeocodeDEResult[] = data.results
      .filter((item: any) => item.country_code === "DE" || item.country === "Germany" || item.country === "Deutschland")
      .slice(0, 5)
      .map((item: any) => ({
        name: item.name,
        postal_code: item.postcodes?.[0] || undefined,
        state: item.admin1 || undefined,
        country: "Deutschland",
        latitude: item.latitude,
        longitude: item.longitude,
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
