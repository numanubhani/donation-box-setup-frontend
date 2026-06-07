import { Collection, Expense } from '@/types';

export interface FinancialSummary {
  totalCollected: number;
  totalExpenses: number;
  netAmount: number;
  collectorCommission: number;
  netNgoRevenue: number;
}

export function calculateFinancials(
  collections: Collection[],
  expenses: Expense[]
): FinancialSummary {
  const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netAmount = totalCollected - totalExpenses;
  const collectorCommission = netAmount * 0.15;
  const netNgoRevenue = netAmount * 0.85;

  return {
    totalCollected,
    totalExpenses,
    netAmount,
    collectorCommission,
    netNgoRevenue,
  };
}

export function expenseMatchesFilters(
  expense: Expense,
  options: {
    collectorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): boolean {
  const matchCollector =
    !options.collectorId || options.collectorId === 'all' || expense.collectorId === options.collectorId;

  const expenseDate = expense.date.split('T')[0];
  const matchDateFrom = !options.dateFrom || expenseDate >= options.dateFrom;
  const matchDateTo = !options.dateTo || expenseDate <= options.dateTo;

  return matchCollector && matchDateFrom && matchDateTo;
}
