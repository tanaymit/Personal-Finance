'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getTransactionsByCategory, fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/lib/colors';
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
  const [filtersLoaded, setFiltersLoaded] = useState(false);

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
    setFiltersLoaded(true);
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;

    async function loadData() {
      try {
        const [categoryTotals, cats] = await Promise.all([
          getTransactionsByCategory(filterYear, filterMonth),
          fetchCategories(filterYear, filterMonth)
        ]);

        setCategories(cats);

        // Convert to array, sort by value descending, and take top 10
        let chartData: CategoryData[] = Object.entries(categoryTotals).map(([category, total], index) => {
          const categoryData = cats.find(c => c.name === category);
          return {
            name: category,
            value: total,
            color: categoryData?.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
          };
        });
        
        // Sort by value descending and take top 10
        chartData = chartData.sort((a, b) => b.value - a.value).slice(0, 10);
        
        setData(chartData);
      } catch (error) {
        console.error('Failed to load category chart:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filterYear, filterMonth, filtersLoaded]);

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

  // Listen for new transactions from upload page
  useEffect(() => {
    const handleTransactionCreated = () => {
      // Reload chart data when new transaction is added
      async function loadData() {
        try {
          const [categoryTotals, cats] = await Promise.all([
            getTransactionsByCategory(filterYear, filterMonth),
            fetchCategories(filterYear, filterMonth)
          ]);

          let chartData: CategoryData[] = Object.entries(categoryTotals).map(([category, total], index) => {
            const categoryData = cats.find(c => c.name === category);
            return {
              name: category,
              value: total,
              color: categoryData?.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            };
          });
          
          chartData = chartData.sort((a, b) => b.value - a.value).slice(0, 10);
          setData(chartData);
        } catch (error) {
          console.error('Failed to reload category chart:', error);
        }
      }
      loadData();
    };

    window.addEventListener('transactionCreated', handleTransactionCreated as EventListener);
    return () => window.removeEventListener('transactionCreated', handleTransactionCreated as EventListener);
  }, [filterYear, filterMonth]);

  // Listen for new transactions from upload page
  useEffect(() => {
    const handleTransactionCreated = () => {
      // Reload chart data when new transaction is added
      async function loadData() {
        try {
          const [categoryTotals, cats] = await Promise.all([
            getTransactionsByCategory(filterYear, filterMonth),
            fetchCategories(filterYear, filterMonth)
          ]);

          let chartData: CategoryData[] = Object.entries(categoryTotals).map(([category, total], index) => {
            const categoryData = cats.find(c => c.name === category);
            return {
              name: category,
              value: total,
              color: categoryData?.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            };
          });
          
          chartData = chartData.sort((a, b) => b.value - a.value).slice(0, 10);
          setData(chartData);
        } catch (error) {
          console.error('Failed to reload category chart:', error);
        }
      }
      loadData();
    };

    window.addEventListener('transactionCreated', handleTransactionCreated as EventListener);
    return () => window.removeEventListener('transactionCreated', handleTransactionCreated as EventListener);
  }, [filterYear, filterMonth]);

  if (loading) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-slate-400">
        No spending data available
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: unknown) => formatCurrency(Number(value))}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {data.length > 10 && (
        <p className="text-xs text-slate-400 text-center">Showing top 10 categories</p>
      )}
    </div>
  );
}
