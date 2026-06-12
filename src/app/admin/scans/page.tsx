'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Modal from '@/components/shared/Modal';
import { Collection } from '@/types';
import {
  Search,
  Calendar,
  User,
  Package,
  Edit2,
  ScanLine,
  DollarSign,
} from 'lucide-react';

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export default function AdminScansPage() {
  const { collections, boxes, collectors, updateCollection, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editForm, setEditForm] = useState({
    boxId: '',
    collectorId: '',
    amount: '',
    collectionDate: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const monthCollections = useMemo(() => {
    return collections
      .filter((c) => getMonthKey(c.collectionDate) === selectedMonth)
      .filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const box = boxes.find((b) => b.id === c.boxId);
        const collector = collectors.find((col) => col.id === c.collectorId);
        return (
          box?.name.toLowerCase().includes(q) ||
          box?.donorName.toLowerCase().includes(q) ||
          collector?.name.toLowerCase().includes(q) ||
          String(c.amount).includes(q)
        );
      })
      .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
  }, [collections, selectedMonth, search, boxes, collectors]);

  const monthTotal = useMemo(
    () => monthCollections.reduce((sum, c) => sum + c.amount, 0),
    [monthCollections]
  );

  const getBoxName = (boxId: string) => {
    const box = boxes.find((b) => b.id === boxId);
    return box ? `${box.name} (#${box.boxNumber})` : 'Unknown Box';
  };

  const getCollectorName = (collectorId: string) =>
    collectors.find((c) => c.id === collectorId)?.name || 'Unknown Collector';

  const openEdit = (collection: Collection) => {
    setSelectedCollection(collection);
    setEditForm({
      boxId: collection.boxId,
      collectorId: collection.collectorId,
      amount: String(collection.amount),
      collectionDate: collection.collectionDate.slice(0, 10),
      notes: collection.notes || '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const errors: Record<string, string> = {};
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!editForm.collectionDate) errors.collectionDate = 'Date is required';
    if (!editForm.boxId) errors.boxId = 'Box is required';
    if (!editForm.collectorId) errors.collectorId = 'Collector is required';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0 || !selectedCollection) return;

    setSaving(true);
    const result = await updateCollection(selectedCollection.id, {
      boxId: editForm.boxId,
      collectorId: editForm.collectorId,
      amount: parseFloat(editForm.amount),
      collectionDate: editForm.collectionDate,
      notes: editForm.notes || undefined,
    });
    setSaving(false);

    if (!result.success) {
      showToast(result.error || 'Failed to update record', 'error');
      return;
    }

    showToast('Collection record updated successfully', 'success');
    setShowEditModal(false);
    setSelectedCollection(null);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">Scans in {monthLabel}</p>
          <p className="text-2xl font-bold text-slate-900 font-sora">{monthCollections.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 font-sora">{formatCurrency(monthTotal)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <p className="text-xs text-slate-400 mb-1">All-Time Scans</p>
          <p className="text-2xl font-bold text-slate-900 font-sora">{collections.length}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-white border border-slate-200 rounded-2xl shadow-card p-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by box, donor, collector, or amount..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-slate-400 shrink-0" />
          <input
            type="month"
            className="input-field lg:max-w-[200px]"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Scan Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Box</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Collector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateTime(collection.collectionDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                      <Package size={13} className="text-slate-400" />
                      {getBoxName(collection.boxId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <User size={13} className="text-slate-400" />
                      {getCollectorName(collection.collectorId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate hidden lg:table-cell">
                    {collection.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {formatCurrency(collection.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(collection)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit record"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monthCollections.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ScanLine size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No scanned collections for {monthLabel}</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedCollection(null); }}
        title="Edit Collection Record"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Correct any wrong entry made by the collector. Changes are saved immediately.
          </p>

          <div>
            <label className="label">Box</label>
            <select
              className="input-field"
              value={editForm.boxId}
              onChange={(e) => setEditForm({ ...editForm, boxId: e.target.value })}
            >
              <option value="">Select box</option>
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name} (#{box.boxNumber})
                </option>
              ))}
            </select>
            {editErrors.boxId && <p className="text-xs text-red-500 mt-1">{editErrors.boxId}</p>}
          </div>

          <div>
            <label className="label">Collector</label>
            <select
              className="input-field"
              value={editForm.collectorId}
              onChange={(e) => setEditForm({ ...editForm, collectorId: e.target.value })}
            >
              <option value="">Select collector</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>{collector.name}</option>
              ))}
            </select>
            {editErrors.collectorId && <p className="text-xs text-red-500 mt-1">{editErrors.collectorId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (PKR)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field pl-9"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
              </div>
              {editErrors.amount && <p className="text-xs text-red-500 mt-1">{editErrors.amount}</p>}
            </div>
            <div>
              <label className="label">Collection Date</label>
              <input
                type="date"
                className="input-field"
                value={editForm.collectionDate}
                onChange={(e) => setEditForm({ ...editForm, collectionDate: e.target.value })}
              />
              {editErrors.collectionDate && <p className="text-xs text-red-500 mt-1">{editErrors.collectionDate}</p>}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field min-h-[80px]"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setSelectedCollection(null); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
