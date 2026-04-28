"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Search,
  Upload,
  TrendingUp,
  Activity,
  MessageCircle,
  Camera,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { AIChatbot } from "@/components/ai-chatbot"
import { AIAnomalyDetection } from "@/components/ai-anomaly-detection"
import { Navigation } from "@/components/navigation"
import Link from "next/link"

// Mock data for demonstrations
const mockCrowdData = [
  { time: "10:00", density: 45, prediction: 52 },
  { time: "10:15", density: 52, prediction: 58 },
  { time: "10:30", density: 58, prediction: 65 },
  { time: "10:45", density: 65, prediction: 72 },
  { time: "11:00", density: 72, prediction: 78 },
  { time: "11:15", density: 78, prediction: 85 },
]

const mockZones = [
  { id: "main-stage", name: "Main Stage", density: 85, status: "high", prediction: 92 },
  { id: "food-court", name: "Food Court", density: 72, status: "medium", prediction: 68 },
  { id: "entrance-a", name: "Entrance A", density: 45, status: "low", prediction: 48 },
  { id: "vip-area", name: "VIP Area", density: 28, status: "low", prediction: 32 },
  { id: "parking", name: "Parking Lot", density: 60, status: "medium", prediction: 55 },
]

const mockAlerts = [
  {
    id: 1,
    type: "crowd",
    severity: "high",
    message: "High crowd density detected at Main Stage",
    time: "2 minutes ago",
    zone: "Main Stage",
  },
  {
    id: 2,
    type: "anomaly",
    severity: "medium",
    message: "Unusual movement pattern detected",
    time: "5 minutes ago",
    zone: "Food Court",
  },
  {
    id: 3,
    type: "prediction",
    severity: "low",
    message: "Crowd surge predicted in 10 minutes",
    time: "8 minutes ago",
    zone: "Entrance A",
  },
]

