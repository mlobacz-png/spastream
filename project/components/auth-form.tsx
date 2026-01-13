'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaStreamLogo } from './spastream-logo';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });
        if (error) throw error;

        console.log('SignUp result:', { user: data?.user?.id, identities: data?.user?.identities?.length });

        if (data?.user && !data.user.identities?.length) {
          setMessage('This email is already registered. Please sign in instead.');
        } else if (data?.user) {
          // Wait a moment for session to be fully established
          await new Promise(resolve => setTimeout(resolve, 500));
          // Always start new signups at business info step
          router.push('/onboarding?step=business-info');
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data?.user) {
          const { data: bizInfo } = await supabase
            .from('business_information')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!bizInfo) {
            router.push('/onboarding?step=business-info');
          } else {
            router.push('/app');
          }
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16">
            <SpaStreamLogo className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl font-light text-slate-800">SpaStream</CardTitle>
          <CardDescription className="text-base">Your serene practice management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200"
              />
            </div>
            {message && (
              <p className={`text-sm text-center ${message.includes('error') || message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {message}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
