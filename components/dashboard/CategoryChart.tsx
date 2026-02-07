'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();

  useEffect(() => {
    // Load filter from localStorage on mount
    const stored = localStorage.getItem('monthYearFilter');
    if (stored) {
      try {
        const { year, month } = JSON.parse(stored);
        setFilterYear(year);
        setFilterMonth(month);
      } catch (e) {
        console.error('Failed to parse stored filter:', e);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoryTotals, categories] = await Promise.all([
          getTransactionsByCategory(filterYear, filterMonth),
          fetchCategories(filterYear, filterMonth)
        ]);

        const chartData: CategoryData[] = Object.entries(categoryTotals).map(([category, total]) => {
          const categoryData = categories.find((c: any) => c.name === category);
          return {
            name: category,
            value: total,
            color: categoryData?.color || '#6b7280'
          };
        });
        setData(chartData);
      } catch (error) {
        console.error('Failed to load category chart:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filterYear, filterMonth]);

  // Listen for filter changes
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      const { year, month } = e.detail;
      setFilterYear(year);
      setFilterMonth(month);
    };

    window.addEventListener('monthYearFilterChange' as any, handleFilterChange);
    return () => window.removeEventListener('monthYearFilterChange' as any, handleFilterChange);
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
            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
