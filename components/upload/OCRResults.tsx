'use client';

import { useState, useEffect } from 'react';
import { Category, UploadedReceipt } from '@/lib/types';
import { fetchCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type EditableTx = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
};

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
  const [editableData, setEditableData] = useState<EditableTx>({
    merchant: receipt.ocrData.merchant,
    amount: receipt.ocrData.amount,
    date: receipt.ocrData.date,
    category: receipt.ocrData.suggestedCategory,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleChange = <K extends keyof EditableTx>(field: K, value: EditableTx[K]) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value,
    }));
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
        if (mounted) setCategories(cats);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Confirm Transaction Details</h3>

      {/* OCR Extracted Data Display */}
      <div className="bg-slate-900/60 rounded-lg p-4 mb-6 border border-slate-800">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Extracted OCR Data</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Merchant</span>
            <p className="font-medium text-slate-100">{receipt.ocrData.merchant}</p>
          </div>
          <div>
            <span className="text-slate-400">Amount</span>
            <p className="font-medium text-slate-100">{formatCurrency(receipt.ocrData.amount)}</p>
          </div>
          <div>
            <span className="text-slate-400">Date</span>
            <p className="font-medium text-slate-100">{receipt.ocrData.date}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Merchant Name
            <span className="text-xs text-slate-500 ml-1">(OCR: {receipt.ocrData.merchant})</span>
          </label>
          <input
            type="text"
            value={editableData.merchant}
            onChange={e => handleChange('merchant', e.target.value)}
            className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Amount
            <span className="text-xs text-slate-500 ml-1">(OCR: {formatCurrency(receipt.ocrData.amount)})</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              value={editableData.amount}
              onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Date
            <span className="text-xs text-slate-500 ml-1">(OCR: {receipt.ocrData.date})</span>
          </label>
          <input
            type="date"
            value={editableData.date}
            onChange={e => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Category
          </label>
          <select
            value={editableData.category}
            onChange={e => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
      <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/40 border border-slate-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-200 mb-1">
          Recording <span className="font-semibold">{editableData.merchant}</span> for{' '}
          <span className="font-semibold text-rose-300">{formatCurrency(editableData.amount)}</span>
        </p>
        <p className="text-xs text-slate-400">
          This transaction will be added to your{' '}
          <span className="font-medium">{editableData.category}</span> category
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-900 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 disabled:bg-cyan-800 transition-colors font-medium"
        >
          {isSubmitting ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
