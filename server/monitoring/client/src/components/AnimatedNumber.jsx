import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Animates a number from its previous value to `value` using GSAP.
 */
export default function AnimatedNumber({ value, decimals = 1, suffix = '' }) {
  const ref  = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    if (!ref.current || value == null) return;
    const obj = { val: prev.current };
    gsap.to(obj, {
      val: value,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current)
          ref.current.textContent = obj.val.toFixed(decimals) + suffix;
      },
      onComplete: () => { prev.current = value; }
    });
  }, [value, decimals, suffix]);

  return <span ref={ref}>{(prev.current || 0).toFixed(decimals)}{suffix}</span>;
}
