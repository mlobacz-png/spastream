'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHome } from './dashboard-home';
import { ClientsSection } from './clients-section';
import { CalendarSection } from './calendar-section';
import { AIFeatures } from './ai-features';
import { RevenueSection } from './revenue-section';
import { PackagesSection } from './packages-section';
import { InventorySection } from './inventory-section';
import { MarketingSection } from './marketing-section';
import { BookingSettings } from './booking-settings';
import { StaffSection } from './staff-section';
import { PaymentSettings } from './payment-settings';
import { InvoicesSection } from './invoices-section';
import { SMSSection } from './sms-section';
import { AnalyticsDashboard } from './analytics-dashboard';
import { ServicesSection } from './services-section';
import { VoiceAISection } from './voice-ai-section';
import { supabase } from '@/lib/supabase';
import { getUserSubscription } from '@/lib/subscription-utils';
import { SpaStreamLogo, SpaStreamLogoWithText } from './spastream-logo';
import { AdvancedReportsDashboard } from './advanced-reports-dashboard';
import { MembershipManagement } from './membership-management';
import { LeadTrackingSection } from './lead-tracking-section';
import { ProviderGoalsBonuses } from './provider-goals-bonuses';
import { LogOut, Home, DollarSign, Package, PackageOpen, Mail, Globe, Users, CreditCard, FileText, MessageSquare, BarChart3, Sparkles, Scissors, Phone, TrendingUp, Crown, Target, UserPlus } from 'lucide-react';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const onboarded = searchParams.get('onboarded');
    const subscriptionSuccess = searchParams.get('subscription');

    if (onboarded === 'true') {
      setCheckingSubscription(false);
    } else if (subscriptionSuccess === 'success') {
      // Poll for subscription after Stripe redirect
      checkSubscriptionWithRetry();
    } else {
      checkSubscription();
    }
  }, []);

  async function checkSubscriptionWithRetry(attempts = 0, maxAttempts = 10) {
    const subscription = await getUserSubscription();

    if (subscription) {
      // Subscription found! Clean up URL and show dashboard
      router.replace('/app');
      setCheckingSubscription(false);
      return;
    }

    // If we haven't found it yet and haven't exceeded max attempts, try again
    if (attempts < maxAttempts) {
      setTimeout(() => {
        checkSubscriptionWithRetry(attempts + 1, maxAttempts);
      }, 1000); // Check every 1 second
    } else {
      // After 10 seconds, fall back to regular check
      checkSubscription();
    }
  }

  async function checkSubscription() {
    const subscription = await getUserSubscription();

    if (!subscription) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: bizInfo } = await supabase
          .from('business_information')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!bizInfo) {
          router.push('/onboarding?step=business-info');
        } else {
          router.push('/onboarding?step=plan');
        }
      }
      return;
    }
    setCheckingSubscription(false);
  }

  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 animate-pulse">
            <SpaStreamLogo className="w-16 h-16" />
          </div>
          <p className="text-slate-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <SpaStreamLogoWithText />
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="rounded-full text-slate-600 hover:text-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full p-1 shadow-lg inline-flex">
                <TabsTrigger
                  value="home"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Home className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Home</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <span className="hidden sm:inline">Calendar</span>
                  <span className="sm:hidden">Cal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="clients"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  Clients
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
                >
                  <Scissors className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Services</span>
                </TabsTrigger>
                <TabsTrigger
                  value="revenue"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  <DollarSign className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Revenue</span>
                </TabsTrigger>
                <TabsTrigger
                  value="packages"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Package className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Packages</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <PackageOpen className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Inventory</span>
                </TabsTrigger>
                <TabsTrigger
                  value="marketing"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
                >
                  <Mail className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Marketing</span>
                </TabsTrigger>
                <TabsTrigger
                  value="voice-ai"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                >
                  <Phone className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Voice AI</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full p-1 shadow-lg inline-flex">
                <TabsTrigger
                  value="staff"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Staff</span>
                </TabsTrigger>
                <TabsTrigger
                  value="booking"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-sky-500 data-[state=active]:text-white"
                >
                  <Globe className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Booking</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  <CreditCard className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Payments</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sms"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  <MessageSquare className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">SMS</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                >
                  <BarChart3 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Sparkles className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">AI Features</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <TabsList className="bg-white/80 backdrop-blur border border-slate-200/50 rounded-full p-1 shadow-lg inline-flex">
                <TabsTrigger
                  value="reports"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <TrendingUp className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Advanced Reports</span>
                </TabsTrigger>
                <TabsTrigger
                  value="memberships"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  <Crown className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Memberships</span>
                </TabsTrigger>
                <TabsTrigger
                  value="leads"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
                >
                  <UserPlus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Lead Tracking</span>
                </TabsTrigger>
                <TabsTrigger
                  value="goals"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  <Target className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Provider Goals</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="home" className="mt-6">
            <DashboardHome onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarSection />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsSection />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesSection />
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <RevenueSection />
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <PackagesSection />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventorySection />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingSection />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <StaffSection />
          </TabsContent>

          <TabsContent value="booking" className="mt-6">
            <BookingSettings />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentSettings />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesSection />
          </TabsContent>

          <TabsContent value="sms" className="mt-6">
            <SMSSection />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AIFeatures />
          </TabsContent>

          <TabsContent value="voice-ai" className="mt-6">
            <VoiceAISection />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AdvancedReportsDashboard />
          </TabsContent>

          <TabsContent value="memberships" className="mt-6">
            <MembershipManagement />
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <LeadTrackingSection />
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <ProviderGoalsBonuses />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-200/50 bg-white/80 backdrop-blur py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-light">SpaStream</span>
              <span className="text-slate-400">•</span>
              <span>© 2025 All rights reserved</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
