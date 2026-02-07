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
          const data = await fetchTransactions();
          setTransactions(data.slice(0, 5));
          // load categories for colors
          const cats = await fetchCategories();
          setCategories(cats as any[]);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-600">No transactions yet — upload a receipt to populate data.</div>
      ) : (
        transactions.map(transaction => {
        const category = categories.find(c => c.name === transaction.category);
        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: category?.color }}
              >
                {category?.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{transaction.merchant}</p>
                <p className="text-sm text-slate-500">{getRelativeTime(transaction.date)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">-{formatCurrency(transaction.amount)}</p>
              <p className="text-xs text-slate-500">{transaction.category}</p>
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
