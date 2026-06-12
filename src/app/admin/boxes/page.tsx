'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useStore';
import StatusBadge, { getStatusVariant, getStatusLabel } from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import QRCodeCard from '@/components/shared/QRCodeCard';
import QRPrintSheet from '@/components/shared/QRPrintSheet';
import { getNextBoxNumber } from '@/lib/utils';
import {
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  Download,
  MapPin,
  Check,
  Package,
  Printer,
} from 'lucide-react';
import { Box } from '@/types';

export default function BoxesPage() {
  const { boxes, collectors, addBox, updateBox, deleteBox, deleteAllBoxes, showToast } = useAppStore();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectorFilter, setCollectorFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAllQRs, setShowAllQRs] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // New box form
  const [form, setForm] = useState({
    name: '',
    boxNumber: getNextBoxNumber(boxes),
    donorName: '',
    donorPhone: '',
    keyNumber: '',
    address: '',
    mapLink: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newBoxQR, setNewBoxQR] = useState<Box | null>(null);

  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) => {
      const matchSearch =
        box.name.toLowerCase().includes(search.toLowerCase()) ||
        box.donorName.toLowerCase().includes(search.toLowerCase()) ||
        (box.keyNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        box.address.toLowerCase().includes(search.toLowerCase()) ||
        box.boxNumber.toString().includes(search);
      const matchStatus = statusFilter === 'all' || box.status === statusFilter;
      const matchCollector =
        collectorFilter === 'all' ||
        (collectorFilter === 'unassigned' && !box.assignedCollectorId) ||
        box.assignedCollectorId === collectorFilter;
      return matchSearch && matchStatus && matchCollector;
    });
  }, [boxes, search, statusFilter, collectorFilter]);

  const getCollectorName = (id?: string) => {
    if (!id) return '—';
    return collectors.find((c) => c.id === id)?.name || '—';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Box name is required';
    if (!form.donorName.trim()) errors.donorName = 'Donor name is required';
    if (!form.donorPhone.trim()) errors.donorPhone = 'Donor phone is required';
    if (!form.keyNumber.trim()) errors.keyNumber = 'Key number is required';
    if (!form.address.trim()) errors.address = 'Address is required';
    if (form.mapLink && !form.mapLink.startsWith('http')) errors.mapLink = 'Enter a valid URL';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitNewBox = async () => {
    if (!validateForm()) return;
    try {
      const newBox = await addBox({
        name: form.name,
        boxNumber: form.boxNumber,
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        keyNumber: form.keyNumber,
        address: form.address,
        mapLink: form.mapLink || undefined,
        status: 'active',
      });
      setNewBoxQR(newBox);
      showToast('Box installed successfully!', 'success');
    } catch {
      showToast('Failed to install box', 'error');
    }
  };

  const handleEdit = (box: Box) => {
    setSelectedBox(box);
    setForm({
      name: box.name,
      boxNumber: box.boxNumber,
      donorName: box.donorName,
      donorPhone: box.donorPhone,
      keyNumber: box.keyNumber || '',
      address: box.address,
      mapLink: box.mapLink || '',
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!validateForm() || !selectedBox) return;
    updateBox(selectedBox.id, {
      name: form.name,
      boxNumber: form.boxNumber,
      donorName: form.donorName,
      donorPhone: form.donorPhone,
      keyNumber: form.keyNumber,
      address: form.address,
      mapLink: form.mapLink || undefined,
    });
    setShowEditModal(false);
    setSelectedBox(null);
    showToast('Box updated successfully!', 'success');
  };

  const resetForm = () => {
    setForm({
      name: '',
      boxNumber: getNextBoxNumber(boxes),
      donorName: '',
      donorPhone: '',
      keyNumber: '',
      address: '',
      mapLink: '',
    });
    setFormErrors({});
    setNewBoxQR(null);
  };

  const printAllQRs = () => {
    setShowAllQRs(true);
  };

  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div>
        <label className="label">Box Label <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Masjid Al-Noor Box"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
      </div>
      <div>
        <label className="label">Box Number</label>
        <input
          type="number"
          className="input-field"
          value={form.boxNumber}
          onChange={(e) => setForm({ ...form, boxNumber: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label className="label">Donor Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Haji Abdul Rashid (used in thank-you SMS)"
          value={form.donorName}
          onChange={(e) => setForm({ ...form, donorName: e.target.value })}
        />
        <p className="text-[10px] text-slate-400 mt-1">Person&apos;s name — not the street address</p>
        {formErrors.donorName && <p className="text-xs text-red-500 mt-1">{formErrors.donorName}</p>}
      </div>
      <div>
        <label className="label">Donor Phone Number <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="+92 3XX XXXXXXX"
          value={form.donorPhone}
          onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
        />
        {formErrors.donorPhone && <p className="text-xs text-red-500 mt-1">{formErrors.donorPhone}</p>}
      </div>
      <div>
        <label className="label">Key Number <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. K-42"
          value={form.keyNumber}
          onChange={(e) => setForm({ ...form, keyNumber: e.target.value })}
        />
        <p className="text-[10px] text-slate-400 mt-1">Physical key tag — helps collectors find the right key</p>
        {formErrors.keyNumber && <p className="text-xs text-red-500 mt-1">{formErrors.keyNumber}</p>}
      </div>
      <div>
        <label className="label">Address <span className="text-red-500">*</span></label>
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Full address..."
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
      </div>
      <div>
        <label className="label">
          Map Link
          <span className="text-slate-400 font-normal ml-1">(Optional, can be added later)</span>
        </label>
        <input
          type="url"
          className="input-field"
          placeholder="https://maps.google.com/..."
          value={form.mapLink}
          onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
        />
        {formErrors.mapLink && <p className="text-xs text-red-500 mt-1">{formErrors.mapLink}</p>}
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
            } else {
              setShowAddModal(false);
              resetForm();
            }
          }}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          onClick={isEdit ? handleSaveEdit : handleSubmitNewBox}
          className="btn-primary flex-1"
        >
          <Check size={18} />
          {isEdit ? 'Save Changes' : 'Install Box'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search boxes..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={collectorFilter}
            onChange={(e) => setCollectorFilter(e.target.value)}
            className="input-field w-auto hidden sm:block"
          >
            <option value="all">All Collectors</option>
            <option value="unassigned">Unassigned</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium inline-flex items-center justify-center gap-1.5 transition-all duration-200 text-sm"
          >
            <Trash2 size={16} />
            Delete All Donors
          </button>
          <button onClick={printAllQRs} className="btn-secondary text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Download All QRs</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn-primary text-sm"
          >
            <Plus size={16} />
            Install New Box
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Box Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Key</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Map</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Collector</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBoxes.map((box) => (
                <tr key={box.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{box.name}</p>
                      <p className="text-xs text-slate-400">{box.donorName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{box.boxNumber}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell font-medium">{box.keyNumber || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate hidden md:table-cell">{box.address}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {box.mapLink ? (
                      <a
                        href={box.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                      >
                        <MapPin size={14} />
                        <span className="text-xs">View</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStatusVariant(box.status)}>
                      {getStatusLabel(box.status)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm hidden lg:table-cell">
                    {getCollectorName(box.assignedCollectorId)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setSelectedBox(box); setShowQRModal(true); }}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="View QR"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(box)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(box.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBoxes.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No boxes found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add Box Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={newBoxQR ? 'Box Installed!' : 'Install New Box'}
        size="md"
      >
        {newBoxQR ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="text-sm text-slate-600">QR code generated for your new box:</p>
            <div className="flex justify-center">
              <QRCodeCard
                data={newBoxQR.qrCodeData}
                boxName={newBoxQR.name}
                boxNumber={newBoxQR.boxNumber}
                size={180}
              />
            </div>
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        ) : (
          renderForm()
        )}
      </Modal>

      {/* Edit Box Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedBox(null); }}
        title="Edit Box"
        size="md"
      >
        {renderForm(true)}
      </Modal>

      {/* View QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => { setShowQRModal(false); setSelectedBox(null); }}
        title="QR Code"
        size="sm"
      >
        {selectedBox && (
          <div className="flex justify-center py-4">
            <QRCodeCard
              data={selectedBox.qrCodeData}
              boxName={selectedBox.name}
              boxNumber={selectedBox.boxNumber}
              size={200}
            />
          </div>
        )}
      </Modal>

      {/* All QRs Modal */}
      <Modal
        isOpen={showAllQRs}
        onClose={() => setShowAllQRs(false)}
        title="All QR Codes (A4 Print)"
        size="xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 no-print">
          <p className="text-sm text-slate-500">
            {boxes.filter((b) => b.status === 'active').length} active boxes · 12 per A4 page
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary text-sm"
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
        </div>
        <div className="no-print max-h-[60vh] overflow-y-auto">
          <QRPrintSheet boxes={boxes} preview />
        </div>
      </Modal>

      {/* Hidden A4 print layout (shown only when printing) */}
      {showAllQRs && <QRPrintSheet boxes={boxes} />}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteBox(deleteConfirm);
            showToast('Box deleted successfully', 'success');
          }
        }}
        title="Delete Box"
        message="Are you sure you want to delete this donation box? This action cannot be undone and will also remove all assignments."
        confirmLabel="Delete Box"
      />

      {/* Delete All Confirm */}
      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={async () => {
          await deleteAllBoxes();
          setShowDeleteAllConfirm(false);
          showToast('All boxes/donors deleted successfully', 'success');
        }}
        title="Delete All Boxes & Donors"
        message="WARNING: Are you sure you want to delete all boxes and donors? This will delete all box data and all associated collections, assignments, and records from the database. This action cannot be undone."
        confirmLabel="Delete All"
      />
    </div>
  );
}
