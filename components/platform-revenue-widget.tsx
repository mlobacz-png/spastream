"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { DollarSign, TrendingUp, Receipt, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface MonthlyRevenue {
  id: string;
  month: string;
  total_revenue: number;
  revenue_over_threshold: number;
  platform_fee_amount: number;
  platform_fee_paid: boolean;
  platform_invoice_id: string | null;
}

interface PlatformInvoice {
  invoice_number: string;
  status: string;
  due_date: string;
  fee_amount: number;
}

export function PlatformRevenueWidget() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<MonthlyRevenue | null>(null);
  const [invoice, setInvoice] = useState<PlatformInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRevenueData();
    }
  }, [user]);

  const fetchRevenueData = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const currentMonthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { data: revenueData } = await supabase
        .from("platform_monthly_revenue")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonthDate)
        .maybeSingle();

      if (revenueData) {
        setCurrentMonth(revenueData);

        if (revenueData.platform_invoice_id) {
          const { data: invoiceData } = await supabase
            .from("platform_fee_invoices")
            .select("invoice_number, status, due_date, fee_amount")
            .eq("id", revenueData.platform_invoice_id)
            .maybeSingle();

          if (invoiceData) {
            setInvoice(invoiceData);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            Platform Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            Platform Revenue
          </CardTitle>
          <CardDescription>Current month revenue tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No revenue data yet for this month. Revenue tracking begins after your first completed transaction.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const threshold = 50000;
  const percentageToThreshold = Math.min((Number(currentMonth.total_revenue) / threshold) * 100, 100);
  const isOverThreshold = Number(currentMonth.total_revenue) > threshold;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-cyan-600" />
          Platform Revenue
        </CardTitle>
        <CardDescription>
          {format(new Date(currentMonth.month), 'MMMM yyyy')} · Revenue threshold: $50,000
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold">
              ${Number(currentMonth.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {isOverThreshold && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Over Threshold</p>
              <p className="text-2xl font-bold text-cyan-600">
                ${Number(currentMonth.revenue_over_threshold).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        {!isOverThreshold && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Progress to threshold</p>
              <p className="text-sm font-medium">{percentageToThreshold.toFixed(1)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${percentageToThreshold}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ${(threshold - Number(currentMonth.total_revenue)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} until platform fee applies
            </p>
          </div>
        )}

        {isOverThreshold && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium">Platform Fee</p>
              </div>
              <p className="text-lg font-bold text-cyan-600">
                ${Number(currentMonth.platform_fee_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              0.5% on revenue over $50,000
            </p>

            {invoice && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Invoice: {invoice.invoice_number}</p>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </div>
                {invoice.status === 'pending' && (
                  <p className="text-xs text-gray-600">
                    Due: {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}
                  </p>
                )}
                {invoice.status === 'paid' && (
                  <p className="text-xs text-green-600">
                    Thank you for your payment!
                  </p>
                )}
              </div>
            )}

            {!invoice && currentMonth.platform_fee_amount > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Platform fee invoice will be generated at the end of the month.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          <TrendingUp className="h-3 w-3 inline mr-1" />
          Revenue updates automatically as transactions complete
        </div>
      </CardContent>
    </Card>
  );
}
