'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { fetchTransactions, fetchCategories } from '@/lib/api';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/utils';

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [initialized, setInitialized] = useState<boolean | null>(null);
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
    async function loadTransactions() {
      try {
        const flag = typeof window !== 'undefined' && localStorage.getItem('dataInitialized');
        setInitialized(!!flag);
        if (!flag) {
          // not initialized: show empty state
          setTransactions([]);
          setCategories([]);
        } else {
          const data = await fetchTransactions(undefined, filterYear, filterMonth);
          setTransactions(data.slice(0, 5));
          // load categories for colors
          const cats = await fetchCategories(filterYear, filterMonth);
          setCategories(cats as any[]);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
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
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400">No transactions yet — upload a receipt to populate data.</div>
      ) : (
        transactions.map(transaction => {
        const category = categories.find(c => c.name === transaction.category);
        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-slate-900/60 rounded-lg hover:bg-slate-900 transition-colors border border-slate-800"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: category?.color }}
              >
                {category?.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-100">{transaction.merchant}</p>
                <p className="text-sm text-slate-400">{getRelativeTime(transaction.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-rose-300">-{formatCurrency(transaction.amount)}</p>
              <p className="text-xs text-slate-400">{transaction.category}</p>
            </div>
          </div>
        );
        })
      )}
      <Link href="/transactions">
        <div className="flex items-center justify-center gap-2 p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          View All Transactions
          <ArrowRight size={16} />
        </div>
      </Link>
    </div>
  );
}
