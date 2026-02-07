'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'red' | 'amber';
}

const colorClasses = {
  blue: 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
  green: 'from-green-50 to-green-100 text-green-700 border-green-200',
  red: 'from-red-50 to-red-100 text-red-700 border-red-200',
  amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200'
};

const iconBgClasses = {
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  red: 'bg-red-200',
  amber: 'bg-amber-200'
};

export function SummaryCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue'
}: SummaryCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend >= 0 ? (
                <>
                  <TrendingUp size={14} />
                  <span>{Math.abs(trend)}% {trendLabel || 'from last month'}</span>
                </>
              ) : (
                <>
                  <TrendingDown size={14} />
                  <span>{Math.abs(trend)}% {trendLabel || 'from last month'}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
