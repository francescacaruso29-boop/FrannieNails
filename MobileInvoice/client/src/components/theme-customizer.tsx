import { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const PRESET_THEMES: Record<string, ThemeColors> = {
  pink: {
    primary: '#EC4899',
    secondary: '#F3E8FF',
    accent: '#EDAFB8',
    background: '#FDF2F8'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#DBEAFE',
    accent: '#93C5FD',
    background: '#F0F9FF'
  },
  purple: {
    primary: '#8B5CF6',
    secondary: '#EDE9FE',
    accent: '#C4B5FD',
    background: '#FAF5FF'
  },
  gold: {
    primary: '#F59E0B',
    secondary: '#FEF3C7',
    accent: '#FCD34D',
    background: '#FFFBEB'
  },
  emerald: {
    primary: '#10B981',
    secondary: '#D1FAE5',
    accent: '#6EE7B7',
    background: '#ECFDF5'
  }
};

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange: (theme: ThemeColors) => void;
  currentTheme: ThemeColors;
}

export function ThemeCustomizer({ isOpen, onClose, onThemeChange, currentTheme }: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('pink');
  const [customColors, setCustomColors] = useState<ThemeColors>(currentTheme);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const applyPresetTheme = (themeName: string) => {
    const theme = PRESET_THEMES[themeName];
    setSelectedTheme(themeName);
    setCustomColors(theme);
    onThemeChange(theme);
  };

  const applyCustomTheme = () => {
    onThemeChange(customColors);
  };

  const updateCustomColor = (colorKey: keyof ThemeColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Personalizza Tema</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Theme Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                !isCustomMode 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Temi Predefiniti
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                isCustomMode 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Personalizzato
            </button>
          </div>

          {!isCustomMode ? (
            // Preset Themes
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-3">Scegli un Tema</h3>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(PRESET_THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    onClick={() => applyPresetTheme(name)}
                    className={`p-3 border-2 rounded-lg transition-all hover:shadow-md ${
                      selectedTheme === name 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: theme.secondary }}
                        />
                      </div>
                      <span className="flex-1 text-left font-medium capitalize">
                        {name === 'pink' ? 'Rosa Classico' : 
                         name === 'blue' ? 'Blu Oceano' :
                         name === 'purple' ? 'Viola Elegante' :
                         name === 'gold' ? 'Oro Luxury' : 'Verde Smeraldo'}
                      </span>
                      {selectedTheme === name && (
                        <Check className="w-5 h-5 text-pink-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Custom Theme Builder
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-3">Colori Personalizzati</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colore Principale
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.primary}
                      onChange={(e) => updateCustomColor('primary', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColors.primary}
                      onChange={(e) => updateCustomColor('primary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colore Secondario
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.secondary}
                      onChange={(e) => updateCustomColor('secondary', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColors.secondary}
                      onChange={(e) => updateCustomColor('secondary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colore Accento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => updateCustomColor('accent', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColors.accent}
                      onChange={(e) => updateCustomColor('accent', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sfondo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColors.background}
                      onChange={(e) => updateCustomColor('background', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColors.background}
                      onChange={(e) => updateCustomColor('background', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima</h4>
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: customColors.background }}
                >
                  <div 
                    className="text-white px-3 py-1 rounded text-sm mb-2"
                    style={{ backgroundColor: customColors.primary }}
                  >
                    Pulsante Principale
                  </div>
                  <div 
                    className="px-3 py-1 rounded text-sm"
                    style={{ 
                      backgroundColor: customColors.secondary,
                      color: customColors.primary 
                    }}
                  >
                    Elemento Secondario
                  </div>
                </div>
              </div>

              <button
                onClick={applyCustomTheme}
                className="w-full py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Applica Tema Personalizzato
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}