'use client';

import { useEffect, useState } from 'react';
import { Category } from '@/lib/types';
import { fetchCategories, updateCategory, fetchBudgetSummary } from '@/lib/api';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { EditCategoryModal } from '@/components/categories/EditCategoryModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalBudget, setGlobalBudget] = useState<number>(0);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudget = async () => {
    try {
      const summary = await fetchBudgetSummary();
      setGlobalBudget(summary.totalBudget);
    } catch (error) {
      console.error('Failed to load global budget:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadBudget();
  }, []);

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Categories</h1>
        <p className="text-slate-600">View and manage your spending categories</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-blue-700">${globalBudget.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-red-700">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-green-700">${(globalBudget - totalSpent).toFixed(2)}</p>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg animate-pulse"
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
