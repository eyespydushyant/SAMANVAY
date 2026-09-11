import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative" style={{ background: '#0a1225' }}>
        {/* Subtle animated dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        {/* Subtle top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="relative p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
