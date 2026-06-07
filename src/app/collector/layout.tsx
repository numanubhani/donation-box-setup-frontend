'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useAppStore, useSessionBootstrap } from '@/store/useStore';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import Sidebar from '@/components/shared/Sidebar';
import TopBar from '@/components/shared/TopBar';
import LoadingScreen from '@/components/shared/LoadingScreen';

const pageTitles: Record<string, string> = {
  '/collector/dashboard': 'Collector Dashboard',
  '/collector/upcoming': 'Upcoming Tasks',
  '/collector/chat': 'Chat Support',
};

export default function CollectorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, role } = useSessionBootstrap();
  const { currentUserId } = useAuthStore();
  const { collectors } = useAppStore();
  useRealtimeSync(ready && authenticated && role === 'collector');

  const currentCollector = collectors.find((c) => c.id === currentUserId);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || role !== 'collector') {
      router.replace('/login');
      return;
    }

    if (!currentCollector) return;

    if (currentCollector.firstLogin && pathname !== '/collector/change-password') {
      router.replace('/collector/change-password');
    } else if (!currentCollector.firstLogin && pathname === '/collector/change-password') {
      router.replace('/collector/dashboard');
    }
  }, [ready, authenticated, role, currentCollector, pathname, router]);

  if (!ready || !authenticated || role !== 'collector') {
    return <LoadingScreen />;
  }

  if (!currentCollector) {
    return <LoadingScreen />;
  }

  if (currentCollector.firstLogin && pathname === '/collector/change-password') {
    return <>{children}</>;
  }

  const title = pageTitles[pathname] || 'Collector';

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar title={title} />
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 font-sora">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {currentCollector.name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden md:block">
              {currentCollector.name}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 pb-6 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
