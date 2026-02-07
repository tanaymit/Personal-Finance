'use client';

import { Category } from '@/lib/types';
import { formatCurrency, calculatePercentage } from '@/lib/utils';
import { Edit2, MoreHorizontal } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
}

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const percentageUsed = calculatePercentage(
    Number(category.spent || 0),
    Number(category.budgetLimit ?? category.spent ?? 0)
  );
  const budgetLimitNum = Number(category.budgetLimit ?? 0);
  const spentNum = Number(category.spent ?? 0);
  const isOverBudget = budgetLimitNum ? spentNum > budgetLimitNum : false;

  // Get icon component
  const iconName = category.icon || 'Tag';
  const IconComponent = (Icons as any)[iconName];
  const Icon = IconComponent || null;

  const color = category.color || '#6b7280';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Icon size={24} />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-900">{category.name}</h3>
            <p className="text-sm text-slate-500">{formatCurrency(spentNum)} spent</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreHorizontal size={18} className="text-slate-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  onEdit?.(category);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full"
              >
                <Edit2 size={16} />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Budget Info */}
      {category.budgetLimit && (
          <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs text-slate-600">Budget: {formatCurrency(budgetLimitNum)}</p>
              <p className="text-xs text-slate-600">
                Remaining: {formatCurrency(Math.max(0, budgetLimitNum - spentNum))}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${
                isOverBudget ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {percentageUsed}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOverBudget ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(percentageUsed, 100)}%`
              }}
            />
          </div>

          {isOverBudget && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              Over budget by {formatCurrency(spentNum - (budgetLimitNum || 0))}
            </p>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: color + '20',
            color: color
          }}
        >
          {category.name}
        </div>
        {isOverBudget && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            Over
          </span>
        )}
      </div>
    </div>
  );
}
