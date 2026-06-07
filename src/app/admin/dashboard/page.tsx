'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useStore';
import StatsCard from '@/components/shared/StatsCard';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { calculateFinancials } from '@/lib/finance';
import {
  DollarSign,
  Users,
  Plus,
  UserPlus,
  Download,
  ArrowRight,
  Shield,
  TrendingUp,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { collectors, collections, expenses, activities, monthlyData } = useAppStore();

  const stats = useMemo(() => {
    const financials = calculateFinancials(collections, expenses);
    const activeCollectors = collectors.filter((c) => c.status === 'active').length;
    return { ...financials, activeCollectors };
  }, [collections, expenses, collectors]);

  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          icon={DollarSign}
          label="Total Collected"
          value={formatCurrency(stats.totalCollected)}
          trend={{ value: 12.5, isPositive: true }}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          icon={Minus}
          label="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Net Amount"
          value={formatCurrency(stats.netAmount)}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Shield}
          label="Net NGO Share (85%)"
          value={formatCurrency(stats.netNgoRevenue)}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <StatsCard
          icon={Users}
          label="Active Collectors"
          value={stats.activeCollectors}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 font-sora">Monthly Collections</h3>
            <span className="text-xs text-slate-400">Last 6 months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    padding: '12px',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Collected']}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
          <h3 className="text-base font-semibold text-slate-900 font-sora mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{activity.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
        <h3 className="text-base font-semibold text-slate-900 font-sora mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/admin/boxes')}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <Plus size={20} className="text-primary-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-slate-900">Install New Box</p>
              <p className="text-xs text-slate-400">Add a donation box</p>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/admin/assignments')}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
              <UserPlus size={20} className="text-sky-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-slate-900">Assign Collector</p>
              <p className="text-xs text-slate-400">Assign boxes to collectors</p>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/admin/boxes')}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Download size={20} className="text-amber-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-slate-900">Download All QRs</p>
              <p className="text-xs text-slate-400">Get printable QR codes</p>
            </div>
            <ArrowRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
