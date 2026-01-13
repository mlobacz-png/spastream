'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { DollarSign, TrendingUp, TrendingDown, Package, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface PricingRule {
  id: string;
  service: string;
  base_price: number;
  current_price: number;
  demand_multiplier: number;
  inventory_level: number;
  last_adjusted: string;
}

const SEASONAL_FACTORS = {
  Q1: { name: 'Winter Recovery', multiplier: 0.95 },
  Q2: { name: 'Spring Prep', multiplier: 1.10 },
  Q3: { name: 'Summer Maintenance', multiplier: 1.05 },
  Q4: { name: 'Holiday Season', multiplier: 1.20 },
};

export function DynamicPricing() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [newBasePrice, setNewBasePrice] = useState('');
  const [newInventory, setNewInventory] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchPricingRules();
  }, [user]);

  const fetchPricingRules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('service');
    if (data) setPricingRules(data);
  };

  const getCurrentQuarter = () => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  };

  const calculateDemandMultiplier = (service: string, inventoryLevel: number) => {
    const quarter = getCurrentQuarter();
    const seasonalMultiplier = SEASONAL_FACTORS[quarter as keyof typeof SEASONAL_FACTORS].multiplier;

    let inventoryMultiplier = 1.0;
    if (inventoryLevel < 10) inventoryMultiplier = 1.15;
    else if (inventoryLevel < 20) inventoryMultiplier = 1.08;
    else if (inventoryLevel > 50) inventoryMultiplier = 0.95;

    let serviceMultiplier = 1.0;
    if (quarter === 'Q4') {
      if (service.includes('Filler') || service.includes('Botox')) {
        serviceMultiplier = 1.10;
      }
    }

    return seasonalMultiplier * inventoryMultiplier * serviceMultiplier;
  };

  const initializePricing = async () => {
    if (!user) return;

    const defaultServices = [
      { service: 'Botox', base_price: 400 },
      { service: 'Dermal Fillers', base_price: 650 },
      { service: 'Chemical Peel', base_price: 250 },
      { service: 'Microneedling', base_price: 350 },
      { service: 'Laser Hair Removal', base_price: 300 },
      { service: 'Hydrafacial', base_price: 200 },
      { service: 'IV Therapy', base_price: 180 },
    ];

    for (const svc of defaultServices) {
      const existing = pricingRules.find(r => r.service === svc.service);
      if (existing) continue;

      const inventoryLevel = Math.floor(Math.random() * 40) + 10;
      const demandMultiplier = calculateDemandMultiplier(svc.service, inventoryLevel);
      const currentPrice = Math.round(svc.base_price * demandMultiplier);

      await supabase.from('pricing_rules').insert([{
        user_id: user.id,
        service: svc.service,
        base_price: svc.base_price,
        current_price: currentPrice,
        demand_multiplier: demandMultiplier,
        inventory_level: inventoryLevel,
        last_adjusted: new Date().toISOString(),
      }]);
    }

    await fetchPricingRules();
  };

  const updatePricing = async (ruleId: string, basePrice?: number, inventory?: number) => {
    const rule = pricingRules.find(r => r.id === ruleId);
    if (!rule) return;

    const newBase = basePrice ?? rule.base_price;
    const newInventory = inventory ?? rule.inventory_level;

    try {
      const session = await supabase.auth.getSession();
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dynamic-pricing`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treatmentType: rule.service,
          basePrice: newBase,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const pricing = await response.json();
        const currentPrice = pricing.recommendedPrice || Math.round(newBase * 1.0);
        const demandMultiplier = currentPrice / newBase;

        await supabase
          .from('pricing_rules')
          .update({
            base_price: newBase,
            current_price: currentPrice,
            demand_multiplier: demandMultiplier,
            inventory_level: newInventory,
            last_adjusted: new Date().toISOString(),
          })
          .eq('id', ruleId);
      } else {
        const demandMultiplier = calculateDemandMultiplier(rule.service, newInventory);
        const currentPrice = Math.round(newBase * demandMultiplier);

        await supabase
          .from('pricing_rules')
          .update({
            base_price: newBase,
            current_price: currentPrice,
            demand_multiplier: demandMultiplier,
            inventory_level: newInventory,
            last_adjusted: new Date().toISOString(),
          })
          .eq('id', ruleId);
      }

      await fetchPricingRules();
      setEditingRule(null);
      setNewBasePrice('');
      setNewInventory('');
    } catch (error) {
      console.error('Error updating pricing:', error);
    }
  };

  const refreshAllPrices = async () => {
    for (const rule of pricingRules) {
      await updatePricing(rule.id);
    }
  };

  const getPriceChangeIndicator = (rule: PricingRule) => {
    const change = rule.current_price - rule.base_price;
    const percentChange = ((change / rule.base_price) * 100).toFixed(1);

    if (change > 0) {
      return (
        <Badge className="rounded-full bg-green-100 text-green-700 border-green-200">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{percentChange}%
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge className="rounded-full bg-red-100 text-red-700 border-red-200">
          <TrendingDown className="w-3 h-3 mr-1" />
          {percentChange}%
        </Badge>
      );
    }
    return <Badge variant="outline" className="rounded-full">No change</Badge>;
  };

  const getInventoryStatus = (level: number) => {
    if (level < 10) return { label: 'Low', color: 'bg-red-100 text-red-700 border-red-200' };
    if (level < 20) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { label: 'Good', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const totalRevenuePotential = pricingRules.reduce((sum, rule) => sum + rule.current_price, 0);
  const avgDemandMultiplier = pricingRules.length > 0
    ? (pricingRules.reduce((sum, rule) => sum + rule.demand_multiplier, 0) / pricingRules.length).toFixed(2)
    : '1.00';

  const currentQuarter = getCurrentQuarter();
  const seasonalInfo = SEASONAL_FACTORS[currentQuarter as keyof typeof SEASONAL_FACTORS];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">Dynamic Pricing AI</h2>
          <p className="text-sm text-slate-600">Demand-based pricing optimization and inventory tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Revenue Potential</p>
                <p className="text-3xl font-light text-slate-800">${totalRevenuePotential}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Demand</p>
                <p className="text-3xl font-light text-slate-800">{avgDemandMultiplier}x</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{currentQuarter} Season</p>
                <p className="text-lg font-light text-slate-800">{seasonalInfo.name}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Pricing Dashboard</CardTitle>
            <div className="flex gap-2">
              {pricingRules.length === 0 && (
                <Button
                  onClick={initializePricing}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Initialize Pricing
                </Button>
              )}
              {pricingRules.length > 0 && (
                <Button
                  onClick={refreshAllPrices}
                  variant="outline"
                  className="rounded-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Prices
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pricingRules.length === 0 ? (
            <Alert className="border-blue-200 bg-blue-50">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Initialize pricing to set up dynamic pricing for your services. AI will automatically adjust prices based on demand, season, and inventory.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {pricingRules.map(rule => {
                const inventoryStatus = getInventoryStatus(rule.inventory_level);
                const isEditing = editingRule === rule.id;

                return (
                  <Card key={rule.id} className="rounded-xl border border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 text-lg">{rule.service}</h4>
                          <p className="text-sm text-slate-500 mt-1">
                            Last adjusted: {format(new Date(rule.last_adjusted), 'MMM dd, h:mm a')}
                          </p>
                        </div>
                        {getPriceChangeIndicator(rule)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Base Price</p>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={newBasePrice || rule.base_price}
                              onChange={(e) => setNewBasePrice(e.target.value)}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="text-lg font-semibold text-slate-700">${rule.base_price}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Current Price</p>
                          <p className="text-lg font-semibold text-blue-600">${rule.current_price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Demand</p>
                          <p className="text-lg font-semibold text-purple-600">{rule.demand_multiplier.toFixed(2)}x</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Inventory</p>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={newInventory || rule.inventory_level}
                              onChange={(e) => setNewInventory(e.target.value)}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <Badge className={`rounded-full border ${inventoryStatus.color} mt-1`}>
                              {rule.inventory_level} ({inventoryStatus.label})
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updatePricing(
                                rule.id,
                                newBasePrice ? parseFloat(newBasePrice) : undefined,
                                newInventory ? parseInt(newInventory) : undefined
                              )}
                              className="rounded-full"
                            >
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRule(null);
                                setNewBasePrice('');
                                setNewInventory('');
                              }}
                              className="rounded-full"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRule(rule.id)}
                            className="rounded-full"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-teal-200 bg-teal-50 rounded-2xl">
        <TrendingUp className="h-4 w-4 text-teal-600" />
        <AlertDescription className="text-sm text-teal-800">
          <strong>Current Season: {seasonalInfo.name}</strong> ({seasonalInfo.multiplier}x multiplier)
          <br />
          Low inventory items receive automatic price increases to maximize revenue.
        </AlertDescription>
      </Alert>
    </div>
  );
}
