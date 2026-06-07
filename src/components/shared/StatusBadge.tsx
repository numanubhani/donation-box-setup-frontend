'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'green' | 'amber' | 'red' | 'slate' | 'blue';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-sky-100 text-sky-700',
};

export default function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Helper to map common statuses to variants
export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
    case 'collected':
    case 'resolved':
      return 'green';
    case 'pending':
    case 'under_review':
      return 'amber';
    case 'overdue':
    case 'inactive':
    case 'reported':
    case 'urgent':
      return 'red';
    case 'maintenance':
      return 'blue';
    default:
      return 'slate';
  }
}

export function getStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
