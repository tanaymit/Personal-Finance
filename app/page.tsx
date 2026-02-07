'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetEditModal } from '@/components/dashboard/BudgetEditModal';
import { MonthYearFilter } from '@/components/shared/MonthYearFilter';
import { fetchBudgetSummary, fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BudgetSummary } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Load filter from localStorage on mount
  useEffect(() => {
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

  // Load data when filters change (but only after initial filter load)
  useEffect(() => {
    if (!filtersLoaded) return;
    
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchBudgetSummary(filterYear, filterMonth);
        setSummary(data);
      } catch (error) {
        console.error('Failed to load budget summary:', error);
        setSummary({
          totalBudget: 0,
          totalSpent: 0,
          remainingBudget: 0,
          largestCategory: '',
          largestCategoryAmount: 0
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filterYear, filterMonth, filtersLoaded]);

  // Listen for filter changes from other pages
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      const { year, month } = e.detail;
      setFilterYear(year);
      setFilterMonth(month);
    };

    window.addEventListener('monthYearFilterChange' as any, handleFilterChange);
    return () => window.removeEventListener('monthYearFilterChange' as any, handleFilterChange);
  }, []);

  const getSpendingPercentage = () => {
    if (!summary) return 0;
    return Math.round((summary.totalSpent / summary.totalBudget) * 100);
  };

  const getTrend = () => {
    // Mock trend calculation - in real app would compare with previous period
    return -5; // 5% decrease
  };

  const handleBudgetUpdate = async (newBudget: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultBudget: newBudget })
      });
      if (!res.ok) throw new Error('Failed to update budget');
      
      // Reload the summary to update all fields
      const updatedSummary = await fetchBudgetSummary(filterYear, filterMonth);
      setSummary(updatedSummary);
      
      // Notify other tabs/components of budget change
      localStorage.setItem('budgetUpdated', JSON.stringify({ 
        timestamp: Date.now(), 
        newBudget 
      }));
      
      setBudgetModalOpen(false);
    } catch (error) {
      console.error('Failed to update budget:', error);
      throw error;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome back, John!</h1>
        <p className="text-slate-400">Here's your financial overview for this month</p>
      </div>

      {/* Month/Year Filter */}
      <MonthYearFilter />

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Budget"
            value={formatCurrency(summary.totalBudget)}
            icon={<Wallet size={24} className="text-cyan-300" />}
            color="blue"
            onClick={() => setBudgetModalOpen(true)}
          />
          <SummaryCard
            title="Total Spent"
            value={formatCurrency(summary.totalSpent)}
            icon={<DollarSign size={24} className="text-rose-300" />}
            trend={getTrend()}
            color="red"
          />
          <SummaryCard
            title="Remaining"
            value={formatCurrency(summary.remainingBudget)}
            icon={<TrendingUp size={24} className="text-emerald-300" />}
            color="green"
          />
          <SummaryCard
            title="Spending Rate"
            value={`${getSpendingPercentage()}%`}
            icon={<AlertCircle size={24} className="text-amber-300" />}
            color="amber"
          />
        </div>
      ) : null}

      {/* Alert */}
      {summary && summary.totalSpent > summary.totalBudget * 0.8 && (
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-800/40 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-300 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-amber-100 mb-1">Approaching Budget Limit</h3>
            <p className="text-sm text-amber-200">
              You've spent {getSpendingPercentage()}% of your monthly budget. Be mindful of your
              remaining funds.
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Spending Trend</h2>
          <SpendingChart type="line" />
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Spending by Category</h2>
          <CategoryChart />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Transactions</h2>
        <RecentTransactions />
      </div>

      {/* Budget Edit Modal */}
      <BudgetEditModal
        isOpen={budgetModalOpen}
        currentBudget={summary?.totalBudget || 0}
        onClose={() => setBudgetModalOpen(false)}
        onSave={handleBudgetUpdate}
      />
    </div>
  );
}
