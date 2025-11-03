"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Award, Clock, Target } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, parse, differenceInDays } from "date-fns";

interface AnalyticsData {
  revenue: {
    total: number;
    byService: Array<{ service: string; revenue: number; count: number }>;
    byMonth: Array<{ month: string; revenue: number }>;
    growth: number;
  };
  clients: {
    total: number;
    new: number;
    returning: number;
    retentionRate: number;
    lifetimeValue: number;
    churnRate: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
    completionRate: number;
  };
  staff: Array<{
    id: string;
    name: string;
    revenue: number;
    appointments: number;
    avgRating: number;
  }>;
  trends: {
    peakHours: Array<{ hour: number; count: number }>;
    peakDays: Array<{ day: string; count: number }>;
    topServices: Array<{ service: string; count: number }>;
  };
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, byService: [], byMonth: [], growth: 0 },
    clients: { total: 0, new: 0, returning: 0, retentionRate: 0, lifetimeValue: 0, churnRate: 0 },
    appointments: { total: 0, completed: 0, cancelled: 0, noShows: 0, completionRate: 0 },
    staff: [],
    trends: { peakHours: [], peakDays: [], topServices: [] },
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const fetchAnalytics = async () => {
    if (!user) return;

    const days = parseInt(period);
    const startDate = subDays(new Date(), days).toISOString();

    const [transactionsRes, clientsRes, appointmentsRes, allClientsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("amount, created_at, client_id, clients(name)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate),
      supabase
        .from("clients")
        .select("id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate),
      supabase
        .from("appointments")
        .select("id, service, status, start_time, client_id")
        .eq("user_id", user.id)
        .gte("start_time", startDate),
      supabase.from("clients").select("id, created_at").eq("user_id", user.id),
    ]);

    const transactions = transactionsRes.data || [];
    const clients = clientsRes.data || [];
    const appointments = appointmentsRes.data || [];
    const allClients = allClientsRes.data || [];

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    const revenueByService: { [key: string]: { revenue: number; count: number } } = {};
    appointments.forEach((apt) => {
      const transaction = transactions.find((t) => t.client_id === apt.client_id);
      if (transaction) {
        if (!revenueByService[apt.service]) {
          revenueByService[apt.service] = { revenue: 0, count: 0 };
        }
        revenueByService[apt.service].revenue += transaction.amount;
        revenueByService[apt.service].count += 1;
      }
    });

    const revenueByServiceArray = Object.entries(revenueByService)
      .map(([service, data]) => ({
        service,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const monthsData: { [key: string]: number } = {};
    transactions.forEach((t) => {
      const month = format(new Date(t.created_at), "MMM yyyy");
      monthsData[month] = (monthsData[month] || 0) + t.amount;
    });

    const revenueByMonth = Object.entries(monthsData)
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-6);

    const previousPeriodStart = subDays(new Date(), days * 2).toISOString();
    const previousPeriodEnd = subDays(new Date(), days).toISOString();

    const { data: previousTransactions } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", previousPeriodStart)
      .lt("created_at", previousPeriodEnd);

    const previousRevenue = previousTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const completedAppts = appointments.filter((a) => a.status === "completed").length;
    const cancelledAppts = appointments.filter((a) => a.status === "cancelled").length;
    const noShowAppts = appointments.filter((a) => a.status === "no-show").length;
    const completionRate = appointments.length > 0 ? (completedAppts / appointments.length) * 100 : 0;

    const returningClients = appointments.reduce((set, apt) => {
      set.add(apt.client_id);
      return set;
    }, new Set()).size;

    const retentionRate = allClients.length > 0 ? (returningClients / allClients.length) * 100 : 0;
    const lifetimeValue = allClients.length > 0 ? totalRevenue / allClients.length : 0;

    const activeClients = Array.from(
      new Set(
        appointments
          .filter((a) => new Date(a.start_time) > subDays(new Date(), 90))
          .map((a) => a.client_id)
      )
    ).length;
    const churnRate = allClients.length > 0 ? ((allClients.length - activeClients) / allClients.length) * 100 : 0;

    const hourCounts: { [key: number]: number } = {};
    appointments.forEach((apt) => {
      const hour = new Date(apt.start_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dayCounts: { [key: string]: number } = {};
    appointments.forEach((apt) => {
      const day = format(new Date(apt.start_time), "EEEE");
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const peakDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    const serviceCounts: { [key: string]: number } = {};
    appointments.forEach((apt) => {
      serviceCounts[apt.service] = (serviceCounts[apt.service] || 0) + 1;
    });

    const topServices = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setAnalytics({
      revenue: {
        total: totalRevenue,
        byService: revenueByServiceArray,
        byMonth: revenueByMonth,
        growth,
      },
      clients: {
        total: allClients.length,
        new: clients.length,
        returning: returningClients,
        retentionRate,
        lifetimeValue,
        churnRate,
      },
      appointments: {
        total: appointments.length,
        completed: completedAppts,
        cancelled: cancelledAppts,
        noShows: noShowAppts,
        completionRate,
      },
      staff: [],
      trends: {
        peakHours,
        peakDays,
        topServices,
      },
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">${analytics.revenue.total.toFixed(2)}</p>
                <p className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.revenue.growth >= 0 ? '↑' : '↓'} {Math.abs(analytics.revenue.growth).toFixed(1)}% vs previous period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold">{analytics.clients.total}</p>
                <p className="text-sm text-gray-600">{analytics.clients.new} new this period</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Appointments</p>
                <p className="text-2xl font-bold">{analytics.appointments.total}</p>
                <p className="text-sm text-gray-600">{analytics.appointments.completionRate.toFixed(1)}% completion rate</p>
              </div>
              <Calendar className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Lifetime Value</p>
                <p className="text-2xl font-bold">${analytics.clients.lifetimeValue.toFixed(0)}</p>
                <p className="text-sm text-gray-600">{analytics.clients.retentionRate.toFixed(1)}% retention</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Insights</TabsTrigger>
          <TabsTrigger value="trends">Business Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>Top performing services</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.revenue.byService.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.revenue.byService.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.service}</span>
                          <span className="text-gray-600">${item.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(item.revenue / analytics.revenue.byService[0].revenue) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.count} appointments</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No revenue data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.revenue.byMonth.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.revenue.byMonth.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.month}</span>
                          <span className="text-gray-600">${item.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{
                              width: `${(item.revenue / Math.max(...analytics.revenue.byMonth.map(m => m.revenue))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No monthly data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Clients</span>
                    <span className="font-bold">{analytics.clients.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Clients</span>
                    <span className="font-bold text-green-600">{analytics.clients.new}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Returning Clients</span>
                    <span className="font-bold text-blue-600">{analytics.clients.returning}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">${analytics.clients.lifetimeValue.toFixed(0)}</div>
                  <p className="text-sm text-gray-500 mt-2">Average per client</p>
                  <p className="text-xs text-gray-400 mt-1">Based on all-time revenue</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Retention Rate</span>
                      <span className="font-bold">{analytics.clients.retentionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analytics.clients.retentionRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Churn Rate</span>
                      <span className="font-bold">{analytics.clients.churnRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${analytics.clients.churnRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Most popular booking times</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trends.peakHours.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.trends.peakHours.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          {format(new Date().setHours(item.hour, 0), "h:mm a")}
                        </span>
                        <span className="font-bold">{item.count} bookings</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Days</CardTitle>
                <CardDescription>Busiest days of the week</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trends.peakDays.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.trends.peakDays.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.day}</span>
                          <span className="font-bold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{
                              width: `${(item.count / analytics.trends.peakDays[0].count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
                <CardDescription>Most booked treatments</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trends.topServices.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.trends.topServices.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm truncate">{item.service}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No data yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.appointments.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{analytics.appointments.noShows}</p>
                  <p className="text-sm text-gray-500">No-Shows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{analytics.appointments.cancelled}</p>
                  <p className="text-sm text-gray-500">Cancelled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.appointments.completionRate.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
