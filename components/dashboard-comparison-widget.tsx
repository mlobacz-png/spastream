'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonWidgetProps {
  label: string;
  currentValue: number;
  previousValue: number;
  format?: 'currency' | 'number' | 'percentage';
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

export function ComparisonWidget({
  label,
  currentValue,
  previousValue,
  format = 'number',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
}: ComparisonWidgetProps) {
  const difference = currentValue - previousValue;
  const percentageChange = previousValue !== 0 ? (difference / previousValue) * 100 : 0;
  const isPositive = difference > 0;
  const isNeutral = difference === 0;

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex items-center gap-1">
            {isNeutral ? (
              <Minus className="w-4 h-4 text-slate-400" />
            ) : isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-semibold ${
                isNeutral
                  ? 'text-slate-600'
                  : isPositive
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {isNeutral ? '0%' : `${isPositive ? '+' : ''}${percentageChange.toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-600 mb-1">{label}</p>
          <p className="text-3xl font-light text-slate-800">
            {formatValue(currentValue)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            vs {formatValue(previousValue)} last month
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface RevenueGoalWidgetProps {
  current: number;
  goal: number;
}

export function RevenueGoalWidget({ current, goal }: RevenueGoalWidgetProps) {
  const percentage = goal > 0 ? (current / goal) * 100 : 0;
  const remaining = goal - current;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
      <CardContent className="p-6">
        <div className="text-white">
          <p className="text-sm text-green-100 mb-2">Monthly Revenue Goal</p>
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-4xl font-light">${current.toLocaleString()}</p>
            <p className="text-lg text-green-100">/ ${goal.toLocaleString()}</p>
          </div>

          <div className="relative w-full h-3 bg-green-700/30 rounded-full overflow-hidden mb-2">
            <div
              className="absolute top-0 left-0 h-full bg-white/90 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-green-100">
              {percentage >= 100 ? 'Goal achieved!' : `${remaining.toLocaleString()} to go`}
            </span>
            <span className="font-semibold">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
