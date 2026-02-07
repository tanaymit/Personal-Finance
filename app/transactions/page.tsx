'use client';

import { useEffect, useState } from 'react';
import { Transaction, FilterOptions } from '@/lib/types';
import { fetchTransactions, deleteTransaction } from '@/lib/api';
import { TransactionList } from '@/components/transactions/TransactionList';
import { FilterPanel } from '@/components/transactions/FilterPanel';
import { Search } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    if (filters.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate!);
    }
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [filters, searchTerm, transactions]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Transactions</h1>
        <p className="text-slate-600">View and manage all your transactions</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Panel and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters (Sidebar on desktop, collapsible on mobile) */}
        <div className="lg:col-span-1">
          <FilterPanel
            onFilterChange={setFilters}
            isOpen={filterOpen}
            onToggle={() => setFilterOpen(!filterOpen)}
          />
        </div>

        {/* Transaction List */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            {filteredTransactions.length > 0 && (
              <div className="mb-4 pb-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
              </div>
            )}
            <TransactionList
              transactions={filteredTransactions}
              onDelete={handleDelete}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
