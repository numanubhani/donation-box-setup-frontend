'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionBootstrap } from '@/store/useStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import Sidebar from '@/components/shared/Sidebar';
import TopBar from '@/components/shared/TopBar';
import BottomNav from '@/components/shared/BottomNav';
import LoadingScreen from '@/components/shared/LoadingScreen';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/boxes': 'Donation Boxes',
  '/admin/collectors': 'Collectors',
  '/admin/assignments': 'Assignments',
  '/admin/scans': 'Monthly Scans',
  '/admin/reports': 'Reports',
  '/admin/expenses': 'Expenses',
  '/admin/complaints': 'Complaints & Issues',
  '/admin/chat': 'Chat',
  '/admin/settings': 'SMS Settings',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, role } = useSessionBootstrap();
  useRealtimeSync(ready && authenticated && role === 'admin');

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || role !== 'admin') {
      router.replace('/login');
    }
  }, [ready, authenticated, role, router]);

  if (!ready || !authenticated || role !== 'admin') {
    return <LoadingScreen />;
  }

  const title = pageTitles[pathname] || 'Admin';

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar title={title} />
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 font-sora">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">AD</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
