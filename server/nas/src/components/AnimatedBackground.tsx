"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function AnimatedBackground() {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const orb3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    // Reveal orbs on mount
    tl.to(orb1.current, { opacity: 1, duration: 2, ease: "power2.out" }, 0)
      .to(orb2.current, { opacity: 1, duration: 2, ease: "power2.out" }, 0.3)
      .to(orb3.current, { opacity: 1, duration: 2, ease: "power2.out" }, 0.6);

    // Continuous float animations
    gsap.to(orb1.current, {
      y: "+=80",
      x: "+=40",
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(orb2.current, {
      y: "-=60",
      x: "-=50",
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(orb3.current, {
      scale: 1.3,
      opacity: 0.6,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      gsap.killTweensOf([orb1.current, orb2.current, orb3.current]);
    };
  }, []);

  return (
    <div className="bg-canvas">
      <div ref={orb1} className="orb orb-1" />
      <div ref={orb2} className="orb orb-2" />
      <div ref={orb3} className="orb orb-3" />
    </div>
  );
}
