import React from 'react';
import { ComparisonResponse } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function ComparisonView({ data }: { data: ComparisonResponse }) {
  const { optimized, baseline, improvements } = data;

  const chartData = [
    { name: 'Total Blocks',  Baseline: baseline.total_blocks,         Optimized: optimized.total_blocks },
    { name: 'Downtime (h)',  Baseline: baseline.total_downtime_hours,  Optimized: optimized.total_downtime_hours },
    { name: 'HP Sched %',   Baseline: baseline.high_priority_scheduled_pct, Optimized: optimized.high_priority_scheduled_pct },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-6 text-white">
        📊 Baseline vs AI-Optimized Comparison
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Metrics */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 text-xs text-slate-400 uppercase pb-2 border-b border-slate-700">
            <span>Metric</span>
            <span className="text-center">🔴 Baseline</span>
            <span className="text-center">🟢 AI-Optimized</span>
          </div>
          {[
            { label: 'Total Blocks',      base: baseline.total_blocks,              opt: optimized.total_blocks,              delta: `-${improvements.blocks_reduction_pct}%`,   good: true  },
            { label: 'Downtime (hrs)',    base: baseline.total_downtime_hours,       opt: optimized.total_downtime_hours,       delta: `-${improvements.downtime_reduction_pct}%`, good: true  },
            { label: 'Multi-Dept Blocks', base: baseline.merged_blocks,             opt: optimized.merged_blocks,             delta: `+${improvements.merged_blocks_gained}`,    good: false },
            { label: 'High-Pri % Sched', base: `${baseline.high_priority_scheduled_pct}%`, opt: `${optimized.high_priority_scheduled_pct}%`, delta: `+${improvements.hp_coverage_gain_pct}%`, good: false },
          ].map(({ label, base, opt, delta, good }) => (
            <div key={label} className="grid grid-cols-3 items-center py-2 border-b border-slate-700/50 text-sm">
              <span className="text-slate-400">{label}</span>
              <span className="text-center text-slate-500 line-through">{base}</span>
              <div className="text-center">
                <span className="font-bold text-white">{opt}</span>
                <span className={`ml-2 text-xs ${good ? 'text-green-400' : 'text-purple-400'}`}>{delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                itemStyle={{ color: '#F8FAFC' }}
              />
              <Legend />
              <Bar dataKey="Baseline"  fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Optimized" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
