'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  FileText,
  AlertTriangle,
  Calendar,
  LogOut,
  MessageSquare,
  Receipt,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from 'lucide-react';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeType: 'none' },
  { href: '/admin/boxes', label: 'Boxes', icon: Package, badgeType: 'none' },
  { href: '/admin/collectors', label: 'Collectors', icon: Users, badgeType: 'none' },
  { href: '/admin/assignments', label: 'Assignments', icon: ClipboardList, badgeType: 'none' },
  { href: '/admin/scans', label: 'Scans', icon: ScanLine, badgeType: 'none' },
  { href: '/admin/reports', label: 'Reports', icon: FileText, badgeType: 'none' },
  { href: '/admin/expenses', label: 'Expenses', icon: Receipt, badgeType: 'none' },
  { href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle, badgeType: 'complaints' },
  { href: '/admin/chat', label: 'Chat', icon: MessageSquare, badgeType: 'messages' },
  { href: '/admin/settings', label: 'SMS Settings', icon: Settings2, badgeType: 'none' },
];

const collectorNav = [
  { href: '/collector/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeType: 'none' },
  { href: '/collector/upcoming', label: 'Upcoming Tasks', icon: Calendar, badgeType: 'none' },
  { href: '/collector/chat', label: 'Chat Support', icon: MessageSquare, badgeType: 'messages' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, logout, currentUserId } = useAuthStore();
  const { complaints, messages, collectors } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapse preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

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

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center border-b border-slate-200 py-5 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center flex-shrink-0 p-1.5 shadow-md shadow-emerald-800/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ANSCF" className="w-full h-full object-contain" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-bold text-slate-900 font-sora leading-tight truncate">
              Al-Najaat Foundation
            </h1>
            <p className="text-[9px] text-emerald-700 font-bold tracking-wider uppercase truncate">
              ANSCF Collection
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badgeVal = getBadgeCount(item.badgeType);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative group ${
                isActive ? 'nav-item-active' : 'nav-item'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                  {item.label}
                </span>
              )}

              {/* Notification Badge */}
              {badgeVal > 0 && (
                <span
                  className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-red-500 ${
                    isCollapsed ? 'absolute top-1 right-2' : 'ml-auto'
                  }`}
                >
                  {badgeVal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section / Sign Out */}
      <div className="border-t border-slate-200 p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-700">
                {role === 'admin' ? 'AD' : currentCollector ? currentCollector.name.split(' ').map((n) => n[0]).join('') : 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {role === 'admin' ? 'Administrator' : currentCollector?.name}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">{role}</p>
            </div>
          </div>
        )}

        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'}`}>
          <Link
            href="/login"
            onClick={() => logout()}
            className={`flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors ${
              isCollapsed ? 'p-2 hover:bg-red-50 rounded-xl' : ''
            }`}
            title="Sign Out"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </Link>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
