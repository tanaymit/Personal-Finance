'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Layers,
  Upload,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/categories', label: 'Categories', icon: Layers },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="flex justify-around h-16">
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 transition-colors border-b-2',
                isActive
                  ? 'bg-blue-50 text-blue-600 border-blue-600'
                  : 'text-slate-600 border-transparent hover:bg-slate-50'
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
