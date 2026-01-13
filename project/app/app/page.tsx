'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthForm } from '@/components/auth-form';
import { Dashboard } from '@/components/dashboard';

export default function AppPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 animate-pulse" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthForm />;
}
