import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Calendar, CalendarDays,
  History, Train, Map, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks & Defects' },
  { to: '/weekly-plan', icon: Calendar, label: 'Weekly Block Plan' },
  { to: '/monthly-plan', icon: CalendarDays, label: 'Monthly Macro Plan' },
  { to: '/live-map', icon: Map, label: 'Live Train Map' },
  { to: '/corridors', icon: Activity, label: 'Corridor Health' },
  { to: '/audit', icon: History, label: 'Governance & Config' },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();

  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

  return (
    <aside
      className={`flex flex-col w-64 h-screen border-r flex-shrink-0 transition-colors duration-200 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : isIR
          ? 'bg-[#081220] border-slate-800 text-slate-100'
          : 'bg-[#0A0F1E] border-slate-800/80 text-slate-100'
      }`}
    >
      {/* Logo Area */}
      <div className={`p-5 border-b transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-3">
          {/* Animated IR Emblem */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                isLight
                  ? 'border-blue-700 bg-blue-50 text-blue-700 shadow-sm'
                  : isIR
                  ? 'border-amber-400 bg-red-950/60 text-amber-400 glow-maroon'
                  : 'border-indigo-500 bg-indigo-950/40 text-indigo-400 glow-indigo'
              }`}
            >
              <Train className="w-4 h-4" />
            </div>
            {/* Live Indicator Dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-status-blink border border-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-base font-black tracking-wider ${
                isLight ? 'text-blue-900' : isIR ? 'text-amber-400' : 'text-white'
              }`}>
                SAMANVAY
              </h1>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                isLight ? 'bg-blue-100 text-blue-800' : 'bg-red-800/60 text-amber-300'
              }`}>
                IR
              </span>
            </div>
            <p className={`text-[10px] tracking-widest font-semibold ${
              isLight ? 'text-slate-500' : isIR ? 'text-amber-200/60' : 'text-indigo-400/80'
            }`}>
              समन्वय · BLOCK PLANNING
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? isLight
                      ? 'text-blue-800 bg-blue-50/90 shadow-sm border border-blue-200'
                      : isIR
                      ? 'text-amber-300 bg-red-900/40 border border-amber-500/30 shadow-sm'
                      : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                {/* Active Indicator Strip */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${
                        isLight ? 'bg-blue-700' : isIR ? 'bg-amber-400' : 'bg-indigo-400'
                      }`}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                    />
                  )}
                </AnimatePresence>

                <item.icon className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive
                    ? isLight ? 'text-blue-700' : isIR ? 'text-amber-400' : 'text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-600'
                )} />

                <span className="tracking-tight">{item.label}</span>

                {/* Special Live Marker for Live Map */}
                {item.to === '/live-map' && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-status-blink" />
                    Live
                  </span>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Track Animation & IR Emblem */}
      <div className={`p-4 border-t transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800/80 bg-slate-950/40'
      }`}>
        {/* Animated Train on Track in Sidebar Footer */}
        <div className="mb-3 relative overflow-hidden h-4 rounded">
          <div className={`absolute inset-x-0 top-1/2 h-px ${isLight ? 'bg-slate-300' : 'bg-slate-700/80'}`} />
          <div className={`absolute inset-x-0 top-[calc(50%+6px)] h-px ${isLight ? 'bg-slate-300' : 'bg-slate-700/80'}`} />
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`absolute top-1 w-px h-2.5 ${isLight ? 'bg-slate-300' : 'bg-slate-700/60'}`}
              style={{ left: `${i * 12 + 2}%` }}
            />
          ))}
          {/* Animated Mini Train Loop */}
          <motion.div
            className={`absolute top-0.5 w-6 h-3 rounded-sm ${
              isLight
                ? 'bg-blue-700 shadow-sm'
                : isIR
                ? 'bg-amber-400 shadow-sm'
                : 'bg-indigo-500'
            }`}
            animate={{ x: ['-25px', '250px'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px] ${
            isLight ? 'border-slate-300 bg-white text-slate-700 shadow-xs' : 'border-slate-700 bg-slate-800 text-amber-300'
          }`}>
            IR
          </div>
          <div>
            <p className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Ministry of Railways
            </p>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Government of India · Ministry of Railways
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
