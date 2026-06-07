'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseType } from '@/types';
import { Receipt, Search, User, Calendar, FileText } from 'lucide-react';

const expenseTypeLabels: Record<ExpenseType, string> = {
  transport: 'Transport',
  food: 'Food',
  phone_balance: 'Phone Balance',
  other: 'Other',
};

export default function AdminExpensesPage() {
  const { expenses, collectors } = useAppStore();
  const [search, setSearch] = useState('');
  const [collectorFilter, setCollectorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const collector = collectors.find((c) => c.id === e.collectorId);
        const matchCollector = collectorFilter === 'all' || e.collectorId === collectorFilter;
        const matchType = typeFilter === 'all' || e.type === typeFilter;
        const matchSearch =
          !search.trim() ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          collector?.name.toLowerCase().includes(search.toLowerCase());
        return matchCollector && matchType && matchSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, collectors, collectorFilter, typeFilter, search]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const getCollectorName = (id: string) =>
    collectors.find((c) => c.id === id)?.name || 'Unknown Collector';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">Total Expenses (filtered)</p>
          <p className="text-2xl font-bold text-red-600 font-sora">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">Expense Records</p>
          <p className="text-2xl font-bold text-slate-900 font-sora">{filteredExpenses.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">All-Time Expenses</p>
          <p className="text-2xl font-bold text-slate-900 font-sora">
            {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-white border border-slate-200 rounded-2xl shadow-card p-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by collector or description..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field lg:max-w-[200px]"
          value={collectorFilter}
          onChange={(e) => setCollectorFilter(e.target.value)}
        >
          <option value="all">All Collectors</option>
          {collectors.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="input-field lg:max-w-[180px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {(Object.keys(expenseTypeLabels) as ExpenseType[]).map((t) => (
            <option key={t} value={t}>{expenseTypeLabels[t]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Collector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(expense.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                      <User size={13} className="text-slate-400" />
                      {getCollectorName(expense.collectorId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                      <Receipt size={12} />
                      {expenseTypeLabels[expense.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell max-w-xs truncate">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={13} className="text-slate-400 shrink-0" />
                      {expense.description}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    − {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No expenses recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
