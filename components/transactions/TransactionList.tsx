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
          <div key={i} className="h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
        <div className="text-slate-400 mb-4">📊</div>
        <p className="text-slate-600 font-medium">No transactions found</p>
        <p className="text-sm text-slate-500">Try adjusting your filters</p>
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
            className={`flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all ${
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
                <p className="font-medium text-slate-900 truncate">{transaction.merchant}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {transaction.category}
                  </span>
                  <p className="text-sm text-slate-500">{getRelativeTime(transaction.date)}</p>
                </div>
                {transaction.description && (
                  <p className="text-xs text-slate-500 truncate">{transaction.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="font-semibold text-slate-900">-{formatCurrency(transaction.amount)}</p>
                {transaction.paymentMethod && (
                  <p className="text-xs text-slate-500">{transaction.paymentMethod}</p>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

 
