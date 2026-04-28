import { createClient } from "@supabase/supabase-js"

// Database types
export interface Event {
  id: string
  name: string
  description?: string
  location: string
  start_date: string
  end_date: string
  capacity: number
  status: "planned" | "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "responder" | "admin"
  responder_type?: "medical" | "security" | "fire" | "technical"
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Zone {
  id: string
  event_id: string
  name: string
  description?: string
  capacity: number
  coordinates?: any
  zone_type: "stage" | "entrance" | "food" | "vip" | "parking" | "backstage" | "general"
  created_at: string
}

export interface Incident {
  id: string
  event_id: string
  zone_id?: string
  incident_id: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "claimed" | "investigating" | "resolved" | "escalated"
  title: string
  description: string
  location: string
  reported_by?: string
  assigned_to?: string
  reported_at: string
  resolved_at?: string
  response_time_minutes?: number
  created_at: string
  updated_at: string
}

export interface CrowdDensity {
  id: string
  event_id: string
  zone_id: string
  timestamp: string
  current_count: number
  density_percentage: number
  prediction_15min?: number
  prediction_30min?: number
  ai_confidence?: number
  created_at: string
}

export interface AnomalyDetection {
  id: string
  event_id: string
  camera_id: string
  zone_id?: string
  detection_type: "crowd_behavior" | "abandoned_object" | "violence" | "unusual_movement" | "gathering"
  confidence: number
  description: string
  status: "active" | "investigating" | "resolved" | "false_positive"
  bounding_box?: any
  image_url?: string
  detected_at: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface LostPerson {
  id: string
  event_id: string
  reporter_name: string
  reporter_contact: string
  person_name: string
  description: string
  last_seen_location?: string
  last_seen_time?: string
  photo_url?: string
  status: "active" | "found" | "closed"
  found_location?: string
  found_time?: string
  created_at: string
  updated_at: string
}

// Initialize Supabase client — gracefully handle missing env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials not configured. Database operations will return empty/mock data.")
    return null
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export const supabase = getSupabase()!

// Database service functions
export class DatabaseService {
  private static db() {
    return getSupabase()
  }

  // Event operations
  static async getActiveEvent(): Promise<Event | null> {
    const db = this.db()
    if (!db) return null
    const { data, error } = await db.from("events").select("*").eq("status", "active").single()

    if (error) {
      console.error("Error fetching active event:", error)
      return null
    }

    return data
  }

  static async getEventById(id: string): Promise<Event | null> {
    const db = this.db()
    if (!db) return null
    const { data, error } = await db.from("events").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching event:", error)
      return null
    }

    return data
  }

  // Zone operations
  static async getEventZones(eventId: string): Promise<Zone[]> {
    const db = this.db()
    if (!db) return []
    const { data, error } = await db.from("zones").select("*").eq("event_id", eventId).order("name")

    if (error) {
      console.error("Error fetching zones:", error)
      return []
    }

    return data || []
  }

  // Incident operations
  static async getIncidents(eventId: string, status?: string, assignedTo?: string): Promise<Incident[]> {
    const db = this.db()
    if (!db) return []
    let query = db.from("incidents").select("*").eq("event_id", eventId)

    if (status) {
      query = query.eq("status", status)
    }

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo)
    }

    const { data, error } = await query.order("reported_at", { ascending: false })

    if (error) {
      console.error("Error fetching incidents:", error)
      return []
    }

