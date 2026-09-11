import { useEffect, useState } from 'react';
import { taskApi, planApi } from '../api/client';
import KPICard from '../components/KPICard';
import { Activity, AlertTriangle, Calendar, Layers, RefreshCw, Map, ShieldCheck, ArrowRight, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plan } from '../types';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

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
            <h1 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              SAMANVAY Operations Dashboard
            </h1>
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-status-blink" />
              Central Dispatch Live
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            समन्वय · AI-Powered Multi-Department Block Scheduling for Indian Railways
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateData}
            disabled={genLoading}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 border text-xs font-bold transition-all disabled:opacity-50 ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${genLoading ? 'animate-spin' : ''}`} />
            {genLoading ? 'Generating...' : 'Generate Synthetic Defects (450)'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tasks"
          value={summary?.total ?? '—'}
          subtitle={`${summary?.pending_count ?? 0} pending in backlog`}
          icon={<Activity className="w-5 h-5" />}
          colorClass="border-l-blue-600"
        />
        <KPICard
          title="Critical & Overdue"
          value={summary?.overdue_count ?? '—'}
          subtitle="Mandatory zero-drop constraints"
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          colorClass="border-l-rose-600"
        />
        <KPICard
          title="Tasks Scheduled"
          value={latestPlan?.stats?.total_tasks_scheduled ?? '—'}
          subtitle="From latest block plan"
          icon={<Calendar className="w-5 h-5 text-emerald-500" />}
          colorClass="border-l-emerald-600"
        />
        <KPICard
          title="Multi-Dept Blocks"
          value={latestPlan?.stats?.merged_blocks ?? '—'}
          subtitle="Cross-department merges"
          icon={<Layers className="w-5 h-5 text-amber-500" />}
          colorClass="border-l-amber-500"
        />
      </div>

      {/* Feature Highlights: Live Map & Corridor Health Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Train Map Banner */}
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/live-map')}
          className={`rounded-2xl p-5 cursor-pointer relative overflow-hidden group shadow-md border transition-all ${
            isLight
              ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border-blue-200 hover:border-blue-400'
              : isIR
              ? 'bg-gradient-to-r from-[#172640] to-[#121B2A] border-amber-500/30 hover:border-amber-400/50'
              : 'bg-gradient-to-r from-indigo-950/70 to-slate-900 border-indigo-500/30 hover:border-indigo-500/60'
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition-opacity">
            <Map className={`w-24 h-24 ${isLight ? 'text-blue-700' : 'text-indigo-400'}`} />
          </div>
          <div className="relative z-10">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-blue-700' : 'text-indigo-400'
            }`}>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time Geospatial Tracking
            </span>
            <h3 className={`text-lg font-black mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Live Train Network Map
            </h3>
            <p className={`text-xs mb-3 max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Watch animated trains travel on 10 corridors across Central, South Central, Western & Northern Railway zones with real-time maintenance block overlays.
            </p>
            <div className={`flex items-center gap-1 text-xs font-bold group-hover:translate-x-1.5 transition-transform ${
              isLight ? 'text-blue-700' : 'text-indigo-300'
            }`}>
              Open Live Train Map <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>

        {/* Corridor Health Banner */}
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => navigate('/corridors')}
          className={`rounded-2xl p-5 cursor-pointer relative overflow-hidden group shadow-md border transition-all ${
            isLight
              ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-emerald-200 hover:border-emerald-400'
              : isIR
              ? 'bg-gradient-to-r from-[#172D24] to-[#112019] border-emerald-500/30 hover:border-emerald-400/50'
              : 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/30 hover:border-emerald-500/60'
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition-opacity">
            <ShieldCheck className={`w-24 h-24 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          </div>
          <div className="relative z-10">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              Corridor Resilience & Safety
            </span>
            <h3 className={`text-lg font-black mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Corridor Health Monitor
            </h3>
            <p className={`text-xs mb-3 max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Track maintenance risk scores, pending defect severity distributions, and block density health rings for each rail corridor.
            </p>
            <div className={`flex items-center gap-1 text-xs font-bold group-hover:translate-x-1.5 transition-transform ${
              isLight ? 'text-emerald-700' : 'text-emerald-300'
            }`}>
              View Health Metrics <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { dept: 'Track Engineering (TMS)', key: 'Engineering', color: 'text-blue-600', border: 'border-blue-500/30', bg: isLight ? 'bg-blue-50/50' : 'bg-blue-500/10' },
          { dept: 'Signaling & Telecom (SMMS)', key: 'S&T', color: 'text-amber-600', border: 'border-amber-500/30', bg: isLight ? 'bg-amber-50/50' : 'bg-amber-500/10' },
          { dept: 'Traction Distribution (TDMS)', key: 'TRD', color: 'text-emerald-600', border: 'border-emerald-500/30', bg: isLight ? 'bg-emerald-50/50' : 'bg-emerald-500/10' },
        ].map(({ dept, key, color, border, bg }) => {
          const d = summary?.by_department?.[key];
          return (
            <motion.div
              key={dept}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={`p-5 rounded-2xl border ${border} ${bg} shadow-sm transition-all`}
            >
              <h3 className={`font-bold ${color} mb-1 text-xs uppercase tracking-wider`}>{dept}</h3>
              <p className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{d?.total ?? '—'}</p>
              <div className="flex gap-3 mt-3 text-xs font-semibold">
                <span className="text-rose-600">● {d?.Critical ?? 0} Critical</span>
                <span className="text-amber-600">● {d?.High ?? 0} High</span>
                <span className="text-blue-600">● {d?.Medium ?? 0} Med</span>
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-xs shadow-md"
        >
          {planLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Generate Weekly Plan (OR-Tools CP-SAT)
        </button>
        <button
          onClick={handleGenerateMonthly}
          disabled={planLoading || !summary?.total}
          className={`px-6 py-3 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs shadow-sm ${
            isLight
              ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
          }`}
        >
          Generate Monthly Macro Plan (30-Day)
        </button>
        {!summary?.total && (
          <p className="text-slate-500 text-xs font-medium">↑ Click "Generate Synthetic Defects" to populate database</p>
        )}
      </div>

      {/* Recent Plans Table */}
      <div>
        <h2 className={`text-lg font-black mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Recent Planning Batches
        </h2>
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <table className="w-full text-xs text-left">
            <thead className={`uppercase font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-slate-800 text-slate-400'
            }`}>
              <tr>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Planning Period</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Blocks (AI)</th>
                <th className="px-5 py-3.5">Tasks Scheduled</th>
                <th className="px-5 py-3.5">Safety Priority %</th>
                <th className="px-5 py-3.5">Created At</th>
              </tr>
            </thead>
            <tbody>
              {recentPlans.slice(0, 10).map((plan) => (
                <tr
                  key={plan.plan_id}
                  className={`border-t transition-colors cursor-pointer ${
                    isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-800 hover:bg-slate-800/40'
                  }`}
                  onClick={() => navigate(plan.plan_type === 'weekly' ? '/weekly-plan' : '/monthly-plan')}
                >
                  <td className="px-5 py-3.5 capitalize font-black text-blue-600">{plan.plan_type}</td>
                  <td className={`px-5 py-3.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {plan.start_date} → {plan.end_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      plan.status === 'Approved'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {plan.stats?.total_blocks ?? '—'}
                  </td>
                  <td className={`px-5 py-3.5 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {plan.stats?.total_tasks_scheduled ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">
                    {plan.stats?.high_priority_scheduled_pct?.toFixed(1) ?? '—'}%
                  </td>
                  <td className={`px-5 py-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(plan.created_at).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {recentPlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">
                    No plans yet. Click "Generate Synthetic Defects", then "Generate Weekly Plan".
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
