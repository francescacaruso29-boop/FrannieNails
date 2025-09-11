// Mobile Optimization Helper - Frannie NAILS
// Garantisce touch targets 44px+ e responsive design perfetto

export interface TouchTarget {
  minWidth: string;
  minHeight: string;
  padding: string;
}

export interface MobileOptimizationRules {
  touchTargets: TouchTarget;
  typography: {
    minSize: string;
    lineHeight: string;
    letterSpacing: string;
  };
  spacing: {
    minMargin: string;
    minPadding: string;
  };
  interactive: {
    hoverFallback: string;
    focusVisible: string;
  };
}

// 📱 REGOLE OTTIMIZZAZIONE MOBILE
export const MOBILE_RULES: MobileOptimizationRules = {
  touchTargets: {
    minWidth: '44px',   // Apple HIG & Material Design minimum
    minHeight: '44px',  // 44px per accessibilità
    padding: '12px'     // Padding interno confortevole
  },
  typography: {
    minSize: '16px',    // Previene zoom su iOS
    lineHeight: '1.5',  // Leggibilità ottimale
    letterSpacing: '0.01em'
  },
  spacing: {
    minMargin: '8px',   // Spazio minimo tra elementi
    minPadding: '16px'  // Padding contenuto
  },
  interactive: {
    hoverFallback: 'focus-visible:ring-2 focus-visible:ring-pink-500',
    focusVisible: 'focus:outline-none focus:ring-2 focus:ring-pink-500'
  }
};

// 🎯 CLASSI CSS OTTIMIZZATE PER MOBILE
export const MOBILE_CLASSES = {
  // Touch Targets (44px minimum)
  touchButton: 'min-h-[44px] min-w-[44px] touch-manipulation select-none',
  touchIcon: 'w-6 h-6 p-2', // Icon + padding = 44px
  touchInput: 'min-h-[44px] text-base', // Previene zoom iOS
  
  // Typography mobile-friendly
  heading: 'text-xl sm:text-2xl md:text-3xl font-bold leading-tight',
  body: 'text-base leading-relaxed',
  caption: 'text-sm leading-normal',
  
  // Spacing responsive
  container: 'px-4 sm:px-6 md:px-8 max-w-7xl mx-auto',
  section: 'py-6 sm:py-8 md:py-12',
  card: 'p-4 sm:p-6 rounded-lg',
  
  // Layout responsive
  grid: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  flex: 'flex flex-col sm:flex-row gap-4',
  
  // Focus & Interaction
  focus: 'focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2',
  hover: 'hover:bg-pink-50 transition-colors duration-200',
  active: 'active:scale-95 transition-transform duration-150'
};

// 🔍 VALIDATOR TOUCH TARGETS
export function validateTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // px
  
  const isValid = rect.width >= minSize && rect.height >= minSize;
  
  if (!isValid) {
    console.warn(`⚠️ Touch target troppo piccolo: ${rect.width}x${rect.height}px (min: ${minSize}px)`, element);
  }
  
  return isValid;
}

// 📏 AUTO-FIX TOUCH TARGETS
export function autoFixTouchTargets(): void {
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]'
  );
  
  let fixedCount = 0;
  
  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    
    if (!validateTouchTarget(htmlElement)) {
      // Aggiungi classi di fix automatico
      htmlElement.classList.add('min-h-[44px]', 'min-w-[44px]');
      
      // Se è un'icona, aggiungi padding
      if (htmlElement.querySelector('svg')) {
        htmlElement.classList.add('p-2');
      }
      
      fixedCount++;
    }
  });
  
  if (fixedCount > 0) {
    console.log(`✅ Auto-fix applicato a ${fixedCount} touch targets`);
  }
}

// 📱 DETECTOR MOBILE/TABLET
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isTabletDevice(): boolean {
  return /iPad|Android(?=.*(?:Tab|Tablet))/i.test(navigator.userAgent);
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ⚡ PERFORMANCE MOBILE
export function optimizeForMobile(): void {
  // 1. Auto-fix touch targets
  autoFixTouchTargets();
  
  // 2. Aggiungi meta viewport se mancante
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
  }
  
  // 3. Disabilita zoom su input se iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      if (htmlInput.style.fontSize && parseFloat(htmlInput.style.fontSize) < 16) {
        htmlInput.style.fontSize = '16px';
      }
    });
  }
  
  // 4. Ottimizza scroll su mobile
  if (isTouchDevice()) {
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    (document.body.style as any).overscrollBehavior = 'contain';
  }
  
  console.log('📱 Ottimizzazioni mobile applicate');
}

// 🎨 THEME MOBILE RESPONSIVE
export const MOBILE_THEME = {
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px'
  },
  touchTargets: {
    minSize: '44px',
    comfort: '48px',
    large: '56px'
  },
  typography: {
    scale: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px (min per iOS)
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem' // 30px
    }
  }
};

// 🔧 UTILITY FUNCTIONS
export function appleMobileOptimizations(): void {
  // Disabilita callout su iOS
  (document.body.style as any).webkitTouchCallout = 'none';
  
  // Disabilita selezione testo su elementi interattivi
  const interactiveElements = document.querySelectorAll('button, a[href]');
  interactiveElements.forEach((element) => {
    const el = element as HTMLElement;
    (el.style as any).webkitUserSelect = 'none';
    el.style.userSelect = 'none';
  });
}

export function androidMobileOptimizations(): void {
  // Ottimizza tap highlighting
  (document.body.style as any).webkitTapHighlightColor = 'transparent';
  
  // Migliora scroll performance
  (document.body.style as any).webkitOverflowScrolling = 'touch';
}

// 🚀 INIT OTTIMIZZAZIONI
export function initMobileOptimizations(): void {
  if (typeof window === 'undefined') return;
  
  // Applica ottimizzazioni base
  optimizeForMobile();
  
  // Ottimizzazioni specifiche per piattaforma
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    appleMobileOptimizations();
  } else if (/Android/i.test(navigator.userAgent)) {
    androidMobileOptimizations();
  }
  
  // Listener per orientamento
  window.addEventListener('orientationchange', () => {
    setTimeout(optimizeForMobile, 500);
  });
  
  console.log('🚀 Sistema ottimizzazione mobile inizializzato');
}