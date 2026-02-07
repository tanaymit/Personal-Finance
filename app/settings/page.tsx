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

  const [goals, setGoals] = useState<Array<{ id: string; name: string; targetAmount: number; targetDate?: string | null; note?: string | null }>>([]);
  const [goalLoading, setGoalLoading] = useState(true);
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalNote, setGoalNote] = useState('');

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

  useEffect(() => {
    async function loadGoals() {
      try {
        const res = await fetch(`${API_BASE_URL}/goals`);
        if (!res.ok) throw new Error('Failed to fetch goals');
        const data = await res.json();
        setGoals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setGoalLoading(false);
      }
    }
    loadGoals();
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

  const handleAddGoal = async () => {
    const name = goalName.trim();
    const amt = Number(goalTarget);
    if (!name || !Number.isFinite(amt) || amt <= 0) return;

    setGoalBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetAmount: amt,
          targetDate: goalDate ? goalDate : null,
          note: goalNote.trim() ? goalNote.trim() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      const created = await res.json();
      setGoals((prev) => [...prev, created]);
      setGoalName('');
      setGoalTarget('');
      setGoalDate('');
      setGoalNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setGoalBusy(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoalBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${encodeURIComponent(goalId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error(err);
    } finally {
      setGoalBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">Manage your budget and preferences</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-800/60 text-rose-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>✓</span>
          <span>Budget updated successfully</span>
        </div>
      )}

      {/* Budget Settings */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-6">Monthly Budget</h2>

        {loading ? (
          <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Set your total monthly budget. Your spending will be tracked against this amount.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Monthly Budget
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-bold text-lg">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={budget || ''}
                  onChange={e => setBudget(parseFloat(e.target.value))}
                  className="flex-1 px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSaveBudget}
                disabled={saving || budget === null}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 disabled:bg-cyan-800 transition-colors font-medium"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Budget'}
              </button>
            </div>

            {/* Budget Info */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 mt-6">
              <p className="text-sm text-slate-300">
                <strong>💡 Tip:</strong> Your actual spending is automatically calculated from uploaded receipts. This budget is used to show your spending percentage and remaining amount on the dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-6">Goals</h2>

        {goalLoading ? (
          <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg animate-pulse" />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Create savings goals (hackathon-friendly, stored locally in the backend JSON).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                placeholder="Goal name"
                disabled={goalBusy}
              />
              <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                placeholder="Target amount (e.g., 1000)"
                type="number"
                min="0"
                step="10"
                disabled={goalBusy}
              />
              <input
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                className="px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                type="date"
                disabled={goalBusy}
              />
              <input
                value={goalNote}
                onChange={(e) => setGoalNote(e.target.value)}
                className="px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                placeholder="Note (optional)"
                disabled={goalBusy}
              />
            </div>

            <button
              onClick={handleAddGoal}
              disabled={goalBusy || !goalName.trim() || !(Number(goalTarget) > 0)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 disabled:bg-cyan-800 transition-colors font-medium"
            >
              Add Goal
            </button>

            <div className="space-y-2">
              {goals.length === 0 ? (
                <div className="text-sm text-slate-400">No goals yet.</div>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="flex items-start justify-between gap-3 border border-slate-800 rounded-lg p-4 bg-slate-900/40">
                    <div>
                      <div className="text-slate-100 font-semibold">{g.name}</div>
                      <div className="text-sm text-slate-300">
                        Target: ${Number(g.targetAmount).toFixed(2)}{g.targetDate ? ` • By ${g.targetDate}` : ''}
                      </div>
                      {g.note ? <div className="text-sm text-slate-400 mt-1">{g.note}</div> : null}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      disabled={goalBusy}
                      className="text-sm text-rose-300 hover:text-rose-200 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
