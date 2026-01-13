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
import { Progress } from "@/components/ui/progress"
import { Plus, Target, TrendingUp, DollarSign, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns"

interface StaffMember {
  id: string
  name: string
  role: string
}

interface ProviderGoal {
  id: string
  staff_member_id: string
  staff_members?: StaffMember
  goal_period: string
  period_start: string
  period_end: string
  revenue_goal: number
  procedure_count_goal: number
  retail_sales_goal: number
  bonus_amount: number
  bonus_percentage: number
  status: string
  actual_revenue: number
  actual_procedure_count: number
  actual_retail_sales: number
  notes: string
  achieved_at?: string
}

export function ProviderGoalsBonuses() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<ProviderGoal[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    staff_member_id: '',
    goal_period: 'monthly',
    revenue_goal: '',
    procedure_count_goal: '',
    retail_sales_goal: '',
    bonus_amount: '',
    bonus_percentage: '',
    notes: ''
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
      const [goalsRes, staffRes] = await Promise.all([
        supabase
          .from('provider_goals')
          .select('*, staff_members(id, name, role)')
          .eq('user_id', user.id)
          .order('period_start', { ascending: false }),
        supabase
          .from('staff_members')
          .select('id, name, role')
          .eq('user_id', user.id)
          .eq('is_active', true)
      ])

      if (goalsRes.data) {
        // Calculate actual performance for each goal
        const goalsWithActuals = await Promise.all(
          goalsRes.data.map(async (goal) => {
            const { data: appointments } = await supabase
              .from('appointments')
              .select('amount_paid, service')
              .eq('user_id', user.id)
              .eq('staff_member_id', goal.staff_member_id)
              .eq('payment_status', 'paid')
              .gte('start_time', goal.period_start)
              .lte('start_time', goal.period_end)

            const { data: retailSales } = await supabase
              .from('retail_sales')
              .select('total')
              .eq('user_id', user.id)
              .eq('staff_member_id', goal.staff_member_id)
              .gte('sale_date', goal.period_start)
              .lte('sale_date', goal.period_end)

            const actualRevenue = appointments?.reduce((sum, apt) =>
              sum + (Number(apt.amount_paid) || 0), 0) || 0

            const actualRetailSales = retailSales?.reduce((sum, sale) =>
              sum + (Number(sale.total) || 0), 0) || 0

            const actualProcedureCount = appointments?.length || 0

            // Update the goal with actual data
            await supabase
              .from('provider_goals')
              .update({
                actual_revenue: actualRevenue,
                actual_procedure_count: actualProcedureCount,
                actual_retail_sales: actualRetailSales
              })
              .eq('id', goal.id)

            return {
              ...goal,
              actual_revenue: actualRevenue,
              actual_procedure_count: actualProcedureCount,
              actual_retail_sales: actualRetailSales
            }
          })
        )

        setGoals(goalsWithActuals as any)
      }

      if (staffRes.data) setStaffMembers(staffRes.data)
    } catch (error) {
      console.error('Error loading goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGoal = async () => {
    if (!user || !formData.staff_member_id) {
      toast.error('Please select a staff member')
      return
    }

    try {
      const now = new Date()
      let periodStart: Date, periodEnd: Date

      switch (formData.goal_period) {
        case 'daily':
          periodStart = new Date(now.setHours(0, 0, 0, 0))
          periodEnd = new Date(now.setHours(23, 59, 59, 999))
          break
        case 'weekly':
          periodStart = startOfWeek(now)
          periodEnd = endOfWeek(now)
          break
        case 'monthly':
          periodStart = startOfMonth(now)
          periodEnd = endOfMonth(now)
          break
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3)
          periodStart = new Date(now.getFullYear(), quarter * 3, 1)
          periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
          break
        case 'yearly':
          periodStart = new Date(now.getFullYear(), 0, 1)
          periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
          break
        default:
          periodStart = startOfMonth(now)
          periodEnd = endOfMonth(now)
      }

      const goalData = {
        user_id: user.id,
        staff_member_id: formData.staff_member_id,
        goal_period: formData.goal_period,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        revenue_goal: parseFloat(formData.revenue_goal) || 0,
        procedure_count_goal: parseInt(formData.procedure_count_goal) || 0,
        retail_sales_goal: parseFloat(formData.retail_sales_goal) || 0,
        bonus_amount: parseFloat(formData.bonus_amount) || 0,
        bonus_percentage: parseFloat(formData.bonus_percentage) || 0,
        status: 'active',
        notes: formData.notes
      }

      const { error } = await supabase
        .from('provider_goals')
        .insert([goalData])

      if (error) throw error

      toast.success('Goal created successfully')
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Error saving goal:', error)
      toast.error(error.message || 'Failed to save goal')
    }
  }

  const markGoalAchieved = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('provider_goals')
        .update({
          status: 'achieved',
          achieved_at: new Date().toISOString()
        })
        .eq('id', goalId)

      if (error) throw error

      toast.success('Goal marked as achieved!')
      loadData()
    } catch (error: any) {
      console.error('Error updating goal:', error)
      toast.error(error.message || 'Failed to update goal')
    }
  }

  const resetForm = () => {
    setFormData({
      staff_member_id: '',
      goal_period: 'monthly',
      revenue_goal: '',
      procedure_count_goal: '',
      retail_sales_goal: '',
      bonus_amount: '',
      bonus_percentage: '',
      notes: ''
    })
  }

  if (!user) return null

  const activeGoals = goals.filter(g => g.status === 'active')
  const achievedGoals = goals.filter(g => g.status === 'achieved')

  const totalBonusesEarned = achievedGoals.reduce((sum, g) => {
    let bonus = g.bonus_amount
    if (g.bonus_percentage > 0 && g.actual_revenue > 0) {
      bonus += (g.actual_revenue * g.bonus_percentage / 100)
    }
    return sum + bonus
  }, 0)

  const getProgressPercentage = (actual: number, goal: number) => {
    if (goal === 0) return 0
    return Math.min((actual / goal) * 100, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'achieved': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Provider Goals & Bonuses</h2>
          <p className="text-gray-500">Track performance and incentivize your team</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Provider Goal</DialogTitle>
              <DialogDescription>Set targets and bonuses for your staff</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <Select
                  value={formData.staff_member_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, staff_member_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Goal Period</Label>
                <Select
                  value={formData.goal_period}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, goal_period: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Revenue Goal ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.revenue_goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, revenue_goal: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Procedure Count Goal</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.procedure_count_goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, procedure_count_goal: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Retail Sales Goal ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.retail_sales_goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, retail_sales_goal: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fixed Bonus Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.bonus_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonus_amount: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">One-time bonus if goal is met</p>
                </div>
                <div>
                  <Label>Bonus Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.bonus_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, bonus_percentage: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">% of revenue as bonus</p>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional details about this goal..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveGoal}>Create Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achieved</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievedGoals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBonusesEarned.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? ((achievedGoals.length / goals.length) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Active Goals</CardTitle>
          <CardDescription>Current performance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-48 rounded"></div>
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No active goals</h3>
              <p className="text-gray-500 mt-2">Create goals to track provider performance</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeGoals.map(goal => {
                const revenueProgress = getProgressPercentage(goal.actual_revenue, goal.revenue_goal)
                const procedureProgress = getProgressPercentage(goal.actual_procedure_count, goal.procedure_count_goal)
                const retailProgress = getProgressPercentage(goal.actual_retail_sales, goal.retail_sales_goal)

                const allGoalsMet = (
                  (goal.revenue_goal === 0 || goal.actual_revenue >= goal.revenue_goal) &&
                  (goal.procedure_count_goal === 0 || goal.actual_procedure_count >= goal.procedure_count_goal) &&
                  (goal.retail_sales_goal === 0 || goal.actual_retail_sales >= goal.retail_sales_goal)
                )

                const potentialBonus = goal.bonus_amount +
                  (goal.bonus_percentage > 0 ? (goal.actual_revenue * goal.bonus_percentage / 100) : 0)

                return (
                  <div key={goal.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{goal.staff_members?.name}</h3>
                        <p className="text-sm text-gray-500">
                          {goal.goal_period.charAt(0).toUpperCase() + goal.goal_period.slice(1)} Goal •{' '}
                          {format(new Date(goal.period_start), 'MMM d')} - {format(new Date(goal.period_end), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {goal.revenue_goal > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Revenue</span>
                            <span className="font-semibold">
                              ${goal.actual_revenue.toLocaleString()} / ${goal.revenue_goal.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={revenueProgress} className="h-2" />
                          <div className="text-xs text-gray-500">{revenueProgress.toFixed(0)}% complete</div>
                        </div>
                      )}

                      {goal.procedure_count_goal > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Procedures</span>
                            <span className="font-semibold">
                              {goal.actual_procedure_count} / {goal.procedure_count_goal}
                            </span>
                          </div>
                          <Progress value={procedureProgress} className="h-2" />
                          <div className="text-xs text-gray-500">{procedureProgress.toFixed(0)}% complete</div>
                        </div>
                      )}

                      {goal.retail_sales_goal > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Retail Sales</span>
                            <span className="font-semibold">
                              ${goal.actual_retail_sales.toLocaleString()} / ${goal.retail_sales_goal.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={retailProgress} className="h-2" />
                          <div className="text-xs text-gray-500">{retailProgress.toFixed(0)}% complete</div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <div className="text-sm text-gray-500">Potential Bonus</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${potentialBonus.toLocaleString()}
                        </div>
                      </div>
                      {allGoalsMet && (
                        <Button onClick={() => markGoalAchieved(goal.id)}>
                          Mark as Achieved
                        </Button>
                      )}
                    </div>

                    {goal.notes && (
                      <div className="text-sm text-gray-600 pt-2 border-t">
                        <span className="font-medium">Notes:</span> {goal.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achieved Goals */}
      {achievedGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Achieved Goals</CardTitle>
            <CardDescription>Successful performance milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievedGoals.slice(0, 5).map(goal => {
                const bonus = goal.bonus_amount +
                  (goal.bonus_percentage > 0 ? (goal.actual_revenue * goal.bonus_percentage / 100) : 0)

                return (
                  <div key={goal.id} className="flex justify-between items-center p-4 border rounded-lg bg-green-50">
                    <div>
                      <div className="font-bold">{goal.staff_members?.name}</div>
                      <div className="text-sm text-gray-600">
                        {goal.goal_period} • Achieved {goal.achieved_at && format(new Date(goal.achieved_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Revenue: ${goal.actual_revenue.toLocaleString()} •
                        Procedures: {goal.actual_procedure_count} •
                        Retail: ${goal.actual_retail_sales.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Bonus Earned</div>
                      <div className="text-xl font-bold text-green-600">${bonus.toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
