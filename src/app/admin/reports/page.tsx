'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useStore';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import { calculateFinancials, expenseMatchesFilters } from '@/lib/finance';
import { ExpenseType } from '@/types';
import {
  Download,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Printer,
  Receipt,
} from 'lucide-react';

const expenseTypeLabels: Record<ExpenseType, string> = {
  transport: 'Transport',
  food: 'Food',
  phone_balance: 'Phone Balance',
  other: 'Other',
};

export default function ReportsPage() {
  const { collections, collectors, boxes, expenses } = useAppStore();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [collectorFilter, setCollectorFilter] = useState('all');
  const [boxFilter, setBoxFilter] = useState('all');

  const handleCurrentMonthFilter = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    
    setDateFrom(`${year}-${month}-01`);
    setDateTo(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchCollector = collectorFilter === 'all' || c.collectorId === collectorFilter;
      const matchBox = boxFilter === 'all' || c.boxId === boxFilter;
      const matchDateFrom = !dateFrom || c.collectionDate >= dateFrom;
      const matchDateTo = !dateTo || c.collectionDate <= dateTo;
      return matchCollector && matchBox && matchDateFrom && matchDateTo;
    }).sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
  }, [collections, collectorFilter, boxFilter, dateFrom, dateTo]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) =>
        expenseMatchesFilters(e, {
          collectorId: collectorFilter,
          dateFrom,
          dateTo,
        })
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, collectorFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const total = filteredCollections.reduce((sum, c) => sum + c.amount, 0);
    const avg = filteredCollections.length > 0 ? total / filteredCollections.length : 0;
    const max = filteredCollections.length > 0 ? Math.max(...filteredCollections.map(c => c.amount)) : 0;
    const financials = calculateFinancials(filteredCollections, filteredExpenses);
    return { total, avg, max, count: filteredCollections.length, ...financials };
  }, [filteredCollections, filteredExpenses]);

  const getCollectorName = (id: string) => collectors.find((c) => c.id === id)?.name || '—';
  const getBoxName = (id: string) => boxes.find((b) => b.id === id)?.name || '—';

  const handleExportCSV = () => {
    const data = filteredCollections.map((c) => ({
      Date: c.collectionDate,
      'Box Name': getBoxName(c.boxId),
      Collector: getCollectorName(c.collectorId),
      'Amount (PKR)': c.amount,
      Notes: c.notes || '',
    }));
    downloadCSV(data, `collections-report-${new Date().toISOString().split('T')[0]}`);
    useAppStore.getState().showToast('Report exported successfully!', 'success');
  };

  return (
    <>
      <div className="space-y-6 print:hidden">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Collected</p>
              <p className="text-lg font-bold text-slate-900 font-sora">{formatCurrency(summary.total)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50">
              <FileText size={18} className="text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Records</p>
              <p className="text-lg font-bold text-slate-900 font-sora">{summary.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Average</p>
              <p className="text-lg font-bold text-slate-900 font-sora">{formatCurrency(Math.round(summary.avg))}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50">
              <Package size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Highest</p>
              <p className="text-lg font-bold text-slate-900 font-sora">{formatCurrency(summary.max)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Net financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl shadow-card p-4">
          <p className="text-xs text-green-700 font-medium mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-800 font-sora">{formatCurrency(summary.totalCollected)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl shadow-card p-4">
          <p className="text-xs text-red-700 font-medium mb-1">Expenses Deducted</p>
          <p className="text-2xl font-bold text-red-800 font-sora">− {formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl shadow-card p-4">
          <p className="text-xs text-emerald-700 font-medium mb-1">Net Amount</p>
          <p className="text-2xl font-bold text-emerald-800 font-sora">{formatCurrency(summary.netAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">From</label>
              <input
                type="date"
                className="input-field text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">To</label>
              <input
                type="date"
                className="input-field text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Collector</label>
              <select
                value={collectorFilter}
                onChange={(e) => setCollectorFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Collectors</option>
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Box</label>
              <select
                value={boxFilter}
                onChange={(e) => setBoxFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Boxes</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <button onClick={handleCurrentMonthFilter} className="btn-secondary text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
              This Month
            </button>
            <button onClick={handleExportCSV} className="btn-secondary text-sm whitespace-nowrap">
              <Download size={16} />
              Export CSV
            </button>
            <button onClick={handlePrint} className="btn-primary text-sm whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 text-white">
              <Printer size={16} />
              Print PDF
            </button>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-surface-50">
          <h3 className="text-sm font-semibold text-slate-900 font-sora">Donor Collections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Box Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Collector</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(collection.collectionDate + 'T00:00:00Z')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 text-sm">{getBoxName(collection.boxId)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                    {getCollectorName(collection.collectorId)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-slate-900">{formatCurrency(collection.amount)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate hidden md:table-cell">
                    {collection.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCollections.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No collections found matching your filters</p>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-surface-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 font-sora flex items-center gap-2">
            <Receipt size={16} className="text-amber-600" />
            Collector Expenses
          </h3>
          <span className="text-xs font-semibold text-red-600">
            Total: − {formatCurrency(summary.totalExpenses)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Collector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {getCollectorName(expense.collectorId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {expenseTypeLabels[expense.type]}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[240px] truncate hidden md:table-cell">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-red-600">− {formatCurrency(expense.amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Receipt size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No expenses found for this period</p>
          </div>
        )}
      </div>
    </div>

      {/* Print-Only Report */}
      <div className="hidden print:block print-report p-8 bg-white text-slate-900 font-sans">
        <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center p-1.5 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ANSCF Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Al-Najaat Social Care Foundation
              </h1>
              <p className="text-xs text-emerald-700 font-bold tracking-wider uppercase">
                ANSCF Box Collection Report
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Collection Report</p>
            <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-6 space-y-1">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Report Period:</span>{' '}
            {dateFrom ? dateFrom : 'Beginning of records'} to{' '}
            {dateTo ? dateTo : 'Present'}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Collector Filter:</span>{' '}
            {collectorFilter === 'all' ? 'All Collectors' : getCollectorName(collectorFilter)}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Box Filter:</span>{' '}
            {boxFilter === 'all' ? 'All Boxes' : getBoxName(boxFilter)}
          </p>
        </div>

        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-50 text-left">
              <th className="py-2 px-3 font-semibold text-slate-700">Date</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Box Name / No.</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Collector</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Address</th>
              <th className="py-2 px-3 font-semibold text-slate-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCollections.map((c) => (
              <tr key={c.id} className="py-2">
                <td className="py-2 px-3 text-slate-600">
                  {c.collectionDate}
                </td>
                <td className="py-2 px-3 font-medium text-slate-950">
                  {getBoxName(c.boxId)} (#{boxes.find((b) => b.id === c.boxId)?.boxNumber || '—'})
                </td>
                <td className="py-2 px-3 text-slate-600">
                  {getCollectorName(c.collectorId)}
                </td>
                <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">
                  {boxes.find((b) => b.id === c.boxId)?.address || '—'}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-slate-950">
                  {formatCurrency(c.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-base font-bold text-slate-900 mb-3 mt-10">Collector Expenses</h2>
        <table className="w-full text-sm border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-50 text-left">
              <th className="py-2 px-3 font-semibold text-slate-700">Date</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Collector</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Type</th>
              <th className="py-2 px-3 font-semibold text-slate-700">Description</th>
              <th className="py-2 px-3 font-semibold text-slate-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredExpenses.map((e) => (
              <tr key={e.id}>
                <td className="py-2 px-3 text-slate-600">{e.date.split('T')[0]}</td>
                <td className="py-2 px-3 text-slate-600">{getCollectorName(e.collectorId)}</td>
                <td className="py-2 px-3 text-slate-600">{expenseTypeLabels[e.type]}</td>
                <td className="py-2 px-3 text-slate-500">{e.description}</td>
                <td className="py-2 px-3 text-right font-semibold text-red-600">− {formatCurrency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations / Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Total Collections:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(summary.totalCollected)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Total Expenses:</span>
              <span className="font-semibold text-red-600">− {formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-700 font-semibold">Net Amount:</span>
              <span className="font-bold text-emerald-800">{formatCurrency(summary.netAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-medium">Collector Commission (15% of Net):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(summary.collectorCommission)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-medium">Net NGO Share (85% of Net):</span>
              <span className="font-bold text-emerald-800">{formatCurrency(summary.netNgoRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-12 pt-12 border-t border-dashed border-slate-300">
          <div className="text-center">
            <div className="border-b border-slate-400 h-8 mx-auto w-64 mb-2"></div>
            <p className="text-xs font-semibold text-slate-600">Collector Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 h-8 mx-auto w-64 mb-2"></div>
            <p className="text-xs font-semibold text-slate-600">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </>
  );
}
