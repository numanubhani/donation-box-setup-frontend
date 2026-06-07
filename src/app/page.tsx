'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/store/useStore';

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const { isLoggedIn, role, accessToken } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (isLoggedIn && role && accessToken) {
      router.replace(role === 'admin' ? '/admin/dashboard' : '/collector/dashboard');
    } else {
      router.replace('/login');
    }
  }, [hydrated, isLoggedIn, role, accessToken, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
