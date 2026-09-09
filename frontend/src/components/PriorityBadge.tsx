import React from 'react';

export default function PriorityBadge({ score }: { score: number }) {
  let color = 'bg-slate-500/20 text-slate-400';
  let label = 'Low';

  if (score >= 80) {
    color = 'bg-red-500/20 text-red-400';
    label = 'Critical';
  } else if (score >= 60) {
    color = 'bg-orange-500/20 text-orange-400';
    label = 'High';
  } else if (score >= 40) {
    color = 'bg-yellow-500/20 text-yellow-400';
    label = 'Medium';
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label} ({score})
    </span>
  );
}
