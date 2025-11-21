'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, Receipt, ArrowLeft, RefreshCw, Download } from 'lucide-react';
import Link from 'next/link';

interface MonthlyRevenue {
  id: string;
  user_id: string;
  month: string;
  total_revenue: number;
  revenue_over_threshold: number;
  platform_fee_amount: number;
  platform_fee_paid: boolean;
  platform_invoice_id: string | null;
  business_name?: string;
  user_email?: string;
}

interface PlatformInvoice {
  id: string;
  user_id: string;
  monthly_revenue_id: string | null;
  invoice_number: string;
  billing_month: string;
  total_revenue: number;
  billable_amount: number;
  fee_amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  business_name?: string;
  user_email?: string;
}

export default function PlatformRevenuePage() {
  const [revenueRecords, setRevenueRecords] = useState<MonthlyRevenue[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalFees: 0,
    pendingFees: 0,
    paidFees: 0,
  });

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      const monthDate = `${selectedMonth}-01`;

      const [revenueResponse, invoicesResponse, businessInfoResponse] = await Promise.all([
        supabase
          .from('platform_monthly_revenue')
          .select('*')
          .eq('month', monthDate)
          .order('total_revenue', { ascending: false }),
        supabase
          .from('platform_fee_invoices')
          .select('*')
          .eq('billing_month', monthDate)
          .order('created_at', { ascending: false }),
        supabase
          .from('business_information')
          .select('user_id, business_name, email')
      ]);

      if (revenueResponse.error) throw revenueResponse.error;
      if (invoicesResponse.error) throw invoicesResponse.error;

      const businessMap = new Map(
        (businessInfoResponse.data || []).map(b => [b.user_id, { business_name: b.business_name, email: b.email }])
      );

      const enrichedRevenue = (revenueResponse.data || []).map(r => ({
        ...r,
        business_name: businessMap.get(r.user_id)?.business_name || 'Unknown',
        user_email: businessMap.get(r.user_id)?.email || 'N/A'
      }));

      const enrichedInvoices = (invoicesResponse.data || []).map(i => ({
        ...i,
        business_name: businessMap.get(i.user_id)?.business_name || 'Unknown',
        user_email: businessMap.get(i.user_id)?.email || 'N/A'
      }));

      setRevenueRecords(enrichedRevenue);
      setInvoices(enrichedInvoices);

      const totalRevenue = enrichedRevenue.reduce((sum, r) => sum + Number(r.total_revenue), 0);
      const totalFees = enrichedRevenue.reduce((sum, r) => sum + Number(r.platform_fee_amount), 0);
      const paidFees = enrichedInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.fee_amount), 0);
      const pendingFees = enrichedInvoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + Number(i.fee_amount), 0);

      setStats({
        totalRevenue,
        totalFees,
        pendingFees,
        paidFees,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInvoices() {
    if (!confirm(`Generate platform fee invoices for ${selectedMonth}?`)) {
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-platform-invoices`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ billingMonth: selectedMonth })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate invoices');
      }

      alert(`Successfully generated ${result.invoicesGenerated} invoice(s)`);
      fetchData();
    } catch (error: any) {
      console.error('Error generating invoices:', error);
      alert(error.message || 'Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  }

  function exportToCSV() {
    const headers = ['Business Name', 'Email', 'Month', 'Total Revenue', 'Revenue Over $50k', 'Platform Fee', 'Fee Paid', 'Invoice Number'];
    const rows = revenueRecords.map(record => [
      record.business_name || 'N/A',
      record.user_email || 'N/A',
      format(new Date(record.month), 'MMMM yyyy'),
      `$${Number(record.total_revenue).toFixed(2)}`,
      `$${Number(record.revenue_over_threshold).toFixed(2)}`,
      `$${Number(record.platform_fee_amount).toFixed(2)}`,
      record.platform_fee_paid ? 'Yes' : 'No',
      invoices.find(i => i.monthly_revenue_id === record.id)?.invoice_number || 'Not generated'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-revenue-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
                <h1 className="text-3xl font-bold tracking-tight">Platform Revenue</h1>
                <p className="text-slate-600 mt-1">Track med spa revenues and platform fees</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={generateInvoices} disabled={generating}>
                <Receipt className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Invoices'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Med Spa Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-slate-500 mt-1">All businesses combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Platform Fees</CardTitle>
              <TrendingUp className="w-4 h-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">${stats.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-slate-500 mt-1">0.5% on revenue over $50k</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              <Receipt className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${stats.pendingFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Fees</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.paidFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-slate-500 mt-1">Received this month</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Revenue by Business</CardTitle>
            <CardDescription>Revenue threshold: $50,000/month · Platform fee: 0.5% on excess</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Over Threshold</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No revenue data for {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}
                    </TableCell>
                  </TableRow>
                ) : (
                  revenueRecords.map((record) => {
                    const invoice = invoices.find(i => i.monthly_revenue_id === record.id);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.business_name}</TableCell>
                        <TableCell className="text-sm text-slate-600">{record.user_email}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(record.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(record.revenue_over_threshold).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-cyan-600">
                          ${Number(record.platform_fee_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.platform_fee_paid ? 'default' : 'secondary'}>
                            {record.platform_fee_paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice ? (
                            <span className="text-sm font-mono">{invoice.invoice_number}</span>
                          ) : (
                            <span className="text-sm text-slate-400">Not generated</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Fee Invoices</CardTitle>
              <CardDescription>All invoices for {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-right">Fee Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.business_name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(invoice.fee_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
