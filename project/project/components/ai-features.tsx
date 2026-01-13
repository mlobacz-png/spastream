'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AICompliance } from './ai-compliance';
import { NoShowPredictor } from './no-show-predictor';
import { TreatmentRecommender } from './treatment-recommender';
import { DynamicPricing } from './dynamic-pricing';
import { StaffOptimizer } from './staff-optimizer';
import { ReputationBooster } from './reputation-booster';
import { ClientRetentionAI } from './client-retention-ai';
import { InventoryForecastingAI } from './inventory-forecasting-ai';
import { Shield, TrendingUp, Sparkles, DollarSign, Users, Star, UserX, PackageSearch } from 'lucide-react';

export function AIFeatures() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-light text-slate-800">AI Powered Features</h2>
          <p className="text-sm text-slate-600">Automate compliance, predictions, and optimization</p>
        </div>
      </div>

      <Tabs defaultValue="compliance" className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur border border-slate-200 rounded-full p-1 shadow-lg grid grid-cols-4 md:grid-cols-8 gap-1">
          <TabsTrigger
            value="compliance"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            <Shield className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger
            value="retention"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <UserX className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Retention</span>
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
          >
            <PackageSearch className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">No-Shows</span>
          </TabsTrigger>
          <TabsTrigger
            value="treatment"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-lime-500 data-[state=active]:text-white"
          >
            <Sparkles className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Treatment</span>
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white"
          >
            <DollarSign className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger
            value="staff"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
          >
            <Star className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Reviews</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compliance">
          <AICompliance />
        </TabsContent>

        <TabsContent value="retention">
          <ClientRetentionAI />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryForecastingAI />
        </TabsContent>

        <TabsContent value="predictions">
          <NoShowPredictor />
        </TabsContent>

        <TabsContent value="treatment">
          <TreatmentRecommender />
        </TabsContent>

        <TabsContent value="pricing">
          <DynamicPricing />
        </TabsContent>

        <TabsContent value="staff">
          <StaffOptimizer />
        </TabsContent>

        <TabsContent value="reviews">
          <ReputationBooster />
        </TabsContent>
      </Tabs>
    </div>
  );
}
