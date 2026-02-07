'use client';

import { useCallback, useEffect, useState } from 'react';
import { Category } from '@/lib/types';
import { fetchCategories, updateCategory, fetchBudgetSummary } from '@/lib/api';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { EditCategoryModal } from '@/components/categories/EditCategoryModal';
import { MonthYearFilter } from '@/components/shared/MonthYearFilter';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalBudget, setGlobalBudget] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterMonth, setFilterMonth] = useState<number | undefined>();
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories(filterYear, filterMonth);
      // Sort categories by spent amount in descending order
      const sorted = [...data].sort((a, b) => (b.spent || 0) - (a.spent || 0));
      setCategories(sorted);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth]);

  const loadBudget = useCallback(async () => {
    try {
      const summary = await fetchBudgetSummary(filterYear, filterMonth);
      setGlobalBudget(summary.totalBudget);
    } catch (error) {
      console.error('Failed to load global budget:', error);
    }
  }, [filterYear, filterMonth]);

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
    loadCategories();
    loadBudget();
  }, [filterYear, filterMonth, filtersLoaded]);

  // Listen for budget updates from dashboard
  useEffect(() => {
    const handleBudgetUpdate = (e: StorageEvent) => {
      if (e.key === 'budgetUpdated' && e.newValue) {
        loadBudget();
      }
    };

    window.addEventListener('storage', handleBudgetUpdate);
    return () => window.removeEventListener('storage', handleBudgetUpdate);
  }, []);

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
    const handleTransactionCreated = async () => {
      // Reload categories and budget to reflect new transaction
      try {
        loadCategories();
        loadBudget();
      } catch (error) {
        console.error('Failed to reload categories:', error);
      }
    };

    window.addEventListener('transactionCreated', handleTransactionCreated as EventListener);
    return () => window.removeEventListener('transactionCreated', handleTransactionCreated as EventListener);
  }, [filterYear, filterMonth]);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleSave = async (updated: Category) => {
    try {
      await updateCategory(updated.id, updated);
      setCategories(categories.map(c => (c.id === updated.id ? updated : c)));
      setSelectedCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Calculate total spent
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Categories</h1>
        <p className="text-slate-400">View and manage your spending categories</p>
      </div>

      {/* Month/Year Filter */}
      <MonthYearFilter />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-emerald-300">${globalBudget.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-rose-300">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-emerald-300">${(globalBudget - totalSpent).toFixed(2)}</p>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedCategory && (
        <EditCategoryModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
