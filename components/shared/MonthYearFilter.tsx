'use client';

import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MonthYearFilterProps {
  onChange?: (year: number, month: number) => void;
}

export function MonthYearFilter({ onChange }: MonthYearFilterProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('monthYearFilter');
    if (stored) {
      try {
        const { year, month } = JSON.parse(stored);
        setSelectedYear(year);
        setSelectedMonth(month);
      } catch (e) {
        console.error('Failed to parse stored filter:', e);
      }
    }
  }, []);

  // Listen for changes from other tabs/pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'monthYearFilter' && e.newValue) {
        try {
          const { year, month } = JSON.parse(e.newValue);
          setSelectedYear(year);
          setSelectedMonth(month);
        } catch (err) {
          console.error('Failed to parse filter update:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Notify parent and save to localStorage when filter changes
  useEffect(() => {
    const filter = { year: selectedYear, month: selectedMonth };
    localStorage.setItem('monthYearFilter', JSON.stringify(filter));
    
    // Trigger custom event for same-page updates
    window.dispatchEvent(new CustomEvent('monthYearFilterChange', { detail: filter }));
    
    onChange?.(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, onChange]);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="rounded-xl p-[1px] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-[0_0_24px_rgba(15,23,42,0.5)]">
      <div className="rounded-xl bg-slate-950/90 border border-slate-800/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center">
            <Calendar size={18} className="text-slate-300" />
          </div>
          <div className="flex gap-2 flex-1">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900/80 text-slate-100 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg bg-slate-900/80 text-slate-100 border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          </div>
        </div>
      </div>
    </div>
  );
}