    return data || []
  }

  static async createIncident(incident: Omit<Incident, "id" | "created_at" | "updated_at">): Promise<Incident | null> {
    const db = this.db()
    if (!db) return null
    const { data, error } = await db.from("incidents").insert(incident).select().single()

    if (error) {
      console.error("Error creating incident:", error)
      return null
    }

    return data
  }

  static async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const db = this.db()
    if (!db) return null
    const { data, error } = await db
      .from("incidents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating incident:", error)
      return null
    }

    return data
  }

  // Crowd density operations
  static async getLatestCrowdDensity(eventId: string): Promise<CrowdDensity[]> {
    const db = this.db()
    if (!db) return []
    const { data, error } = await db
      .from("crowd_density")
      .select(`
        *,
        zones (name, zone_type)
      `)
      .eq("event_id", eventId)
      .order("timestamp", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching crowd density:", error)
      return []
    }

    return data || []
  }

  static async getCrowdDensityHistory(eventId: string, zoneId?: string, hours = 24): Promise<CrowdDensity[]> {
    const db = this.db()
    if (!db) return []
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    let query = db.from("crowd_density").select("*").eq("event_id", eventId).gte("timestamp", since)

    if (zoneId) {
      query = query.eq("zone_id", zoneId)
    }

    const { data, error } = await query.order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching crowd density history:", error)
      return []
    }

    return data || []
  }

  // Anomaly detection operations
  static async getAnomalyDetections(eventId: string, status?: string): Promise<AnomalyDetection[]> {
    const db = this.db()
    if (!db) return []
    let query = db
      .from("anomaly_detections")
      .select(`
        *,
        cameras (camera_id, name),
        zones (name)
      `)
      .eq("event_id", eventId)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("detected_at", { ascending: false })

    if (error) {
      console.error("Error fetching anomaly detections:", error)
      return []
    }

    return data || []
  }

  static async createAnomalyDetection(
    anomaly: Partial<AnomalyDetection>
  ): Promise<AnomalyDetection | null> {
    const db = this.db()
    if (!db) { console.warn("⚠️ Skipping anomaly insert — no DB configured"); return null }
    const { data, error } = await db.from("anomaly_detections").insert(anomaly).select().single()

    if (error) {
      console.error("Error creating anomaly detection:", error)
      return null
    }

    return data
  }

  // Lost person operations
  static async getLostPersons(eventId: string, status?: string): Promise<LostPerson[]> {
    const db = this.db()
    if (!db) return []
    let query = db.from("lost_persons").select("*").eq("event_id", eventId)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching lost persons:", error)
      return []
    }

    return data || []
  }

  static async createLostPersonReport(
    report: Partial<LostPerson>,
  ): Promise<LostPerson | null> {
    const db = this.db()
    if (!db) { console.warn("⚠️ Skipping lost person insert — no DB configured"); return null }
    const { data, error } = await db.from("lost_persons").insert(report).select().single()

    if (error) {
      console.error("Error creating lost person report:", error)
      return null
    }

    return data
  }

  // User operations
  static async getUserById(id: string): Promise<User | null> {
    const db = this.db()
    if (!db) return null
    const { data, error } = await db.from("users").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data
  }

  static async getResponders(eventId: string): Promise<User[]> {
    const db = this.db()
    if (!db) return []
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("role", "responder")
      .eq("is_active", true)
      .order("first_name")

    if (error) {
      console.error("Error fetching responders:", error)
      return []
    }

    return data || []
  }

  // System metrics
  static async getSystemMetrics(eventId: string, metricType?: string): Promise<any[]> {
    const db = this.db()
    if (!db) return []
    let query = db.from("system_metrics").select("*").eq("event_id", eventId)

    if (metricType) {
      query = query.eq("metric_type", metricType)
    }

    const { data, error } = await query.order("timestamp", { ascending: false })

    if (error) {
      console.error("Error fetching system metrics:", error)
      return []
    }

    return data || []
  }

  // Real-time subscriptions
  static subscribeToIncidents(eventId: string, callback: (payload: any) => void) {
    const db = this.db()
    if (!db) return null
    return db
      .channel("incidents")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
          filter: `event_id=eq.${eventId}`,
        },
        callback,
      )
      .subscribe()
  }

  static subscribeToCrowdDensity(eventId: string, callback: (payload: any) => void) {
    const db = this.db()
    if (!db) return null
    return db
      .channel("crowd_density")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crowd_density",
          filter: `event_id=eq.${eventId}`,
        },
        callback,
      )
      .subscribe()
  }

  static subscribeToAnomalies(eventId: string, callback: (payload: any) => void) {
    const db = this.db()
    if (!db) return null
    return db
      .channel("anomaly_detections")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anomaly_detections",
          filter: `event_id=eq.${eventId}`,
        },
        callback,
      )
      .subscribe()
  }
}
