'use client';

import { useState, useEffect } from 'react';
import { Transaction, FilterOptions } from '@/lib/types';
import { fetchCategories } from '@/lib/api';
import { formatCurrency, getRelativeTime } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function TransactionList({
  transactions,
  onDelete,
  isLoading = false
}: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (mounted) setCategories(cats as any[]);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onDelete?.(id);
      setDeletingId(null);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg border border-slate-800">
        <div className="text-slate-500 mb-4">📊</div>
        <p className="text-slate-200 font-medium">No transactions found</p>
        <p className="text-sm text-slate-400">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map(transaction => {
        const category = categories.find(c => c.name === transaction.category);
        const isDeleting = deletingId === transaction.id;

        return (
          <div
            key={transaction.id}
            className={`flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-all ${
              isDeleting ? 'opacity-50 scale-95' : ''
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: category?.color }}
              >
                {category?.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-100 truncate">{transaction.merchant}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-800">
                    {transaction.category}
                  </span>
                  <p className="text-sm text-slate-400">{getRelativeTime(transaction.date)}</p>
                </div>
                {transaction.description && (
                  <p className="text-xs text-slate-400 truncate">{transaction.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="font-semibold text-rose-300">-{formatCurrency(transaction.amount)}</p>
                {transaction.paymentMethod && (
                  <p className="text-xs text-slate-400">{transaction.paymentMethod}</p>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/30 rounded-lg transition-colors"
                  title="Delete transaction"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

 
