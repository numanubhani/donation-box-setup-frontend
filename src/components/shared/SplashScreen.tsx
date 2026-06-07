'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('auth-store');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.isLoggedIn && parsed?.state?.accessToken);
  } catch {
    return false;
  }
}

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // ignore registration errors
      });
    }

    const played = sessionStorage.getItem('splash-played');
    if (played || hasStoredSession()) {
      return;
    }

    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('splash-played', 'true');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="w-32 h-32 rounded-3xl bg-white flex items-center justify-center p-5 shadow-2xl shadow-emerald-950/50 mb-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ANSCF Logo" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sora mb-2">
              Al-Najaat Social Care Foundation
            </h1>
            <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs">
              Box Collection System
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
