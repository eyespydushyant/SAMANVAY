import { useEffect, useState } from 'react';
import { auditApi, configApi } from '../api/client';
import { History, Sliders, Save, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scoring weights state
  const [weights, setWeights] = useState({
    criticality_weight: 0.40,
    urgency_weight: 0.35,
    asset_risk_weight: 0.25,
  });
  const [weightsMsg, setWeightsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingWeights, setSavingWeights] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, weightsRes] = await Promise.all([
        auditApi.getOverrides(),
        configApi.getWeights(),
      ]);
      setLogs(logsRes.data || []);
      if (weightsRes.data) {
        setWeights({
          criticality_weight: weightsRes.data.criticality_weight ?? 0.40,
          urgency_weight: weightsRes.data.urgency_weight ?? 0.35,
          asset_risk_weight: weightsRes.data.asset_risk_weight ?? 0.25,
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalWeight = Math.round(
    (weights.criticality_weight + weights.urgency_weight + weights.asset_risk_weight) * 100
  );

  const handleSaveWeights = async () => {
    if (totalWeight !== 100) {
      setWeightsMsg({ type: 'error', text: `Weights must sum to 100% (currently ${totalWeight}%).` });
      return;
    }
    setSavingWeights(true);
    setWeightsMsg(null);
    try {
      const res = await configApi.updateWeights(weights);
      if (res.data?.error) {
        setWeightsMsg({ type: 'error', text: res.data.error });
      } else {
        setWeightsMsg({ type: 'success', text: 'Scoring weights successfully updated! Future block plans will reflect these weights.' });
        setTimeout(() => setWeightsMsg(null), 5000);
      }
    } catch (e) {
      setWeightsMsg({ type: 'error', text: 'Failed to update weights.' });
    }
    setSavingWeights(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Governance & Auditability</h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete audit trail of planner manual overrides and dynamic AI priority weight configuration
        </p>
      </div>

      {/* AI Scoring Weights Configuration */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">AI Prioritization Weight Configuration (FR6)</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Tune the relative importance of safety criticality, schedule urgency, and corridor traffic risk. Weights must sum to 100%.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-red-400">Criticality Weight</label>
              <span className="text-sm font-mono text-white">{Math.round(weights.criticality_weight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.criticality_weight}
              onChange={(e) => setWeights({ ...weights, criticality_weight: parseFloat(e.target.value) })}
              className="w-full accent-red-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Safety defect severity (e.g., rail fracture, OHE break)</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-orange-400">Urgency Weight</label>
              <span className="text-sm font-mono text-white">{Math.round(weights.urgency_weight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.urgency_weight}
              onChange={(e) => setWeights({ ...weights, urgency_weight: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Days until deadline or days overdue</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/80">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-blue-400">Asset Risk Weight</label>
              <span className="text-sm font-mono text-white">{Math.round(weights.asset_risk_weight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.asset_risk_weight}
              onChange={(e) => setWeights({ ...weights, asset_risk_weight: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">Corridor traffic density (daily train density)</p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-slate-700/60">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Sum of weights:</span>
            <span className={`font-mono font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
              {totalWeight}%
            </span>
            {totalWeight !== 100 && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Adjust to equal 100%
              </span>
            )}
          </div>
          <button
            onClick={handleSaveWeights}
            disabled={savingWeights || totalWeight !== 100}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Save size={16} /> {savingWeights ? 'Saving...' : 'Update AI Weights'}
          </button>
        </div>

        {weightsMsg && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            weightsMsg.type === 'success' ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}>
            {weightsMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {weightsMsg.text}
          </div>
        )}
      </div>

      {/* Manual Override Audit Log */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Manual Override History (FR17)</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No block overrides logged yet. Overrides made from the Weekly Gantt view will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Block ID</th>
                  <th className="px-4 py-3">Operator / Planner</th>
                  <th className="px-4 py-3">Original Window</th>
                  <th className="px-4 py-3">New Window</th>
                  <th className="px-4 py-3">Rationale / Reason</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id} className="border-t border-slate-700/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{log.log_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300">Block #{log.block_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{log.changed_by}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {log.old_start ? new Date(log.old_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} –{' '}
                      {log.old_end ? new Date(log.old_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-green-400 text-xs font-semibold">
                      {log.new_start ? new Date(log.new_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} –{' '}
                      {log.new_end ? new Date(log.new_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[240px] truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
