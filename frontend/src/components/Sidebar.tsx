import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Calendar, CalendarDays, History, Train } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/weekly-plan', icon: Calendar, label: 'Weekly Plan' },
  { to: '/monthly-plan', icon: CalendarDays, label: 'Monthly Plan' },
  { to: '/audit', icon: History, label: 'Audit & Config' },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Train className="w-6 h-6 text-brand" />
          SAMANVAY
        </h1>
        <p className="text-xs text-slate-400 mt-1">समन्वय | AI Block Planning</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-brand'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
          <div className="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center">
             <span className="text-xs font-bold">IR</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">Indian Railways Prototype</p>
      </div>
    </div>
  );
}
