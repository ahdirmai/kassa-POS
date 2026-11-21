"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface FadeContentProps {
  children: ReactNode;
  blur?: boolean;
  duration?: number;
  easing?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  className?: string;
}

/**
 * React Bits — FadeContent (Animations/FadeContent)
 * Calm intersection-triggered fade + optional subtle blur reveal.
 */
export default function FadeContent({
  children,
  blur = false,
  duration = 650,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  delay = 0,
  threshold = 0.08,
  initialOpacity = 0,
  className = "",
}: FadeContentProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const t = setTimeout(() => setInView(true), delay);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          setTimeout(() => setInView(true), delay);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : initialOpacity,
        transform: inView ? "translateY(0px)" : "translateY(10px)",
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}, filter ${duration}ms ${easing}`,
        filter: blur ? (inView ? "blur(0px)" : "blur(6px)") : "none",
      }}
    >
      {children}
    </div>
  );
}
