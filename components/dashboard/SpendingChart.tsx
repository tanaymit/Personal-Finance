'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getTransactionsByDate } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface ChartData {
  date: string;
  total: number;
}

interface SpendingChartProps {
  type?: 'line' | 'bar';
  days?: number;
}

export function SpendingChart({ type = 'line', days = 30 }: SpendingChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const transactions = await getTransactionsByDate(days);
        setData(transactions);
      } catch (error) {
        console.error('Failed to load spending trend:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [days]);

  if (loading) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
