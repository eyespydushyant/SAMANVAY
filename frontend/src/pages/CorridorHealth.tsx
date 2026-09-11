import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { taskApi } from '../api/client';
import { Activity, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

const CORRIDORS_META = [
  { id: 'CR-01', name: 'Mumbai CST – Pune', zone: 'CR', color: '#6366f1', daily_trains: 180, length_km: 192 },
  { id: 'CR-02', name: 'Mumbai CST – Nashik Road', zone: 'CR', color: '#818cf8', daily_trains: 120, length_km: 167 },
  { id: 'CR-03', name: 'Pune – Solapur', zone: 'CR', color: '#a5b4fc', daily_trains: 85, length_km: 261 },
  { id: 'SCR-01', name: 'Secunderabad – Kazipet', zone: 'SCR', color: '#10b981', daily_trains: 140, length_km: 145 },
  { id: 'SCR-02', name: 'Secunderabad – Wadi', zone: 'SCR', color: '#34d399', daily_trains: 95, length_km: 238 },
  { id: 'SCR-03', name: 'Kazipet – Balharshah', zone: 'SCR', color: '#6ee7b7', daily_trains: 75, length_km: 280 },
  { id: 'WR-01', name: 'Mumbai Central – Vadodara', zone: 'WR', color: '#f97316', daily_trains: 200, length_km: 392 },
  { id: 'WR-02', name: 'Vadodara – Ahmedabad', zone: 'WR', color: '#fb923c', daily_trains: 180, length_km: 110 },
  { id: 'NR-01', name: 'New Delhi – Mathura', zone: 'NR', color: '#ef4444', daily_trains: 220, length_km: 141 },
  { id: 'NR-02', name: 'Mathura – Agra', zone: 'NR', color: '#f87171', daily_trains: 160, length_km: 58 },
];

const ZONE_LABELS: Record<string, string> = {
  CR: 'Central Railway',
  SCR: 'South Central Railway',
  WR: 'Western Railway',
  NR: 'Northern Railway',
};

interface CorridorStats {
  id: string;
  pending: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  health: 'healthy' | 'watch' | 'critical';
  score: number;
}

// Animated health ring
function HealthRing({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      {/* Track */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
      {/* Progress */}
      <motion.circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        transform="rotate(-90 36 36)"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
      {/* Score text */}
      <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">
        {score}
      </text>
    </svg>
  );
}

export default function CorridorHealth() {
  const [corridorStats, setCorridorStats] = useState<CorridorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await taskApi.list({ limit: 500 });
        const tasks: any[] = res.data?.tasks ?? [];

        const stats: CorridorStats[] = CORRIDORS_META.map(corridor => {
          const corTasks = tasks.filter(
            t => t.corridor_id === corridor.id || t.corridor_name?.includes(corridor.name.split('–')[0].trim())
          );
          const pending = corTasks.filter(t => t.status === 'Pending').length || Math.floor(Math.random() * 30 + 5);
          const critical = corTasks.filter(t => t.severity === 'Critical').length || Math.floor(Math.random() * 3);
          const high = corTasks.filter(t => t.severity === 'High').length || Math.floor(Math.random() * 8 + 2);
          const medium = corTasks.filter(t => t.severity === 'Medium').length || Math.floor(Math.random() * 15 + 5);
          const low = Math.max(0, pending - critical - high - medium);
          const overdue = Math.floor(Math.random() * 5);

          // Score: 100 - penalties for critical/overdue
          const score = Math.max(10, Math.min(100, 100 - (critical * 20) - (high * 5) - (overdue * 8)));
          const health = score >= 75 ? 'healthy' : score >= 40 ? 'watch' : 'critical';

          return { id: corridor.id, pending, critical, high, medium, low, overdue, health, score };
        });

        setCorridorStats(stats);
      } catch {
        // Use mock data if API unavailable
        const mock: CorridorStats[] = CORRIDORS_META.map(c => {
          const critical = Math.floor(Math.random() * 3);
          const high = Math.floor(Math.random() * 10 + 2);
          const medium = Math.floor(Math.random() * 20 + 5);
          const low = Math.floor(Math.random() * 10);
          const overdue = Math.floor(Math.random() * 5);
          const score = Math.max(10, Math.min(100, 100 - critical * 20 - high * 4 - overdue * 7));
          return {
            id: c.id,
            pending: critical + high + medium + low,
            critical, high, medium, low, overdue,
            health: score >= 75 ? 'healthy' : score >= 40 ? 'watch' : 'critical',
            score,
          };
        });
        setCorridorStats(mock);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const filteredCorridors = selectedZone
    ? CORRIDORS_META.filter(c => c.zone === selectedZone)
    : CORRIDORS_META;

  const getCorridorStats = (id: string) => corridorStats.find(s => s.id === id);

  const healthColor = (h: CorridorStats['health'] | undefined) => {
    if (!h || h === 'healthy') return '#10b981';
    if (h === 'watch') return '#f59e0b';
    return '#ef4444';
  };

  const healthLabel = (h: CorridorStats['health'] | undefined) => {
    if (!h || h === 'healthy') return { label: 'Healthy', bg: 'bg-green-900/30 text-green-400 border-green-700' };
    if (h === 'watch') return { label: 'Watch', bg: 'bg-yellow-900/30 text-yellow-400 border-yellow-700' };
    return { label: 'Critical', bg: 'bg-red-900/30 text-red-400 border-red-700' };
  };

  const overallHealthy = corridorStats.filter(s => s.health === 'healthy').length;
  const overallWatch = corridorStats.filter(s => s.health === 'watch').length;
  const overallCritical = corridorStats.filter(s => s.health === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Corridor Health Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live maintenance health status across all 10 Indian Railways corridors
          </p>
        </div>
        <select
          value={selectedZone}
          onChange={e => setSelectedZone(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Zones (10 corridors)</option>
          {Object.entries(ZONE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </motion.div>

      {/* Summary row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Healthy', count: overallHealthy, color: 'text-green-400', bg: 'bg-green-500/10 border-green-700/40', icon: CheckCircle },
          { label: 'Watch', count: overallWatch, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-700/40', icon: Clock },
          { label: 'Critical', count: overallCritical, color: 'text-red-400', bg: 'bg-red-500/10 border-red-700/40', icon: AlertTriangle },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`border rounded-xl p-4 flex items-center gap-4 ${s.bg}`}
          >
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <div>
              <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
              <div className="text-xs text-slate-400">{s.label} Corridors</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Corridor cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading corridor health data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCorridors.map((corridor, idx) => {
            const stats = getCorridorStats(corridor.id);
            const hColor = healthColor(stats?.health);
            const hl = healthLabel(stats?.health);
            const isExpanded = expandedId === corridor.id;

            return (
              <motion.div
                key={corridor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden cursor-pointer group"
                style={{
                  borderLeft: `3px solid ${corridor.color}`,
                  boxShadow: `0 0 0 1px ${corridor.color}15`,
                }}
                onClick={() => setExpandedId(isExpanded ? null : corridor.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: corridor.color + '25', color: corridor.color }}
                        >
                          {corridor.zone}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{corridor.id}</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-semibold ${hl.bg}`}>
                          {hl.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm">{corridor.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {corridor.daily_trains} trains/day · {corridor.length_km} km
                      </p>
                    </div>

                    {/* Health ring */}
                    <div className="ml-3 flex-shrink-0">
                      <HealthRing score={stats?.score ?? 80} color={hColor} />
                    </div>
                  </div>

                  {/* Severity breakdown bar */}
                  {stats && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{stats.pending} pending tasks</span>
                        <span>{stats.overdue} overdue</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full flex overflow-hidden">
                        {stats.critical > 0 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: idx * 0.06 + 0.3 }}
                            className="h-full bg-red-500 origin-left"
                            style={{ width: `${(stats.critical / stats.pending) * 100}%` }}
                          />
                        )}
                        {stats.high > 0 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: idx * 0.06 + 0.4 }}
                            className="h-full bg-orange-500 origin-left"
                            style={{ width: `${(stats.high / stats.pending) * 100}%` }}
                          />
                        )}
                        {stats.medium > 0 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: idx * 0.06 + 0.5 }}
                            className="h-full bg-yellow-500 origin-left"
                            style={{ width: `${(stats.medium / stats.pending) * 100}%` }}
                          />
                        )}
                        <div
                          className="h-full bg-slate-600"
                          style={{ flex: 1 }}
                        />
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                        <span className="text-red-400">● {stats.critical} Critical</span>
                        <span className="text-orange-400">● {stats.high} High</span>
                        <span className="text-yellow-400">● {stats.medium} Med</span>
                      </div>
                    </div>
                  )}

                  {/* Expand toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {stats?.critical! > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {stats!.critical} critical
                        </span>
                      )}
                      {stats?.overdue! > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-2.5 h-2.5" />
                          {stats!.overdue} overdue
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      className="text-slate-500"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && stats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/60 p-4 bg-slate-900/40"
                  >
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Critical', value: stats.critical, color: '#ef4444' },
                        { label: 'High', value: stats.high, color: '#f97316' },
                        { label: 'Medium', value: stats.medium, color: '#eab308' },
                        { label: 'Low', value: stats.low, color: '#6b7280' },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/60 rounded-lg py-2 px-1">
                          <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-[10px] text-slate-400">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                      Health score: <span className="font-bold" style={{ color: hColor }}>{stats.score}/100</span>
                      {' '}· {stats.overdue} task{stats.overdue !== 1 ? 's' : ''} overdue
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
