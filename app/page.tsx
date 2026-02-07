'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { fetchBudgetSummary, fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BudgetSummary } from '@/lib/types';

export default function Dashboard() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchBudgetSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to load budget summary:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getSpendingPercentage = () => {
    if (!summary) return 0;
    return Math.round((summary.totalSpent / summary.totalBudget) * 100);
  };

  const getTrend = () => {
    // Mock trend calculation - in real app would compare with previous period
    return -5; // 5% decrease
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, John!</h1>
        <p className="text-slate-600">Here's your financial overview for this month</p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Budget"
            value={formatCurrency(summary.totalBudget)}
            icon={<Wallet size={24} className="text-blue-700" />}
            color="blue"
          />
          <SummaryCard
            title="Total Spent"
            value={formatCurrency(summary.totalSpent)}
            icon={<DollarSign size={24} className="text-red-700" />}
            trend={getTrend()}
            color="red"
          />
          <SummaryCard
            title="Remaining"
            value={formatCurrency(summary.remainingBudget)}
            icon={<TrendingUp size={24} className="text-green-700" />}
            color="green"
          />
          <SummaryCard
            title="Spending Rate"
            value={`${getSpendingPercentage()}%`}
            icon={<AlertCircle size={24} className="text-amber-700" />}
            color="amber"
          />
        </div>
      ) : null}

      {/* Alert */}
      {summary && summary.totalSpent > summary.totalBudget * 0.8 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Approaching Budget Limit</h3>
            <p className="text-sm text-orange-800">
              You've spent {getSpendingPercentage()}% of your monthly budget. Be mindful of your
              remaining funds.
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Spending Trend</h2>
          <SpendingChart type="line" />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Spending by Category</h2>
          <CategoryChart />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h2>
        <RecentTransactions />
      </div>
    </div>
  );
}
