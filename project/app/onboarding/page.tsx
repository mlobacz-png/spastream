"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Download, FileText, PlayCircle, Sparkles, Users, CreditCard, MessageSquare, Calendar, UserPlus, Rocket, Building2, ArrowRight } from "lucide-react";
import { PlanSelection } from "@/components/plan-selection";
import { getUserSubscription } from "@/lib/subscription-utils";
import { BusinessInformationForm } from "@/components/business-information-form";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [hasBusinessInfo, setHasBusinessInfo] = useState<boolean | null>(null);
  const step = searchParams.get('step');

  useEffect(() => {
    console.log('Onboarding - User changed:', { userId: user?.id, step });
    if (user) {
      checkSubscription();
      checkBusinessInfo();
    } else {
      // If no user, they haven't completed business info or subscription
      setHasBusinessInfo(false);
      setHasSubscription(false);
    }
  }, [user]);

  async function checkSubscription() {
    const subscription = await getUserSubscription();
    console.log('Onboarding - checkSubscription:', { hasSubscription: subscription !== null });
    setHasSubscription(subscription !== null);
  }

  async function checkBusinessInfo() {
    if (!user) return;

    const { data, error } = await supabase
      .from('business_information')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Onboarding - checkBusinessInfo:', { hasBusinessInfo: data !== null, userId: user.id });
    setHasBusinessInfo(data !== null);
  }

  if (hasSubscription === null || hasBusinessInfo === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Step 0: Collect business information (ALWAYS show if step=business-info)
  console.log('Onboarding - Render decision:', { hasBusinessInfo, hasSubscription, step });
  if (step === 'business-info' || !hasBusinessInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center space-y-2">
              <Badge className="mb-4" variant="secondary">
                <Building2 className="w-3 h-3 mr-1" />
                Welcome to SpaStream
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">Tell Us About Your Business</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Let's start by collecting some basic information about your med spa.
              </p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <BusinessInformationForm
            onComplete={() => {
              setHasBusinessInfo(true);
              router.push('/onboarding?step=plan');
            }}
          />
        </div>
      </div>
    );
  }

  if (!hasSubscription || step === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="text-center space-y-2">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Step 2 of 9
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Select the perfect plan for your practice. Start with a 14-day free trial.
              </p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <PlanSelection onComplete={() => {
            setHasSubscription(true);
            // Add parameter to skip subscription check since we just created it
            router.push('/app?onboarded=true');
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center space-y-4">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              Getting Started
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Welcome to SpaStream</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get your med spa up and running in under 30 minutes with our comprehensive onboarding guide
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">15-45 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">9 steps</span>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-600">Video tutorials included</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button size="lg" onClick={() => router.push('/app')}>
                <Rocket className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                const element = document.querySelector('[value="guide"]');
                if (element) {
                  (element as HTMLElement).click();
                }
              }}>
                <FileText className="w-5 h-5 mr-2" />
                View Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
            <TabsTrigger value="checklist">Go Live Checklist</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>What You'll Need</CardTitle>
                <CardDescription>Gather these items before you begin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Business Information</p>
                      <p className="text-sm text-slate-600">Name, address, phone, email, operating hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Staff Information</p>
                      <p className="text-sm text-slate-600">Names, roles, specialties, availability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Service Menu</p>
                      <p className="text-sm text-slate-600">Treatments, durations, and prices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Stripe Account</p>
                      <p className="text-sm text-slate-600">For accepting online payments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Twilio Account (Optional)</p>
                      <p className="text-sm text-slate-600">For SMS appointment reminders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
                    <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Client List (Optional)</p>
                      <p className="text-sm text-slate-600">CSV file of existing clients</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Timeline</CardTitle>
                <CardDescription>What to focus on and when</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-700">W1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Week 1-2: Get Comfortable</h4>
                      <p className="text-sm text-slate-600">Book test appointments, process payments, explore the calendar, add client notes</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-green-700">W3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Week 3-4: Optimize</h4>
                      <p className="text-sm text-slate-600">Set up automated reminders, create packages, import client history, train staff</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-purple-700">M2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Month 2: Advanced Features</h4>
                      <p className="text-sm text-slate-600">Launch marketing campaigns, set up memberships, use AI recommendations</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-orange-700">M3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Month 3+: Scale</h4>
                      <p className="text-sm text-slate-600">Dynamic pricing, no-show prediction, AI staff optimization, reputation management</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step-by-Step Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            {/* Step 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-bold text-blue-700">1</span>
                  </div>
                  <div>
                    <CardTitle>Initial Setup</CardTitle>
                    <CardDescription>Create your account and business profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Create Your Account</p>
                      <p className="text-sm text-slate-600">Sign up with your business email and verify</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Business Profile</p>
                      <p className="text-sm text-slate-600">Add business name, address, phone, hours, and logo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Time Zone</p>
                      <p className="text-sm text-slate-600">Set your correct time zone for appointments</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>5 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle>Staff Configuration</CardTitle>
                    <CardDescription>Add your team and set their availability</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Add Staff Members</p>
                      <p className="text-sm text-slate-600">Enter name, email, phone, role, and specialties</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Set Availability</p>
                      <p className="text-sm text-slate-600">Configure working days, hours, and break times</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Assign Permissions</p>
                      <p className="text-sm text-slate-600">Manager, Provider, or Front Desk access levels</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>10 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle>Service Menu Setup</CardTitle>
                    <CardDescription>Add treatments and create packages</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Add Services</p>
                      <p className="text-sm text-slate-600">Enter name, category, duration, price, and description</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Assign Providers</p>
                      <p className="text-sm text-slate-600">Select which staff can perform each service</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Create Packages</p>
                      <p className="text-sm text-slate-600">Bundle services with discounted pricing</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>15 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Payment Integration (Required)</CardTitle>
                    <CardDescription>Connect Stripe to accept payments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Create Stripe Account</p>
                      <p className="text-sm text-slate-600">Visit stripe.com and complete business verification</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Get API Keys</p>
                      <p className="text-sm text-slate-600">Copy publishable and secret keys from Stripe Dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Connect to SpaStream</p>
                      <p className="text-sm text-slate-600">Paste keys in Payment Settings and test a payment</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Need help?</strong> Check our detailed Stripe setup guide: <a href="/setup/stripe" className="underline">Payment Setup Documentation</a>
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>10 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 5 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <CardTitle>SMS Setup (Optional)</CardTitle>
                    <CardDescription>Reduce no-shows with automated reminders</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Create Twilio Account</p>
                      <p className="text-sm text-slate-600">Sign up at twilio.com and purchase a phone number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Get Credentials</p>
                      <p className="text-sm text-slate-600">Copy Account SID, Auth Token, and phone number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Configure SMS Settings</p>
                      <p className="text-sm text-slate-600">Enable reminders, confirmations, and marketing messages</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Pro Tip:</strong> SMS reminders can reduce no-shows by up to 40%! Cost: ~$0.0075 per message.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>10 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 6 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <CardTitle>Online Booking Setup</CardTitle>
                    <CardDescription>Let clients book appointments 24/7</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Configure Booking Rules</p>
                      <p className="text-sm text-slate-600">Set advance booking, minimum notice, and buffer times</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Customize Booking Page</p>
                      <p className="text-sm text-slate-600">Add cover photo, brand colors, and welcome message</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Share Your Link</p>
                      <p className="text-sm text-slate-600">Add to website, social media, and email signature</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>10 minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 7 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <CardTitle>Client Import (Optional)</CardTitle>
                    <CardDescription>Bring your existing client database</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pl-13 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Export from Old System</p>
                      <p className="text-sm text-slate-600">Download client list as CSV file</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Format Your Data</p>
                      <p className="text-sm text-slate-600">Use our template: client-import-template.csv</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium text-sm">Import and Verify</p>
                      <p className="text-sm text-slate-600">Upload CSV and check all data imported correctly</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>15 minutes</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-6 h-6" />
                  Go Live Checklist
                </CardTitle>
                <CardDescription>Complete these items before accepting your first booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Business Setup
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Business profile completed</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Logo uploaded</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Operating hours set</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Time zone configured</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Team Setup
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">All staff members added</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Staff availability configured</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Staff permissions assigned</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Staff have created their accounts</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Services Setup
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">All treatments added with prices</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Service durations set correctly</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Staff assigned to services</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Treatment categories organized</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      Payment Setup
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Stripe account connected</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Test payment processed successfully</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Payment preferences configured</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Cancellation/refund policy set</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-700">
                      <MessageSquare className="w-5 h-5" />
                      Optional Integrations
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">SMS reminders enabled (Twilio)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Test SMS sent successfully</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Email notifications configured</span>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      Online Booking
                    </h3>
                    <div className="pl-7 space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Online booking enabled</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Booking rules configured</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Booking page customized</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Booking link shared publicly</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-green-700" />
                  Ready to Launch!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">
                  Once you've completed all the required items above, you're ready to start accepting bookings!
                  Don't worry about perfection—you can always adjust settings as you learn what works best for your business.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-12 bg-gradient-to-br from-blue-50 to-slate-50">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>We're here to support you every step of the way</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Documentation</h4>
                <p className="text-sm text-slate-600">Complete setup guides and FAQs</p>
              </div>
              <div className="text-center p-4">
                <PlayCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Video Tutorials</h4>
                <p className="text-sm text-slate-600">Step-by-step walkthroughs</p>
              </div>
              <div className="text-center p-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold mb-1">Support Team</h4>
                <p className="text-sm text-slate-600">Email or live chat assistance</p>
              </div>
            </div>
            <Separator />
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">Email us at <strong>support@spastream.com</strong></p>
              <p className="text-sm text-slate-600">Live chat available Mon-Fri, 9am-5pm EST</p>
              <Button className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Download Full PDF Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
