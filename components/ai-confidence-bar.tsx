'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ConfidenceBarProps {
  label: string;
  confidence: number;
  animate?: boolean;
}

export function ConfidenceBar({ label, confidence, animate = true }: ConfidenceBarProps) {
  const [displayConfidence, setDisplayConfidence] = useState(animate ? 0 : confidence);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setDisplayConfidence(confidence);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [confidence, animate]);

  const getColor = (value: number) => {
    if (value >= 80) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
    if (value >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
    return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
  };

  const colors = getColor(confidence);

  const getIcon = (value: number) => {
    if (value >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getBorderColor = (value: number) => {
    if (value >= 80) return 'border-green-200';
    if (value >= 60) return 'border-yellow-200';
    return 'border-red-200';
  };

  return (
    <div className={`p-4 rounded-xl ${colors.bg} border ${getBorderColor(confidence)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon(confidence)}
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className={`text-lg font-bold ${colors.text}`}>
          {confidence}%
        </span>
      </div>
      <div className="relative w-full h-3 bg-white rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${displayConfidence}%` }}
        />
      </div>
    </div>
  );
}

interface RiskScoreProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScore({ score, label = 'Risk Score', size = 'md' }: RiskScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (value: number) => {
    if (value <= 30) return 'text-green-600';
    if (value <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sizeClasses = {
    sm: 'w-20 h-20 text-xl',
    md: 'w-28 h-28 text-3xl',
    lg: 'w-36 h-36 text-4xl'
  };

  const strokeWidth = size === 'sm' ? 8 : size === 'md' ? 10 : 12;
  const radius = size === 'sm' ? 36 : size === 'md' ? 50 : 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className={sizeClasses[size]} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${getColor(score)} transition-all duration-1000 ease-out transform -rotate-90 origin-center`}
            style={{ transformOrigin: '60px 60px' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${getColor(score)}`}>
            {Math.round(displayScore)}
          </span>
        </div>
      </div>
      <span className="text-sm text-slate-600 mt-2">{label}</span>
    </div>
  );
}

interface AIInsightCardProps {
  title: string;
  description: string;
  confidence: number;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AIInsightCard({ title, description, confidence, icon, action }: AIInsightCardProps) {
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'from-green-500 to-emerald-600';
    if (value >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getConfidenceColor(confidence)} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-500">AI Active</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">{description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getConfidenceColor(confidence)} transition-all duration-500`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700">{confidence}%</span>
              </div>
            </div>
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {action.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
