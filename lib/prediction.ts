export interface DensityPrediction {
  zoneId: string
  currentDensity: number
  prediction15Min: number
  confidence: number // 0-1 scale
  basedOn: "xgboost_backend" | "fallback"
  timestamp: string
  riskLevel: "low" | "medium" | "high"
}

export interface CrowdDensityData {
  id: string
  event_id: string
  zone_id: string
  timestamp: string
  current_count: number
  density_percentage: number
}

export interface EventData {
  id: string
  name: string
  start_date: string
  capacity: number
  event_type?: string
  location?: string
}

// Generate predictions using the Python XGBoost microservice
export async function generatePredictions(
  eventId: string,
  historicalDensityData: CrowdDensityData[] = [],
  activeAnomalies: any[] = [],
  eventData?: EventData
): Promise<DensityPrediction[]> {
  const predictions: DensityPrediction[] = []
  
  // Get latest density for each zone from historical data
  const latestDensityByZone: Record<string, number> = {}
  
  // Sort by timestamp to ensure we get the latest
  const sortedData = [...historicalDensityData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  
  for (const data of sortedData) {
    latestDensityByZone[data.zone_id] = data.density_percentage
  }

  // Zone capacities (in production, fetch from database)
  const zoneCapacities = {
    "zone-1": 500,
    "zone-2": 400,
    "zone-3": 300,
    "zone-4": 600,
    "zone-5": 2000,
    "zone-6": 200,
    "zone_1": 500,
    "zone_2": 500,
    "zone_3": 800,
    "zone_4": 300,
    "zone_5": 2000,
    "zone_6": 200,
  }

  const currentTime = new Date().toISOString()
  
  // Collect all unique zone IDs
  const allZones = Array.from(new Set([
    ...Object.keys(latestDensityByZone),
    ...Object.keys(zoneCapacities)
  ]))
  
  // We use Promise.all to fetch predictions concurrently for all zones
  const predictionPromises = allZones.map(async (zoneId) => {
    const currentDensity = latestDensityByZone[zoneId] || 0;
    
    // Default fallback prediction
    const fallbackPrediction: DensityPrediction = {
      zoneId,
      currentDensity,
      prediction15Min: currentDensity, // Assume no change if backend fails
      confidence: 0,
      basedOn: "fallback",
      timestamp: currentTime,
      riskLevel: currentDensity > 80 ? "high" : currentDensity > 50 ? "medium" : "low"
    }

    try {
      // Connect to Python FastAPI Backend
      const response = await fetch("http://localhost:8001/predict/crowd-density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          zone_id: zoneId,
          current_density: currentDensity,
          timestamp: currentTime
        }),
        // Fast timeout to avoid hanging the UI if backend is down
        signal: AbortSignal.timeout(3000) 
      });
      
      if (!response.ok) {
        console.error(`Python API failed for zone ${zoneId} with status: ${response.status}`);
        return fallbackPrediction;
      }
      
      const result = await response.json();
      
      // Scale predicted density if returned as 0-1
      const predictedDensityPercent = result.predicted_density <= 1.0 
        ? result.predicted_density * 100 
        : result.predicted_density;
        
      const confidence = result.confidence_score / 100.0;
      
      let riskLevel: "low" | "medium" | "high" = "medium";
      if (predictedDensityPercent > 80) riskLevel = "high";
      else if (predictedDensityPercent < 50) riskLevel = "low";
      
      return {
        zoneId,
        currentDensity,
        prediction15Min: predictedDensityPercent,
        confidence,
        basedOn: "xgboost_backend" as const,
        timestamp: currentTime,
        riskLevel
      };
      
    } catch (error) {
      console.error(`Python ML backend unreachable or failed for zone ${zoneId}:`, error);
      return fallbackPrediction;
    }
  });

  const results = await Promise.all(predictionPromises);
  
  return results;
}
