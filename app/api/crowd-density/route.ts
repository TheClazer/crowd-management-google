import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { generatePredictions } from "@/lib/prediction"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const zoneId = searchParams.get("zoneId")
    const hours = Number.parseInt(searchParams.get("hours") || "24")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const densityData = await DatabaseService.getCrowdDensityHistory(eventId, zoneId || undefined, hours)
    const eventData = await DatabaseService.getEventById(eventId)
    const activeAnomalies = await DatabaseService.getAnomalyDetections(eventId, "active")

    // Generate 15-minute predictions using the Python XGBoost backend
    const predictions = await generatePredictions(eventId, densityData, activeAnomalies, eventData || undefined)

    return NextResponse.json({
      densityData,
      predictions,
      eventInfo: eventData ? {
        id: eventData.id,
        name: eventData.name,
        startDate: eventData.start_date,
        capacity: eventData.capacity
      } : null,
      emergencyMode: activeAnomalies.some(a => a.detection_type === "violence" || a.detection_type === "unusual_movement")
    })
  } catch (error) {
    console.error("Error fetching crowd density:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint for receiving crowd density updates from sensors/CCTV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, apiKey, zoneOverrides } = body

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    if (!apiKey || apiKey !== "valid-density-api-key") {
      return NextResponse.json({ error: "Invalid API key for density calculations" }, { status: 401 })
    }

    const eventData = await DatabaseService.getEventById(eventId)
    const eventZones = await DatabaseService.getEventZones(eventId)

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const densityCalculations: { [zoneId: string]: { density: number, cctvCount: number, cctvIds: string[] } } = {}

    for (const zone of eventZones) {
      const overrideValue = zoneOverrides?.[zone.id]
      // Use override (sensor data) or default to 0 if no reading is available. Removed Math.random() mock data.
      const density = overrideValue !== undefined ? overrideValue : 0

      // Assume 2 CCTVs per zone for simplicity
      const cctvCount = 2
      const cctvs: { id: string; detectedDensity: number }[] = []

      for (let i = 0; i < cctvCount; i++) {
        cctvs.push({
          id: `${zone.id}-cam${i + 1}`,
          detectedDensity: density
        })
      }

      densityCalculations[zone.id] = {
        density: density,
        cctvCount,
        cctvIds: cctvs.map(c => c.id)
      }
    }

    const timestamp = new Date().toISOString()
    const densityRecords = eventZones.map(zone => ({
      event_id: eventId,
      zone_id: zone.id,
      timestamp,
      current_count: Math.floor(densityCalculations[zone.id].density * zone.capacity / 100),
      density_percentage: densityCalculations[zone.id].density,
      prediction_15min: null, // Predicted via GET endpoint asynchronously
      prediction_30min: null,
      ai_confidence: 0.0
    }))

    // In a real implementation, you would insert into DatabaseService here

    return NextResponse.json({
      success: true,
      message: "Crowd density updated",
      calculations: densityCalculations,
      densityRecords,
      timestamp,
      apiUsed: "sensor-ingestion"
    })
  } catch (error) {
    console.error("Error updating crowd density:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
