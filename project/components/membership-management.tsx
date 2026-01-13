"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Users, DollarSign, Crown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface MembershipTier {
  id: string
  name: string
  description: string
  monthly_price: number
  benefits: string[]
  discount_percentage: number
  points_multiplier: number
  active: boolean
}

interface ClientMembership {
  id: string
  client_id: string
  clients: { name: string }
  membership_tiers: MembershipTier
  status: string
  start_date: string
  billing_cycle_day: number
}

export function MembershipManagement() {
  const { user } = useAuth()
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [memberships, setMemberships] = useState<ClientMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthly_price: '',
    discount_percentage: '',
    benefits: [''],
    active: true
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
      const [tiersRes, membershipsRes] = await Promise.all([
        supabase
          .from('membership_tiers')
          .select('*')
          .eq('user_id', user.id)
          .order('monthly_price', { ascending: false }),
        supabase
          .from('client_memberships')
          .select(`
            *,
            clients(name),
            membership_tiers(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
      ])

      if (tiersRes.data) setTiers(tiersRes.data)
      if (membershipsRes.data) setMemberships(membershipsRes.data as any)
    } catch (error) {
      console.error('Error loading membership data:', error)
      toast.error('Failed to load membership data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTier = async () => {
    if (!user) return

    try {
      const tierData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        monthly_price: parseFloat(formData.monthly_price) || 0,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        benefits: formData.benefits.filter(b => b.trim()),
        points_multiplier: 1,
        active: formData.active
      }

      if (editingTier) {
        const { error } = await supabase
          .from('membership_tiers')
          .update(tierData)
          .eq('id', editingTier.id)

        if (error) throw error
        toast.success('Membership tier updated')
      } else {
        const { error } = await supabase
          .from('membership_tiers')
          .insert([tierData])

        if (error) throw error
        toast.success('Membership tier created')
      }

      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Error saving tier:', error)
      toast.error(error.message || 'Failed to save membership tier')
    }
  }

  const handleEditTier = (tier: MembershipTier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      description: tier.description,
      monthly_price: tier.monthly_price.toString(),
      discount_percentage: tier.discount_percentage.toString(),
      benefits: tier.benefits.length > 0 ? tier.benefits : [''],
      active: tier.active
    })
    setDialogOpen(true)
  }

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this membership tier?')) return

    try {
      const { error } = await supabase
        .from('membership_tiers')
        .delete()
        .eq('id', tierId)

      if (error) throw error
      toast.success('Membership tier deleted')
      loadData()
    } catch (error: any) {
      console.error('Error deleting tier:', error)
      toast.error(error.message || 'Failed to delete tier')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthly_price: '',
      discount_percentage: '',
      benefits: [''],
      active: true
    })
    setEditingTier(null)
  }

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b)
    }))
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  if (!user) return null

  const stats = {
    totalMembers: memberships.length,
    monthlyRevenue: memberships.reduce((sum, m) =>
      sum + (m.membership_tiers?.monthly_price || 0), 0),
    averageValue: memberships.length > 0 ?
      memberships.reduce((sum, m) => sum + (m.membership_tiers?.monthly_price || 0), 0) / memberships.length :
      0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Membership Programs</h2>
          <p className="text-gray-500">Recurring revenue & client loyalty</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Membership Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTier ? 'Edit Membership Tier' : 'Create Membership Tier'}
              </DialogTitle>
              <DialogDescription>
                Define the benefits and pricing for this membership level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tier Name</Label>
                <Input
                  placeholder="e.g., VIP Membership, Gold Member"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="What makes this membership special?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monthly Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Discount on Services (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Benefits</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., Priority booking, Free consultation"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label>Active (available for purchase)</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTier}>
                  {editingTier ? 'Update' : 'Create'} Tier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-gray-500">Subscribed clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Recurring income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageValue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Per member</p>
          </CardContent>
        </Card>
      </div>

      {/* Membership Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
          <CardDescription>Manage your membership offerings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded"></div>
              ))}
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No membership tiers yet</h3>
              <p className="text-gray-500 mt-2">Create your first membership program to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiers.map(tier => {
                const memberCount = memberships.filter(m =>
                  m.membership_tiers?.id === tier.id
                ).length

                return (
                  <div
                    key={tier.id}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{tier.name}</h3>
                        <p className="text-gray-500 text-sm">{tier.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {!tier.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEditTier(tier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTier(tier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">${tier.monthly_price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Benefits:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {tier.discount_percentage > 0 && (
                          <li>• {tier.discount_percentage}% discount on all services</li>
                        )}
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx}>• {benefit}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center text-sm">
                      <span className="text-gray-500">{memberCount} members</span>
                      <span className="font-semibold">
                        ${(tier.monthly_price * memberCount).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Memberships */}
      <Card>
        <CardHeader>
          <CardTitle>Active Memberships</CardTitle>
          <CardDescription>Clients with active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active memberships yet
            </div>
          ) : (
            <div className="space-y-2">
              {memberships.map(membership => (
                <div
                  key={membership.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{membership.clients?.name}</div>
                    <div className="text-sm text-gray-500">
                      {membership.membership_tiers?.name} • Started {new Date(membership.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${membership.membership_tiers?.monthly_price}/mo
                    </div>
                    <Badge variant="secondary">
                      Bills on day {membership.billing_cycle_day}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
