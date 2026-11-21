"use client";

import React, { useRef, useLayoutEffect, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "motion/react";

interface ScrollVelocityProps {
  texts: string[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) setWidth(ref.current.offsetWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [ref]);

  return width;
}

function VelocityRow({
  text,
  baseVelocity,
  className,
  damping,
  stiffness,
  numCopies,
}: {
  text: string;
  baseVelocity: number;
  className: string;
  damping: number;
  stiffness: number;
  numCopies: number;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3.5], {
    clamp: false,
  });

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);

  function wrap(min: number, max: number, v: number): number {
    const range = max - min;
    const mod = (((v - min) % range) + range) % range;
    return mod + min;
  }

  const x = useTransform(baseX, (v) => {
    if (copyWidth === 0) return "0px";
    return `${wrap(-copyWidth, 0, v)}px`;
  });

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      <motion.div className="inline-flex whitespace-nowrap" style={{ x }}>
        {Array.from({ length: numCopies }).map((_, i) => (
          <span
            key={i}
            ref={i === 0 ? copyRef : null}
            className={`inline-block shrink-0 ${className}`}
          >
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * React Bits — ScrollVelocity (TextAnimations/ScrollVelocity)
 * Kinetic typography strip whose speed reacts smoothly to scroll velocity.
 */
export default function ScrollVelocity({
  texts,
  velocity = 38,
  className = "",
  damping = 50,
  stiffness = 380,
  numCopies = 6,
}: ScrollVelocityProps) {
  return (
    <div className="w-full overflow-hidden">
      {texts.map((text, index) => (
        <VelocityRow
          key={index}
          text={text}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          className={className}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
        />
      ))}
    </div>
  );
}
