// Hook to show animation when digit changes

"use client";

import { useEffect, useRef, useState } from "react";

export function useCountAnimation(
  end: number,
  duration: number = 1000,
): number {
  // Start with the actual value to avoid showing 0
  const [count, setCount] = useState(end);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Remember previous target value
  const prevEndRef = useRef(end);

  // Store animation frame ID so we can cancel it later
  const requestRef = useRef<number>(null);

  useEffect(() => {
    // On first render, always animate from 0 to end
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        // Calculate how far we are (0 = start, 1 = complete)
        const progress = Math.min((now - startTime) / duration, 1);

        // Apply easing for smooth slow-down effect
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        // Animate from 0 to end value
        const currentCount = Math.floor(end * easeOutQuart);

        setCount(currentCount);

        // Keep animating if not finished yet
        if (progress < 1) {
          requestRef.current = requestAnimationFrame(animate);
        }
      };

      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Skip animation if value hasn't changed
    if (prevEndRef.current === end) {
      return;
    }

    // Animate from previous value to new value
    const startValue = prevEndRef.current;
    prevEndRef.current = end;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Apply easing for smooth slow-down effect (like YouTube counters)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      // Calculate current number based on progress
      const currentCount = Math.floor(
        startValue + (end - startValue) * easeOutQuart,
      );

      setCount(currentCount);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    // Stop animation if component unmounts or value changes mid-animation
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, duration]);

  return count;
}
