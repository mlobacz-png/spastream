'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Users, DollarSign, TrendingUp, Download, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  plan: {
    name: string;
    price: number;
  };
  user: {
    email: string;
  };
}

export default function SubscribersPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trialing: 0,
    mrr: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-subscribers`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();

      setSubscriptions(data.subscriptions);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(subscriptions.filter(sub => sub.id !== subscriptionId));

      setStats(prev => ({
        total: prev.total - 1,
        active: prev.active - (subscriptions.find(s => s.id === subscriptionId)?.status === 'active' ? 1 : 0),
        trialing: prev.trialing - (subscriptions.find(s => s.id === subscriptionId)?.status === 'trialing' ? 1 : 0),
        mrr: prev.mrr - (subscriptions.find(s => s.id === subscriptionId)?.plan?.price || 0),
      }));
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Failed to delete subscription');
    }
  }

  function exportToCSV() {
    const headers = ['Email', 'Plan', 'Status', 'Trial Ends', 'Period Start', 'Period End', 'Signup Date'];
    const rows = subscriptions.map(sub => [
      sub.user?.email || 'N/A',
      sub.plan?.name || 'N/A',
      sub.status,
      sub.trial_ends_at ? format(new Date(sub.trial_ends_at), 'MMM dd, yyyy') : 'N/A',
      format(new Date(sub.current_period_start), 'MMM dd, yyyy'),
      sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM dd, yyyy') : 'N/A',
      format(new Date(sub.created_at), 'MMM dd, yyyy HH:mm'),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
                <p className="text-slate-600 mt-1">View and manage all subscriptions</p>
              </div>
            </div>
            <Button onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Trial</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.trialing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">${stats.mrr.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>Complete list of all subscribers and their plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Current Period</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No subscriptions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.user?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.plan?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'default'
                              : sub.status === 'trialing'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {sub.trial_ends_at ? format(new Date(sub.trial_ends_at), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(sub.current_period_start), 'MMM dd')} -{' '}
                        {sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM dd') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(sub.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSubscription(sub.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
