import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Train, Film, Video, Check, RotateCcw } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, setTheme, videoBackdrop, setVideoBackdrop, replayIntro } = useTheme();

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
        {/* Subtle Indian Railways Tricolor Ribbon on top */}
        <div className="h-1 w-full ir-tricolor-bar flex-shrink-0 z-30" />

        {/* Top Control Bar */}
        <header className={`px-8 py-3 border-b flex items-center justify-between z-20 flex-shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : isIR
            ? 'bg-[#101F33] border-slate-700/60 shadow-md'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          {/* Left: Indian Railways Divisional Badge */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
              isLight ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-amber-400 bg-slate-950 text-amber-400'
            }`}>
              <Train className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase">
                  Indian Railways Central Block System
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                10 Corridors · AI Multi-Department Coordination (TMS + SMMS + TDMS)
              </p>
            </div>
          </div>

          {/* Right: Theme Switcher + Video Backdrop + Replay Intro */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Theme Toggle Buttons */}
            <div className={`flex items-center p-1 rounded-xl border text-xs ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/90 border-slate-700'
            }`}>
              {/* Bright White Theme */}
              <button
                onClick={() => setTheme('bright')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  isLight
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Bright White Indian Railways Day Mode"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Bright White</span>
              </button>

              {/* Indian Railways Classic Theme */}
              <button
                onClick={() => setTheme('ir-classic')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  isIR
                    ? 'bg-red-800 text-amber-300 shadow-sm border border-amber-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Indian Railways Classic Maroon & Navy"
              >
                <Train className="w-3.5 h-3.5 text-amber-400" />
                <span>IR Classic</span>
              </button>

              {/* Dark Night Theme */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Night Command Center"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>

            {/* Video Backdrop Toggle */}
            <button
              onClick={() => setVideoBackdrop(!videoBackdrop)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                videoBackdrop
                  ? isLight
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Atmospheric Indian Railways Mountain Video Backdrop"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Mountain Backdrop: {videoBackdrop ? 'ON' : 'OFF'}</span>
            </button>

            {/* Replay Intro Button */}
            <button
              onClick={replayIntro}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Replay Indian Railways Cinematic Mountain Crossing Intro"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Cinematic Intro</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Atmospheric Video Backdrop (Optional Subtle Mountain Train Journey) */}
          {videoBackdrop && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <video
                autoPlay
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover filter brightness-[0.9] contrast-[1.05] transition-opacity duration-700 ${
                  isLight ? 'opacity-[0.06]' : isIR ? 'opacity-[0.14]' : 'opacity-[0.10]'
                }`}
              >
                <source src="https://videos.pexels.com/video-files/2814470/2814470-hd_1920_1080_24fps.mp4" type="video/mp4" />
              </video>
              <div className={`absolute inset-0 ${
                isLight ? 'bg-gradient-to-b from-slate-50/90 to-slate-50/95' : 'bg-gradient-to-b from-slate-950/85 to-slate-950/95'
              }`} />
            </div>
          )}

          {/* Dot Grid Background */}
          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none z-0" />

          {/* Animated Page Transitions */}
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
