'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { getTransactionsByCategory, fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function CategoryChart() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoryTotals, categories] = await Promise.all([
          getTransactionsByCategory(),
          fetchCategories()
        ]);

        const chartData: CategoryData[] = Object.entries(categoryTotals)
          .map(([category, total]) => {
            const categoryData = categories.find((c: any) => c.name === category);
            return {
              name: category,
              value: Math.max(0, total),
              color: categoryData?.color || '#6b7280'
            };
          })
          .filter(d => d.value > 0);
        setData(chartData);
      } catch (error) {
        console.error('Failed to load category chart:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${formatCurrency(value)} (${Math.round((percent || 0) * 100)}%)`}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
            activeIndex={activeIndex ?? undefined}
            activeShape={props => (
              <g>
                <text x={props.cx} y={props.cy - 10} textAnchor="middle" className="fill-slate-800 text-sm font-semibold">
                  {props.payload.name}
                </text>
                <text x={props.cx} y={props.cy + 10} textAnchor="middle" className="fill-slate-600 text-xs">
                  {formatCurrency(props.value)}
                </text>
                <Sector {...props} outerRadius={props.outerRadius + 10} fill={props.fill} />
              </g>
            )}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any, _name, payload) => `${formatCurrency(value as number)} (${payload?.payload?.name || ''})`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
