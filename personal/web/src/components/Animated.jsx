/**
 * PageTransition — Framer Motion wrapper for animated route changes
 * Smooth fade+slide on every page entry/exit
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

export const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * FadeUp — Simple Framer Motion reveal wrapper
 */
export const FadeUp = ({ children, delay = 0, duration = 0.5, style, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * ScaleIn — Pop-in reveal
 */
export const ScaleIn = ({ children, delay = 0, style, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.45, delay, ease: [0.34, 1.56, 0.64, 1] }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * SlideIn — Slide from left
 */
export const SlideIn = ({ children, delay = 0, style, className }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * StaggerWrapper + StaggerItem — For lists that reveal with stagger
 */
export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const StaggerWrapper = ({ children, style, className }) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, style, className }) => (
  <motion.div variants={staggerItem} style={style} className={className}>
    {children}
  </motion.div>
);

/**
 * AnimatedCard — Card with hover lift + tilt via Framer Motion
 */
export const AnimatedCard = ({ children, style, className, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{
      y: -4,
      boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(129,140,248,0.12)',
      borderColor: 'rgba(129,140,248,0.3)',
      transition: { duration: 0.2 },
    }}
    whileTap={{ scale: 0.98 }}
    style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    className={className}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

/**
 * PulseRing — Animated pulsing ring for active states
 */
export const PulseRing = ({ color = 'var(--accent-primary)', size = 12 }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
    <motion.span
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        backgroundColor: color,
        opacity: 0.4,
      }}
      animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
    />
    <span style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: color, display: 'block'
    }} />
  </span>
);

/**
 * FloatingOrb — Decorative animated orb for backgrounds
 */
export const FloatingOrb = ({ color, size, top, left, right, bottom, delay = 0, opacity = 0.15 }) => (
  <motion.div
    style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left, right, bottom,
      pointerEvents: 'none',
      filter: 'blur(60px)',
      opacity,
    }}
    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/**
 * CountUp — Animated number display
 */
export const CountUp = ({ target, decimals = 0, suffix = '', prefix = '', duration = 1.4, delay = 0, style, className }) => {
  const [value, setValue] = React.useState(0);
  const obj = React.useRef({ val: 0 });

  React.useEffect(() => {
    const gsapImport = import('gsap').then(({ gsap }) => {
      const tween = gsap.to(obj.current, {
        val: target,
        duration,
        delay,
        ease: 'power3.out',
        onUpdate: () => {
          const v = obj.current.val;
          setValue(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v));
        },
      });
      return tween;
    });
    return () => gsapImport.then(t => t?.kill?.());
  }, [target, duration, delay, decimals]);

  const display = decimals > 0
    ? value.toLocaleString('es-ES', { minimumFractionDigits: decimals })
    : value.toLocaleString('es-ES');

  return (
    <span style={style} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
};
