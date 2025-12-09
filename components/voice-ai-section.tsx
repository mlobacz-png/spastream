"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, PhoneCall, Clock, DollarSign, FileText, Settings, Loader2, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface VoiceAIConfig {
  id: string
  business_name: string
  vapi_phone_number: string | null
  vapi_assistant_id: string | null
  ai_assistant_name: string
  greeting_message: string
  business_hours: any
  services_offered: string[]
  booking_instructions: string | null
  is_enabled: boolean
  monthly_minutes_included: number
  monthly_minutes_used: number
}

interface CallLog {
  id: string
  vapi_call_id: string
  phone_number_from: string
  call_status: string
  call_duration_seconds: number
  call_cost: number
  transcript: string | null
  summary: string | null
  intent_detected: string | null
  booking_created: boolean
  created_at: string
}

export function VoiceAISection() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [config, setConfig] = useState<VoiceAIConfig | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [businessName, setBusinessName] = useState("")
  const [manualPhoneNumber, setManualPhoneNumber] = useState("")
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [editPhoneNumber, setEditPhoneNumber] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadConfig()
      loadCallLogs()
    }
  }, [user])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("voice_ai_config")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setConfig(data)

      // Also try to get business name from business_information
      if (!data) {
        const { data: businessInfo } = await supabase
          .from("business_information")
          .select("business_name")
          .eq("user_id", user?.id)
          .maybeSingle()

        if (businessInfo) {
          setBusinessName(businessInfo.business_name)
        }
      }
    } catch (error: any) {
      console.error("Error loading voice AI config:", error)
      toast.error("Failed to load voice AI settings")
    } finally {
      setLoading(false)
    }
  }

  const loadCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("voice_ai_call_logs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setCallLogs(data || [])
    } catch (error: any) {
      console.error("Error loading call logs:", error)
    }
  }

  const provisionPhoneNumber = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter your business name")
      return
    }

    try {
      setProvisioning(true)
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/provision-voice-number`
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          aiAssistantName: "Sarah",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to provision phone number")
      }

      toast.success(`Phone number ${result.phoneNumber} provisioned successfully!`)
      await loadConfig()
    } catch (error: any) {
      console.error("Error provisioning phone number:", error)
      toast.error(error.message || "Failed to provision phone number")
    } finally {
      setProvisioning(false)
    }
  }

  const saveManualConfig = async () => {
    if (!businessName.trim()) {
      toast.error("Please enter your business name")
      return
    }

    if (!manualPhoneNumber.trim()) {
      toast.error("Please enter your Vapi phone number")
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from("voice_ai_config")
        .insert({
          user_id: user?.id,
          business_name: businessName.trim(),
          vapi_phone_number: manualPhoneNumber.trim(),
          ai_assistant_name: "Sarah",
          is_enabled: false,
        })

      if (error) throw error

      toast.success("Configuration saved successfully!")
      await loadConfig()
    } catch (error: any) {
      console.error("Error saving config:", error)
      toast.error(error.message || "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("voice_ai_config")
        .update({
          vapi_assistant_id: config.vapi_assistant_id,
          ai_assistant_name: config.ai_assistant_name,
          greeting_message: config.greeting_message,
          booking_instructions: config.booking_instructions,
          is_enabled: config.is_enabled,
        })
        .eq("user_id", user?.id)

      if (error) throw error

      toast.success("Settings saved successfully")
    } catch (error: any) {
      console.error("Error saving config:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const toggleVoiceAI = async (enabled: boolean) => {
    if (!config) return

    try {
      const { error } = await supabase
        .from("voice_ai_config")
        .update({ is_enabled: enabled })
        .eq("user_id", user?.id)

      if (error) throw error

      setConfig({ ...config, is_enabled: enabled })
      toast.success(enabled ? "Voice AI enabled" : "Voice AI disabled")
    } catch (error: any) {
      console.error("Error toggling voice AI:", error)
      toast.error("Failed to update status")
    }
  }

  const openEditDialog = () => {
    setEditPhoneNumber(config?.vapi_phone_number || "")
    setShowEditDialog(true)
  }

  const updatePhoneNumber = async () => {
    if (!config || !editPhoneNumber.trim()) {
      toast.error("Please enter a valid phone number")
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from("voice_ai_config")
        .update({ vapi_phone_number: editPhoneNumber.trim() })
        .eq("user_id", user?.id)

      if (error) throw error

      setConfig({ ...config, vapi_phone_number: editPhoneNumber.trim() })
      toast.success("Phone number updated successfully")
      setShowEditDialog(false)
    } catch (error: any) {
      console.error("Error updating phone number:", error)
      toast.error("Failed to update phone number")
    } finally {
      setSaving(false)
    }
  }

  const deletePhoneNumber = async () => {
    if (!config) return

    try {
      setDeleting(true)
      const { error } = await supabase
        .from("voice_ai_config")
        .delete()
        .eq("user_id", user?.id)

      if (error) throw error

      setConfig(null)
      toast.success("Voice AI configuration deleted successfully")
    } catch (error: any) {
      console.error("Error deleting configuration:", error)
      toast.error("Failed to delete configuration")
    } finally {
      setDeleting(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice AI Phone System
          </CardTitle>
          <CardDescription>
            Give your med spa a 24/7 AI-powered phone receptionist that never sleeps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {showManualEntry
                ? "Enter your existing Vapi phone number and configuration details."
                : "Get started by provisioning a new number, or connect your existing Vapi phone number."}
            </AlertDescription>
          </Alert>

          {!showManualEntry ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Radiant Med Spa"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <Button
                onClick={provisionPhoneNumber}
                disabled={provisioning}
                size="lg"
                className="w-full"
              >
                {provisioning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning Number...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Get Your AI Phone Number
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                onClick={() => setShowManualEntry(true)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                I Already Have a Vapi Number
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Radiant Med Spa"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="manualPhoneNumber">Vapi Phone Number</Label>
                <Input
                  id="manualPhoneNumber"
                  placeholder="e.g., +15551234567"
                  value={manualPhoneNumber}
                  onChange={(e) => setManualPhoneNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The phone number from your Vapi dashboard
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowManualEntry(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={saveManualConfig}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold">What You'll Get:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Dedicated local phone number for your business</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>24/7 AI receptionist that sounds natural and professional</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Automatic appointment booking and service information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Full call transcripts and analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>300 minutes included monthly (expandable)</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  const minutesPercentage = (config.monthly_minutes_used / config.monthly_minutes_included) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Voice AI Phone System
              </CardTitle>
              <CardDescription>
                Manage your AI receptionist and view call activity
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={config.is_enabled ? "default" : "secondary"}>
                  {config.is_enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Switch
                checked={config.is_enabled}
                onCheckedChange={toggleVoiceAI}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Your Number</div>
                      <div className="text-lg font-semibold">
                        {config.vapi_phone_number ? formatPhoneNumber(config.vapi_phone_number) : "Not set"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openEditDialog}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Voice AI Configuration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete your entire Voice AI configuration including call history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deletePhoneNumber}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <PhoneCall className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Calls</div>
                    <div className="text-lg font-semibold">{callLogs.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Minutes Used</div>
                    <div className="text-lg font-semibold">
                      {config.monthly_minutes_used} / {config.monthly_minutes_included}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(minutesPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="calls">Call History</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="vapiAssistantId">Vapi Assistant ID</Label>
                <Input
                  id="vapiAssistantId"
                  value={config.vapi_assistant_id || ""}
                  onChange={(e) => setConfig({ ...config, vapi_assistant_id: e.target.value })}
                  placeholder="asst_xxxxxxxxxxxxx"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your Vapi Assistant ID from the dashboard
                </p>
              </div>

              <div>
                <Label htmlFor="assistantName">AI Assistant Name</Label>
                <Input
                  id="assistantName"
                  value={config.ai_assistant_name}
                  onChange={(e) => setConfig({ ...config, ai_assistant_name: e.target.value })}
                  placeholder="e.g., Sarah"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The name your AI assistant will introduce herself as
                </p>
              </div>

              <div>
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={config.greeting_message}
                  onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                  placeholder="Thank you for calling! How can I help you today?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Booking Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={config.booking_instructions || ""}
                  onChange={(e) => setConfig({ ...config, booking_instructions: e.target.value })}
                  placeholder="e.g., Require 24-hour notice for cancellations, ask about allergies for new clients..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Special instructions for the AI when handling bookings
                </p>
              </div>

              <Button onClick={saveConfig} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="calls" className="mt-6">
              {callLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PhoneCall className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calls yet</p>
                  <p className="text-sm">Your call history will appear here</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Intent</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callLogs.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell>
                            {new Date(call.created_at).toLocaleDateString()} {new Date(call.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>{formatPhoneNumber(call.phone_number_from)}</TableCell>
                          <TableCell>{formatDuration(call.call_duration_seconds)}</TableCell>
                          <TableCell>
                            <Badge variant={call.call_status === "completed" ? "default" : "secondary"}>
                              {call.call_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {call.intent_detected && (
                              <Badge variant="outline">{call.intent_detected}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Call Details</DialogTitle>
                                  <DialogDescription>
                                    {new Date(call.created_at).toLocaleString()}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {call.summary || "No summary available"}
                                    </p>
                                  </div>
                                  {call.transcript && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Transcript</h4>
                                      <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                                        {call.transcript}
                                      </div>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Duration:</span>{" "}
                                      {formatDuration(call.call_duration_seconds)}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Cost:</span> ${call.call_cost.toFixed(4)}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Phone Number Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phone Number</DialogTitle>
            <DialogDescription>
              Update your Vapi phone number
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                placeholder="e.g., +15551234567"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the phone number from your Vapi dashboard
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={updatePhoneNumber}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
