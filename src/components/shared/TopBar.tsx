'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/store/useStore';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  FileText,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeType: 'none' },
  { href: '/admin/boxes', label: 'Boxes', icon: Package, badgeType: 'none' },
  { href: '/admin/collectors', label: 'Collectors', icon: Users, badgeType: 'none' },
  { href: '/admin/assignments', label: 'Assignments', icon: ClipboardList, badgeType: 'none' },
  { href: '/admin/reports', label: 'Reports', icon: FileText, badgeType: 'none' },
  { href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle, badgeType: 'complaints' },
  { href: '/admin/chat', label: 'Chat', icon: MessageSquare, badgeType: 'messages' },
  { href: '/admin/settings', label: 'SMS Settings', icon: Settings2, badgeType: 'none' },
];

const collectorNav = [
  { href: '/collector/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeType: 'none' },
  { href: '/collector/upcoming', label: 'Upcoming Tasks', icon: Calendar, badgeType: 'none' },
  { href: '/collector/chat', label: 'Chat Support', icon: MessageSquare, badgeType: 'messages' },
];

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { role, logout, currentUserId } = useAuthStore();
  const { complaints, messages, collectors } = useAppStore();

  const navItems = role === 'admin' ? adminNav : collectorNav;
  const currentCollector = collectors.find((c) => c.id === currentUserId);

  // Compute Badge Counts
  const unreadComplaints = complaints.filter((c) => c.status === 'reported').length;
  const unreadMessages = messages.filter((m) => {
    if (role === 'admin') {
      return m.receiverId === 'admin' && m.senderId !== 'admin' && !m.isRead;
    }
    return m.receiverId === currentUserId && m.senderId === 'admin' && !m.isRead;
  }).length;

  const getBadgeCount = (type: string) => {
    if (type === 'complaints') return unreadComplaints;
    if (type === 'messages') {
      const onChatPage =
        (role === 'admin' && pathname === '/admin/chat') ||
        (role === 'collector' && pathname === '/collector/chat');
      if (onChatPage) return 0;
      return unreadMessages;
    }
    return 0;
  };

  const getInitials = () => {
    if (role === 'admin') return 'AD';
    if (currentCollector) {
      return currentCollector.name.split(' ').map((n) => n[0]).join('');
    }
    return 'C';
  };

  return (
    <>
      <header className="lg:hidden bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-semibold text-slate-900 font-sora">{title}</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-700">
              {getInitials()}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl flex flex-col lg:hidden"
            >
              {/* Rebranded Header Logo */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center p-1.5 shadow-md shadow-emerald-800/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="ANSCF Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xs font-bold text-slate-900 font-sora leading-tight">
                    Al-Najaat Foundation
                  </h1>
                  <p className="text-[10px] text-emerald-700 font-bold tracking-wider uppercase">
                    ANSCF Box Collection
                  </p>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const badgeVal = getBadgeCount(item.badgeType);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`relative flex items-center justify-between ${
                        isActive ? 'nav-item-active' : 'nav-item'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </span>

                      {badgeVal > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-red-500">
                          {badgeVal}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="px-4 py-4 border-t border-slate-200">
                <Link
                  href="/login"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors px-1"
                >
                  <LogOut size={16} />
                  Sign Out
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
