'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/useStore';
import StatusBadge, { getStatusVariant, getStatusLabel } from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { getInitials, formatDate } from '@/lib/utils';
import {
  loadCollectorCredentials,
  saveCollectorCredentials,
  removeCollectorCredentials,
  CollectorCredentials,
} from '@/lib/collectorCredentials';
import {
  Plus,
  Search,
  Edit2,
  Eye,
  EyeOff,
  UserX,
  Phone,
  Mail,
  MapPin,
  Check,
  Trash2,
  Copy,
  KeyRound,
  User,
} from 'lucide-react';
import { Collector } from '@/types';

export default function CollectorsPage() {
  const { collectors, boxes, collections, assignments, addCollector, updateCollector, deleteAllCollectors, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', area: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [storedCredentials, setStoredCredentials] = useState<Record<string, CollectorCredentials>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setStoredCredentials(loadCollectorCredentials());
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast(`Could not copy ${label.toLowerCase()}`, 'error');
    }
  };

  const filteredCollectors = useMemo(() => {
    return collectors.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.area.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );
  }, [collectors, search]);

  const getCollectorStats = (collectorId: string) => {
    const assignedBoxes = assignments.filter((a) => a.collectorId === collectorId).length;
    const thisMonthCollections = collections.filter(
      (c) => c.collectorId === collectorId && new Date(c.collectionDate).getMonth() === new Date().getMonth()
    );
    const totalThisMonth = thisMonthCollections.reduce((sum, c) => sum + c.amount, 0);
    return { assignedBoxes, collectionsCount: thisMonthCollections.length, totalThisMonth };
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (form.email && !form.email.includes('@')) errors.email = 'Invalid email';
    if (!form.area.trim()) errors.area = 'Area is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    const result = await addCollector({ ...form, status: 'active' });
    setShowAddModal(false);
    setForm({ name: '', phone: '', email: '', area: '' });

    if (result?.id && result.username && result.temporaryPassword) {
      const updated = saveCollectorCredentials(result.id, {
        username: result.username,
        temporaryPassword: result.temporaryPassword,
      });
      setStoredCredentials(updated);
      setShowPassword(true);

      const newCollector = useAppStore.getState().collectors.find((c) => c.id === result.id);
      if (newCollector) {
        setSelectedCollector(newCollector);
        setShowProfileModal(true);
      }
      showToast('Collector account created. Share the login credentials below.', 'success');
    } else if (result?.id) {
      showToast('Collector added successfully!', 'success');
    } else {
      showToast('Failed to create collector. Please try again.', 'error');
    }
  };

  const handleEdit = (collector: Collector) => {
    setSelectedCollector(collector);
    setForm({ name: collector.name, phone: collector.phone, email: collector.email, area: collector.area });
    setFormErrors({});
    setShowProfileModal(false);
    setShowEditModal(true);
  };

  const openProfile = (collector: Collector) => {
    if (!collector.firstLogin && storedCredentials[collector.id]) {
      setStoredCredentials(removeCollectorCredentials(collector.id));
    }
    setSelectedCollector(collector);
    setShowPassword(false);
    setShowProfileModal(true);
  };

  const renderCredentialsSection = (collector: Collector) => {
    const credentials = storedCredentials[collector.id];
    if (!credentials || !collector.firstLogin) return null;

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <KeyRound size={18} className="text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Login Credentials</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Share these with the collector. They must change the password on first login.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white border border-amber-100 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Username</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{credentials.username}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(credentials.username, 'Username')}
              className="shrink-0 p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Copy username"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg bg-white border border-amber-100 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Temporary Password</p>
              <p className="text-sm font-semibold text-slate-900 font-mono truncate">
                {showPassword ? credentials.temporaryPassword : '••••••••••••'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(credentials.temporaryPassword, 'Password')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Copy password"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveEdit = () => {
    if (!validateForm() || !selectedCollector) return;
    updateCollector(selectedCollector.id, form);
    setShowEditModal(false);
    setSelectedCollector(null);
    showToast('Collector updated successfully!', 'success');
  };

  const handleToggleStatus = (collector: Collector) => {
    const newStatus = collector.status === 'active' ? 'inactive' : 'active';
    updateCollector(collector.id, { status: newStatus });
    showToast(`Collector ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
  };

  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div>
        <label className="label">Full Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Ahmed Khan"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
      </div>
      <div>
        <label className="label">Phone Number <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="+92 3XX XXXXXXX"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
      </div>
      <div>
        <label className="label">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          className="input-field"
          placeholder="email@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
      </div>
      <div>
        <label className="label">Area <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Gulshan-e-Iqbal"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
        />
        {formErrors.area && <p className="text-xs text-red-500 mt-1">{formErrors.area}</p>}
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button onClick={isEdit ? handleSaveEdit : handleAdd} className="btn-primary flex-1">
          <Check size={18} />
          {isEdit ? 'Save Changes' : 'Add Collector'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search collectors..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-200 text-sm"
          >
            <Trash2 size={16} />
            Delete All Collectors
          </button>
          <button
            onClick={() => {
              setForm({ name: '', phone: '', email: '', area: '' });
              setFormErrors({});
              setShowAddModal(true);
            }}
            className="btn-primary text-sm"
          >
            <Plus size={16} />
            Add Collector
          </button>
        </div>
      </div>

      {/* Collector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCollectors.map((collector) => {
          const stats = getCollectorStats(collector.id);
          return (
            <div
              key={collector.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">
                      {getInitials(collector.name)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{collector.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={11} />
                      {collector.area}
                    </p>
                  </div>
                </div>
                <StatusBadge variant={getStatusVariant(collector.status)}>
                  {getStatusLabel(collector.status)}
                </StatusBadge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-surface-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-slate-900 font-sora">{stats.assignedBoxes}</p>
                  <p className="text-[10px] text-slate-400">Boxes</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-slate-900 font-sora">{stats.collectionsCount}</p>
                  <p className="text-[10px] text-slate-400">This Month</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs font-bold text-slate-900 font-sora">
                    {stats.totalThisMonth > 0 ? `${(stats.totalThisMonth / 1000).toFixed(1)}k` : '0'}
                  </p>
                  <p className="text-[10px] text-slate-400">PKR</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Phone size={12} />
                <span>{collector.phone}</span>
                <span className="text-slate-300">|</span>
                <Mail size={12} />
                <span className="truncate">{collector.email}</span>
              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => openProfile(collector)}
                  className="btn-secondary text-xs flex-1 py-2"
                >
                  <Eye size={14} />
                  Profile
                </button>
                <button
                  onClick={() => handleEdit(collector)}
                  className="btn-secondary text-xs flex-1 py-2"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(collector)}
                  className={`text-xs flex-1 py-2 rounded-xl font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    collector.status === 'active'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {collector.status === 'active' ? <UserX size={14} /> : <Check size={14} />}
                  {collector.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCollectors.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card text-center py-12 text-slate-400">
          <p className="text-sm">No collectors found</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Collector" size="md">
        {renderForm()}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Collector" size="md">
        {renderForm(true)}
      </Modal>

      {/* Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => { setShowProfileModal(false); setSelectedCollector(null); }}
        title="Collector Profile"
        size="md"
      >
        {selectedCollector && (() => {
          const stats = getCollectorStats(selectedCollector.id);
          const assignedBoxList = boxes.filter((b) => b.assignedCollectorId === selectedCollector.id);
          const credentials = storedCredentials[selectedCollector.id];
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-700">
                    {getInitials(selectedCollector.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 font-sora">{selectedCollector.name}</h3>
                  <p className="text-sm text-slate-500">{selectedCollector.area}</p>
                  {selectedCollector.username && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <User size={12} />
                      @{selectedCollector.username}
                    </p>
                  )}
                </div>
              </div>

              {renderCredentialsSection(selectedCollector)}

              {!credentials && selectedCollector.firstLogin && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Temporary password was shown when this account was created. If needed, reset access from Django admin.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={15} className="text-slate-400" />
                  {selectedCollector.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={15} className="text-slate-400" />
                  {selectedCollector.email}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 font-sora">{stats.assignedBoxes}</p>
                  <p className="text-xs text-slate-400">Assigned Boxes</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900 font-sora">{stats.collectionsCount}</p>
                  <p className="text-xs text-slate-400">Collections</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary-600 font-sora">
                    {(stats.totalThisMonth / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-slate-400">PKR Total</p>
                </div>
              </div>
              {assignedBoxList.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Assigned Boxes</h4>
                  <div className="space-y-2">
                    {assignedBoxList.map((box) => (
                      <div key={box.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{box.name}</p>
                          <p className="text-xs text-slate-400">#{box.boxNumber}</p>
                        </div>
                        <StatusBadge variant={getStatusVariant(box.status)}>
                          {getStatusLabel(box.status)}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Member since {formatDate(selectedCollector.createdAt)}
              </p>

              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    handleEdit(selectedCollector);
                  }}
                  className="btn-secondary text-sm flex-1 py-2.5"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedCollector(null);
                    setShowPassword(false);
                  }}
                  className="btn-primary text-sm flex-1 py-2.5"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete All Confirm */}
      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={async () => {
          await deleteAllCollectors();
          setShowDeleteAllConfirm(false);
          showToast('All collectors deleted successfully', 'success');
        }}
        title="Delete All Collectors"
        message="WARNING: Are you sure you want to delete all collectors? This will delete all collector profiles, user credentials, and associated assignments/complaints/expenses/collections records from the database. This action cannot be undone."
        confirmLabel="Delete All"
      />
    </div>
  );
}
