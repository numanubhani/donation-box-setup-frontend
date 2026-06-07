'use client';

import { useAppStore } from '@/store/useStore';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  if (!toast) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      borderColor: 'border-green-200',
      bg: 'bg-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-200',
      bg: 'bg-white',
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-200',
      bg: 'bg-white',
    },
  };

  const { icon: Icon, iconColor, borderColor, bg } = config[toast.type];

  return (
    <AnimatePresence>
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 right-4 z-[100]"
      >
        <div
          className={`${bg} inline-flex items-start space-x-3 p-4 text-sm rounded-xl border ${borderColor} shadow-lg shadow-black/5 max-w-sm`}
        >
          <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className="text-slate-700 font-medium">{toast.message}</p>
          </div>
          <button
            onClick={clearToast}
            className="cursor-pointer text-slate-400 hover:text-slate-600 active:scale-95 transition flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
