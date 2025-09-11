import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Animation duration presets
export type AnimationDuration = 'fast' | 'normal' | 'slow' | number;

const getDurationMs = (duration: AnimationDuration): number => {
  if (typeof duration === 'number') return duration;
  switch (duration) {
    case 'fast': return 150;
    case 'slow': return 500;
    default: return 300;
  }
};

// Hover Scale Animation Component
interface HoverScaleProps {
  children: ReactNode;
  scale?: number;
  duration?: AnimationDuration;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  duration = 'normal',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const durationMs = getDurationMs(duration);

  return (
    <div
      className={`transition-transform ease-in-out ${className}`}
      style={{
        transform: isHovered ? `scale(${scale})` : 'scale(1)',
        transitionDuration: `${durationMs}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

// Fade In Animation Component
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: AnimationDuration;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 'normal',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const durationMs = getDurationMs(duration);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ease-in-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${durationMs}ms`
      }}
    >
      {children}
    </div>
  );
};

// Slide In Animation Component
interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: AnimationDuration;
  delay?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  distance = 20,
  duration = 'normal',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const durationMs = getDurationMs(duration);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    
    switch (direction) {
      case 'left': return `translateX(-${distance}px)`;
      case 'right': return `translateX(${distance}px)`;
      case 'up': return `translateY(-${distance}px)`;
      case 'down': return `translateY(${distance}px)`;
      default: return `translateX(-${distance}px)`;
    }
  };

  return (
    <div
      className={`transition-transform ease-in-out ${className}`}
      style={{
        transform: getTransform(),
        transitionDuration: `${durationMs}ms`
      }}
    >
      {children}
    </div>
  );
};

// Bounce Animation Component
interface BounceProps {
  children: ReactNode;
  trigger?: boolean;
  duration?: AnimationDuration;
  className?: string;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  trigger = false,
  duration = 'normal',
  className = ''
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const durationMs = getDurationMs(duration);

  useEffect(() => {
    if (trigger) {
      setIsBouncing(true);
      const timer = setTimeout(() => {
        setIsBouncing(false);
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [trigger, durationMs]);

  return (
    <div
      className={`${isBouncing ? 'animate-bounce' : ''} ${className}`}
      style={{
        animationDuration: `${durationMs}ms`
      }}
    >
      {children}
    </div>
  );
};

// Pulse Animation Component
interface PulseProps {
  children: ReactNode;
  active?: boolean;
  duration?: AnimationDuration;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  duration = 'normal',
  className = ''
}) => {
  const durationMs = getDurationMs(duration);

  return (
    <div
      className={`${active ? 'animate-pulse' : ''} ${className}`}
      style={{
        animationDuration: `${durationMs}ms`
      }}
    >
      {children}
    </div>
  );
};

// Stagger Animation Hook
export const useStaggerAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, i * delay);
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [itemCount, delay]);

  return visibleItems;
};

// Animation System Provider
interface AnimationSystemProps {
  children: ReactNode;
  disabled?: boolean;
}

export const AnimationSystem: React.FC<AnimationSystemProps> = ({
  children,
  disabled = false
}) => {
  if (disabled) {
    return <div className="motion-reduce">{children}</div>;
  }

  return <>{children}</>;
};

export default AnimationSystem;