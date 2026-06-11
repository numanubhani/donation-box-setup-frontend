'use client';

import { useState, useMemo } from 'react';
import { useAppStore, useAuthStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateFinancials } from '@/lib/finance';
import StatusBadge, { getStatusVariant, getStatusLabel } from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import StatsCard from '@/components/shared/StatsCard';
import {
  QrCode, TrendingUp, Receipt, AlertTriangle, Camera,
  Check, Clock, AlertCircle, ExternalLink,
  X, Upload, Send, DollarSign, Shield, Phone, MapPin, Key,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Box, ExpenseType, IssueType, UrgencyLevel } from '@/types';

const expenseTypes: { value: ExpenseType; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food' },
  { value: 'phone_balance', label: 'Phone Balance' },
  { value: 'other', label: 'Other' },
];

const issueTypes: { value: IssueType; label: string }[] = [
  { value: 'box_damaged', label: 'Box Damaged' },
  { value: 'box_stolen', label: 'Box Stolen' },
  { value: 'location_changed', label: 'Location Changed' },
  { value: 'box_full', label: 'Box Full / Overflowing' },
  { value: 'other', label: 'Other' },
];

export default function CollectorDashboard() {
  const { currentUserId } = useAuthStore();
  const {
    boxes, assignments, collections, expenses, complaints,
    addCollection, addExpense, addComplaint, updateBox, showToast
  } = useAppStore();

  // QR / Collection
  const [showQRModal, setShowQRModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedBox, setScannedBox] = useState<Box | null>(null);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [missingMapLink, setMissingMapLink] = useState(false);
  const [newMapLink, setNewMapLink] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionErrors, setCollectionErrors] = useState<Record<string, string>>({});

  // Expense
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    type: 'transport' as ExpenseType, amount: '', description: '',
    date: new Date().toISOString().split('T')[0], receiptUrl: ''
  });
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Complaint
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    boxId: '', issueType: 'box_damaged' as IssueType,
    description: '', urgency: 'normal' as UrgencyLevel, photoUrl: ''
  });
  const [complaintErrors, setComplaintErrors] = useState<Record<string, string>>({});

  const myAssignments = useMemo(
    () => assignments.filter((a) => a.collectorId === currentUserId),
    [assignments, currentUserId]
  );
  const myBoxIds = useMemo(() => myAssignments.map((a) => a.boxId), [myAssignments]);
  const myBoxes = useMemo(() => boxes.filter((b) => myBoxIds.includes(b.id)), [boxes, myBoxIds]);

  const collectedCount = myAssignments.filter((a) => a.status === 'collected').length;
  const totalAssigned = myAssignments.length;

  const myExpenses = useMemo(
    () => expenses.filter((e) => e.collectorId === currentUserId),
    [expenses, currentUserId]
  );
  const totalExpensesThisMonth = myExpenses
    .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  const myCollections = useMemo(
    () => collections.filter((c) => c.collectorId === currentUserId),
    [collections, currentUserId]
  );

  const financials = useMemo(
    () => calculateFinancials(myCollections, myExpenses),
    [myCollections, myExpenses]
  );

  const myComplaints = useMemo(
    () => complaints.filter((c) => c.collectorId === currentUserId),
    [complaints, currentUserId]
  );

  // QR scanning
  const handleManualEntry = () => {
    const code = manualCode.trim().toUpperCase();
    const box = boxes.find((b) => b.qrCodeData === code || b.id === code);
    if (!box) {
      showToast('Box not found. Check the code and try again.', 'error');
      return;
    }
    processScannedBox(box);
  };

  const processScannedBox = (box: Box) => {
    if (!box.donorName || !box.donorPhone) {
      showToast('Critical info missing. Please contact admin.', 'error');
      return;
    }
    setScannedBox(box);
    if (!box.mapLink) {
      setMissingMapLink(true);
      setShowQRModal(false);
    } else {
      setMissingMapLink(false);
      setShowQRModal(false);
      setShowCollectionForm(true);
    }
  };

  const handleSaveMapLink = () => {
    if (scannedBox && newMapLink) {
      updateBox(scannedBox.id, { mapLink: newMapLink });
      setScannedBox({ ...scannedBox, mapLink: newMapLink });
    }
    setMissingMapLink(false);
    setShowCollectionForm(true);
  };

  const handleSkipMapLink = () => {
    setMissingMapLink(false);
    setShowCollectionForm(true);
  };

  const handleSubmitCollection = async () => {
    const errors: Record<string, string> = {};
    if (!collectionAmount || parseFloat(collectionAmount) <= 0) errors.amount = 'Enter a valid amount';
    if (!collectionDate) errors.date = 'Date is required';
    setCollectionErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await addCollection({
      boxId: scannedBox!.id,
      collectorId: currentUserId!,
      amount: parseFloat(collectionAmount),
      notes: collectionNotes || undefined,
      collectionDate,
    });

    if (!result?.success) {
      showToast(result?.error || 'Failed to save collection', 'error');
      return;
    }

    const donorLabel = scannedBox!.donorName || scannedBox!.name;
    if (result.smsSent) {
      showToast(`Collection saved! Thank-you SMS sent to ${donorLabel}.`, 'success');
    } else if (result.smsReason === 'below_minimum') {
      showToast('Collection saved. SMS is only sent for amounts of PKR 3,000 or more.', 'success');
    } else if (result.smsReason === 'disabled') {
      showToast('Collection saved. SMS is turned off in Admin → SMS Settings.', 'warning');
    } else if (result.smsReason === 'not_configured') {
      showToast('Collection saved. Ask admin to configure Twilio SMS settings.', 'warning');
    } else if (result.smsReason) {
      showToast(`Collection saved. SMS failed: ${result.smsReason}`, 'warning');
    } else {
      showToast('Collection saved successfully!', 'success');
    }
    setShowCollectionForm(false);
    resetCollectionForm();
  };

  const resetCollectionForm = () => {
    setScannedBox(null);
    setCollectionAmount('');
    setCollectionNotes('');
    setCollectionDate(new Date().toISOString().split('T')[0]);
    setCollectionErrors({});
    setManualCode('');
    setNewMapLink('');
  };

  // Quick collect from progress
  const handleQuickCollect = (box: Box) => {
    processScannedBox(box);
  };

  // Expense submit
  const handleSubmitExpense = () => {
    const errors: Record<string, string> = {};
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!expenseForm.description.trim()) errors.description = 'Description is required';
    setExpenseErrors(errors);
    if (Object.keys(errors).length > 0) return;

    addExpense({
      collectorId: currentUserId!,
      type: expenseForm.type,
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      date: expenseForm.date,
      receiptUrl: receiptPreview || undefined,
    });
    showToast('Expense added successfully!', 'success');
    setShowExpenseModal(false);
    setExpenseForm({ type: 'transport', amount: '', description: '', date: new Date().toISOString().split('T')[0], receiptUrl: '' });
    setReceiptPreview(null);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Complaint submit
  const handleSubmitComplaint = () => {
    const errors: Record<string, string> = {};
    if (!complaintForm.boxId) errors.boxId = 'Select a box';
    if (!complaintForm.description.trim()) errors.description = 'Description is required';
    setComplaintErrors(errors);
    if (Object.keys(errors).length > 0) return;

    addComplaint({
      collectorId: currentUserId!,
      boxId: complaintForm.boxId,
      issueType: complaintForm.issueType,
      description: complaintForm.description,
      urgency: complaintForm.urgency,
      status: 'reported',
      photoUrl: undefined,
    });
    showToast('Complaint submitted successfully!', 'success');
    setShowComplaintModal(false);
    setComplaintForm({ boxId: '', issueType: 'box_damaged', description: '', urgency: 'normal', photoUrl: '' });
  };

  const progressPercent = totalAssigned > 0 ? (collectedCount / totalAssigned) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Financial Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign}
          label="Total Collected By Me"
          value={formatCurrency(financials.totalCollected)}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          icon={Minus}
          label="My Expenses"
          value={formatCurrency(financials.totalExpenses)}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Net Amount"
          value={formatCurrency(financials.netAmount)}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Shield}
          label="My Commission (15% of Net)"
          value={formatCurrency(financials.collectorCommission)}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* 2x2 Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Collect Box */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-50">
              <QrCode size={24} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 font-sora mb-1">Collect Box</h3>
              <p className="text-sm text-slate-500 mb-4">Scan QR code or enter manually to collect donations</p>
              <button onClick={() => { setShowQRModal(true); setManualCode(''); }} className="btn-primary text-sm w-full sm:w-auto">
                <Camera size={16} /> Start Collection
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: My Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-50">
              <TrendingUp size={24} className="text-sky-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 font-sora mb-1">My Progress</h3>
              <p className="text-sm text-slate-500 mb-2">{collectedCount} / {totalAssigned} boxes collected</p>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-primary-500 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-400">{Math.round(progressPercent)}% complete</p>
            </div>
          </div>
        </div>

        {/* Card 3: Add Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Receipt size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 font-sora mb-1">Add Expense</h3>
              <p className="text-sm text-slate-500 mb-1">Log transport, food & other expenses</p>
              <p className="text-xs text-amber-600 font-medium mb-3">This month: {formatCurrency(totalExpensesThisMonth)}</p>
              <button onClick={() => setShowExpenseModal(true)} className="btn-secondary text-sm w-full sm:w-auto">
                <Receipt size={16} /> Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Report Issue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 font-sora mb-1">Report Issue</h3>
              <p className="text-sm text-slate-500 mb-4">Report damage, theft, or other problems</p>
              <button onClick={() => setShowComplaintModal(true)} className="btn-secondary text-sm w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50">
                <AlertTriangle size={16} /> Submit Complaint
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-slate-900 font-sora mb-4">Assigned Boxes</h3>
        <div className="space-y-3">
          {myAssignments.map((assignment) => {
            const box = boxes.find((b) => b.id === assignment.boxId);
            if (!box) return null;
            const lastCollection = collections
              .filter((c) => c.boxId === box.id && c.collectorId === currentUserId)
              .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))[0];
            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    assignment.status === 'collected' ? 'bg-green-100' :
                    assignment.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {assignment.status === 'collected' ? <Check size={16} className="text-green-600" /> :
                     assignment.status === 'overdue' ? <AlertCircle size={16} className="text-red-500" /> :
                     <Clock size={16} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{box.name}</p>
                        <p className="text-xs text-slate-400">Box #{box.boxNumber}</p>
                      </div>
                      <StatusBadge variant={getStatusVariant(assignment.status)}>
                        {getStatusLabel(assignment.status)}
                      </StatusBadge>
                    </div>

                    {assignment.status === 'collected' && lastCollection && (
                      <p className="text-xs text-green-700 font-medium mb-2">
                        {formatCurrency(lastCollection.amount)} collected · {formatDate(lastCollection.collectionDate + 'T00:00:00Z')}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-600">
                      {box.keyNumber && (
                        <div className="flex items-center gap-2">
                          <Key size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">Key #{box.keyNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a href={`tel:${box.donorPhone}`} className="hover:text-primary-600 transition-colors">
                          {box.donorPhone}
                        </a>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{box.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink size={13} className="text-slate-400 shrink-0" />
                        {box.mapLink ? (
                          <a
                            href={box.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:underline truncate"
                          >
                            Open map link
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No map link available</span>
                        )}
                      </div>
                    </div>

                    {assignment.status === 'pending' && (
                      <button
                        onClick={() => handleQuickCollect(box)}
                        className="btn-primary text-xs py-2 px-4 mt-3"
                      >
                        <QrCode size={14} />
                        Collect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {myAssignments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No boxes assigned yet</p>
          )}
        </div>
      </div>

      {/* Recent Complaints */}
      {myComplaints.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-slate-900 font-sora mb-4">My Complaints</h3>
          <div className="space-y-2">
            {myComplaints.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{getStatusLabel(c.issueType)}</p>
                  <p className="text-xs text-slate-400">{boxes.find(b => b.id === c.boxId)?.name}</p>
                </div>
                <StatusBadge variant={getStatusVariant(c.status)}>{getStatusLabel(c.status)}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Scan QR Code" size="md">
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center">
              <Camera size={48} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Camera scanner requires HTTPS</p>
              <p className="text-xs text-slate-400">Use manual entry below</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-3">Or enter code manually</p>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="e.g. DBOX-1001-ALNOOR"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
              />
              <button onClick={handleManualEntry} className="btn-primary">
                <Check size={16} /> Submit
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Missing Map Link Warning */}
      <Modal isOpen={missingMapLink} onClose={() => { setMissingMapLink(false); resetCollectionForm(); }} title="Missing Information" size="md">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">This box is missing a map link</p>
              <p className="text-xs text-amber-600 mt-1">Please add it to continue or skip.</p>
            </div>
          </div>
          <div>
            <label className="label">Map Link</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://maps.google.com/..."
              value={newMapLink}
              onChange={(e) => setNewMapLink(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSkipMapLink} className="btn-secondary flex-1">Skip for Now</button>
            <button onClick={handleSaveMapLink} className="btn-primary flex-1" disabled={!newMapLink}>
              <Check size={16} /> Save & Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* Collection Form */}
      <Modal isOpen={showCollectionForm} onClose={() => { setShowCollectionForm(false); resetCollectionForm(); }} title="Record Collection" size="md">
        {scannedBox && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Box Name</span><span className="text-sm font-medium text-slate-900">{scannedBox.name}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Donor Phone</span><span className="text-sm text-slate-600">{scannedBox.donorPhone}</span></div>
              {scannedBox.keyNumber && (
                <div className="flex justify-between"><span className="text-xs text-slate-400">Key Number</span><span className="text-sm font-medium text-slate-900">{scannedBox.keyNumber}</span></div>
              )}
              <div className="flex justify-between items-start"><span className="text-xs text-slate-400">Address</span><span className="text-sm text-slate-600 text-right max-w-[60%]">{scannedBox.address}</span></div>
              {scannedBox.mapLink && (
                <div className="flex justify-between"><span className="text-xs text-slate-400">Map</span>
                  <a href={scannedBox.mapLink} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 hover:underline flex items-center gap-1"><ExternalLink size={12} /> View</a>
                </div>
              )}
            </div>
            <div>
              <label className="label">Amount Collected (PKR) <span className="text-red-500">*</span></label>
              <input type="number" className="input-field" placeholder="0" value={collectionAmount} onChange={(e) => setCollectionAmount(e.target.value)} />
              {collectionErrors.amount && <p className="text-xs text-red-500 mt-1">{collectionErrors.amount}</p>}
            </div>
            <div>
              <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea className="input-field min-h-[70px]" placeholder="Any notes..." value={collectionNotes} onChange={(e) => setCollectionNotes(e.target.value)} />
            </div>
            <div>
              <label className="label">Collection Date</label>
              <input type="date" className="input-field" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
            </div>
            <button onClick={handleSubmitCollection} className="btn-primary w-full">
              <Check size={18} /> Mark as Collected ✓
            </button>
          </div>
        )}
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Expense Type</label>
            <select className="input-field" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as ExpenseType })}>
              {expenseTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (PKR) <span className="text-red-500">*</span></label>
            <input type="number" className="input-field" placeholder="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            {expenseErrors.amount && <p className="text-xs text-red-500 mt-1">{expenseErrors.amount}</p>}
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea className="input-field min-h-[70px]" placeholder="What was the expense for..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            {expenseErrors.description && <p className="text-xs text-red-500 mt-1">{expenseErrors.description}</p>}
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Receipt Photo <span className="text-slate-400 font-normal">(optional)</span></label>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-500">Upload receipt</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
            </label>
            {receiptPreview && (
              <div className="mt-2 relative">
                <img src={receiptPreview} alt="Receipt" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={() => setReceiptPreview(null)} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow"><X size={14} /></button>
              </div>
            )}
          </div>
          <button onClick={handleSubmitExpense} className="btn-primary w-full"><Check size={18} /> Submit Expense</button>
        </div>
      </Modal>

      {/* Complaint Modal */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Report Issue" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Select Box <span className="text-red-500">*</span></label>
            <select className="input-field" value={complaintForm.boxId} onChange={(e) => setComplaintForm({ ...complaintForm, boxId: e.target.value })}>
              <option value="">Choose a box...</option>
              {myBoxes.map((b) => <option key={b.id} value={b.id}>{b.name} (#{b.boxNumber})</option>)}
            </select>
            {complaintErrors.boxId && <p className="text-xs text-red-500 mt-1">{complaintErrors.boxId}</p>}
          </div>
          <div>
            <label className="label">Issue Type</label>
            <div className="flex flex-wrap gap-2">
              {issueTypes.map((t) => (
                <button key={t.value} onClick={() => setComplaintForm({ ...complaintForm, issueType: t.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    complaintForm.issueType === t.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea className="input-field min-h-[80px]" placeholder="Describe the issue..." value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} />
            {complaintErrors.description && <p className="text-xs text-red-500 mt-1">{complaintErrors.description}</p>}
          </div>
          <div>
            <label className="label">Urgency</label>
            <div className="flex gap-2">
              {(['normal', 'urgent'] as UrgencyLevel[]).map((u) => (
                <button key={u} onClick={() => setComplaintForm({ ...complaintForm, urgency: u })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                    complaintForm.urgency === u
                      ? u === 'urgent' ? 'bg-red-500 text-white' : 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmitComplaint} className="btn-primary w-full">
            <Send size={16} /> Submit Complaint
          </button>
        </div>
      </Modal>
    </div>
  );
}
