import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Calendar, CalendarDays,
  History, Train, Map, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/weekly-plan', icon: Calendar, label: 'Weekly Plan' },
  { to: '/monthly-plan', icon: CalendarDays, label: 'Monthly Plan' },
  { to: '/live-map', icon: Map, label: 'Live Train Map' },
  { to: '/corridors', icon: Activity, label: 'Corridor Health' },
  { to: '/audit', icon: History, label: 'Audit & Config' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div
      className="flex flex-col w-64 h-screen border-r border-slate-800/60 flex-shrink-0"
      style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0f172a 100%)' }}
    >
      {/* Logo area */}
      <div className="p-5 border-b border-slate-800/60">
        <motion.div
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ x: 2 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {/* Animated IR emblem */}
          <div className="relative w-9 h-9">
            <motion.div
              className="w-9 h-9 rounded-full border-2 border-indigo-500 flex items-center justify-center glow-indigo"
              style={{ background: 'rgba(99,102,241,0.15)' }}
              whileHover={{ scale: 1.1 }}
            >
              <Train className="w-4 h-4 text-indigo-400" />
            </motion.div>
            {/* Live status dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-status-blink border border-slate-900" />
          </div>

          <div>
            <h1 className="text-base font-black text-white tracking-wider">SAMANVAY</h1>
            <p className="text-[10px] text-indigo-400/70 tracking-widest font-medium">समन्वय · AI BLOCK PLANNING</p>
          </div>
        </motion.div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'text-indigo-300 bg-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-indigo-400"
                      style={{ boxShadow: '0 0 8px rgba(129,140,248,0.8)' }}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}
                >
                  <item.icon className="w-4 h-4" />
                </motion.div>
                <span>{item.label}</span>

                {/* Live indicator for Live Map */}
                {item.to === '/live-map' && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] text-green-400 font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-status-blink" />
                    Live
                  </span>
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/60">
        {/* Mini decorative train track */}
        <div className="mb-3 relative overflow-hidden h-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/60" />
          <div className="absolute inset-x-0 top-[calc(50%+6px)] h-px bg-slate-700/60" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1 w-px h-2.5 bg-slate-700/50"
              style={{ left: `${i * 14 + 3}%` }}
            />
          ))}
          {/* Moving mini train */}
          <motion.div
            className="absolute top-0.5 w-5 h-3 rounded-sm"
            style={{
              background: 'linear-gradient(90deg, #4338ca, #6366f1)',
              boxShadow: '0 0 4px rgba(99,102,241,0.6)',
            }}
            animate={{ x: ['-24px', '280px'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center bg-slate-800/50">
            <span className="text-[9px] font-black text-slate-400">IR</span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Indian Railways</p>
            <p className="text-[10px] text-slate-600">Hackathon Prototype</p>
          </div>
        </div>
      </div>
    </div>
  );
}
