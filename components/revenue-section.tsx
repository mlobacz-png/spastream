'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, Appointment, Client } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

export function RevenueSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [appointmentsRes, clientsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    };

    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.amount_paid || 0), 0);
    const totalExpected = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    const outstanding = totalExpected - totalRevenue;

    const monthlyRevenue = appointments
      .filter(apt => {
        const date = new Date(apt.start_time);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, apt) => sum + (apt.amount_paid || 0), 0);

    const weeklyRevenue = appointments
      .filter(apt => {
        const date = new Date(apt.start_time);
        return date >= weekStart && date <= weekEnd;
      })
      .reduce((sum, apt) => sum + (apt.amount_paid || 0), 0);

    const yearlyRevenue = appointments
      .filter(apt => {
        const date = new Date(apt.start_time);
        return date >= yearStart && date <= yearEnd;
      })
      .reduce((sum, apt) => sum + (apt.amount_paid || 0), 0);

    const paidCount = appointments.filter(apt => apt.payment_status === 'paid').length;
    const pendingCount = appointments.filter(apt => apt.payment_status === 'pending').length;
    const partialCount = appointments.filter(apt => apt.payment_status === 'partial').length;

    const serviceRevenue = appointments.reduce((acc, apt) => {
      const service = apt.service || 'Other';
      acc[service] = (acc[service] || 0) + (apt.amount_paid || 0);
      return acc;
    }, {} as Record<string, number>);

    const recentPayments = appointments
      .filter(apt => apt.payment_date && apt.amount_paid && apt.amount_paid > 0)
      .sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime())
      .slice(0, 10);

    return {
      totalRevenue,
      totalExpected,
      outstanding,
      monthlyRevenue,
      weeklyRevenue,
      yearlyRevenue,
      paidCount,
      pendingCount,
      partialCount,
      serviceRevenue,
      recentPayments,
    };
  }, [appointments]);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Revenue & Financial Analytics</h2>
          <p className="text-sm text-slate-600">Track payments and business performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-light text-slate-800">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">This Month</p>
                <p className="text-3xl font-light text-slate-800">${stats.monthlyRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Outstanding</p>
                <p className="text-3xl font-light text-slate-800">${stats.outstanding.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">This Year</p>
                <p className="text-3xl font-light text-slate-800">${stats.yearlyRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg">By Service</TabsTrigger>
          <TabsTrigger value="recent" className="rounded-lg">Recent Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light text-slate-800">{stats.paidCount}</p>
                <p className="text-sm text-slate-500 mt-1">Completed payments</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light text-slate-800">{stats.pendingCount}</p>
                <p className="text-sm text-slate-500 mt-1">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  Partial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-light text-slate-800">{stats.partialCount}</p>
                <p className="text-sm text-slate-500 mt-1">Partially paid</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-700">Total Expected</span>
                <span className="font-semibold text-slate-800">${stats.totalExpected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-green-700">Total Collected</span>
                <span className="font-semibold text-green-800">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-700">Outstanding Balance</span>
                <span className="font-semibold text-amber-800">${stats.outstanding.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="text-blue-700">Collection Rate</span>
                <span className="font-semibold text-blue-800">
                  {stats.totalExpected > 0 ? ((stats.totalRevenue / stats.totalExpected) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Revenue by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.serviceRevenue).length === 0 ? (
                <p className="text-slate-500 text-center py-8">No service data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.serviceRevenue)
                    .sort(([, a], [, b]) => b - a)
                    .map(([service, revenue]) => {
                      const percentage = stats.totalRevenue > 0
                        ? ((revenue / stats.totalRevenue) * 100).toFixed(1)
                        : 0;

                      return (
                        <div key={service} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700 font-medium">{service}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 text-sm">{percentage}%</span>
                              <span className="font-semibold text-slate-800">${revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 mt-4">
          <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentPayments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No recent payments</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentPayments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{getClientName(apt.client_id)}</p>
                        <p className="text-sm text-slate-500">{apt.service}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {apt.payment_date && format(new Date(apt.payment_date), 'PPP')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${(apt.amount_paid || 0).toFixed(2)}</p>
                        {apt.payment_method && (
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {apt.payment_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
