import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
  trend?: { value: number; label: string };
}

// Animated number counter hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;
    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => { startRef.current = null; };
  }, [target, duration]);

  return count;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  colorClass = 'border-l-brand',
  trend,
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const animatedCount = useCountUp(isNumeric ? numericValue : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative bg-card rounded-xl p-5 border border-slate-800 border-l-4 ${colorClass} overflow-hidden group`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-3xl font-black text-white leading-none">
            {isNumeric ? animatedCount.toLocaleString('en-IN') : value}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-slate-500 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <motion.div
            className="text-slate-500 group-hover:text-slate-300 transition-colors"
            whileHover={{ scale: 1.15, rotate: 5 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
