import { useEffect, useState, useMemo } from 'react';
import { planApi } from '../api/client';
import { Plan, ScheduledBlock } from '../types';
import { Download, CheckCircle, CalendarDays, Layers, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonthlyPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCorridor, setSelectedCorridor] = useState('');
  const [approvedMsg, setApprovedMsg] = useState('');

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await planApi.generateMonthly();
      setPlan(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleExport = async () => {
    if (!plan) return;
    try {
      const res = await planApi.exportCsv(plan.plan_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly-plan-${plan.plan_id}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    try {
      await planApi.approve(plan.plan_id, 'Chief Operations Manager');
      setPlan({ ...plan, status: 'Approved', approved_by: 'Chief Operations Manager' });
      setApprovedMsg('Plan successfully approved by Chief Operations Manager');
      setTimeout(() => setApprovedMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Compute blocks per corridor for visualization
  const corridorStats = useMemo(() => {
    if (!plan?.scheduled_blocks) return [];
    const counts: Record<string, { name: string; blocks: number; merged: number }> = {};
    plan.scheduled_blocks.forEach((b: ScheduledBlock) => {
      const key = b.corridor_id;
      if (!counts[key]) {
        counts[key] = { name: b.corridor_name || key, blocks: 0, merged: 0 };
      }
      counts[key].blocks += 1;
      if (b.departments_involved && b.departments_involved.length > 1) {
        counts[key].merged += 1;
      }
    });
    return Object.values(counts);
  }, [plan]);

  const filteredBlocks = useMemo(() => {
    if (!plan?.scheduled_blocks) return [];
    if (!selectedCorridor) return plan.scheduled_blocks;
    return plan.scheduled_blocks.filter((b) => b.corridor_id === selectedCorridor);
  }, [plan, selectedCorridor]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Monthly Block Plan (30-Day Rolling)</h1>
            {plan && (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                plan.status === 'Approved' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-slate-700 text-slate-300'
              }`}>
                {plan.status}
              </span>
            )}
          </div>
          {plan && (
            <p className="text-slate-400 text-sm mt-1">
              Planning Horizon: {plan.start_date} → {plan.end_date}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={!plan || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-200 text-sm transition-colors disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={handleApprove}
            disabled={!plan || loading || plan.status === 'Approved'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle size={16} /> {plan?.status === 'Approved' ? 'Approved' : 'Approve Plan'}
          </button>
        </div>
      </div>

      {approvedMsg && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 p-3 rounded-lg text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          {approvedMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 text-slate-400">
          <CalendarDays className="w-10 h-10 mx-auto text-indigo-400 animate-pulse mb-3" />
          Generating 30-day AI-optimized block plan with OR-Tools...
        </div>
      ) : plan ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg border-l-4 border-l-blue-500">
              <span className="text-xs text-slate-400 uppercase font-medium">Total 30-Day Blocks</span>
              <p className="text-2xl font-bold text-white mt-1">{plan.stats.total_blocks}</p>
              <span className="text-xs text-slate-500">{plan.stats.total_tasks_scheduled} tasks addressed</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg border-l-4 border-l-purple-500">
              <span className="text-xs text-slate-400 uppercase font-medium">Multi-Dept Merged</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{plan.stats.merged_blocks}</p>
              <span className="text-xs text-purple-300">Coordinated cross-department windows</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg border-l-4 border-l-green-500">
              <span className="text-xs text-slate-400 uppercase font-medium">High-Priority Scheduled</span>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {plan.stats.high_priority_scheduled_pct?.toFixed(1) ?? '100'}%
              </p>
              <span className="text-xs text-green-300">Safety constraints strictly met</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg border-l-4 border-l-orange-500">
              <span className="text-xs text-slate-400 uppercase font-medium">Corridor Downtime</span>
              <p className="text-2xl font-bold text-orange-400 mt-1">{plan.stats.total_downtime_hours} hrs</p>
              <span className="text-xs text-slate-500">Across 10 corridors</span>
            </div>
          </div>

          {/* Corridor Distribution Bar Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Corridor Block Density (30 Days)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corridorStats} margin={{ top: 10, right: 10, bottom: 25, left: 0 }}>
                  <XAxis dataKey="name" stroke="#94A3B8" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Bar dataKey="blocks" fill="#6366F1" name="Total Blocks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="merged" fill="#A855F7" name="Merged Blocks" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Block Schedule Browser */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-wrap gap-3">
              <h3 className="text-lg font-bold text-white">Scheduled Maintenance Windows</h3>
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Corridors ({plan.scheduled_blocks?.length})</option>
                {Array.from(new Set(plan.scheduled_blocks?.map((b) => b.corridor_id) || [])).map((cid) => (
                  <option key={cid} value={cid}>
                    {plan.scheduled_blocks.find((b) => b.corridor_id === cid)?.corridor_name || cid}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-400 uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Block ID</th>
                    <th className="px-4 py-3">Corridor</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time Window</th>
                    <th className="px-4 py-3">Departments</th>
                    <th className="px-4 py-3">Tasks</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlocks.map((block) => (
                    <tr key={block.block_id} className="border-t border-slate-700/60 hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">#{block.block_id}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{block.corridor_name}</td>
                      <td className="px-4 py-3 text-slate-300">{block.block_date}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(block.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(block.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {block.departments_involved?.map((dept) => (
                            <span
                              key={dept}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                dept === 'Engineering'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : dept === 'S&T'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-semibold">{block.tasks?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded text-xs font-medium">
                          {block.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
