import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
}

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

export default function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
