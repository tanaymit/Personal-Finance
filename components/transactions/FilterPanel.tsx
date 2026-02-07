'use client';

import { useState, useEffect } from 'react';
import { Category, FilterOptions } from '@/lib/types';
import { fetchCategories } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function FilterPanel({ onFilterChange, isOpen, onToggle }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [categories, setCategories] = useState<Category[]>([]);

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

  const handleCategoryChange = (category: string) => {
    const newFilters = {
      ...filters,
      category: category === 'all' ? undefined : category
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmountChange = (min: number, max: number) => {
    const newFilters = {
      ...filters,
      minAmount: min || undefined,
      maxAmount: max || undefined
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (start: string, end: string) => {
    const newFilters = {
      ...filters,
      startDate: start || undefined,
      endDate: end || undefined
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-[0_0_24px_rgba(2,6,23,0.4)]">
      {/* Filter Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-900 transition-colors"
      >
        <h3 className="font-semibold text-slate-100">Filters</h3>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filter Content */}
      {isOpen && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={filters.category || 'all'}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={e =>
                  handleAmountChange(
                    e.target.value ? parseFloat(e.target.value) : 0,
                    filters.maxAmount || 0
                  )
                }
                className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={e =>
                  handleAmountChange(
                    filters.minAmount || 0,
                    e.target.value ? parseFloat(e.target.value) : 0
                  )
                }
                className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={e => handleDateChange(e.target.value, filters.endDate || '')}
                className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={e => handleDateChange(filters.startDate || '', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-slate-900 text-slate-200 rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
