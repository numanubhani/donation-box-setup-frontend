'use client';

import { useState, useMemo } from 'react';
import { useAppStore, useAuthStore } from '@/store/useStore';
import {
  Calendar,
  Phone,
  ExternalLink,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  Key,
} from 'lucide-react';
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDate, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollectorUpcomingPage() {
  const { currentUserId } = useAuthStore();
  const { assignments, boxes } = useAppStore();

  // Expanded months state - default the first month (index 0) to be expanded
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({
    0: true,
  });

  const myAssignments = useMemo(
    () => assignments.filter((a) => a.collectorId === currentUserId),
    [assignments, currentUserId]
  );

  // Define 4 months options: Current Month, Month + 1, Month + 2, Month + 3
  const monthOptions = useMemo(() => {
    return [0, 1, 2, 3].map((offset) => {
      const date = addMonths(new Date(), offset);
      return {
        offset,
        label: format(date, 'MMMM yyyy'),
        shortLabel: format(date, 'MMM yy'),
        date,
      };
    });
  }, []);

  // Compute tasks for all months
  const tasksByMonth = useMemo(() => {
    return monthOptions.map((option) => {
      const startOfTargetMonth = startOfMonth(option.date);
      const endOfTargetMonth = endOfMonth(option.date);

      const days = eachDayOfInterval({ start: startOfTargetMonth, end: endOfTargetMonth });
      const tasksList: {
        date: Date;
        boxId: string;
        boxName: string;
        donorName: string;
        donorPhone: string;
        keyNumber: string;
        address: string;
        mapLink?: string;
        schedule: string;
      }[] = [];

      days.forEach((day) => {
        const dayOfWeekIdx = getDay(day); // 0 = Sunday, 1 = Monday, etc.
        const dayOfMonth = getDate(day);  // 1-31

        myAssignments.forEach((assignment) => {
          const box = boxes.find((b) => b.id === assignment.boxId);
          if (!box || box.status !== 'active') return;

          let isScheduled = false;
          if (assignment.schedule === 'daily') {
            isScheduled = true;
          } else if (assignment.schedule === 'weekly' && assignment.scheduleDay === dayOfWeekIdx) {
            isScheduled = true;
          } else if (assignment.schedule === 'monthly' && assignment.scheduleDay === dayOfMonth) {
            isScheduled = true;
          }

          if (isScheduled) {
            tasksList.push({
              date: day,
              boxId: box.id,
              boxName: box.name,
              donorName: box.donorName,
              donorPhone: box.donorPhone,
              keyNumber: box.keyNumber,
              address: box.address,
              mapLink: box.mapLink,
              schedule: assignment.schedule,
            });
          }
        });
      });

      return {
        offset: option.offset,
        label: option.label,
        tasks: tasksList.sort((a, b) => a.date.getTime() - b.date.getTime()),
      };
    });
  }, [myAssignments, boxes, monthOptions]);

  const toggleMonth = (offset: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [offset]: !prev[offset],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 font-sora">Upcoming Schedule</h2>
            <p className="text-sm text-slate-500">Planned donation box collections grouped by month</p>
          </div>
        </div>
      </div>

      {/* Accordion Group */}
      <div className="space-y-4">
        {tasksByMonth.map((monthData) => {
          const isExpanded = !!expandedMonths[monthData.offset];
          const taskCount = monthData.tasks.length;

          return (
            <div
              key={monthData.offset}
              className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleMonth(monthData.offset)}
                className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100/70 active:bg-slate-100 transition-colors border-b border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 font-sora text-base">
                    {monthData.label}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="text-slate-500">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Accordion Body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {monthData.tasks.map((task, idx) => (
                        <div
                          key={`${task.boxId}-${task.date.getTime()}-${idx}`}
                          className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-300 transition-all duration-200 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider font-sora">
                                {format(task.date, 'eee, MMM dd')}
                              </div>
                              <span className="text-[11px] text-slate-400 capitalize inline-flex items-center gap-1">
                                <Clock size={11} />
                                {task.schedule} Schedule
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium font-sora">
                              Donor: {task.donorName}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <Package size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">{task.boxName}</p>
                                  <p className="text-[11px] text-slate-500">{task.address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col justify-between items-start md:items-end gap-2">
                              {task.keyNumber && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                  <Key size={12} className="text-slate-400" />
                                  <span>Key #{task.keyNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Phone size={12} className="text-slate-400" />
                                <span>{task.donorPhone}</span>
                              </div>

                              <div className="flex gap-2 w-full md:w-auto">
                                {task.mapLink && (
                                  <a
                                    href={task.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                                  >
                                    <ExternalLink size={11} />
                                    Open Map
                                  </a>
                                )}
                                <a
                                  href={`tel:${task.donorPhone}`}
                                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 py-1 px-2.5 text-xs inline-flex items-center gap-1"
                                >
                                  <Phone size={11} />
                                  Call Donor
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {monthData.tasks.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <Calendar size={32} className="mx-auto mb-2 opacity-45" />
                          <p className="text-xs">No scheduled collections for {monthData.label}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
