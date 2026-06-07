'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50',
}: StatsCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 font-sora">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-500'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
