import React, { useEffect, useState } from 'react';
import { planApi } from '../api/client';
import { Plan, ScheduledBlock, ComparisonResponse } from '../types';
import GanttChart from '../components/GanttChart';
import ComparisonView from '../components/ComparisonView';
import OverrideModal from '../components/OverrideModal';
import { Download, CheckCircle } from 'lucide-react';

export default function WeeklyPlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      // For demo, just generate a new one or fetch latest
      const res = await planApi.generateWeekly();
      setPlan(res.data);
      if (res.data.plan_id) {
        const compRes = await planApi.getComparison(res.data.plan_id);
        setComparison(compRes.data);
      }
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
      link.setAttribute('download', `weekly-plan-${plan.plan_id}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold">AI-Optimized Weekly Plan</h1>
          {plan && (
            <p className="text-slate-400 text-sm mt-1">
              {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-indigo-600 rounded-md text-white">
            <CheckCircle size={16} /> Approve Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Generating optimal plan...</div>
      ) : (
        <>
          {comparison && <ComparisonView data={comparison} />}
          {plan && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Block Schedule Gantt</h2>
              <GanttChart blocks={plan.scheduled_blocks} onBlockClick={setSelectedBlock} />
            </div>
          )}
        </>
      )}

      {selectedBlock && plan && (
        <OverrideModal
          block={selectedBlock}
          planId={plan.plan_id}
          onClose={() => setSelectedBlock(null)}
          onSuccess={() => {
            setSelectedBlock(null);
            // Re-fetch or update local state
          }}
        />
      )}
    </div>
  );
}
