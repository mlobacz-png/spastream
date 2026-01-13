'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  CalendarDays,
  Users,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap,
  FileText,
  Download,
  DollarSign,
  UserPlus,
  Calendar
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { generatePlatformBrochure } from '@/lib/platform-brochure-generator';
import { generateQuickStartGuide } from '@/lib/quick-start-guide-generator';
import { ComparisonWidget, RevenueGoalWidget } from './dashboard-comparison-widget';
import { PlatformRevenueWidget } from './platform-revenue-widget';

interface DashboardStats {
  totalClients: number;
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  recentActivity: any[];
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  thisMonthClients: number;
  lastMonthClients: number;
  thisMonthAppointments: number;
  lastMonthAppointments: number;
  revenueGoal: number;
}

interface UserSubscriptionInfo {
  planName: string;
  status: string;
  trialDaysLeft: number | null;
}

export function DashboardHome({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    recentActivity: [],
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    thisMonthClients: 0,
    lastMonthClients: 0,
    thisMonthAppointments: 0,
    lastMonthAppointments: 0,
    revenueGoal: 50000,
  });
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserSubscriptionInfo>({
    planName: 'Free',
    status: 'active',
    trialDaysLeft: null,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        status,
        trial_ends_at,
        plan:subscription_plans(name)
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching subscription:', error);
      return;
    }

    const planName = (data.plan as any)?.name || 'Free';
    const status = data.status;
    let trialDaysLeft = null;

    if (status === 'trialing' && data.trial_ends_at) {
      const trialEnd = new Date(data.trial_ends_at);
      const today = new Date();
      trialDaysLeft = Math.max(0, differenceInDays(trialEnd, today));
    }

    setSubscriptionInfo({ planName, status, trialDaysLeft });
  };

  const fetchStats = async () => {
    if (!user) return;

    console.log('Fetching dashboard stats for user:', user.id);

    const [clientsRes, appointmentsRes, transactionsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', user.id),
      supabase.from('appointments').select('*').eq('user_id', user.id).order('start_time'),
      supabase.from('transactions').select('*').eq('user_id', user.id).eq('status', 'completed'),
    ]);

    const clients = clientsRes.data || [];
    const appointments = appointmentsRes.data || [];
    const transactions = transactionsRes.data || [];
    const now = new Date();

    console.log('Raw data fetched:', {
      clients: clients.length,
      appointments: appointments.length,
      transactions: transactions.length,
      transactionSample: transactions.slice(0, 2)
    });

    const todayAppointments = appointments.filter(apt => isToday(new Date(apt.start_time)));
    const upcomingAppointments = appointments.filter(apt => new Date(apt.start_time) > now);

    const recentActivity = appointments
      .filter(apt => new Date(apt.start_time) <= now)
      .slice(-5)
      .reverse()
      .map(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        return { ...apt, clientName: client?.name || 'Unknown' };
      });

    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthRevenue = transactions
      .filter(txn => {
        const date = new Date(txn.created_at);
        return date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    const lastMonthRevenue = transactions
      .filter(txn => {
        const date = new Date(txn.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    const thisMonthClients = clients.filter(client => {
      const date = new Date(client.created_at);
      return date >= thisMonthStart && date <= thisMonthEnd;
    }).length;

    const lastMonthClients = clients.filter(client => {
      const date = new Date(client.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;

    const thisMonthAppointments = appointments.filter(apt => {
      const date = new Date(apt.start_time);
      return date >= thisMonthStart && date <= thisMonthEnd;
    }).length;

    const lastMonthAppointments = appointments.filter(apt => {
      const date = new Date(apt.start_time);
      return date >= lastMonthStart && date <= lastMonthEnd;
    }).length;

    // Calculate revenue goal: last month's revenue + 20% growth target
    const revenueGoal = lastMonthRevenue > 0 ? Math.round(lastMonthRevenue * 1.2) : 50000;

    console.log('Dashboard stats calculated:', {
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGoal,
      thisMonthClients,
      lastMonthClients,
      thisMonthAppointments,
      lastMonthAppointments
    });

    setStats({
      totalClients: clients.length,
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      recentActivity,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthClients,
      lastMonthClients,
      thisMonthAppointments,
      lastMonthAppointments,
      revenueGoal,
    });
  };

  const quickActions = [
    {
      icon: CalendarDays,
      label: 'Book Appointment',
      description: 'Schedule a new client',
      gradient: 'from-blue-500 to-cyan-500',
      action: () => onNavigate('calendar'),
    },
    {
      icon: Users,
      label: 'Add Client',
      description: 'Create client profile',
      gradient: 'from-purple-500 to-pink-500',
      action: () => onNavigate('clients'),
    },
    {
      icon: Sparkles,
      label: 'AI Features',
      description: 'Explore AI tools',
      gradient: 'from-violet-500 to-purple-500',
      action: () => onNavigate('ai'),
    },
  ];

  const aiFeatures = [
    { icon: Shield, name: 'Compliance Auditor', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, name: 'No-Show Predictor', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Sparkles, name: 'Treatment Plans', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Zap, name: 'Dynamic Pricing', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYwek0tMTAgMTBoNjB2MmgtNjB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-light text-white mb-2">
                {getTimeGreeting()}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Welcome back to SpaStream
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30">
                <Star className="w-3 h-3 mr-1" />
                {subscriptionInfo.planName} Plan
              </Badge>
              {subscriptionInfo.status === 'trialing' && subscriptionInfo.trialDaysLeft !== null && (
                <span className="text-xs text-white/80">
                  {subscriptionInfo.trialDaysLeft} {subscriptionInfo.trialDaysLeft === 1 ? 'day' : 'days'} left in trial
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Clients</p>
                  <p className="text-3xl font-light text-white">{stats.totalClients}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Bookings</p>
                  <p className="text-3xl font-light text-white">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Today</p>
                  <p className="text-3xl font-light text-white">{stats.todayAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Upcoming</p>
                  <p className="text-3xl font-light text-white">{stats.upcomingAppointments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card
                key={idx}
                className="rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer group overflow-hidden"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-1">{action.label}</h3>
                  <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    Get started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 shadow-inner">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">This Month vs Last Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RevenueGoalWidget current={stats.thisMonthRevenue} goal={stats.revenueGoal} />
          <ComparisonWidget
            label="Monthly Revenue"
            currentValue={stats.thisMonthRevenue}
            previousValue={stats.lastMonthRevenue}
            format="currency"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <ComparisonWidget
            label="New Clients"
            currentValue={stats.thisMonthClients}
            previousValue={stats.lastMonthClients}
            format="number"
            icon={UserPlus}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <ComparisonWidget
            label="Appointments"
            currentValue={stats.thisMonthAppointments}
            previousValue={stats.lastMonthAppointments}
            format="number"
            icon={Calendar}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
        </div>
      </div>

      <PlatformRevenueWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-light text-slate-800 mb-4">AI-Powered Features</h2>
          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-6">
              <div className="space-y-3">
                {aiFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onNavigate('ai')}
                    >
                      <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{feature.name}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  );
                })}
              </div>
              <Button
                onClick={() => onNavigate('ai')}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Explore All AI Features
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-light text-slate-800 mb-4">Recent Activity</h2>
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {activity.clientName}
                        </p>
                        <p className="text-sm text-slate-600">{activity.service}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(activity.start_time), 'MMM dd, h:mm a')}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs rounded-full bg-green-50 text-green-700 border-green-200"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-slate-800 mb-1">
                Unlock $200K+ Annual Value
              </h3>
              <p className="text-slate-600 mb-3">
                Our AI features save med spas an average of $200,300 per year through compliance protection,
                no-show reduction, and dynamic pricing optimization.
              </p>
              <Button
                onClick={() => onNavigate('ai')}
                variant="outline"
                className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-medium text-slate-800 mb-1">
                  Platform Overview Brochure
                </h3>
                <p className="text-slate-600 mb-3">
                  Download a comprehensive PDF guide featuring all SpaStream features, benefits, and capabilities.
                  Perfect for sharing with your team or presenting to stakeholders.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                  <Badge variant="outline" className="bg-white">
                    Complete Feature List
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Business Benefits
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Use Cases
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    12 Pages
                  </Badge>
                </div>
              </div>
              <Button
                onClick={generatePlatformBrochure}
                className="w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-medium text-slate-800 mb-1">
                  Quick Start Guide
                </h3>
                <p className="text-slate-600 mb-3">
                  Get up and running fast! Download your personalized quick start guide with step-by-step instructions
                  to set up your med spa practice in minutes.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                  <Badge variant="outline" className="bg-white">
                    Step-by-Step Setup
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Best Practices
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Quick Tips
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    5 Minutes
                  </Badge>
                </div>
              </div>
              <Button
                onClick={generateQuickStartGuide}
                className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
