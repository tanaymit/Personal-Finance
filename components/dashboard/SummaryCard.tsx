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
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-slate-950 to-slate-900 text-slate-100 border-slate-800',
  green: 'from-slate-950 to-slate-900 text-slate-100 border-slate-800',
  red: 'from-slate-950 to-slate-900 text-slate-100 border-slate-800',
  amber: 'from-slate-950 to-slate-900 text-slate-100 border-slate-800'
};

const iconBgClasses = {
  blue: 'bg-cyan-400/10 text-cyan-300',
  green: 'bg-emerald-400/10 text-emerald-300',
  red: 'bg-rose-400/10 text-rose-300',
  amber: 'bg-amber-400/10 text-amber-300'
};

const valueClasses = {
  blue: 'text-cyan-300',
  green: 'text-emerald-300',
  red: 'text-rose-300',
  amber: 'text-amber-300'
};

export function SummaryCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue',
  onClick
}: SummaryCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-transform shadow-[0_0_24px_rgba(2,6,23,0.35)] ${onClick ? 'cursor-pointer hover:scale-[1.02]' : 'hover:scale-[1.01]'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${valueClasses[color]}`}>{value}</h3>
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
        <div className={`p-3 rounded-lg border border-slate-800 ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
