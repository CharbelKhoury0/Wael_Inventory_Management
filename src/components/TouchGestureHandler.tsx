import React, { useRef, useCallback, useEffect, useState } from 'react';

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  className?: string;
  disabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  className = '',
  disabled = false
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  const [lastTap, setLastTap] = useState<TouchPoint | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    setTouchStart(touchPoint);
    setTouchEnd(null);
    setIsLongPressing(false);
    setIsPinching(false);

    // Handle multi-touch for pinch gestures
    if (e.touches.length === 2 && onPinch) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setIsPinching(true);
    }

    // Start long press timer
    if (onLongPress && e.touches.length === 1) {
      const timer = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressDelay);
      setLongPressTimer(timer);
    }
  }, [disabled, onLongPress, onPinch, longPressDelay, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Handle pinch gesture
    if (isPinching && e.touches.length === 2 && onPinch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      onPinch(scale);
    }

    // Update touch end position for swipe detection
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchEnd({
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      });
    }
  }, [disabled, longPressTimer, isPinching, onPinch, initialDistance, getDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Don't process gestures if long pressing
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }

    // Reset pinch state
    if (isPinching) {
      setIsPinching(false);
      return;
    }

    if (!touchStart || !touchEnd) {
      // Handle tap if no movement
      if (touchStart && !touchEnd) {
        handleTap(touchStart);
      }
      return;
    }

    // Calculate swipe distance and direction
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if movement is significant enough to be a swipe
    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    } else {
      // Small movement, treat as tap
      handleTap(touchEnd);
    }

    // Reset touch points
    setTouchStart(null);
    setTouchEnd(null);
  }, [
    disabled,
    longPressTimer,
    isLongPressing,
    isPinching,
    touchStart,
    touchEnd,
    swipeThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  ]);

  // Handle tap and double tap
  const handleTap = useCallback((touchPoint: TouchPoint) => {
    const now = Date.now();
    
    if (lastTap && (now - lastTap.timestamp) < doubleTapDelay) {
      // Double tap detected
      if (onDoubleTap) {
        onDoubleTap();
        // Add haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 50, 30]);
        }
      }
      setLastTap(null);
    } else {
      // Single tap
      setLastTap(touchPoint);
      
      // Delay single tap to check for double tap
      setTimeout(() => {
        setLastTap(current => {
          if (current === touchPoint && onTap) {
            onTap();
          }
          return null;
        });
      }, doubleTapDelay);
    }
  }, [lastTap, doubleTapDelay, onTap, onDoubleTap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Prevent default touch behaviors that might interfere
  const handleTouchStartCapture = useCallback((e: React.TouchEvent) => {
    // Prevent zoom on double tap for iOS
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      ref={elementRef}
      className={`touch-gesture-handler ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchStartCapture={handleTouchStartCapture}
      style={{
        touchAction: isPinching ? 'none' : 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
    </div>
  );
};

export default TouchGestureHandler;

// Hook for using touch gestures
export const useTouchGestures = () => {
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // Detect touch capability
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // Detect orientation
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkTouch();
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return {
    isTouch,
    orientation,
    isMobile: isTouch && window.innerWidth < 768
  };
};

// Utility function for haptic feedback
export const hapticFeedback = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Utility function to prevent zoom on iOS
export const preventZoom = () => {
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }
};

// Utility function to enable zoom on iOS
export const enableZoom = () => {
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    );
  }
};