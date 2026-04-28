"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  MapPin,
  Clock,
  Upload,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

const incidentTypes = [
  "Medical Emergency",
  "Security Incident",
  "Crowd Control Issue",
  "Technical Problem",
  "Fire Safety Concern",
  "Lost Person",
  "Property Damage",
  "Other",
]

const urgencyLevels = [
  { value: "low", label: "Low - Non-urgent", color: "text-blue-600" },
  { value: "medium", label: "Medium - Requires attention", color: "text-orange-600" },
  { value: "high", label: "High - Immediate response needed", color: "text-red-600" },
  { value: "critical", label: "Critical - Emergency situation", color: "text-red-800" },
]

export default function ReportIncidentPage() {
  const [formData, setFormData] = useState({
    incidentType: "",
    location: "",
    urgency: "",
    description: "",
    reporterName: "",
    reporterContact: "",
    additionalInfo: "",
  })
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [incidentId, setIncidentId] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.incidentType || !formData.location || !formData.urgency || !formData.description) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      let aiAnalysis = ""
      if (attachedFiles.length > 0) {
        const visionFormData = new FormData()
        visionFormData.append("type", "anomaly")
        visionFormData.append("file", attachedFiles[0])
        visionFormData.append("location", formData.location)
        
        const response = await fetch("/api/vision", {
          method: "POST",
          body: visionFormData
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.detection_type && result.detection_type !== "none") {
            const confidence = (result.confidence * 100).toFixed(1)
            aiAnalysis = `\n[AI Detection: ${result.detection_type} with ${confidence}% confidence]`
            alert(`AI Analysis Complete! Detected: ${result.detection_type} (${confidence}% confidence). Record saved.`)
          }
        }
      }

      // Update description with AI findings if any
      setFormData(prev => ({
        ...prev,
        description: prev.description + aiAnalysis
      }))

      const generatedId = "INC-" + Math.random().toString(36).substr(2, 9).toUpperCase()
      setIncidentId(generatedId)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to submit incident report")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation userRole="user" userName="John Doe" eventName="Summer Music Festival 2025" unreadAlerts={3} />

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Incident Reported Successfully!</CardTitle>
              <CardDescription>
                Your incident report has been submitted and is being reviewed by our response team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Incident Reference ID:</p>
                <p className="text-lg font-mono text-primary">{incidentId}</p>
              </div>

              <div className="space-y-2 text-left">
                <h3 className="font-medium">Report Details:</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <p><span className="font-medium">Type:</span> {formData.incidentType}</p>
                  <p><span className="font-medium">Urgency:</span> {urgencyLevels.find(u => u.value === formData.urgency)?.label}</p>
                  <p><span className="font-medium">Location:</span> {formData.location}</p>
                  <p><span className="font-medium">Time:</span> {new Date().toLocaleString()}</p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Our response team has been notified and will address this incident according to the urgency level specified.
                  You will receive updates via the dashboard alerts.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 justify-center">
                <Link href="/dashboard/user">
                  <Button>
                    Return to Dashboard
                  </Button>
                </Link>
                <Link href="/report-incident">
                  <Button variant="outline">
                    Report Another Incident
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="user" userName="John Doe" eventName="Summer Music Festival 2025" unreadAlerts={3} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/user">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Report New Incident
          </h1>
          <p className="text-muted-foreground mt-2">
            Please provide detailed information about the incident to help our response team address it effectively.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentType">Incident Type *</Label>
                  <Select value={formData.incidentType} onValueChange={(value) => handleInputChange("incidentType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level *</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <span className={level.color}>{level.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Stage, Food Court, Parking Lot A, etc."
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide detailed information about the incident, including what happened, who is involved, and any immediate concerns..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional context, specific requirements, or observations..."
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reporter Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reporterName">Your Name</Label>
                  <Input
                    id="reporterName"
                    placeholder="Enter your full name"
                    value={formData.reporterName}
                    onChange={(e) => handleInputChange("reporterName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reporterContact">Contact Information</Label>
                  <Input
                    id="reporterContact"
                    placeholder="Phone number or email"
                    value={formData.reporterContact}
                    onChange={(e) => handleInputChange("reporterContact", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Attach Media (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload photos or videos related to the incident
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      id="fileUpload"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => document.getElementById("fileUpload")?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>

                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Attached Files:</Label>
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => removeFile(index)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-end">
                <Link href="/dashboard/user">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
