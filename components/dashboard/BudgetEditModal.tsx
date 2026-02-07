'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetEditModalProps {
  isOpen: boolean;
  currentBudget: number;
  onClose: () => void;
  onSave: (newBudget: number) => Promise<void>;
}

export function BudgetEditModal({
  isOpen,
  currentBudget,
  onClose,
  onSave
}: BudgetEditModalProps) {
  const [budget, setBudget] = useState(currentBudget);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (budget < 0) {
      setError('Budget must be a positive number');
      return;
    }
    if (budget === currentBudget) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(budget);
    } catch (err) {
      setError('Failed to save budget. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Budget</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Current Budget Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Current Monthly Budget</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(currentBudget)}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Budget Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            New Budget Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold text-lg">$</span>
            <input
              type="number"
              min="0"
              step="10"
              value={budget}
              onChange={e => setBudget(parseFloat(e.target.value) || 0)}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold disabled:bg-slate-100"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Hint */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600">
            💡 Your budget will update across the dashboard, categories, and all other tabs immediately.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || budget === currentBudget}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}
