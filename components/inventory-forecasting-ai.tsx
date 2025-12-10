"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw, Package, AlertTriangle, TrendingUp, TrendingDown, Minus, Calendar, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ConfidenceBar } from "./ai-confidence-bar";
import { SafeProgress } from "./safe-progress";

interface InventoryForecast {
  id: string;
  product_id: string;
  current_quantity: number;
  daily_usage_rate: number;
  predicted_stockout_date: string | null;
  days_until_stockout: number | null;
  recommended_order_quantity: number;
  confidence_score: number;
  upcoming_appointments_count: number;
  historical_usage_trend: 'increasing' | 'stable' | 'decreasing';
  product?: {
    name: string;
    category: string;
    unit_type: string;
    min_quantity: number;
  };
}

export function InventoryForecastingAI() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);

  const loadForecasts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("inventory_forecasts")
        .select(`
          *,
          product:inventory_products(name, category, unit_type, min_quantity)
        `)
        .eq("user_id", user.id)
        .order("days_until_stockout", { ascending: true, nullsFirst: false });

      if (error) throw error;

      setForecasts(data || []);
    } catch (error: any) {
      toast.error("Failed to load forecasts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runForecast = async () => {
    try {
      setAnalyzing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inventory-forecaster`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Forecast failed");

      const result = await response.json();
      toast.success(`Analyzed ${result.analyzed} products successfully`);
      await loadForecasts();
    } catch (error: any) {
      toast.error("Failed to run forecast: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getUrgencyLevel = (days: number | null) => {
    if (days === null) return 'stable';
    if (days <= 7) return 'critical';
    if (days <= 14) return 'warning';
    if (days <= 30) return 'caution';
    return 'stable';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'caution': return 'secondary';
      case 'stable': return 'outline';
      default: return 'outline';
    }
  };

  const criticalItems = forecasts.filter(f => f.days_until_stockout !== null && f.days_until_stockout <= 7).length;
  const warningItems = forecasts.filter(f => f.days_until_stockout !== null && f.days_until_stockout > 7 && f.days_until_stockout <= 14).length;
  const totalValue = forecasts.reduce((sum, f) => sum + (f.recommended_order_quantity * 50), 0); // Estimate $50 per unit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Inventory Forecasting AI</h2>
          <p className="text-muted-foreground">
            AI-powered predictions for optimal inventory management and purchasing
          </p>
        </div>
        <Button onClick={runForecast} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Forecast
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecasts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalItems}</div>
            <p className="text-xs text-muted-foreground">Stockout within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Items</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{warningItems}</div>
            <p className="text-xs text-muted-foreground">Stockout within 14 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Recommended purchases</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Forecasts</CardTitle>
          <CardDescription>
            AI predicts stock levels based on usage patterns and upcoming appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : forecasts.length === 0 ? (
            <Alert>
              <AlertDescription>
                No forecasts available. Click "Run Forecast" to analyze your inventory.
              </AlertDescription>
            </Alert>
          ) : (
            forecasts.map((forecast) => {
              const urgency = getUrgencyLevel(forecast.days_until_stockout);
              const stockPercentage = forecast.product?.min_quantity
                ? Math.min(100, Math.max(0, (forecast.current_quantity / forecast.product.min_quantity) * 100))
                : 50;

              return (
                <Card key={forecast.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{forecast.product?.name || 'Unknown Product'}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{forecast.product?.category}</Badge>
                          <Badge variant={getUrgencyColor(urgency) as any}>
                            {urgency.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(forecast.historical_usage_trend)}
                            <span className="text-xs text-muted-foreground">
                              {forecast.historical_usage_trend}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{forecast.current_quantity}</div>
                        <div className="text-xs text-muted-foreground">{forecast.product?.unit_type}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Current Stock Level</span>
                        <span className="text-sm text-muted-foreground">{stockPercentage.toFixed(0)}%</span>
                      </div>
                      <SafeProgress value={stockPercentage} className="h-2" />
                    </div>

                    <ConfidenceBar confidence={forecast.confidence_score} label="Forecast Confidence" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Daily Usage Rate</div>
                        <div className="font-medium">{forecast.daily_usage_rate} {forecast.product?.unit_type}/day</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Days Until Stockout</div>
                        <div className="font-medium">
                          {forecast.days_until_stockout !== null
                            ? `${forecast.days_until_stockout} days`
                            : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Upcoming Appointments</div>
                        <div className="font-medium">{forecast.upcoming_appointments_count}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Recommended Order</div>
                        <div className="font-medium text-primary">
                          {forecast.recommended_order_quantity} {forecast.product?.unit_type}
                        </div>
                      </div>
                    </div>

                    {forecast.predicted_stockout_date && (
                      <Alert variant={urgency === 'critical' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Predicted stockout: {new Date(forecast.predicted_stockout_date).toLocaleDateString()}
                          {urgency === 'critical' && ' - ORDER IMMEDIATELY'}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2 pt-2">
                      <div className="text-sm font-medium">AI Insights:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>
                            Usage trend is {forecast.historical_usage_trend}
                            {forecast.historical_usage_trend === 'increasing' && ' - Consider ordering more than usual'}
                            {forecast.historical_usage_trend === 'decreasing' && ' - Order conservatively'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>
                            {forecast.upcoming_appointments_count > 0
                              ? `${forecast.upcoming_appointments_count} appointments scheduled in next 30 days`
                              : 'No upcoming appointments - usage may be lower'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>
                            Order {forecast.recommended_order_quantity} {forecast.product?.unit_type} for 60-day supply
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
