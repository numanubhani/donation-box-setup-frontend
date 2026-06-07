'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { LayoutDashboard, Package, Users, ClipboardList, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/boxes', label: 'Boxes', icon: Package },
  { href: '/admin/collectors', label: 'Collectors', icon: Users },
  { href: '/admin/assignments', label: 'Assign', icon: ClipboardList },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
];

const collectorNav = [
  { href: '/collector/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/collector/upcoming', label: 'Upcoming', icon: Calendar },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const navItems = role === 'admin' ? adminNav : collectorNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
