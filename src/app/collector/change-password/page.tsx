'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/store/useStore';
import { Lock, Check, AlertCircle } from 'lucide-react';
import PasswordInput from '@/components/shared/PasswordInput';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { currentUserId, logout } = useAuthStore();
  const { collectors, changeCollectorPassword, showToast } = useAppStore();

  const collector = collectors.find((c) => c.id === currentUserId);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!collector) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await changeCollectorPassword(collector.id, currentPassword, newPassword);
      setLoading(false);
      
      if (res.success) {
        showToast('Password changed successfully! You can now start working.', 'success');
        router.replace('/collector/dashboard');
      } else {
        setError(res.error || 'Failed to change password');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-card p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <Lock className="text-amber-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-sora">Change Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Hi, <span className="font-semibold text-slate-700">{collector.name}</span>. For security reasons, you must change your temporary password before accessing your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Current (Temporary) Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Min 6 characters"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel & Logout
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Save Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
