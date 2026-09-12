import { useEffect, useState, useRef } from 'react';
import { taskApi, planApi } from '../api/client';
import KPICard from '../components/KPICard';
import {
  Activity, AlertTriangle, Calendar, Layers, RefreshCw, Map,
  ShieldCheck, ArrowRight, Radio, Zap, TrendingUp, Users, Train,
  Database, Cpu, ChevronRight, Star, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Plan } from '../types';
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || typeof value !== 'number') return;
    let start = 0;
    const end = value;
    if (end === 0) return;
    const duration = 900;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {typeof value === 'number' ? display : value}
      {suffix}
    </span>
  );
}

// ─── Indian Railways Stat Cards ────────────────────────────────────────────────
const IR_FACTS = [
  { icon: '🚂', label: 'Route Km', value: '68,103', sub: 'Largest rail network in Asia' },
  { icon: '🛤️', label: 'Track Km', value: '1,26,366', sub: 'Total track including sidings' },
  { icon: '🚉', label: 'Stations', value: '7,349', sub: 'Across India' },
  { icon: '👷', label: 'Employees', value: '14 Lakh', sub: 'World\'s largest employer' },
];

// ─── Moving Track Animation CSS ────────────────────────────────────────────────
const TrackAnimation = ({ isLight }: { isLight: boolean }) => (
  <div className="relative overflow-hidden h-10 rounded-xl" style={{ background: isLight ? '#f1f5f9' : '#0f172a' }}>
    <svg className="absolute inset-0 w-[200%] h-full" style={{ animation: 'slide-track 3s linear infinite' }}>
      {/* Rails */}
      <line x1="0" y1="30%" x2="200%" y2="30%" stroke={isLight ? '#94a3b8' : '#334155'} strokeWidth="2" />
      <line x1="0" y1="70%" x2="200%" y2="70%" stroke={isLight ? '#94a3b8' : '#334155'} strokeWidth="2" />
      {/* Sleepers */}
      {Array.from({ length: 40 }).map((_, i) => (
        <rect key={i} x={`${i * 5}%`} y="15%" width="2.5%" height="70%" fill={isLight ? '#cbd5e1' : '#1e293b'} rx="1" />
      ))}
      {/* Train car */}
      <rect x="10%" y="5%" width="15%" height="90%" rx="4" fill="#FF9933" opacity="0.9" />
      <rect x="10%" y="5%" width="15%" height="25%" rx="2" fill="#FFFFFF" opacity="0.4" />
      <circle cx="14%" cy="95%" r="4%" fill="#1e293b" />
      <circle cx="22%" cy="95%" r="4%" fill="#1e293b" />
    </svg>
    <style>{`@keyframes slide-track { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
  </div>
);

export default function Dashboard() {
  const { theme } = useTheme();
  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

  const [genLoading, setGenLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [recentPlans, setRecentPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState(false);
  const [currentFact, setCurrentFact] = useState(0);
  const [clock, setClock] = useState(new Date());
  const navigate = useNavigate();

  // Rotating IR facts ticker
  useEffect(() => {
    const t = setInterval(() => setCurrentFact(f => (f + 1) % IR_FACTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
      setError('Backend not reachable. Make sure the API server is running on port 8000.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerateData = async () => {
    setGenLoading(true);
    setError(null);
    setGenSuccess(false);
    try {
      await taskApi.generate();
      await loadData();
      setGenSuccess(true);
      setTimeout(() => setGenSuccess(false), 4000);
    } catch (e: any) {
      setError('Failed to generate data. Make sure backend is running on port 8000.');
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── HERO HEADER with IR maintenance image ──────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className={`relative overflow-hidden rounded-3xl border shadow-lg ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}
        style={{ minHeight: 200 }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/assets/ir-track-maintenance.jpg"
            alt="Indian Railways Track Maintenance"
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${
            isLight
              ? 'bg-gradient-to-r from-white/95 via-white/85 to-transparent'
              : isIR
              ? 'bg-gradient-to-r from-[#0B1728]/97 via-[#0B1728]/90 to-[#0B1728]/30'
              : 'bg-gradient-to-r from-slate-950/97 via-slate-950/90 to-slate-950/40'
          }`} />
        </div>

        {/* Tricolor top border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 ir-tricolor-bar" />

        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* Live badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold mb-3"
            >
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Central Dispatch · LIVE
              <span className={`ml-1 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
              </span>
            </motion.div>

            <motion.h1
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}
            >
              SAMANVAY{' '}
              <span className="text-amber-500">समन्वय</span>
            </motion.h1>
            <p className={`text-sm max-w-lg leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              AI-Powered Multi-Department Block Scheduling for Indian Railways ·
              Unifying <strong>TMS + SMMS + TDMS</strong> across 10 high-density corridors
            </p>

            {/* Rotating IR Facts ticker */}
            <div className="mt-4 h-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFact}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-lg">{IR_FACTS[currentFact].icon}</span>
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                    Indian Railways · {IR_FACTS[currentFact].label}:
                  </span>
                  <span className="text-amber-500 font-black">{IR_FACTS[currentFact].value}</span>
                  <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'}`}>— {IR_FACTS[currentFact].sub}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 shrink-0">
            <motion.button
              onClick={handleGenerateData}
              disabled={genLoading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`relative px-5 py-3 rounded-xl flex items-center gap-2 border text-xs font-bold transition-all disabled:opacity-60 shadow-md overflow-hidden ${
                isLight
                  ? 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-600'
              }`}
            >
              {/* shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: genLoading ? '200%' : '-100%' }}
                transition={{ duration: 1, repeat: genLoading ? Infinity : 0 }}
              />
              <Database className={`w-4 h-4 ${genLoading ? 'animate-spin' : ''}`} />
              {genLoading ? 'Generating 450 defects...' : '⚡ Generate Synthetic Defects (450)'}
            </motion.button>

            {/* Success toast */}
            <AnimatePresence>
              {genSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5" />
                  450 maintenance defects generated across 10 corridors!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ─── ERROR BANNER ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-600 p-4 rounded-xl text-xs font-semibold flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Backend Connection Error</p>
              <p>{error}</p>
              <button onClick={loadData} className="mt-2 underline font-bold">Retry Connection →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KPI CARDS ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Tasks',
            value: summary?.total ?? '—',
            subtitle: `${summary?.pending_count ?? 0} pending in backlog`,
            icon: <Activity className="w-5 h-5" />,
            colorClass: 'border-l-blue-600',
            bg: isLight ? 'bg-blue-50/40' : 'bg-blue-500/5',
          },
          {
            title: 'Critical & Overdue',
            value: summary?.overdue_count ?? '—',
            subtitle: 'Zero-drop safety constraints',
            icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
            colorClass: 'border-l-rose-600',
            bg: isLight ? 'bg-rose-50/40' : 'bg-rose-500/5',
          },
          {
            title: 'Tasks Scheduled',
            value: latestPlan?.stats?.total_tasks_scheduled ?? '—',
            subtitle: 'From latest block plan',
            icon: <Calendar className="w-5 h-5 text-emerald-500" />,
            colorClass: 'border-l-emerald-600',
            bg: isLight ? 'bg-emerald-50/40' : 'bg-emerald-500/5',
          },
          {
            title: 'Multi-Dept Blocks',
            value: latestPlan?.stats?.merged_blocks ?? '—',
            subtitle: 'Cross-department merges',
            icon: <Layers className="w-5 h-5 text-amber-500" />,
            colorClass: 'border-l-amber-500',
            bg: isLight ? 'bg-amber-50/40' : 'bg-amber-500/5',
          },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <KPICard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {/* ─── IR STATS RIBBON ────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className={`grid grid-cols-2 md:grid-cols-4 gap-3`}
      >
        {[
          { icon: '🏔️', label: 'AI Block Reduction', value: '68.9%', color: 'text-blue-500', detail: 'vs manual siloed scheduling' },
          { icon: '⚡', label: 'CP-SAT Optimizer', value: '30s', color: 'text-amber-500', detail: 'constraint programming solve time' },
          { icon: '🛡️', label: 'Safety Coverage', value: '100%', color: 'text-emerald-500', detail: 'critical tasks never dropped' },
          { icon: '🚆', label: 'Active Corridors', value: '10', color: 'text-rose-500', detail: 'CR · SCR · WR · NR zones' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            whileHover={{ y: -2 }}
            className={`p-4 rounded-2xl border text-center ${
              isLight
                ? 'bg-white border-slate-200 shadow-sm'
                : isIR
                ? 'bg-[#121E33] border-slate-700/60'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className={`text-[11px] font-bold mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{stat.label}</div>
            <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{stat.detail}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── FEATURE BANNERS ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Train Map */}
        <motion.div
          whileHover={{ scale: 1.02, y: -3 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
          onClick={() => navigate('/live-map')}
          className={`rounded-2xl p-6 cursor-pointer relative overflow-hidden group shadow-md border transition-all ${
            isLight
              ? 'bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white border-blue-200 hover:border-blue-400 hover:shadow-blue-200/50 hover:shadow-lg'
              : isIR
              ? 'bg-gradient-to-br from-[#172640] to-[#0D1626] border-amber-500/30 hover:border-amber-400/60'
              : 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/30 hover:border-indigo-500/70'
          }`}
        >
          {/* Animated background pulse */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-blue-500"
            />
          </div>

          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Map className={`w-28 h-28 ${isLight ? 'text-blue-700' : 'text-indigo-400'}`} />
          </div>

          <div className="relative z-10">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-3 ${
              isLight ? 'text-blue-700' : 'text-indigo-400'
            }`}>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time Geospatial Tracking
            </span>
            <h3 className={`text-xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              🗺️ Live Train Network Map
            </h3>
            <p className={`text-xs mb-4 max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Watch animated trains on 10 corridors across Central, South Central, Western & Northern Railway zones with RailRadar live telemetry.
            </p>
            <motion.div
              className={`flex items-center gap-1.5 text-xs font-bold ${
                isLight ? 'text-blue-700' : 'text-indigo-300'
              }`}
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Open Live Train Map <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </motion.div>

        {/* Corridor Health */}
        <motion.div
          whileHover={{ scale: 1.02, y: -3 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
          onClick={() => navigate('/corridors')}
          className={`rounded-2xl p-6 cursor-pointer relative overflow-hidden group shadow-md border transition-all ${
            isLight
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200/50 hover:shadow-lg'
              : isIR
              ? 'bg-gradient-to-br from-[#172D24] to-[#0D1E17] border-emerald-500/30 hover:border-emerald-400/60'
              : 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/30 hover:border-emerald-500/70'
          }`}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-emerald-500"
            />
          </div>

          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className={`w-28 h-28 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          </div>

          <div className="relative z-10">
            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-3 ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              Corridor Resilience & Safety
            </span>
            <h3 className={`text-xl font-black mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              🛡️ Corridor Health Monitor
            </h3>
            <p className={`text-xs mb-4 max-w-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Track maintenance risk scores, pending defect severity distributions, and block density health rings for each rail corridor.
            </p>
            <motion.div
              className={`flex items-center gap-1.5 text-xs font-bold ${
                isLight ? 'text-emerald-700' : 'text-emerald-300'
              }`}
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              View Health Metrics <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── DEPARTMENT BREAKDOWN ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            dept: 'Track Engineering (TMS)',
            key: 'Engineering',
            color: 'text-blue-600',
            border: 'border-blue-500/30',
            bg: isLight ? 'bg-blue-50/60' : 'bg-blue-500/8',
            glow: 'shadow-blue-500/10',
            icon: '🛤️',
            badge: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
          },
          {
            dept: 'Signaling & Telecom (SMMS)',
            key: 'S&T',
            color: 'text-amber-600',
            border: 'border-amber-500/30',
            bg: isLight ? 'bg-amber-50/60' : 'bg-amber-500/8',
            glow: 'shadow-amber-500/10',
            icon: '📡',
            badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
          },
          {
            dept: 'Traction Distribution (TDMS)',
            key: 'TRD',
            color: 'text-emerald-600',
            border: 'border-emerald-500/30',
            bg: isLight ? 'bg-emerald-50/60' : 'bg-emerald-500/8',
            glow: 'shadow-emerald-500/10',
            icon: '⚡',
            badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
          },
        ].map(({ dept, key, color, border, bg, glow, icon, badge }, i) => {
          const d = summary?.by_department?.[key];
          const total = d?.total ?? 0;
          const maxSev = Math.max(d?.Critical ?? 0, d?.High ?? 0, d?.Medium ?? 0, d?.Low ?? 0, 1);

          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`p-5 rounded-2xl border ${border} ${bg} shadow-sm ${glow} transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-2xl">{icon}</span>
                  <h3 className={`font-bold ${color} mt-1 text-xs uppercase tracking-wider`}>{dept}</h3>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge}`}>
                  {total} tasks
                </span>
              </div>

              <p className={`text-4xl font-black ${isLight ? 'text-slate-900' : 'text-white'} mb-4`}>
                <Counter value={total} />
              </p>

              {/* Severity bars */}
              <div className="space-y-1.5">
                {[
                  { label: 'Critical', val: d?.Critical ?? 0, color: 'bg-rose-500' },
                  { label: 'High', val: d?.High ?? 0, color: 'bg-amber-500' },
                  { label: 'Medium', val: d?.Medium ?? 0, color: 'bg-blue-500' },
                  { label: 'Low', val: d?.Low ?? 0, color: 'bg-slate-400' },
                ].map(({ label, val, color: barColor }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold w-12 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                    <div className={`flex-1 h-1.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700'} overflow-hidden`}>
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / maxSev) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-6 text-right ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ─── QUICK ACTIONS ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h2 className={`text-sm font-black uppercase tracking-wider mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Block Planning Actions
        </h2>
        <div className="flex gap-3 flex-wrap items-center">
          <motion.button
            onClick={handleGenerateWeekly}
            disabled={planLoading || !summary?.total}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-xs shadow-md shadow-blue-600/20"
          >
            {planLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            🤖 Generate Weekly Plan (OR-Tools CP-SAT)
          </motion.button>

          <motion.button
            onClick={handleGenerateMonthly}
            disabled={planLoading || !summary?.total}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className={`px-6 py-3 rounded-xl font-bold border transition-all disabled:opacity-50 text-xs shadow-sm flex items-center gap-2 ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Generate Monthly Macro Plan (30-Day)
          </motion.button>

          {!summary?.total && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-slate-400 text-xs font-medium"
            >
              ↑ Click "Generate Synthetic Defects" to populate the database first
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* ─── RECENT PLANS TABLE ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Recent Planning Batches
          </h2>
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {recentPlans.length} plans
          </span>
        </div>

        <div className={`rounded-2xl border overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <table className="w-full text-xs text-left">
            <thead className={`uppercase font-bold text-[10px] tracking-wider ${
              isLight ? 'bg-slate-50 text-slate-500 border-b border-slate-200' : 'bg-slate-800/60 text-slate-400 border-b border-slate-800'
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
              {recentPlans.slice(0, 10).map((plan, i) => (
                <motion.tr
                  key={plan.plan_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-t transition-colors cursor-pointer group ${
                    isLight ? 'border-slate-100 hover:bg-blue-50/40' : 'border-slate-800/60 hover:bg-slate-800/40'
                  }`}
                  onClick={() => navigate(plan.plan_type === 'weekly' ? '/weekly-plan' : '/monthly-plan')}
                >
                  <td className="px-5 py-3 capitalize font-black text-blue-600">{plan.plan_type}</td>
                  <td className={`px-5 py-3 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {plan.start_date} → {plan.end_date}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      plan.status === 'Approved'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className={`px-5 py-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {plan.stats?.total_blocks ?? '—'}
                  </td>
                  <td className={`px-5 py-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {plan.stats?.total_tasks_scheduled ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-bold text-emerald-600">
                    {plan.stats?.high_priority_scheduled_pct?.toFixed(1) ?? '—'}%
                  </td>
                  <td className={`px-5 py-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(plan.created_at).toLocaleString('en-IN')}
                  </td>
                </motion.tr>
              ))}
              {recentPlans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">🚂</span>
                      <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        No plans yet. Click "Generate Synthetic Defects" to start, then generate a Weekly Plan.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── BOTTOM IR IMAGERY BANNER ───────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl overflow-hidden border relative h-40 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <img
          src="/assets/ir-track-maintenance.jpg"
          alt="Indian Railways Track Renewal Machine"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 flex items-end p-4"
          style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.92), rgba(2,6,23,0.4), transparent)' }}
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-white font-black text-sm">Indian Railways Track Renewal Machine</p>
              <p className="text-slate-300 text-xs">Track Engineers & S&T field crews at work · SAMANVAY coordinates their maintenance blocks</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold shrink-0">
              <Award className="w-4 h-4" />
              <span>Govt. of India · Ministry of Railways</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
