'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Loader2, CheckCircle2, AlertCircle, UserPlus, Calendar, DollarSign, Megaphone } from 'lucide-react';
import Link from 'next/link';

type TestStatus = 'idle' | 'success' | 'error';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const updateStatus = (key: string, status: TestStatus, message: string) => {
    setStatuses(prev => ({ ...prev, [key]: status }));
    setMessages(prev => ({ ...prev, [key]: message }));
  };

  const testWelcomeEmail = async () => {
    if (!email) {
      updateStatus('welcome', 'error', 'Please enter an email address');
      return;
    }

    setLoading('welcome');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-welcome-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ email, name: name || undefined }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        updateStatus('welcome', 'success', 'Welcome email sent! Check your inbox (and spam folder).');
      } else {
        updateStatus('welcome', 'error', data.error || 'Failed to send email');
      }
    } catch (error) {
      updateStatus('welcome', 'error', 'Network error: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const testBookingConfirmation = async () => {
    if (!email) {
      updateStatus('booking', 'error', 'Please enter an email address');
      return;
    }

    setLoading('booking');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-booking-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            to: email,
            businessName: 'Test Med Spa',
            clientName: name || 'Test Client',
            service: 'Botox Treatment',
            date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: '2:00 PM',
            confirmationMessage: 'Thank you for booking with us! We look forward to seeing you.'
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        updateStatus('booking', 'success', 'Booking confirmation sent! Check your inbox.');
      } else {
        updateStatus('booking', 'error', data.error || 'Failed to send email');
      }
    } catch (error) {
      updateStatus('booking', 'error', 'Network error: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const testSignupNotification = async () => {
    setLoading('signup');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-signup-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            user_email: email || 'test@example.com',
            plan_name: 'Pro Plan',
            plan_price: 19900,
            status: 'trialing',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        updateStatus('signup', 'success', 'Admin notification sent! Check the admin email inbox.');
      } else {
        updateStatus('signup', 'error', data.error || 'Failed to send notification');
      }
    } catch (error) {
      updateStatus('signup', 'error', 'Network error: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const StatusMessage = ({ testKey }: { testKey: string }) => {
    const status = statuses[testKey];
    const message = messages[testKey];

    if (status === 'success') {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 mt-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 mt-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl">SpaStream</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4">Email System Testing</h1>
          <p className="text-slate-600 mt-2">Test all email functions to verify they're working correctly</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Email Address</CardTitle>
            <CardDescription>Enter your email address to receive test emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading !== null}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading !== null}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="welcome" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="welcome" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Welcome
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Welcome Email Test
                </CardTitle>
                <CardDescription>
                  This email is sent automatically when a new user signs up. Test it here to verify it's working.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Email Details:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• <strong>From:</strong> SpaStream &lt;noreply@spastream.net&gt;</li>
                    <li>• <strong>Subject:</strong> Welcome to SpaStream - Your Account is Live!</li>
                    <li>• <strong>Content:</strong> Welcome message with feature overview</li>
                  </ul>
                </div>

                <Button
                  onClick={testWelcomeEmail}
                  disabled={loading !== null}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                >
                  {loading === 'welcome' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Test Welcome Email
                    </>
                  )}
                </Button>

                <StatusMessage testKey="welcome" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Booking Confirmation Test
                </CardTitle>
                <CardDescription>
                  This email is sent when a client books an appointment through your booking page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Email Details:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• <strong>From:</strong> SpaStream &lt;bookings@spastream.net&gt;</li>
                    <li>• <strong>Subject:</strong> Booking Confirmed - [Business Name]</li>
                    <li>• <strong>Content:</strong> Appointment details and confirmation</li>
                  </ul>
                </div>

                <Button
                  onClick={testBookingConfirmation}
                  disabled={loading !== null}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                >
                  {loading === 'booking' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Send Test Booking Email
                    </>
                  )}
                </Button>

                <StatusMessage testKey="booking" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-500" />
                  Admin Notification Test
                </CardTitle>
                <CardDescription>
                  This email notifies you when someone subscribes to a paid plan. Goes to ADMIN_EMAIL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Email Details:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• <strong>From:</strong> SpaStream &lt;notifications@spastream.net&gt;</li>
                    <li>• <strong>To:</strong> admin@spastream.net (from ADMIN_EMAIL env var)</li>
                    <li>• <strong>Subject:</strong> New Signup: [Plan Name] - [User Email]</li>
                    <li>• <strong>Content:</strong> Subscriber details and plan info</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This will be sent to the ADMIN_EMAIL configured in your Supabase environment variables, not to the email address you entered above.
                  </p>
                </div>

                <Button
                  onClick={testSignupNotification}
                  disabled={loading !== null}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  {loading === 'signup' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4 mr-2" />
                      Send Test Admin Notification
                    </>
                  )}
                </Button>

                <StatusMessage testKey="signup" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Important Setup Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium">Verify Domain in Resend</p>
                  <p className="text-sm text-slate-600">Add spastream.net to Resend and verify DNS records</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium">Configure Environment Variables</p>
                  <p className="text-sm text-slate-600">Set RESEND_API_KEY, ADMIN_EMAIL, and APP_URL in Supabase Functions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium">Test Email Delivery</p>
                  <p className="text-sm text-slate-600">Use this page to test each email type</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href="/app">
                <Button variant="outline" className="w-full">
                  Back to App
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
