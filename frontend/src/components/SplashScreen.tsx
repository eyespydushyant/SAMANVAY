import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

// Floating particle positions for creative overlay
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 3,
  duration: Math.random() * 4 + 3,
}));

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [phase, setPhase] = useState<'logo' | 'reveal' | 'stats'>('logo');

  useEffect(() => {
    // Phase 1: Show logo (0s)
    // Phase 2: Reveal content (1s)
    const t1 = setTimeout(() => setPhase('reveal'), 1000);
    // Phase 3: Show stats (2.2s)
    const t2 = setTimeout(() => setPhase('stats'), 2200);
    // Auto-dismiss after 5s
    const t3 = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onComplete(), 700);
    }, 5000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="ir-cinematic-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999] overflow-hidden select-none"
        >
          {/* === BACKGROUND: Vande Bharat Mountain Image with Ken Burns pan/zoom === */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.18, x: [0, -20, -10], y: [0, -10, -5] }}
            transition={{ duration: 6, ease: 'linear' }}
          >
            <img
              src="/assets/vande-bharat-mountain.jpg"
              alt="Vande Bharat Mountain Crossing"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>

          {/* === LAYERED GRADIENTS for cinematic depth === */}
          {/* Bottom-to-top dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/20 z-10" />
          {/* Left vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/70 z-10" />
          {/* Top vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-transparent z-10" />
          {/* Cinematic horizontal letterbox bars */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-transparent z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent z-20" />

          {/* === FLOATING PARTICLES (light dots like bokeh / fireflies) === */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: i % 3 === 0 ? '#FF9933' : i % 3 === 1 ? '#FFFFFF' : '#138808',
                  opacity: 0,
                }}
                animate={{
                  opacity: [0, 0.7, 0],
                  y: [0, -30, -60],
                }}
                transition={{
                  delay: p.delay,
                  duration: p.duration,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* === ANIMATED TRACK LINES across the screen === */}
          <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-30">
            {/* Top rail */}
            <motion.line
              x1="-200" y1="72%" x2="110%" y2="72%"
              stroke="#FF9933" strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
            {/* Bottom rail */}
            <motion.line
              x1="-200" y1="calc(72% + 12px)" x2="110%" y2="calc(72% + 12px)"
              stroke="#138808" strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            />
            {/* Sleepers */}
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.line
                key={i}
                x1={`${i * 4.8 + 1}%`} y1="71%"
                x2={`${i * 4.8 + 1}%`} y2="74.5%"
                stroke="#FFFFFF" strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.8 + i * 0.05 }}
              />
            ))}
          </svg>

          {/* === MAIN CONTENT AREA === */}
          <div className="relative z-30 h-full flex flex-col items-center justify-center px-6 text-center">

            {/* Tricolor top ribbon */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-48 h-2 rounded-full ir-tricolor-bar mb-8 origin-center shadow-lg"
            />

            {/* IR Emblem circle */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              className="w-20 h-20 rounded-full border-2 border-amber-400 flex items-center justify-center mb-6 shadow-2xl"
              style={{ background: 'radial-gradient(circle, rgba(20,30,60,0.9), rgba(8,16,32,0.97))' }}
            >
              <div className="text-center">
                <div className="text-amber-400 font-black text-xs tracking-wider">IR</div>
                <div className="text-[8px] text-amber-300/70 font-bold leading-none">🚆</div>
              </div>
            </motion.div>

            {/* SAMANVAY Title */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none drop-shadow-2xl">
                SAMANVAY
              </h1>
              <p className="text-2xl md:text-3xl text-amber-300 font-light mt-1 tracking-[0.3em] drop-shadow-lg">
                समन्वय
              </p>
            </motion.div>

            {/* Subtitle */}
            <AnimatePresence>
              {(phase === 'reveal' || phase === 'stats') && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="mt-5 space-y-2"
                >
                  <p className="text-lg md:text-xl font-semibold text-blue-200 tracking-wide drop-shadow">
                    AI-Powered Block Planning for <span className="text-amber-400 font-black">Indian Railways</span>
                  </p>
                  <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Unifying maintenance possessions across Track Engineering, Signaling & Telecom, and Traction Distribution
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats badges */}
            <AnimatePresence>
              {phase === 'stats' && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 flex flex-wrap justify-center gap-3"
                >
                  {[
                    { icon: '🏔️', text: 'Vande Bharat Mountain Corridors', color: 'text-blue-300 border-blue-500/40 bg-blue-950/60' },
                    { icon: '⚡', text: 'Google OR-Tools CP-SAT Optimizer', color: 'text-amber-300 border-amber-500/40 bg-amber-950/60' },
                    { icon: '🛡️', text: 'Zero-Drop Safety Constraints', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60' },
                    { icon: '📡', text: 'Live Train Tracking (RailRadar API)', color: 'text-rose-300 border-rose-500/40 bg-rose-950/60' },
                  ].map((badge, i) => (
                    <motion.span
                      key={badge.text}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className={`px-4 py-1.5 rounded-full border backdrop-blur-md text-xs font-semibold ${badge.color}`}
                    >
                      {badge.icon} {badge.text}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* === BOTTOM BAR: Ministry branding === */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 z-30 p-5 border-t border-slate-800/60 backdrop-blur-sm"
            style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.95), rgba(2,6,23,0.7))' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3 max-w-5xl mx-auto">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className="font-bold text-amber-400">Ministry of Railways · Govt. of India</span>
                <span className="hidden md:inline text-slate-500">|</span>
                <span className="hidden md:flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">10 Corridors</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-blue-400 font-bold">68.9% Block Reduction</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-400 font-bold">Live RailRadar Feed</span>
                </span>
              </div>

              {/* Loading bar auto-progress */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Loading operations dashboard...</span>
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4.5, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
