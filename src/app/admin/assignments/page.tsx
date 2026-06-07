'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useStore';
import StatusBadge, { getStatusVariant, getStatusLabel } from '@/components/shared/StatusBadge';
import Modal from '@/components/shared/Modal';
import { formatDate } from '@/lib/utils';
import { ScheduleType } from '@/types';
import {
  Plus,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Package,
  Clock,
} from 'lucide-react';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AssignmentsPage() {
  const { assignments, collectors, boxes, addAssignment, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard state
  const [selectedCollector, setSelectedCollector] = useState('');
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleType>('weekly');
  const [scheduleDay, setScheduleDay] = useState(1);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const collector = collectors.find((c) => c.id === a.collectorId);
      const box = boxes.find((b) => b.id === a.boxId);
      const matchSearch =
        search === '' ||
        collector?.name.toLowerCase().includes(search.toLowerCase()) ||
        box?.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [assignments, search, statusFilter, collectors, boxes]);

  const getCollectorName = (id: string) => collectors.find((c) => c.id === id)?.name || '—';
  const getBoxName = (id: string) => boxes.find((b) => b.id === id)?.name || '—';
  const getBoxNumber = (id: string) => boxes.find((b) => b.id === id)?.boxNumber || 0;

  const availableBoxes = useMemo(() => {
    return boxes.filter((b) => b.status === 'active');
  }, [boxes]);

  const handleFinishAssignment = () => {
    selectedBoxes.forEach((boxId) => {
      addAssignment({
        collectorId: selectedCollector,
        boxId,
        schedule,
        scheduleDay: schedule !== 'daily' ? scheduleDay : undefined,
        status: 'pending',
      });
    });
    showToast(`${selectedBoxes.length} box(es) assigned successfully!`, 'success');
    setShowWizard(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedCollector('');
    setSelectedBoxes([]);
    setSchedule('weekly');
    setScheduleDay(1);
  };

  const toggleBox = (boxId: string) => {
    setSelectedBoxes((prev) =>
      prev.includes(boxId) ? prev.filter((id) => id !== boxId) : [...prev, boxId]
    );
  };

  const getScheduleLabel = () => {
    if (schedule === 'daily') return 'Every day';
    if (schedule === 'weekly') return `Every ${daysOfWeek[scheduleDay]}`;
    return `Every month on the ${scheduleDay}${scheduleDay === 1 ? 'st' : scheduleDay === 2 ? 'nd' : scheduleDay === 3 ? 'rd' : 'th'}`;
  };

  const canProceed = () => {
    if (wizardStep === 1) return !!selectedCollector;
    if (wizardStep === 2) return selectedBoxes.length > 0;
    if (wizardStep === 3) return true;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments..."
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
            <option value="pending">Pending</option>
            <option value="collected">Collected</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button
          onClick={() => {
            resetWizard();
            setShowWizard(true);
          }}
          className="btn-primary text-sm"
        >
          <Plus size={16} />
          Assign Collector
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Collector</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Box</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Collected</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary-700">
                          {getCollectorName(assignment.collectorId).split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 text-sm">{getCollectorName(assignment.collectorId)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-900">{getBoxName(assignment.boxId)}</p>
                      <p className="text-xs text-slate-400">#{getBoxNumber(assignment.boxId)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-slate-600 capitalize">
                      {assignment.schedule}
                      {assignment.schedule === 'weekly' && assignment.scheduleDay !== undefined
                        ? ` (${daysOfWeek[assignment.scheduleDay]})`
                        : ''}
                      {assignment.schedule === 'monthly' && assignment.scheduleDay
                        ? ` (${assignment.scheduleDay}${assignment.scheduleDay === 1 ? 'st' : assignment.scheduleDay === 2 ? 'nd' : assignment.scheduleDay === 3 ? 'rd' : 'th'})`
                        : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">
                    {assignment.lastCollected ? formatDate(assignment.lastCollected + 'T00:00:00Z') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={getStatusVariant(assignment.status)}>
                      {getStatusLabel(assignment.status)}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAssignments.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Clock size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No assignments found</p>
          </div>
        )}
      </div>

      {/* Assignment Wizard */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title={`Assign Collector — Step ${wizardStep} of 4`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step <= wizardStep ? 'bg-primary-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Collector */}
          {wizardStep === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User size={16} className="text-primary-600" />
                Select Collector
              </h3>
              <div className="space-y-2">
                {collectors
                  .filter((c) => c.status === 'active')
                  .map((collector) => (
                    <button
                      key={collector.id}
                      onClick={() => setSelectedCollector(collector.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                        selectedCollector === collector.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-700">
                          {collector.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{collector.name}</p>
                        <p className="text-xs text-slate-400">{collector.area} · {collector.phone}</p>
                      </div>
                      {selectedCollector === collector.id && (
                        <Check size={20} className="text-primary-600" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Boxes */}
          {wizardStep === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Package size={16} className="text-primary-600" />
                Select Box(es)
              </h3>
              <p className="text-xs text-slate-400 mb-3">{selectedBoxes.length} selected</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {availableBoxes.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => toggleBox(box.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                      selectedBoxes.includes(box.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                        selectedBoxes.includes(box.id)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedBoxes.includes(box.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{box.name}</p>
                      <p className="text-xs text-slate-400">#{box.boxNumber} · {box.address.substring(0, 50)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {wizardStep === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-primary-600" />
                Select Schedule
              </h3>
              <div className="flex gap-2 mb-4">
                {(['daily', 'weekly', 'monthly'] as ScheduleType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSchedule(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      schedule === type
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {schedule === 'weekly' && (
                <div>
                  <label className="label">Day of Week</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {daysOfWeek.map((day, idx) => (
                      <button
                        key={day}
                        onClick={() => setScheduleDay(idx)}
                        className={`py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                          scheduleDay === idx
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {schedule === 'monthly' && (
                <div>
                  <label className="label">Day of Month</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => setScheduleDay(day)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          scheduleDay === day
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {wizardStep === 4 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Check size={16} className="text-primary-600" />
                Confirm Assignment
              </h3>
              <div className="bg-surface-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Collector</span>
                  <span className="text-sm font-medium text-slate-900">
                    {getCollectorName(selectedCollector)}
                  </span>
                </div>
                <div className="border-t border-slate-200" />
                <div>
                  <span className="text-sm text-slate-500">Boxes ({selectedBoxes.length})</span>
                  <div className="mt-2 space-y-1">
                    {selectedBoxes.map((boxId) => (
                      <p key={boxId} className="text-sm text-slate-900">
                        • {getBoxName(boxId)} (#{boxes.find(b => b.id === boxId)?.boxNumber})
                      </p>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-200" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Schedule</span>
                  <span className="text-sm font-medium text-slate-900">{getScheduleLabel()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {wizardStep > 1 && (
              <button
                onClick={() => setWizardStep((s) => s - 1)}
                className="btn-secondary flex-1"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {wizardStep < 4 ? (
              <button
                onClick={() => setWizardStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary flex-1"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinishAssignment} className="btn-primary flex-1">
                <Check size={16} />
                Confirm & Assign
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
