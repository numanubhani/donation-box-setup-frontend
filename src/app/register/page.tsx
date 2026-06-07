'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useStore';
import { User, Mail, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import PasswordInput from '@/components/shared/PasswordInput';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { registerAdmin } = useAppStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await registerAdmin(name.trim(), email.trim(), username.trim(), password);
      setLoading(false);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch {
      setLoading(false);
      setError('Connection to registration server failed.');
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

        {/* Register Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-8">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-sora mb-2">Registered Successfully!</h2>
              <p className="text-sm text-slate-500">Redirecting you to the login screen...</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 font-sora mb-1">Create Admin Account</h2>
              <p className="text-sm text-slate-500 mb-6">Register a new administrator profile</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className="input-field pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      placeholder="e.g. admin@email.com"
                      className="input-field pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <ShieldCheck size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. admin_john"
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
                    placeholder="Min 6 characters"
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
                      Register Admin
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-100 pt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
