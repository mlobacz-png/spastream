"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3 } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AdvancedReportsDashboard() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any>({
    revenueByProcedure: [],
    revenueByProvider: [],
    revenuePerRoom: [],
    conversionRates: null,
    membershipStats: null,
    profitMargins: [],
    costPerLead: [],
    averageSpend: 0,
    retailSales: [],
    providerGoals: [],
    retentionRate: 0,
    totalRevenue: 0,
    totalProfit: 0
  })

  useEffect(() => {
    if (user) {
      loadReports()
    }
  }, [user, dateRange])

  const loadReports = async () => {
    if (!user) return
    setLoading(true)

    try {
      const startDate = dateRange.from.toISOString()
      const endDate = dateRange.to.toISOString()

      // 1. Revenue per procedure
      const { data: procedureRevenue } = await supabase
        .rpc('get_revenue_per_procedure', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      // 2. Revenue per provider
      const { data: providerRevenue } = await supabase
        .rpc('get_revenue_per_provider', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      // 3. Conversion rates
      const { data: conversionData } = await supabase
        .rpc('get_conversion_rates', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      // 4. Average customer spend
      const { data: avgSpend } = await supabase
        .rpc('get_average_customer_spend', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      // 5. Cost per lead
      const { data: leadCosts } = await supabase
        .rpc('get_cost_per_lead', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      // 6. Membership statistics
      const { data: memberships } = await supabase
        .from('client_memberships')
        .select('*, membership_tiers(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const { data: newMemberships } = await supabase
        .from('client_memberships')
        .select('count')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .single()

      // 7. Profit margins (revenue - costs)
      const { data: procedureCosts } = await supabase
        .from('procedure_costs')
        .select('*, services(name)')
        .eq('user_id', user.id)

      // 8. Retail sales
      const { data: retailData } = await supabase
        .from('retail_sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate)

      // 9. Provider goals
      const { data: goalsData } = await supabase
        .from('provider_goals')
        .select('*, staff_members(name)')
        .eq('user_id', user.id)
        .gte('period_start', dateRange.from.toISOString().split('T')[0])
        .lte('period_end', dateRange.to.toISOString().split('T')[0])

      // 10. Room revenue
      const { data: roomRevenue } = await supabase
        .from('appointments')
        .select(`
          treatment_room_id,
          treatment_rooms(name),
          amount_paid,
          duration,
          start_time
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .not('treatment_room_id', 'is', null)

      // 11. Total revenue and profit
      const { data: appointments } = await supabase
        .from('appointments')
        .select('amount_paid, service')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .gte('start_time', startDate)
        .lte('start_time', endDate)

      const totalRevenue = appointments?.reduce((sum, apt) => sum + (Number(apt.amount_paid) || 0), 0) || 0

      // Calculate profit margins
      const profitMargins = procedureRevenue?.map((proc: any) => {
        const cost = procedureCosts?.find(c => c.services?.name === proc.service_name)
        const totalCost = cost ? Number(cost.total_cost) * proc.procedure_count : 0
        const profit = proc.total_revenue - totalCost
        const margin = proc.total_revenue > 0 ? (profit / proc.total_revenue * 100) : 0
        return {
          service: proc.service_name,
          revenue: proc.total_revenue,
          cost: totalCost,
          profit,
          margin
        }
      }) || []

      // Calculate room revenue per hour
      const roomRevenueData = roomRevenue?.reduce((acc: any, apt: any) => {
        const roomName = apt.treatment_rooms?.name || 'Unknown'
        if (!acc[roomName]) {
          acc[roomName] = { revenue: 0, hours: 0 }
        }
        acc[roomName].revenue += Number(apt.amount_paid) || 0
        acc[roomName].hours += (apt.duration || 60) / 60
        return acc
      }, {})

      const roomRevenueArray = Object.entries(roomRevenueData || {}).map(([name, data]: any) => ({
        room: name,
        revenue: data.revenue,
        revenuePerHour: data.hours > 0 ? data.revenue / data.hours : 0
      }))

      // Group retail sales by product company
      const retailByCompany = retailData?.reduce((acc: any, sale: any) => {
        const items = sale.items || []
        items.forEach((item: any) => {
          const company = item.company || 'Other'
          if (!acc[company]) acc[company] = 0
          acc[company] += Number(item.total) || 0
        })
        return acc
      }, {})

      const retailSalesArray = Object.entries(retailByCompany || {}).map(([company, total]) => ({
        company,
        total
      }))

      // Calculate retention rate
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString()
      const { data: oldClients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .lt('created_at', sixMonthsAgo)

      const { data: recentVisits } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('user_id', user.id)
        .in('client_id', oldClients?.map(c => c.id) || [])
        .gte('start_time', startDate)
        .lte('start_time', endDate)

      const uniqueReturningClients = new Set(recentVisits?.map(v => v.client_id) || []).size
      const retentionRate = oldClients?.length ? (uniqueReturningClients / oldClients.length * 100) : 0

      const totalProfit = profitMargins.reduce((sum: number, p: any) => sum + p.profit, 0)

      setReports({
        revenueByProcedure: procedureRevenue || [],
        revenueByProvider: providerRevenue || [],
        revenuePerRoom: roomRevenueArray,
        conversionRates: conversionData?.[0] || null,
        membershipStats: {
          total: memberships?.length || 0,
          newThisMonth: newMemberships?.count || 0,
          totalRevenue: memberships?.reduce((sum: number, m: any) =>
            sum + (Number(m.membership_tiers?.monthly_price) || 0), 0) || 0
        },
        profitMargins,
        costPerLead: leadCosts || [],
        averageSpend: avgSpend || 0,
        retailSales: retailSalesArray,
        providerGoals: goalsData || [],
        retentionRate,
        totalRevenue,
        totalProfit
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const reportData = {
      dateRange: {
        from: format(dateRange.from, 'PPP'),
        to: format(dateRange.to, 'PPP')
      },
      ...reports
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medspa-report-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Advanced Business Reports</h2>
          <p className="text-gray-500">Comprehensive analytics for your med spa</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    setDateRange({ from: startOfMonth(now), to: endOfMonth(now) })
                  }}
                  className="w-full"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastMonth = subMonths(new Date(), 1)
                    setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
                  }}
                  className="w-full"
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const threeMonthsAgo = subMonths(new Date(), 3)
                    setDateRange({ from: threeMonthsAgo, to: new Date() })
                  }}
                  className="w-full"
                >
                  Last 3 Months
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reports.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reports.totalProfit.toLocaleString()}</div>
                <p className="text-xs text-gray-500">
                  {reports.totalRevenue > 0 ?
                    `${((reports.totalProfit / reports.totalRevenue) * 100).toFixed(1)}% margin` :
                    'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Customer Spend</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reports.averageSpend.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Per visit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.retentionRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">
                  {reports.retentionRate >= 70 ? 'Excellent' :
                   reports.retentionRate >= 50 ? 'Good' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Tabs */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
              <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
              <TabsTrigger value="providers">Provider Performance</TabsTrigger>
              <TabsTrigger value="membership">Memberships</TabsTrigger>
              <TabsTrigger value="marketing">Marketing ROI</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Procedure</CardTitle>
                    <CardDescription>Top performing services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reports.revenueByProcedure.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="service_name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Bar dataKey="total_revenue" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue per Room/Hour</CardTitle>
                    <CardDescription>Treatment room utilization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reports.revenuePerRoom}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="room" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                        <Bar dataKey="revenuePerHour" fill="#00C49F" name="$/Hour" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Retail Sales by Company/Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reports.retailSales}
                        dataKey="total"
                        nameKey="company"
                        cx="50%"
                        cy="50%"
                        label={(entry) => `${entry.company}: $${entry.total.toFixed(0)}`}
                      >
                        {reports.retailSales.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead to Consultation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {reports.conversionRates?.consultation_conversion_rate || 0}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Target: 70% {(reports.conversionRates?.consultation_conversion_rate || 0) >= 70 ? '✓' : '⚠️'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {reports.conversionRates?.leads_to_consultation || 0} of {reports.conversionRates?.total_leads || 0} leads
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Consultation to Treatment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {reports.conversionRates?.treatment_conversion_rate || 0}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Target: 55% {(reports.conversionRates?.treatment_conversion_rate || 0) >= 55 ? '✓' : '⚠️'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overall Conversion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {reports.conversionRates?.overall_conversion_rate || 0}%
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Lead to paying customer
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profitability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profit Margin by Procedure</CardTitle>
                  <CardDescription>Revenue vs Cost analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.profitMargins.map((item: any) => (
                      <div key={item.service} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.service}</span>
                          <span className={cn(
                            "font-bold",
                            item.margin >= 50 ? "text-green-600" :
                            item.margin >= 30 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {item.margin.toFixed(1)}% margin
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-gray-500">Revenue</div>
                            <div className="font-semibold">${item.revenue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Cost</div>
                            <div className="font-semibold">${item.cost.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Profit</div>
                            <div className="font-semibold">${item.profit.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Provider</CardTitle>
                  <CardDescription>Individual performance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reports.revenueByProvider}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="provider_name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="total_revenue" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider Goals & Bonuses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.providerGoals.map((goal: any) => (
                      <div key={goal.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{goal.staff_members?.name}</span>
                          <span className={cn(
                            "px-2 py-1 rounded text-sm",
                            goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                            goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {goal.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Revenue Goal</div>
                            <div className="font-semibold">
                              ${goal.actual_revenue.toLocaleString()} / ${goal.revenue_goal.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Bonus</div>
                            <div className="font-semibold">${goal.bonus_amount.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Memberships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{reports.membershipStats?.total || 0}</div>
                    <p className="text-sm text-gray-500 mt-2">Currently subscribed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>New This Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{reports.membershipStats?.newThisMonth || 0}</div>
                    <p className="text-sm text-gray-500 mt-2">New signups</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Membership Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      ${reports.membershipStats?.totalRevenue.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Monthly recurring</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Per Lead by Source</CardTitle>
                  <CardDescription>Marketing efficiency analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reports.costPerLead}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source_name" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="cost_per_lead" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
