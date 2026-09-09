import React, { useEffect, useState } from 'react';
import { taskApi, planApi } from '../api/client';
import KPICard from '../components/KPICard';
import { Activity, AlertTriangle, Calendar, Layers, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plan } from '../types';

export default function Dashboard() {
  const [genLoading, setGenLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [recentPlans, setRecentPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [summRes, plansRes] = await Promise.all([
        taskApi.summary(),
        planApi.list(),
      ]);
      setSummary(summRes.data);
      setRecentPlans(plansRes.data || []);
      setError(null);
    } catch (e: any) {
      setError('Backend not reachable. Start the API server first.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerateData = async () => {
    setGenLoading(true);
    setError(null);
    try {
      await taskApi.generate();
      await loadData();
    } catch (e) {
      setError('Failed to generate data.');
    }
    setGenLoading(false);
  };

  const handleGenerateWeekly = async () => {
    setPlanLoading(true);
    try {
      await planApi.generateWeekly();
      navigate('/weekly-plan');
    } catch (e) {
      setError('Failed to generate weekly plan.');
      setPlanLoading(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setPlanLoading(true);
    try {
      await planApi.generateMonthly();
      navigate('/monthly-plan');
    } catch (e) {
      setError('Failed to generate monthly plan.');
      setPlanLoading(false);
    }
  };

  const latestPlan = recentPlans[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">SAMANVAY Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">समन्वय — AI Block Planning for Indian Railways</p>
        </div>
        <button
          onClick={handleGenerateData}
          disabled={genLoading}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${genLoading ? 'animate-spin' : ''}`} />
          {genLoading ? 'Generating...' : 'Generate Synthetic Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tasks"
          value={summary?.total ?? '—'}
          subtitle={`${summary?.pending_count ?? 0} pending`}
          icon={<Activity />}
          colorClass="border-l-blue-500"
        />
        <KPICard
          title="Critical & Overdue"
          value={summary?.overdue_count ?? '—'}
          subtitle="Requires immediate attention"
          icon={<AlertTriangle className="text-red-400" />}
          colorClass="border-l-red-500"
        />
        <KPICard
          title="Tasks Scheduled"
          value={latestPlan?.stats?.total_tasks_scheduled ?? '—'}
          subtitle="From latest plan"
          icon={<Calendar />}
          colorClass="border-l-green-500"
        />
        <KPICard
          title="Multi-Dept Blocks"
          value={latestPlan?.stats?.merged_blocks ?? '—'}
          subtitle="Departments coordinated"
          icon={<Layers />}
          colorClass="border-l-purple-500"
        />
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { dept: 'Engineering', key: 'Engineering', color: 'text-blue-400 border-blue-500/30', bg: 'bg-blue-500/10' },
          { dept: 'S&T', key: 'S&T', color: 'text-orange-400 border-orange-500/30', bg: 'bg-orange-500/10' },
          { dept: 'TRD', key: 'TRD', color: 'text-green-400 border-green-500/30', bg: 'bg-green-500/10' },
        ].map(({ dept, key, color, bg }) => {
          const d = summary?.by_department?.[key];
          return (
            <div key={dept} className={`p-4 rounded-lg border ${color} ${bg}`}>
              <h3 className={`font-semibold ${color.split(' ')[0]} mb-1`}>{dept}</h3>
              <p className="text-3xl font-bold text-white">{d?.total ?? '—'}</p>
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span className="text-red-400">● {d?.Critical ?? 0} Critical</span>
                <span className="text-orange-400">● {d?.High ?? 0} High</span>
                <span className="text-yellow-400">● {d?.Medium ?? 0} Med</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleGenerateWeekly}
          disabled={planLoading || !summary?.total}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {planLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Generate Weekly Plan
        </button>
        <button
          onClick={handleGenerateMonthly}
          disabled={planLoading || !summary?.total}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          Generate Monthly Plan
        </button>
        {!summary?.total && (
          <p className="self-center text-slate-500 text-sm">↑ Generate synthetic data first</p>
        )}
      </div>

      {/* Recent Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">Recent Plans</h2>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Blocks (AI)</th>
                <th className="px-4 py-3">Tasks Scheduled</th>
                <th className="px-4 py-3">High-Priority %</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentPlans.slice(0, 10).map((plan) => (
                <tr key={plan.plan_id} className="border-t border-slate-700 hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => navigate(plan.plan_type === 'weekly' ? '/weekly-plan' : '/monthly-plan')}>
                  <td className="px-4 py-3 capitalize font-medium text-indigo-300">{plan.plan_type}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {plan.start_date} → {plan.end_date}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      plan.status === 'Approved' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-300'
                    }`}>{plan.status}</span>
                  </td>
                  <td className="px-4 py-3 text-white">{plan.stats?.total_blocks ?? '—'}</td>
                  <td className="px-4 py-3 text-white">{plan.stats?.total_tasks_scheduled ?? '—'}</td>
                  <td className="px-4 py-3 text-white">{plan.stats?.high_priority_scheduled_pct?.toFixed(1) ?? '—'}%</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(plan.created_at).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {recentPlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No plans yet. Generate synthetic data, then click "Generate Weekly Plan".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
