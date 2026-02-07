'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Layers,
  Upload,
  Settings,
  LogOut,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/assistant', label: 'Assistant', icon: MessageCircle },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/categories', label: 'Categories', icon: Layers },
  { href: '/upload', label: 'Upload Receipt', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white h-screen sticky top-0 border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-500 rounded-lg flex items-center justify-center font-bold text-sm">
            PF
          </div>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400">FinanceDash</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors',
                isActive
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-500 rounded-full flex items-center justify-center font-bold text-sm">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">John Doe</p>
              <p className="text-xs text-slate-400">Account</p>
            </div>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </aside>
  );
}
