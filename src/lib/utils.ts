import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'MMM dd, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'MMM dd, yyyy h:mm a');
  } catch {
    return '—';
  }
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return '—';
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getNextBoxNumber(boxes: { boxNumber: number }[]): number {
  if (boxes.length === 0) return 1001;
  return Math.max(...boxes.map((b) => b.boxNumber)) + 1;
}

export function downloadCSV(data: Record<string, string | number>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
