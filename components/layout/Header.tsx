'use client';

import { Bell, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const navigationItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/categories', label: 'Categories' },
  { href: '/upload', label: 'Upload Receipt' },
  { href: '/settings', label: 'Settings' }
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 border-b border-slate-800 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        {/* Mobile menu button + Logo for mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 mr-2 hover:bg-slate-900 rounded-lg transition-transform duration-200 transform ${
              mobileOpen ? 'rotate-90' : ''
            }`}
            aria-label="Toggle menu"
          >
            <Menu size={20} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center font-bold text-xs text-slate-100">
              PF
            </div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400">FinanceDash</h1>
          </div>
        </div>

        {/* Search bar (desktop) */}
        <div className="hidden lg:flex items-center bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-2 w-80">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="bg-transparent ml-2 w-full outline-none text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Search button for mobile */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden p-2 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <Search size={20} className="text-slate-300" />
          </button>

          <button className="relative p-2 hover:bg-slate-900 rounded-lg transition-colors">
            <Bell size={20} className="text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* menu moved to left for mobile */}
        </div>
      </div>

      {/* Mobile search expanded */}
      {searchOpen && (
        <div className="mt-4 flex items-center bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="bg-transparent ml-2 w-full outline-none text-sm text-slate-100 placeholder:text-slate-500"
            autoFocus
          />
        </div>
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 p-4 transform transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center font-bold text-xs text-slate-100">
                PF
              </div>
              <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400">FinanceDash</h2>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-300">
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col mt-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 hover:bg-slate-900"
              >
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </header>
  );
}
