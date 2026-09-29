/**
 * useCounter — Animates a number from 0 to targetValue using GSAP
 */
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export const useCounter = (target, duration = 1.4, delay = 0) => {
  const [value, setValue] = useState(0);
  const obj = useRef({ val: 0 });

  useEffect(() => {
    const tween = gsap.to(obj.current, {
      val: target,
      duration,
      delay,
      ease: 'power3.out',
      onUpdate: () => setValue(Math.round(obj.current.val * 100) / 100),
    });
    return () => tween.kill();
  }, [target, duration, delay]);

  return value;
};

/**
 * useTiltCard — 3D perspective tilt on hover, resets on leave
 */
export const useTiltCard = (intensity = 8) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: x * intensity * 2,
        rotateX: -y * intensity * 2,
        transformPerspective: 800,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const onLeave = () => {
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [intensity]);

  return ref;
};

/**
 * useStaggerReveal — GSAP stagger entrance for a list of elements
 */
export const useStaggerReveal = (selector = '.stagger-item', delay = 0) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(selector);
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.07,
        delay,
        ease: 'power3.out',
      }
    );
    return () => tween.kill();
  }, [selector, delay]);

  return containerRef;
};

/**
 * useProgressRing — Animates SVG stroke-dasharray from 0 to a given percent
 */
export const useProgressRing = (percent, circumference, delay = 0) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const target = (percent / 100) * circumference;
    const tween = gsap.fromTo(
      ref.current,
      { strokeDasharray: `0 ${circumference}` },
      {
        strokeDasharray: `${target} ${circumference}`,
        duration: 1.2,
        delay,
        ease: 'power3.out',
      }
    );
    return () => tween.kill();
  }, [percent, circumference, delay]);

  return ref;
};
