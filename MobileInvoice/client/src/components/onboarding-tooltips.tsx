import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: TooltipStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="main-gallery"]',
    title: 'Benvenuta nella Galleria!',
    content: 'Qui puoi vedere tutte le tue nail art preferite. Scorri per vedere di più!',
    position: 'bottom'
  },
  {
    id: 'swipe',
    target: '[data-tour="photo-display"]',
    title: 'Naviga le Foto',
    content: 'Scorri a sinistra/destra o usa le frecce per vedere altre foto',
    position: 'top'
  },
  {
    id: 'comments',
    target: '[data-tour="photo-comments"]',
    title: 'Commenti e Reazioni',
    content: 'Clicca sulla foto per vedere i commenti e lasciare il tuo!',
    position: 'bottom'
  },
  {
    id: 'sections',
    target: '[data-tour="gallery-sections"]',
    title: 'Sezioni Galleria',
    content: 'Cambia sezione per vedere foto in attesa, approvate o rifiutate',
    position: 'top'
  }
];

interface OnboardingTooltipsProps {
  isActive: boolean;
  onComplete: () => void;
}

export function OnboardingTooltips({ isActive, onComplete }: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || currentStep >= ONBOARDING_STEPS.length) return;

    const updatePosition = () => {
      const step = ONBOARDING_STEPS[currentStep];
      const target = document.querySelector(step.target);
      
      if (target) {
        const rect = target.getBoundingClientRect();
        let top = rect.bottom + 10;
        let left = rect.left + rect.width / 2;

        // Adjust based on position preference
        switch (step.position) {
          case 'top':
            top = rect.top - 10;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }

        setTooltipPosition({ top, left });
        
        // Add highlight to target element
        target.classList.add('onboarding-highlight');
        
        return () => {
          target.classList.remove('onboarding-highlight');
        };
      }
    };

    const cleanup = updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => {
      cleanup?.();
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, isActive]);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  if (!isActive || currentStep >= ONBOARDING_STEPS.length) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      
      {/* Tooltip */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl p-4 max-w-xs transform -translate-x-1/2 -translate-y-full"
        style={{ 
          top: tooltipPosition.top, 
          left: tooltipPosition.left,
          animation: 'tooltipFadeIn 0.3s ease-out'
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
          <button onClick={skip} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-gray-600 text-xs mb-3">{step.content}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {currentStep + 1} di {ONBOARDING_STEPS.length}
          </span>
          
          <div className="flex gap-2">
            <button 
              onClick={skip}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Salta
            </button>
            <button 
              onClick={nextStep}
              className="px-3 py-1 bg-pink-500 text-white text-xs rounded-md hover:bg-pink-600 flex items-center gap-1"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Fine!' : 'Avanti'}
              {currentStep < ONBOARDING_STEPS.length - 1 && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
        
        {/* Tooltip Arrow */}
        <div 
          className="absolute w-2 h-2 bg-white transform rotate-45"
          style={{
            bottom: step.position === 'top' ? '-4px' : 'auto',
            top: step.position === 'bottom' ? '-4px' : 'auto',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }}
        />
      </div>

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-100%) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
        }
        
        .onboarding-highlight {
          position: relative;
          z-index: 41;
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.2) !important;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}