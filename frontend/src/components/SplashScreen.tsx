import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Train } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

// Animated signal dots around India map
const signalPositions = [
  { x: 72, y: 40 }, { x: 78, y: 48 }, { x: 80, y: 55 }, { x: 75, y: 62 },
  { x: 68, y: 58 }, { x: 85, y: 42 }, { x: 70, y: 70 }, { x: 82, y: 68 },
  { x: 76, y: 35 }, { x: 88, y: 52 }, { x: 65, y: 45 }, { x: 90, y: 60 },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'exit'>('loading');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 800);
    const t2 = setTimeout(() => setPhase('exit'), 2800);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #0c1a36 100%)' }}
        >
          {/* Animated dot grid background */}
          <div className="absolute inset-0 dot-grid opacity-30" />

          {/* Glowing orb behind logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 0.15 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />

          {/* Track lines SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Horizontal rail */}
            <motion.line
              x1="-100" y1="75%" x2="110%" y2="75%"
              stroke="#1e3a5f" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            <motion.line
              x1="-100" y1="calc(75% + 14px)" x2="110%" y2="calc(75% + 14px)"
              stroke="#1e3a5f" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
            {/* Sleepers */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.line
                key={i}
                x1={`${i * 6}%`} y1="74%" x2={`${i * 6}%`} y2="76.5%"
                stroke="#1e3a5f" strokeWidth="4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.2, delay: 0.3 + i * 0.05 }}
              />
            ))}

            {/* Signal dots */}
            {signalPositions.map((pos, i) => (
              <motion.circle
                key={i}
                cx={`${pos.x}%`} cy={`${pos.y}%`}
                r="3"
                fill="#6366f1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.4], scale: [0, 1.3, 1] }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.12,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}

            {/* Connecting network lines */}
            {signalPositions.slice(0, -1).map((pos, i) => (
              <motion.line
                key={`l${i}`}
                x1={`${pos.x}%`} y1={`${pos.y}%`}
                x2={`${signalPositions[i + 1].x}%`} y2={`${signalPositions[i + 1].y}%`}
                stroke="#6366f1" strokeWidth="0.8" strokeOpacity="0.25"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8 + i * 0.08 }}
              />
            ))}
          </svg>

          {/* Train silhouette moving across */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute bottom-[23%] left-0 flex items-center"
              initial={{ x: '-10vw' }}
              animate={{ x: '105vw' }}
              transition={{ duration: 2.2, ease: 'linear' }}
            >
              {/* Engine */}
              <div className="relative flex items-end">
                <div
                  className="relative"
                  style={{
                    width: 200,
                    height: 44,
                    background: 'linear-gradient(90deg, #312e81, #4338ca, #6366f1)',
                    borderRadius: '4px 20px 4px 4px',
                    border: '1px solid #818cf8',
                    boxShadow: '0 0 20px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Windows */}
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      position: 'absolute', top: 8, left: 20 + i * 36,
                      width: 26, height: 18,
                      background: 'rgba(224, 231, 255, 0.9)',
                      borderRadius: 3,
                      boxShadow: '0 0 8px rgba(165, 180, 252, 0.8)',
                    }} />
                  ))}
                  {/* Headlight glow */}
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{
                      position: 'absolute', right: -20, top: 8,
                      width: 20, height: 20,
                      background: 'radial-gradient(circle, #fde68a 0%, transparent 70%)',
                    }}
                  />
                  {/* Wheels */}
                  {[20, 80, 140].map(x => (
                    <motion.div
                      key={x}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', bottom: -10, left: x,
                        width: 20, height: 20,
                        border: '3px solid #818cf8',
                        borderRadius: '50%',
                        background: '#1e1b4b',
                      }}
                    />
                  ))}
                </div>
                {/* Carriages */}
                {[0, 1].map(c => (
                  <div key={c} style={{
                    width: 130, height: 38,
                    background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
                    border: '1px solid #4338ca',
                    marginLeft: 6,
                    borderRadius: 4,
                    position: 'relative',
                    boxShadow: '0 0 8px rgba(99,102,241,0.3)',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        position: 'absolute', top: 7, left: 12 + i * 34,
                        width: 22, height: 16,
                        background: 'rgba(165, 180, 252, 0.5)',
                        borderRadius: 2,
                      }} />
                    ))}
                    {[16, 90].map(x => (
                      <motion.div
                        key={x}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                        style={{
                          position: 'absolute', bottom: -8, left: x,
                          width: 16, height: 16,
                          border: '2px solid #4338ca',
                          borderRadius: '50%',
                          background: '#0f0e1e',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main logo area */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
          >
            {/* IR badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mb-4 w-16 h-16 rounded-full border-2 border-indigo-500 flex items-center justify-center glow-indigo"
              style={{ background: 'rgba(99,102,241,0.15)' }}
            >
              <Train className="w-7 h-7 text-indigo-400" />
            </motion.div>

            <motion.h1
              className="text-5xl font-black tracking-tight text-white mb-2"
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, letterSpacing: '-0.01em' }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              SAMANVAY
            </motion.h1>

            <motion.p
              className="text-indigo-300 text-lg font-light tracking-widest mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              समन्वय
            </motion.p>

            <motion.p
              className="text-slate-400 text-sm tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              AI-Powered Block Planning · Indian Railways
            </motion.p>

            {/* Loading bar */}
            <motion.div
              className="mt-8 w-48 h-0.5 rounded-full overflow-hidden bg-slate-800"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>

          {/* Bottom tagline */}
          <motion.p
            className="absolute bottom-8 text-slate-600 text-xs tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Ministry of Railways · Problem Statement #26027
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
