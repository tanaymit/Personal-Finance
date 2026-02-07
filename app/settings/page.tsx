'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SettingsPage() {
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load current budget on mount
  useEffect(() => {
    async function loadBudget() {
      try {
        const res = await fetch(`${API_BASE_URL}/budget`);
        if (!res.ok) throw new Error('Failed to fetch budget');
        const data = await res.json();
        setBudget(data.defaultBudget);
      } catch (err) {
        setError('Failed to load budget settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBudget();
  }, []);

  const handleSaveBudget = async () => {
    if (budget === null) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultBudget: budget })
      });
      if (!res.ok) throw new Error('Failed to save budget');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save budget');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your budget and preferences</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>✓</span>
          <span>Budget updated successfully</span>
        </div>
      )}

      {/* Budget Settings */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Monthly Budget</h2>

        {loading ? (
          <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Set your total monthly budget. Your spending will be tracked against this amount.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Monthly Budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-bold text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={budget || ''}
                  onChange={e => setBudget(parseFloat(e.target.value))}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSaveBudget}
                disabled={saving || budget === null}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Budget'}
              </button>
            </div>

            {/* Budget Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Your actual spending is automatically calculated from uploaded receipts. This budget is used to show your spending percentage and remaining amount on the dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
