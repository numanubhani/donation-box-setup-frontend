'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useSessionBootstrap } from '@/store/useStore';
import { ArrowRight, User } from 'lucide-react';
import PasswordInput from '@/components/shared/PasswordInput';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loginWithCredentials } = useAuthStore();
  const { ready, authenticated, role } = useSessionBootstrap();

  useEffect(() => {
    if (!ready || !authenticated) return;
    router.replace(role === 'admin' ? '/admin/dashboard' : '/collector/dashboard');
  }, [ready, authenticated, role, router]);

  if (!ready || authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await loginWithCredentials(username, password);
      setLoading(false);

      if (res.success) {
        if (res.firstLogin) {
          router.push('/collector/change-password');
        } else {
          const role = useAuthStore.getState().role;
          router.push(role === 'admin' ? '/admin/dashboard' : '/collector/dashboard');
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch {
      setLoading(false);
      setError('Connection to authentication server failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Rebranding */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-emerald-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-800/35 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Al-Najaat Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sora tracking-tight">
            Al-Najaat Social Care Foundation
          </h1>
          <p className="text-emerald-700 font-semibold text-sm mt-1 uppercase tracking-wider font-sora">
            Box Collection System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">
          <h2 className="text-lg font-bold text-slate-900 font-sora mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your portal</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="input-field pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                withLockIcon
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button
              onClick={() => router.push('/register')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Don't have an admin account? Register
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
