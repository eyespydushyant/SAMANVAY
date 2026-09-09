import { useState, useEffect, useMemo } from 'react';
import { taskApi } from '../api/client';
import { MaintenanceTask } from '../types';
import TaskTable from '../components/TaskTable';
import { Search, AlertCircle, Filter } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (selectedDept) params.department = selectedDept;
      if (selectedSeverity) params.severity = selectedSeverity;
      if (overdueOnly) params.overdue = true;
      const res = await taskApi.list(params);
      setTasks(res.data?.tasks ?? []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDept, selectedSeverity, overdueOnly]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.asset_id?.toLowerCase().includes(q) ||
        t.defect_type?.toLowerCase().includes(q) ||
        t.corridor_name?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">All Maintenance Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulated defect feeds across TMS (Track), SMMS (S&T), and TDMS (TRD)
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          Showing {filteredTasks.length} tasks
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-400 text-sm mr-1">
            <Filter className="w-4 h-4 text-slate-400" />
            Filters:
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering (Track)</option>
            <option value="S&T">S&T (Signals)</option>
            <option value="TRD">TRD (Traction)</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-900">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700"
            />
            <span>Overdue only</span>
          </label>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search asset, defect, corridor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading tasks...</div>
      ) : (
        <TaskTable tasks={filteredTasks} />
      )}
    </div>
  );
}
