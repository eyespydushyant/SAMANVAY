import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

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
  colorClass = 'border-l-blue-600',
  trend,
}: KPICardProps) {
  const { theme } = useTheme();
  const isLight = theme === 'bright';
  const isIR = theme === 'ir-classic';

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const animatedCount = useCountUp(isNumeric ? numericValue : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative rounded-xl p-5 border border-l-4 ${colorClass} overflow-hidden group transition-all duration-200 ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : isIR
          ? 'bg-[#142238] border-slate-700/80 shadow-md'
          : 'bg-[#1E293B] border-slate-800 shadow-md'
      }`}
    >
      {/* Subtle hover background highlight */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at top left, rgba(37,99,235,0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top left, rgba(99,102,241,0.06) 0%, transparent 70%)'
        }}
      />

      <div className="relative flex justify-between items-start">
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {title}
          </p>
          <h3 className={`text-3xl font-black leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {isNumeric ? animatedCount.toLocaleString('en-IN') : value}
          </h3>
          {subtitle && (
            <p className={`text-xs mt-1.5 font-medium ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <motion.div
            className={`transition-colors p-2 rounded-lg ${
              isLight ? 'text-slate-400 group-hover:text-blue-600 bg-slate-50' : 'text-slate-500 group-hover:text-slate-300 bg-slate-800/40'
            }`}
            whileHover={{ scale: 1.15, rotate: 4 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
