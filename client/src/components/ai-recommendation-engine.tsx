import { useState, useEffect } from 'react';
import { Sparkles, Heart, TrendingUp, Star, X } from 'lucide-react';

interface NailStyle {
  id: string;
  name: string;
  description: string;
  colors: string[];
  difficulty: 'Facile' | 'Medio' | 'Difficile';
  duration: string;
  trending: boolean;
  matchScore: number;
  reasons: string[];
}

const MOCK_RECOMMENDATIONS: NailStyle[] = [
  {
    id: '1',
    name: 'French Classico Rosa',
    description: 'Elegante french manicure con tocco rosa delicato',
    colors: ['#FFE4E1', '#FF69B4', '#FFFFFF'],
    difficulty: 'Facile',
    duration: '45 min',
    trending: true,
    matchScore: 95,
    reasons: ['Ti piacciono i colori rosa', 'Preferisci stili eleganti', 'Adatto alla forma delle tue unghie']
  },
  {
    id: '2',
    name: 'Ombré Tramonto',
    description: 'Sfumatura delicata dai toni caldi del tramonto',
    colors: ['#FF6B35', '#F7931E', '#FFD23F'],
    difficulty: 'Medio',
    duration: '60 min',
    trending: true,
    matchScore: 88,
    reasons: ['Ami i colori vivaci', 'Ti piacciono le sfumature', 'Perfetto per l\'estate']
  },
  {
    id: '3',
    name: 'Minimalista Nude',
    description: 'Stile pulito e naturale con dettagli dorati',
    colors: ['#F5E6D3', '#E8D5C4', '#D4AF37'],
    difficulty: 'Facile',
    duration: '30 min',
    trending: false,
    matchScore: 82,
    reasons: ['Adatto al tuo stile di vita', 'Facile manutenzione', 'Sempre elegante']
  }
];

interface AIRecommendationEngineProps {
  isOpen: boolean;
  onClose: () => void;
  userPreferences?: {
    favoriteColors?: string[];
    preferredStyles?: string[];
    lifestyle?: 'casual' | 'business' | 'glamour';
  };
}

export function AIRecommendationEngine({ 
  isOpen, 
  onClose, 
  userPreferences 
}: AIRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<NailStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<NailStyle | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Simulate AI processing
      setLoading(true);
      setTimeout(() => {
        // In a real app, this would call an AI service
        const sortedRecs = MOCK_RECOMMENDATIONS.sort((a, b) => b.matchScore - a.matchScore);
        setRecommendations(sortedRecs);
        setLoading(false);
      }, 1500);
    }
  }, [isOpen, userPreferences]);

  const handleBookStyle = (style: NailStyle) => {
    // Navigate to booking with selected style
    console.log('Booking style:', style);
    onClose();
  };

  const handleSaveStyle = (style: NailStyle) => {
    // Save to favorites
    console.log('Saving style to favorites:', style);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Consigli AI per Te</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Basato sui tuoi gusti e preferenze
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">L'AI sta analizzando i tuoi gusti...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((style) => (
                <div 
                  key={style.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedStyle(selectedStyle?.id === style.id ? null : style)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{style.name}</h3>
                        {style.trending && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            Trend
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{style.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                        <Star className="w-4 h-4 fill-current" />
                        {style.matchScore}%
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Colori:</span>
                    <div className="flex gap-1">
                      {style.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    <span>Difficoltà: {style.difficulty}</span>
                    <span>Durata: {style.duration}</span>
                  </div>

                  {/* Match Reasons */}
                  {selectedStyle?.id === style.id && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Perché ti consigliamo questo stile:
                      </h4>
                      <ul className="space-y-1">
                        {style.reasons.map((reason, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookStyle(style);
                          }}
                          className="flex-1 py-2 px-3 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          Prenota Questo Stile
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveStyle(style);
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Footer */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  I consigli migliorano con l'uso dell'app
                </p>
                <button
                  onClick={onClose}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Chiudi e Continua a Navigare
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}