import React from 'react';
import { MaintenanceTask } from '../types';
import PriorityBadge from './PriorityBadge';

export default function TaskTable({ tasks }: { tasks: MaintenanceTask[] }) {
  return (
    <div className="overflow-x-auto bg-card rounded-lg border border-slate-800">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Task ID</th>
            <th className="px-4 py-3">Dept</th>
            <th className="px-4 py-3">Asset</th>
            <th className="px-4 py-3">Defect</th>
            <th className="px-4 py-3">Due Date</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.task_id} className="border-b border-slate-800 hover:bg-slate-800/20">
              <td className="px-4 py-3 font-mono text-xs text-slate-400">{task.task_id}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs
                  ${task.department === 'Engineering' ? 'bg-blue-500/20 text-blue-400' :
                    task.department === 'S&T' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-green-500/20 text-green-400'}`}>
                  {task.department}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300">{task.asset_id}</td>
              <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]" title={task.defect_type}>{task.defect_type}</td>
              <td className="px-4 py-3 text-slate-300">
                {new Date(task.due_date).toLocaleDateString()}
                {task.overdue_flag && (
                  <span className="ml-2 bg-red-500/20 text-red-500 text-[10px] px-1 py-0.5 rounded uppercase">Overdue</span>
                )}
              </td>
              <td className="px-4 py-3"><PriorityBadge score={task.priority_score} /></td>
              <td className="px-4 py-3 text-slate-400">{task.status}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No tasks found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
