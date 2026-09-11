import { useEffect, useState } from 'react';
import { taskApi, planApi } from '../api/client';
import KPICard from '../components/KPICard';
import { Activity, AlertTriangle, Calendar, Layers, RefreshCw, Map, ShieldCheck, ArrowRight, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plan } from '../types';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">SAMANVAY Operations Dashboard</h1>
            <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-status-blink" />
              Central Dispatch Live
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            समन्वय · AI-Powered Multi-Department Block Scheduling for Indian Railways
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateData}
            disabled={genLoading}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${genLoading ? 'animate-spin' : ''}`} />
            {genLoading ? 'Generating...' : 'Generate Synthetic Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tasks"
          value={summary?.total ?? '—'}
          subtitle={`${summary?.pending_count ?? 0} pending in backlog`}
          icon={<Activity />}
          colorClass="border-l-blue-500"
        />
        <KPICard
          title="Critical & Overdue"
          value={summary?.overdue_count ?? '—'}
          subtitle="Mandatory zero-drop constraints"
          icon={<AlertTriangle className="text-red-400" />}
          colorClass="border-l-red-500"
        />
        <KPICard
          title="Tasks Scheduled"
          value={latestPlan?.stats?.total_tasks_scheduled ?? '—'}
          subtitle="From latest block plan"
          icon={<Calendar />}
          colorClass="border-l-green-500"
        />
        <KPICard
          title="Multi-Dept Blocks"
          value={latestPlan?.stats?.merged_blocks ?? '—'}
          subtitle="Cross-department merges"
          icon={<Layers />}
          colorClass="border-l-purple-500"
        />
      </div>

      {/* Feature Highlights: Live Map & Corridor Health Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/live-map')}
          className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-5 cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Map className="w-20 h-20 text-indigo-400" />
          </div>
          <div className="relative z-10">
            <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              Interactive Geospatial Tracking
            </span>
            <h3 className="text-lg font-bold text-white mb-1">Live Train Network Map</h3>
            <p className="text-slate-400 text-xs mb-3 max-w-sm">
              Watch animated trains travel on 10 corridors across Central, South Central, Western & Northern Railway zones with real-time maintenance block overlays.
            </p>
            <div className="flex items-center gap-1 text-xs text-indigo-300 font-medium group-hover:translate-x-1 transition-transform">
              Open Live Train Map <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/corridors')}
          className="bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-5 cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <ShieldCheck className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="relative z-10">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Corridor Resilience & Safety
            </span>
            <h3 className="text-lg font-bold text-white mb-1">Corridor Health Monitor</h3>
            <p className="text-slate-400 text-xs mb-3 max-w-sm">
              Track maintenance risk scores, pending defect severity distributions, and block density health rings for each rail corridor.
            </p>
            <div className="flex items-center gap-1 text-xs text-emerald-300 font-medium group-hover:translate-x-1 transition-transform">
              View Health Metrics <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { dept: 'Engineering (TMS)', key: 'Engineering', color: 'text-blue-400 border-blue-500/30', bg: 'bg-blue-500/10' },
          { dept: 'S&T (SMMS)', key: 'S&T', color: 'text-orange-400 border-orange-500/30', bg: 'bg-orange-500/10' },
          { dept: 'TRD (TDMS)', key: 'TRD', color: 'text-green-400 border-green-500/30', bg: 'bg-green-500/10' },
        ].map(({ dept, key, color, bg }) => {
          const d = summary?.by_department?.[key];
          return (
            <motion.div
              key={dept}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl border ${color} ${bg}`}
            >
              <h3 className={`font-semibold ${color.split(' ')[0]} mb-1 text-sm`}>{dept}</h3>
              <p className="text-3xl font-black text-white">{d?.total ?? '—'}</p>
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span className="text-red-400">● {d?.Critical ?? 0} Critical</span>
                <span className="text-orange-400">● {d?.High ?? 0} High</span>
                <span className="text-yellow-400">● {d?.Medium ?? 0} Med</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap items-center">
        <button
          onClick={handleGenerateWeekly}
          disabled={planLoading || !summary?.total}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md"
        >
          {planLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Generate Weekly Plan (CP-SAT)
        </button>
        <button
          onClick={handleGenerateMonthly}
          disabled={planLoading || !summary?.total}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium border border-slate-700 transition-colors disabled:opacity-50 text-sm"
        >
          Generate Monthly Plan (30-Day)
        </button>
        {!summary?.total && (
          <p className="text-slate-500 text-sm">↑ Click "Generate Synthetic Data" to populate 450 defects</p>
        )}
      </div>

      {/* Recent Plans */}
      <div>
        <h2 className="text-lg font-bold mb-3 text-white">Recent Planning Batches</h2>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Planning Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Blocks (AI)</th>
                <th className="px-4 py-3">Tasks Scheduled</th>
                <th className="px-4 py-3">High-Priority %</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentPlans.slice(0, 10).map((plan) => (
                <tr
                  key={plan.plan_id}
                  className="border-t border-slate-700 hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => navigate(plan.plan_type === 'weekly' ? '/weekly-plan' : '/monthly-plan')}
                >
                  <td className="px-4 py-3 capitalize font-medium text-indigo-300">{plan.plan_type}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {plan.start_date} → {plan.end_date}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      plan.status === 'Approved' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-slate-700 text-slate-300'
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
                    No plans yet. Click "Generate Synthetic Data", then "Generate Weekly Plan".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