export default function UserDashboard() {
  const [selectedZone, setSelectedZone] = useState("main-stage")
  const [selectedTab, setSelectedTab] = useState("heatmap")
  const [lostPersonForm, setLostPersonForm] = useState({
    name: "",
    description: "",
    lastSeen: "",
    contact: "",
    image: null as File | null,
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "text-destructive"
      case "medium":
        return "text-warning"
      case "low":
        return "text-success"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleLostPersonSearch = async () => {
    if (!lostPersonForm.name || !lostPersonForm.description) return

    setIsSearching(true)
    
    try {
      if (lostPersonForm.image) {
        const formData = new FormData()
        formData.append("type", "person_register")
        formData.append("file", lostPersonForm.image)
        formData.append("name", lostPersonForm.name)
        formData.append("description", lostPersonForm.description)
        formData.append("lastSeen", lostPersonForm.lastSeen)
        formData.append("contact", lostPersonForm.contact)
        
        const response = await fetch("/api/vision", {
          method: "POST",
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          alert(`Person registered with AI System! ID: ${result.person_id}`)
          // Clear form after successful registration
          setLostPersonForm({
            name: "",
            description: "",
            lastSeen: "",
            contact: "",
            image: null,
          })
        } else {
          alert("Could not register with AI. Backend might be unreachable.")
        }
      } else {
        alert("Please upload a photo for AI facial recognition.")
      }
    } catch (error) {
      console.error(error)
      alert("Error contacting the vision system.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === "lost-found") {
      window.open('https://lost-and-found-396665235482.us-west1.run.app/', '_blank');
    } else {
      setSelectedTab(value);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Component */}
      <Navigation userRole="user" userName="John Doe" eventName="Summer Music Festival 2025" unreadAlerts={3} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Real-time Alerts */}
            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <Alert key={alert.id} className={alert.severity === "high" ? "border-destructive" : ""}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-muted-foreground ml-2">• {alert.zone}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{alert.time}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>

            <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="lost-found">Lost & Found</TabsTrigger>
              </TabsList>

              {/* Heat Map Tab */}
              <TabsContent value="heatmap" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Real-time Crowd Heat Map</span>
                    </CardTitle>
                    <CardDescription>Interactive crowd density visualization by zone</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Mock Heat Map Visualization */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {mockZones.map((zone) => (
                        <Card
                          key={zone.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedZone === zone.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => setSelectedZone(zone.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-sm">{zone.name}</h3>
                              <Badge variant={getStatusBadge(zone.status)}>{zone.status}</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Current</span>
                                <span className={getStatusColor(zone.status)}>{zone.density}%</span>
                              </div>
                              <Progress value={zone.density} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Predicted</span>
                                <span>{zone.prediction}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Selected Zone Details */}
                    {selectedZone && (
                      <Card className="bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {mockZones.find((z) => z.id === selectedZone)?.name} - Detailed View
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-3">Crowd Density Trend</h4>
                              <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={mockCrowdData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Area
                                    type="monotone"
                                    dataKey="density"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary))"
                                    fillOpacity={0.3}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <div>
                              <h4 className="font-medium mb-3">Zone Statistics</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Current Capacity</span>
                                  <span className="font-medium">
                                    {mockZones.find((z) => z.id === selectedZone)?.density}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Peak Today</span>
                                  <span className="font-medium">89%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Average</span>
                                  <span className="font-medium">64%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Active Cameras</span>
                                  <span className="font-medium">4/4</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>15-Minute Crowd Predictions</span>
                    </CardTitle>
                    <CardDescription>AI-powered crowd flow forecasting using WE-GCN model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mockCrowdData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="density"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name="Current Density"
                          />
                          <Line
                            type="monotone"
                            dataKey="prediction"
                            stroke="hsl(var(--accent))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Predicted Density"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      <div className="grid md:grid-cols-3 gap-4">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-medium">Next 5 Minutes</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">+8%</p>
                            <p className="text-sm text-muted-foreground">Density increase expected</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-warning/5 border-warning/20">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              <span className="font-medium">Peak Prediction</span>
                            </div>
                            <p className="text-2xl font-bold text-warning">11:30 AM</p>
                            <p className="text-sm text-muted-foreground">Expected peak time</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-success/5 border-success/20">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Activity className="h-4 w-4 text-success" />
                              <span className="font-medium">Confidence</span>
                            </div>
                            <p className="text-2xl font-bold text-success">87%</p>
                            <p className="text-sm text-muted-foreground">Model accuracy</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Lost & Found Tab */}
              <TabsContent value="lost-found" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Lost Person Search</span>
                    </CardTitle>
                    <CardDescription>
                      Upload a photo and description to search across all CCTV cameras using AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="personName">Person's Name</Label>
                          <Input
                            id="personName"
                            placeholder="Enter the person's name"
                            value={lostPersonForm.name}
                            onChange={(e) => setLostPersonForm({ ...lostPersonForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe clothing, appearance, distinctive features..."
                            value={lostPersonForm.description}
                            onChange={(e) => setLostPersonForm({ ...lostPersonForm, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastSeen">Last Seen Location</Label>
                          <Input
                            id="lastSeen"
                            placeholder="Where were they last seen?"
                            value={lostPersonForm.lastSeen}
                            onChange={(e) => setLostPersonForm({ ...lostPersonForm, lastSeen: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact">Contact Information</Label>
                          <Input
                            id="contact"
                            placeholder="Your phone number"
                            value={lostPersonForm.contact}
                            onChange={(e) => setLostPersonForm({ ...lostPersonForm, contact: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="photo">Upload Photo</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Click to upload or drag and drop a clear photo
                            </p>
                            <Input
                              id="photo"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                setLostPersonForm({ ...lostPersonForm, image: e.target.files?.[0] || null })
                              }
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById("photo")?.click()}
                              className="bg-transparent"
                            >
                              Choose File
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={handleLostPersonSearch}
                          disabled={isSearching || !lostPersonForm.name || !lostPersonForm.description}
                          className="w-full"
                        >
                          {isSearching ? "Searching..." : "Search CCTV Cameras"}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium">Search Results</h3>
                        {isSearching && (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Analyzing CCTV footage...</p>
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="space-y-3">
                            {searchResults.map((result) => (
                              <Card key={result.id} className="border-success/20">
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <img
                                      src={result.image || "/placeholder.svg"}
                                      alt="Found person"
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge className="bg-success/10 text-success border-success/20">
                                          {result.confidence}% Match
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                                      </div>
                                      <p className="font-medium text-sm">{result.location}</p>
                                      <Button size="sm" className="mt-2">
                                        <Camera className="h-3 w-3 mr-1" />
                                        View Live Feed
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                        {!isSearching && searchResults.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No search results yet. Fill out the form and click search to begin.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* AI Anomaly Detection */}
            <AIAnomalyDetection context="user" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/report-incident">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent sm:w-auto sm:flex-1 md:w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report New Incident
                  </Button>
                </Link>
                <Link href="/request-backup">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent sm:w-auto sm:flex-1 md:w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Request Backup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbot context="user" />
    </div>
  )
}
