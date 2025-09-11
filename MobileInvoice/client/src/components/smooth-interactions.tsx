import { useEffect, useState } from 'react';

// Smooth hover effects for gallery elements
export const useSmoothHover = (elementRef: React.RefObject<HTMLElement>) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
      element.style.transform = 'scale(1.02)';
      element.style.transition = 'transform 0.2s ease-out';
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      element.style.transform = 'scale(1)';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef]);

  return isHovered;
};

// Smooth gallery navigation with momentum
export const useSmoothNavigation = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const smoothNavigate = (direction: 'left' | 'right', callback: () => void) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Add smooth transition
    const element = document.querySelector('[data-tour="photo-display"]');
    if (element) {
      const htmlElement = element as HTMLElement;
      htmlElement.style.opacity = '0.7';
      htmlElement.style.transform = `translateX(${direction === 'left' ? '-' : ''}20px)`;
      htmlElement.style.transition = 'all 0.15s ease-out';
      
      setTimeout(() => {
        callback();
        htmlElement.style.opacity = '1';
        htmlElement.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          setIsAnimating(false);
          htmlElement.style.transition = '';
        }, 150);
      }, 75);
    } else {
      callback();
      setIsAnimating(false);
    }
  };

  return { smoothNavigate, isAnimating };
};

// Add micro-interactions to buttons
export const MicroInteractionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ children, onClick, className = '', variant = 'primary' }) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = 'transition-all duration-150 active:scale-95 hover:scale-105';
  const variantClasses = {
    primary: 'bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={() => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);
        onClick();
      }}
      style={{
        transform: isPressed ? 'scale(0.98)' : undefined
      }}
    >
      {children}
    </button>
  );
};