import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Train } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : isIR ? 'bg-[#0B1728] text-white' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Indian Railways Tricolor top ribbon */}
        <div className="h-1 w-full ir-tricolor-bar flex-shrink-0 z-30" />

        {/* Top Control Bar — Clean, minimal: just IR branding + theme switcher */}
        <header className={`px-6 py-2.5 border-b flex items-center justify-between z-20 flex-shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : isIR
            ? 'bg-[#101F33] border-slate-700/60 shadow-md'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          {/* Left: Indian Railways identity */}
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${
              isLight ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-amber-400 bg-slate-950 text-amber-400'
            }`}>
              <Train className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black tracking-wider uppercase ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Indian Railways Central Block System
                </span>
                <span className="text-[10px] px-1.5 rounded bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                AI Multi-Department Coordination · TMS + SMMS + TDMS
              </p>
            </div>
          </div>

          {/* Right: Theme Switcher only */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/90 border-slate-700'
          }`}>
            <button
              onClick={() => setTheme('bright')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                isLight ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Bright White — Indian Railways Day Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Bright White</span>
            </button>
            <button
              onClick={() => setTheme('ir-classic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                isIR ? 'bg-red-900 text-amber-300 shadow-sm border border-amber-400/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Indian Railways Classic Maroon & Navy"
            >
              <Train className="w-3.5 h-3.5 text-amber-400" />
              <span>IR Classic</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Night Command Center"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Atmospheric Vande Bharat mountain image backdrop (very subtle) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <img
              src="/assets/vande-bharat-mountain.jpg"
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isLight ? 'opacity-[0.03]' : isIR ? 'opacity-[0.08]' : 'opacity-[0.06]'
              }`}
              aria-hidden="true"
            />
            <div className={`absolute inset-0 ${
              isLight
                ? 'bg-gradient-to-b from-slate-50/95 to-slate-50/98'
                : isIR
                ? 'bg-gradient-to-b from-[#0B1728]/90 to-[#0B1728]/97'
                : 'bg-gradient-to-b from-slate-950/88 to-slate-950/96'
            }`} />
          </div>

          {/* Dot grid */}
          <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none z-0" />

          {/* Page transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
