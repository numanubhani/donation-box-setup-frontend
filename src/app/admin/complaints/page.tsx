'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useStore';
import StatusBadge, { getStatusVariant, getStatusLabel } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import { IssueStatus, Complaint } from '@/types';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  User,
  Package,
  Calendar,
  Wrench,
} from 'lucide-react';
import Modal from '@/components/shared/Modal';

export default function AdminComplaintsPage() {
  const { complaints, boxes, collectors, updateComplaintStatus, updateBox, showToast } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchUrgency = urgencyFilter === 'all' || c.urgency === urgencyFilter;
      return matchStatus && matchUrgency;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [complaints, statusFilter, urgencyFilter]);

  const getBoxName = (id: string) => boxes.find((b) => b.id === id)?.name || 'Unknown Box';
  const getBoxNumber = (id: string) => boxes.find((b) => b.id === id)?.boxNumber || 0;
  const getCollectorName = (id: string) => collectors.find((c) => c.id === id)?.name || 'Unknown Collector';

  const handleUpdateStatus = (complaintId: string, newStatus: IssueStatus) => {
    updateComplaintStatus(complaintId, newStatus);
    
    // If resolved, ensure box status is set back to active if it was in maintenance
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint && newStatus === 'resolved') {
      const box = boxes.find(b => b.id === complaint.boxId);
      if (box && box.status === 'maintenance') {
        updateBox(box.id, { status: 'active' });
      }
    }
    
    showToast(`Complaint status updated to ${getStatusLabel(newStatus)}`, 'success');
  };

  const handlePutInMaintenance = (boxId: string) => {
    updateBox(boxId, { status: 'maintenance' });
    showToast('Box status updated to Maintenance', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white border border-slate-200 rounded-2xl shadow-card p-4">
        <div className="flex flex-1 gap-3">
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs text-slate-500 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs text-slate-500 mb-1 block">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Urgency</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium mt-2 sm:mt-0">
          Showing {filteredComplaints.length} issue(s)
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComplaints.map((complaint) => {
          const box = boxes.find((b) => b.id === complaint.boxId);
          return (
            <div
              key={complaint.id}
              className={`bg-white border rounded-2xl shadow-card p-5 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between ${
                complaint.urgency === 'urgent' && complaint.status !== 'resolved'
                  ? 'border-red-200 bg-red-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 font-sora text-sm">
                      {getStatusLabel(complaint.issueType)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Package size={12} />
                      {getBoxName(complaint.boxId)} (#{getBoxNumber(complaint.boxId)})
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge variant={complaint.urgency === 'urgent' ? 'red' : 'amber'}>
                      {complaint.urgency.toUpperCase()}
                    </StatusBadge>
                    <StatusBadge variant={getStatusVariant(complaint.status)}>
                      {getStatusLabel(complaint.status)}
                    </StatusBadge>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {complaint.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4">
                  <span className="flex items-center gap-1 font-medium">
                    <User size={12} className="text-slate-400" />
                    {getCollectorName(complaint.collectorId)}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar size={12} />
                    {formatDate(complaint.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-3 mt-auto">
                <button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setShowDetailModal(true);
                  }}
                  className="btn-secondary text-xs py-2 flex-1"
                >
                  <Eye size={13} />
                  View Details
                </button>
                {complaint.status !== 'resolved' && (
                  <>
                    {box && box.status !== 'maintenance' && (
                      <button
                        onClick={() => handlePutInMaintenance(complaint.boxId)}
                        className="btn-secondary text-xs py-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                        title="Put Box in Maintenance"
                      >
                        <Wrench size={13} />
                        Service Box
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                      className="btn-primary text-xs py-2 text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={13} />
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card text-center py-12 text-slate-400">
          <AlertTriangle size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No issues or complaints reported</p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedComplaint(null);
        }}
        title="Complaint Details"
        size="md"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Issue</span>
                <span className="text-sm font-semibold text-slate-900">
                  {getStatusLabel(selectedComplaint.issueType)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Box Location</span>
                <span className="text-sm text-slate-900 font-medium">
                  {getBoxName(selectedComplaint.boxId)} (#{getBoxNumber(selectedComplaint.boxId)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Reported By</span>
                <span className="text-sm text-slate-900">
                  {getCollectorName(selectedComplaint.collectorId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Reported Date</span>
                <span className="text-sm text-slate-900">
                  {formatDate(selectedComplaint.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Urgency</span>
                <StatusBadge variant={selectedComplaint.urgency === 'urgent' ? 'red' : 'amber'}>
                  {selectedComplaint.urgency.toUpperCase()}
                </StatusBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Current Status</span>
                <StatusBadge variant={getStatusVariant(selectedComplaint.status)}>
                  {getStatusLabel(selectedComplaint.status)}
                </StatusBadge>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Description
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-sm whitespace-pre-line leading-relaxed">
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.status !== 'resolved' && (
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                {selectedComplaint.status === 'reported' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedComplaint.id, 'under_review');
                      setSelectedComplaint({ ...selectedComplaint, status: 'under_review' });
                    }}
                    className="btn-secondary text-sm flex-1"
                  >
                    <Clock size={16} />
                    Mark Under Review
                  </button>
                )}
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedComplaint.id, 'resolved');
                    setShowDetailModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="btn-primary text-sm flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  Resolve Issue
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
