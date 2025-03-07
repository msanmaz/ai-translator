import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AnimationDirection = "up" | "down" | "left" | "right" | "fade";

interface AnimatedTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: AnimationDirection;
  duration?: number;
  className?: string;
  onExited?: () => void;
}

const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  show,
  children,
  direction = "fade",
  duration = 300,
  className,
  onExited,
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  // Handle initial render
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (show) {
      // When showing, render immediately then animate in
      setShouldRender(true);
      // Small delay to ensure DOM is updated
      const animationTimer = window.setTimeout(() => {
        if (mountedRef.current) {
          setIsAnimating(true);
        }
      }, 10);
      
      return () => {
        window.clearTimeout(animationTimer);
      };
    } else {
      // When hiding, animate out then stop rendering
      setIsAnimating(false);
      
      if (timerRef.current) window.clearTimeout(timerRef.current);
      
      timerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          setShouldRender(false);
          if (onExited) onExited();
        }
      }, duration + 50); // Add small buffer to ensure animation completes
      
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }
  }, [show, duration, onExited]);

  const getAnimationClasses = () => {
    const animationClasses = {
      base: "transition-all",
      up: "transform translate-y-4 opacity-0",
      down: "transform -translate-y-4 opacity-0",
      left: "transform translate-x-4 opacity-0",
      right: "transform -translate-x-4 opacity-0",
      fade: "opacity-0",
    };

    const targetClass = isAnimating ? "" : animationClasses[direction];
    return cn(animationClasses.base, targetClass);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={cn(getAnimationClasses(), className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedTransition;