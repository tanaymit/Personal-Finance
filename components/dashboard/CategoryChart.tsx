'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getTransactionsByCategory, fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Category } from '@/lib/types';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function CategoryChart() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
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
        const [categoryTotals, cats] = await Promise.all([
          getTransactionsByCategory(filterYear, filterMonth),
          fetchCategories(filterYear, filterMonth)
        ]);

        setCategories(cats);

        const chartData: CategoryData[] = Object.entries(categoryTotals).map(([category, total]) => {
          const categoryData = cats.find(c => c.name === category);
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
    const handleFilterChange = (event: Event) => {
      const e = event as CustomEvent<{ year: number; month: number }>;
      const { year, month } = e.detail;
      setFilterYear(year);
      setFilterMonth(month);
    };

    window.addEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    return () => window.removeEventListener('monthYearFilterChange', handleFilterChange as EventListener);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl animate-pulse" />
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
          <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
