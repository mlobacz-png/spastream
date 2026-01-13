'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function TestNotificationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [responseDetails, setResponseDetails] = useState('');

  async function testNotification() {
    if (!email) {
      setStatus('error');
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');
    setResponseDetails('');

    try {
      const payload = {
        user_email: email,
        plan_name: 'Premium',
        plan_price: 99900,
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await fetch(
        'https://kviciiartofmqbsbrqii.supabase.co/functions/v1/send-signup-notification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      setResponseDetails(responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);

      setStatus('success');
      setMessage(
        `Notification sent successfully! Message ID: ${data.messageId || 'N/A'}. Check your admin email inbox.`
      );
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/test-signup">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Test Signup
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Email Notification</CardTitle>
            <CardDescription>
              Directly test the notification edge function without creating a user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Test User Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="testuser@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-slate-500">
                This is the email that will appear in the notification (not where it's sent to)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-900">
                <strong>Test Details:</strong>
              </p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>Plan: Premium ($999/mo)</li>
                <li>Status: Trialing</li>
                <li>The notification will be sent to your ADMIN_EMAIL</li>
                <li>This does NOT create a real user in the database</li>
              </ul>
            </div>

            <Button
              onClick={testNotification}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Notification...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>

            {status === 'success' && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Success!</p>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Error</p>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {responseDetails && (
              <details className="text-xs bg-slate-50 p-3 rounded border">
                <summary className="cursor-pointer font-medium mb-2">Raw Response</summary>
                <pre className="whitespace-pre-wrap break-all">{responseDetails}</pre>
              </details>
            )}

            <div className="pt-4 border-t space-y-2 text-center">
              <p className="text-sm text-slate-600">Check your environment variables:</p>
              <div className="text-xs bg-slate-100 p-3 rounded font-mono text-left">
                <div>RESEND_API_KEY: {process.env.NEXT_PUBLIC_RESEND_API_KEY ? '✓ Set' : '✗ Not set'}</div>
                <div className="mt-1 text-slate-500">
                  ADMIN_EMAIL: Must be set in Supabase Edge Functions settings
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
