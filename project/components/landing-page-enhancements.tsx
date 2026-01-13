'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Shield, Clock, Users, DollarSign, Star, TrendingUp, X } from 'lucide-react';

export function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 py-8 bg-slate-50 rounded-2xl">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-slate-700">HIPAA Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-slate-700">SOC 2 Certified</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-slate-700">99.9% Uptime</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-green-600" />
        <span className="text-sm font-semibold text-slate-700">Trusted by 500+ Med Spas</span>
      </div>
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500" />
        <span className="text-sm font-semibold text-slate-700">4.9/5 Rating</span>
      </div>
    </div>
  );
}

export function CustomerTestimonials() {
  const testimonials = [
    {
      name: 'Dr. Sarah Martinez',
      role: 'Medical Director, Serenity MedSpa',
      content: 'SpaStream transformed our practice. The AI no-show predictor alone saved us over $40K in the first year. The compliance auditor gives me peace of mind that we\'re always HIPAA compliant.',
      rating: 5,
      image: '👩‍⚕️',
    },
    {
      name: 'Jessica Chen',
      role: 'Owner, Radiance Aesthetics',
      content: 'We switched from Mindbody and couldn\'t be happier. The interface is modern, the AI features actually work, and we\'re seeing 32% revenue growth. Best decision we made for our business.',
      rating: 5,
      image: '👱‍♀️',
    },
    {
      name: 'Michael Johnson',
      role: 'Practice Manager, Elite Skin',
      content: 'The treatment recommender is incredible. Our average transaction value increased by 35% because the AI suggests complementary services our staff would never think of. It\'s like having an expert consultant 24/7.',
      rating: 5,
      image: '👨‍💼',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-slate-700 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{testimonial.image}</div>
              <div>
                <p className="font-semibold text-slate-800">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ComparisonTable() {
  const competitors = [
    { name: 'SpaStream', ai: true, hipaa: true, inventory: true, marketing: true, sms: true, price: '$599', contract: 'Month-to-month', setup: '$0' },
    { name: 'Zenoti', ai: false, hipaa: 'Partial', inventory: true, marketing: 'Limited', sms: 'Extra $', price: '$900+', contract: '12-36 months', setup: '$500-5000' },
    { name: 'Mindbody', ai: false, hipaa: false, inventory: 'Basic', marketing: 'Limited', sms: 'Extra $', price: '$600+', contract: '12 months', setup: '$0-500' },
    { name: 'Vagaro', ai: false, hipaa: false, inventory: false, marketing: false, sms: 'Limited', price: '$150', contract: 'Month-to-month', setup: '$0' },
    { name: 'Boulevard', ai: false, hipaa: 'Partial', inventory: false, marketing: false, sms: 'Extra $', price: '$625', contract: 'Month-to-month', setup: '$0' },
  ];

  const renderValue = (value: any) => {
    if (value === true) return <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-red-500 mx-auto" />;
    return <span className="text-sm text-slate-700">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-4 text-left font-semibold text-slate-800">Feature</th>
            {competitors.map((comp, i) => (
              <th key={i} className={`p-4 text-center font-semibold ${comp.name === 'SpaStream' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                {comp.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-4 font-medium text-slate-700">AI Features</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'SpaStream' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.ai)}
              </td>
            ))}
          </tr>
          <tr className="border-b bg-slate-50">
            <td className="p-4 font-medium text-slate-700">HIPAA Compliant</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.hipaa)}
              </td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-4 font-medium text-slate-700">Inventory</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.inventory)}
              </td>
            ))}
          </tr>
          <tr className="border-b bg-slate-50">
            <td className="p-4 font-medium text-slate-700">Marketing Automation</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.marketing)}
              </td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-4 font-medium text-slate-700">SMS Included</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.sms)}
              </td>
            ))}
          </tr>
          <tr className="border-b bg-slate-50">
            <td className="p-4 font-medium text-slate-700">Price (3 staff)</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                <span className="font-semibold text-slate-800">{comp.price}/mo</span>
              </td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-4 font-medium text-slate-700">Contract</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.contract)}
              </td>
            ))}
          </tr>
          <tr className="bg-slate-50">
            <td className="p-4 font-medium text-slate-700">Setup Fee</td>
            {competitors.map((comp, i) => (
              <td key={i} className={`p-4 text-center ${comp.name === 'MedSpaFlow' ? 'bg-blue-50' : ''}`}>
                {renderValue(comp.setup)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [noShowRate, setNoShowRate] = useState(15);
  const [avgTransaction, setAvgTransaction] = useState(350);

  const calculations = {
    noShowRecovery: (monthlyRevenue * (noShowRate / 100) * 0.4) * 12,
    revenueIncrease: (monthlyRevenue * 0.32) * 12,
    laborSavings: 20 * 4 * 12 * 25,
    totalSavings: 0,
  };

  calculations.totalSavings = calculations.noShowRecovery + calculations.revenueIncrease + calculations.laborSavings;

  const softwareCost = 599 * 12;
  const netBenefit = calculations.totalSavings - softwareCost;
  const roi = ((netBenefit / softwareCost) * 100).toFixed(0);

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardContent className="p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">ROI Calculator</h3>
        <p className="text-slate-600 mb-6">See how much SpaStream can save your practice</p>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monthly Revenue: ${monthlyRevenue.toLocaleString()}
            </label>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              No-Show Rate: {noShowRate}%
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={noShowRate}
              onChange={(e) => setNoShowRate(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Avg Transaction: ${avgTransaction}
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={avgTransaction}
              onChange={(e) => setAvgTransaction(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl">
            <span className="text-slate-700">No-Show Recovery (40% reduction)</span>
            <span className="font-semibold text-green-600">${calculations.noShowRecovery.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl">
            <span className="text-slate-700">Revenue Increase (32% avg)</span>
            <span className="font-semibold text-green-600">${calculations.revenueIncrease.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-xl">
            <span className="text-slate-700">Labor Savings (10hrs/week)</span>
            <span className="font-semibold text-green-600">${calculations.laborSavings.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white">
          <p className="text-sm text-green-100 mb-1">Total Annual Benefit</p>
          <p className="text-4xl font-bold mb-2">${calculations.totalSavings.toLocaleString()}</p>
          <p className="text-green-100 mb-4">Software cost: ${softwareCost.toLocaleString()}/year</p>
          <div className="flex items-center justify-between">
            <span className="text-lg">Net Benefit:</span>
            <span className="text-2xl font-bold">${netBenefit.toLocaleString()}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <div className="flex items-center justify-between">
              <span className="text-lg">ROI:</span>
              <span className="text-3xl font-bold">{roi}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
