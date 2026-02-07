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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-[0_0_40px_rgba(2,6,23,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Edit Budget</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-slate-900 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Current Budget Display */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Current Monthly Budget</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(currentBudget)}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800/60 text-rose-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Budget Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            New Budget Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold text-lg">$</span>
            <input
              type="number"
              min="0"
              step="10"
              value={budget}
              onChange={e => setBudget(parseFloat(e.target.value) || 0)}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-lg font-semibold disabled:bg-slate-900"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Hint */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400">
            💡 Your budget will update across the dashboard, categories, and all other tabs immediately.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-900 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || budget === currentBudget}
            className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 disabled:bg-cyan-800 transition-colors font-medium"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}
