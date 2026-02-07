'use client';

import { useState } from 'react';
import { Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
  onSave: (category: Category) => void;
}

export function EditCategoryModal({ category, onClose, onSave }: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    budgetLimit: category.budgetLimit || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...category,
      budgetLimit: formData.budgetLimit || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Edit Category</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={category.name}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monthly Budget Limit
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-700">$</span>
              <input
                type="number"
                value={formData.budgetLimit}
                onChange={e =>
                  setFormData({ budgetLimit: parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter budget limit"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Current Spent:</strong> {formatCurrency(category.spent)}
            </p>
            {formData.budgetLimit > 0 && (
              <p className="text-xs text-slate-600">
                <strong>Remaining:</strong>{' '}
                {formatCurrency(Math.max(0, formData.budgetLimit - category.spent))}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
