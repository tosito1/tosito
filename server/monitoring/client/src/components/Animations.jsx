import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Wraps children in a div that animates in on mount via GSAP.
 * @param {number} delay  - stagger delay in seconds (0.08 per child by default)
 */
export function PageEnter({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('[data-animate]');
    if (items.length === 0) {
      // Animate the wrapper itself
      gsap.fromTo(ref.current,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
      return;
    }
    gsap.fromTo(items,
      { opacity: 0, y: 28, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.08
      }
    );
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}

/**
 * Wraps a single child and plays a GSAP entrance when it mounts or key changes.
 */
export function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out' }
    );
  }, [delay]);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
}
