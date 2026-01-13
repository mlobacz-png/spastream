"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Phone, Mail, Calendar, TrendingUp, UserPlus, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface LeadSource {
  id: string
  name: string
  category: string
  cost_per_month: number
  active: boolean
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  status: string
  interested_in: string[]
  notes: string
  lead_sources?: LeadSource
  created_at: string
  contacted_at?: string
  converted_at?: string
  lost_reason?: string
}

interface Consultation {
  id: string
  lead_id?: string
  client_id?: string
  consultation_date: string
  status: string
  services_discussed: string[]
  estimated_value: number
  converted_to_treatment: boolean
  conversion_value: number
  notes: string
}

export function LeadTrackingSection() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [sources, setSources] = useState<LeadSource[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false)

  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    lead_source_id: '',
    interested_in: '',
    notes: '',
    acquisition_cost: ''
  })

  const [sourceForm, setSourceForm] = useState({
    name: '',
    category: 'online_ad',
    cost_per_month: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const [leadsRes, sourcesRes, consultationsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*, lead_sources(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('lead_sources')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true),
        supabase
          .from('consultations')
          .select('*')
          .eq('user_id', user.id)
          .order('consultation_date', { ascending: false })
      ])

      if (leadsRes.data) setLeads(leadsRes.data as any)
      if (sourcesRes.data) setSources(sourcesRes.data)
      if (consultationsRes.data) setConsultations(consultationsRes.data)
    } catch (error) {
      console.error('Error loading lead data:', error)
      toast.error('Failed to load lead data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLead = async () => {
    if (!user || !leadForm.name) {
      toast.error('Name is required')
      return
    }

    try {
      const leadData = {
        user_id: user.id,
        name: leadForm.name,
        phone: leadForm.phone,
        email: leadForm.email,
        lead_source_id: leadForm.lead_source_id || null,
        interested_in: leadForm.interested_in.split(',').map(s => s.trim()).filter(Boolean),
        notes: leadForm.notes,
        acquisition_cost: parseFloat(leadForm.acquisition_cost) || 0,
        status: 'new'
      }

      const { error } = await supabase
        .from('leads')
        .insert([leadData])

      if (error) throw error

      toast.success('Lead added successfully')
      setLeadDialogOpen(false)
      resetLeadForm()
      loadData()
    } catch (error: any) {
      console.error('Error saving lead:', error)
      toast.error(error.message || 'Failed to save lead')
    }
  }

  const handleSaveSource = async () => {
    if (!user || !sourceForm.name) {
      toast.error('Source name is required')
      return
    }

    try {
      const sourceData = {
        user_id: user.id,
        name: sourceForm.name,
        category: sourceForm.category,
        cost_per_month: parseFloat(sourceForm.cost_per_month) || 0,
        active: true
      }

      const { error } = await supabase
        .from('lead_sources')
        .insert([sourceData])

      if (error) throw error

      toast.success('Lead source added')
      setSourceDialogOpen(false)
      resetSourceForm()
      loadData()
    } catch (error: any) {
      console.error('Error saving source:', error)
      toast.error(error.message || 'Failed to save source')
    }
  }

  const updateLeadStatus = async (leadId: string, status: string, additionalData: any = {}) => {
    try {
      const updateData: any = { status, ...additionalData }

      if (status === 'contacted' && !leads.find(l => l.id === leadId)?.contacted_at) {
        updateData.contacted_at = new Date().toISOString()
      }

      if (status === 'converted') {
        updateData.converted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)

      if (error) throw error

      toast.success('Lead status updated')
      loadData()
    } catch (error: any) {
      console.error('Error updating lead:', error)
      toast.error(error.message || 'Failed to update lead')
    }
  }

  const resetLeadForm = () => {
    setLeadForm({
      name: '',
      phone: '',
      email: '',
      lead_source_id: '',
      interested_in: '',
      notes: '',
      acquisition_cost: ''
    })
  }

  const resetSourceForm = () => {
    setSourceForm({
      name: '',
      category: 'online_ad',
      cost_per_month: ''
    })
  }

  if (!user) return null

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    consultationScheduled: leads.filter(l => l.status === 'consultation_scheduled').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
    conversionRate: leads.length > 0 ? (leads.filter(l => l.status === 'converted').length / leads.length * 100) : 0
  }

  const consultationStats = {
    total: consultations.length,
    scheduled: consultations.filter(c => c.status === 'scheduled').length,
    completed: consultations.filter(c => c.status === 'completed').length,
    converted: consultations.filter(c => c.converted_to_treatment).length,
    conversionRate: consultations.filter(c => c.status === 'completed').length > 0 ?
      (consultations.filter(c => c.converted_to_treatment).length /
       consultations.filter(c => c.status === 'completed').length * 100) : 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'consultation_scheduled': return 'bg-purple-100 text-purple-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Lead Tracking & Conversions</h2>
          <p className="text-gray-500">Manage your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Lead Source</DialogTitle>
                <DialogDescription>Track where your leads come from</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Source Name</Label>
                  <Input
                    placeholder="e.g., Instagram Ads, Referrals"
                    value={sourceForm.name}
                    onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={sourceForm.category}
                    onValueChange={(value) => setSourceForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online_ad">Online Advertising</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Monthly Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sourceForm.cost_per_month}
                    onChange={(e) => setSourceForm(prev => ({ ...prev, cost_per_month: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSourceDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveSource}>Add Source</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Capture a new potential client</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Lead Source</Label>
                  <Select
                    value={leadForm.lead_source_id}
                    onValueChange={(value) => setLeadForm(prev => ({ ...prev, lead_source_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interested In</Label>
                  <Input
                    placeholder="Botox, Fillers, Hydrafacial (comma separated)"
                    value={leadForm.interested_in}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, interested_in: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Acquisition Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={leadForm.acquisition_cost}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, acquisition_cost: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any additional information..."
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLeadDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveLead}>Add Lead</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conversion Funnel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Consult</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.consultationScheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conv. Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationStats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationStats.converted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consult Conv. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultationStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Target: 55%</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>Manage your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="new">New ({stats.new})</TabsTrigger>
              <TabsTrigger value="contacted">Contacted ({stats.contacted})</TabsTrigger>
              <TabsTrigger value="consultation_scheduled">Scheduled ({stats.consultationScheduled})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4">
              {leads.map(lead => (
                <div key={lead.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold">{lead.name}</h4>
                      <div className="text-sm text-gray-500 space-x-2">
                        {lead.phone && <span><Phone className="inline h-3 w-3" /> {lead.phone}</span>}
                        {lead.email && <span><Mail className="inline h-3 w-3" /> {lead.email}</span>}
                      </div>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {lead.interested_in.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-500">Interested in:</span> {lead.interested_in.join(', ')}
                    </div>
                  )}

                  {lead.lead_sources && (
                    <div className="text-sm text-gray-500">
                      Source: {lead.lead_sources.name}
                    </div>
                  )}

                  {lead.notes && (
                    <div className="text-sm text-gray-600">{lead.notes}</div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {lead.status === 'new' && (
                      <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'contacted')}>
                        Mark Contacted
                      </Button>
                    )}
                    {lead.status === 'contacted' && (
                      <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'consultation_scheduled')}>
                        Schedule Consultation
                      </Button>
                    )}
                    {lead.status === 'consultation_scheduled' && (
                      <Button size="sm" variant="outline" onClick={() => updateLeadStatus(lead.id, 'converted')}>
                        Mark Converted
                      </Button>
                    )}
                    {lead.status !== 'lost' && lead.status !== 'converted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Reason for losing this lead:')
                          if (reason) {
                            updateLeadStatus(lead.id, 'lost', { lost_reason: reason })
                          }
                        }}
                      >
                        Mark Lost
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {leads.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold">No leads yet</h3>
                  <p className="text-gray-500 mt-2">Add your first lead to start tracking conversions</p>
                </div>
              )}
            </TabsContent>

            {['new', 'contacted', 'consultation_scheduled'].map(status => (
              <TabsContent key={status} value={status} className="space-y-2 mt-4">
                {leads.filter(l => l.status === status).map(lead => (
                  <div key={lead.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{lead.name}</h4>
                        <div className="text-sm text-gray-500 space-x-2">
                          {lead.phone && <span><Phone className="inline h-3 w-3" /> {lead.phone}</span>}
                          {lead.email && <span><Mail className="inline h-3 w-3" /> {lead.email}</span>}
                        </div>
                      </div>
                    </div>
                    {lead.interested_in.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Interested in:</span> {lead.interested_in.join(', ')}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {status === 'new' && (
                        <Button size="sm" onClick={() => updateLeadStatus(lead.id, 'contacted')}>
                          Mark Contacted
                        </Button>
                      )}
                      {status === 'contacted' && (
                        <Button size="sm" onClick={() => updateLeadStatus(lead.id, 'consultation_scheduled')}>
                          Schedule Consultation
                        </Button>
                      )}
                      {status === 'consultation_scheduled' && (
                        <Button size="sm" onClick={() => updateLeadStatus(lead.id, 'converted')}>
                          Mark Converted
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
