import { NextRequest, NextResponse } from "next/server"

/**
 * API Route: Reverse Geocoding
 * 
 * Converts latitude/longitude to human-readable location name.
 * Uses Open-Meteo Geocoding API (server-side to avoid CORS issues).
 * 
 * Query Parameters:
 * - lat: Latitude (required)
 * - lon: Longitude (required)
 * 
 * Returns:
 * - name: City/locality name
 * - admin1: State/region
 * - country: Country name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing required parameters: lat, lon" },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      )
    }

    // Call Open-Meteo Reverse Geocoding API
    // NOTE: Use singular "latitude", "longitude" (not "latitudes")
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=de`
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Open-Meteo Geocoding error:", response.status, response.statusText)
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 503 }
      )
    }

    const data = await response.json()

    // Extract first result
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        name: "Unbekannter Ort",
        admin1: null,
        country: null,
      })
    }

    const result = data.results[0]

    // Return only needed fields
    return NextResponse.json({
      name: result.name || result.admin2 || result.admin1 || "Unbekannter Ort",
      admin1: result.admin1 || null,
      country: result.country || null,
    })
  } catch (error) {
    console.error("Geocoding API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
