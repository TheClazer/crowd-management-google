import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const type = formData.get("type") as string // "anomaly" or "person_match" or "person_register"
    const file = formData.get("file") as File
    const eventId = formData.get("eventId") as string || "evt-summer-fest-2025"
    
    if (!type || !file) {
      return NextResponse.json({ error: "Missing type or file" }, { status: 400 })
    }
    
    let pythonEndpoint = ""
    if (type === "anomaly") pythonEndpoint = "http://localhost:8001/analyze/anomaly"
    else if (type === "person_match") pythonEndpoint = "http://localhost:8001/person/match"
    else if (type === "person_register") pythonEndpoint = "http://localhost:8001/person/register"
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 })
      
    // Forward the file to the Python backend
    const backendFormData = new FormData()
    backendFormData.append("file", file)
    
    if (type === "anomaly") {
      backendFormData.append("metadata_duration", "100")
    }
    
    const response = await fetch(pythonEndpoint, {
      method: "POST",
      body: backendFormData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Python API Error:", errorText)
      throw new Error(`Python backend failed with status ${response.status}`)
    }
    
    const result = await response.json()
    
    // Save to database based on response — field names match the Supabase schema
    if (type === "anomaly" && result.detection_type && result.detection_type !== "none") {
      const location = formData.get("location") as string || "Unknown Location"
      
      await DatabaseService.createAnomalyDetection({
        event_id: eventId,
        camera_id: "cv-upload",
        zone_id: "zone-1",
        detection_type: result.detection_type,
        confidence: typeof result.confidence === "number" ? result.confidence : 0.5,
        description: `AI detected ${result.detection_type} at ${location}`,
        status: "active",
        bounding_box: result.bounding_box || null,
        detected_at: new Date().toISOString(),
      })
    } else if (type === "person_register") {
      const name = formData.get("name") as string || "Unknown"
      const description = formData.get("description") as string || ""
      const lastSeen = formData.get("lastSeen") as string || ""
      const contact = formData.get("contact") as string || ""
      
      await DatabaseService.createLostPersonReport({
        event_id: eventId,
        reporter_name: contact ? "Reporter" : "Anonymous",
        reporter_contact: contact,
        person_name: name,
        description: description,
        last_seen_location: lastSeen,
        status: "active",
        photo_url: result.person_id || null, // Store AI person_id for correlation
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Vision proxy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
