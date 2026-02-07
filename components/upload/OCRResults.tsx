'use client';

import { useState, useEffect } from 'react';
import { UploadedReceipt } from '@/lib/types';
import { fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface OCRResultsProps {
  receipt: UploadedReceipt;
  onConfirm: (data: {
    merchant: string;
    amount: number;
    date: string;
    category: string;
  }) => void;
  onCancel: () => void;
}

export function OCRResults({ receipt, onConfirm, onCancel }: OCRResultsProps) {
  const [editableData, setEditableData] = useState({
    merchant: receipt.ocrData.merchant,
    amount: receipt.ocrData.amount,
    date: receipt.ocrData.date,
    category: receipt.ocrData.suggestedCategory
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const handleChange = (field: string, value: string | number) => {
    setEditableData({
      ...editableData,
      [field]: value
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 800));
    onConfirm(editableData);
    setIsSubmitting(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (mounted) setCategories(cats as any[]);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Transaction Details</h3>

      <div className="space-y-4 mb-6">
        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Merchant Name
          </label>
          <input
            type="text"
            value={editableData.merchant}
            onChange={e => handleChange('merchant', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              value={editableData.amount}
              onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={editableData.date}
            onChange={e => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            value={editableData.category}
            onChange={e => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-700 mb-1">
          Recording <span className="font-semibold">{editableData.merchant}</span> for{' '}
          <span className="font-semibold text-red-600">{formatCurrency(editableData.amount)}</span>
        </p>
        <p className="text-xs text-slate-600">
          This transaction will be added to your{' '}
          <span className="font-medium">{editableData.category}</span> category
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
        >
          {isSubmitting ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
