import { useState, useEffect } from 'react';
import { Star, Heart, ThumbsUp, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeedbackItem {
  id: number;
  clientName: string;
  text: string;
  rating: number;
  date: string;
  photoId?: number;
  photoUrl?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface ClientFeedbackReelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: 1,
    clientName: 'Maria Rossi',
    text: 'Stupende! Adoro i colori che hai scelto per le mie unghie. Sei davvero un\'artista! 💕',
    rating: 5,
    date: '2025-01-15',
    photoId: 1,
    sentiment: 'positive'
  },
  {
    id: 2,
    clientName: 'Anna Bianchi',
    text: 'Lavoro incredibile come sempre! Non vedo l\'ora di mostrare le mie nuove nail art alle amiche 😍',
    rating: 5,
    date: '2025-01-14',
    photoId: 2,
    sentiment: 'positive'
  },
  {
    id: 3,
    clientName: 'Sofia Verde',
    text: 'Sei un\'artista! Ogni volta superi te stessa. Grazie per la pazienza e la professionalità ✨',
    rating: 5,
    date: '2025-01-13',
    photoId: 3,
    sentiment: 'positive'
  },
  {
    id: 4,
    clientName: 'Giulia Neri',
    text: 'Perfette come sempre! Il French con il tocco rosa è esattamente quello che volevo 💅',
    rating: 5,
    date: '2025-01-12',
    sentiment: 'positive'
  },
  {
    id: 5,
    clientName: 'Francesca Blu',
    text: 'Bravissima! Le decorazioni sono delicate e eleganti. Consiglierò sicuramente il tuo lavoro! 👏',
    rating: 5,
    date: '2025-01-11',
    sentiment: 'positive'
  },
  {
    id: 6,
    clientName: 'Elena Rosa',
    text: 'Che meraviglia! I glitter sono perfetti e la durata è incredibile. Tornerò presto! ⭐',
    rating: 5,
    date: '2025-01-10',
    sentiment: 'positive'
  }
];

export function ClientFeedbackReel({ isOpen, onClose }: ClientFeedbackReelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % MOCK_FEEDBACK.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? MOCK_FEEDBACK.length - 1 : prev - 1);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % MOCK_FEEDBACK.length);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!isOpen) return null;

  const currentFeedback = MOCK_FEEDBACK[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 fill-current" />
              <h2 className="text-xl font-bold">I Tuoi Migliori Complimenti</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-pink-100 text-sm mt-1">
            Raccolta automatica dei feedback più belli delle tue clienti
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6 min-h-[300px] relative">
          <div className="text-center">
            {/* Client Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">
                {currentFeedback.clientName.charAt(0)}
              </span>
            </div>

            {/* Client Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentFeedback.clientName}
            </h3>

            {/* Rating */}
            <div className="flex justify-center gap-1 mb-4">
              {renderStars(currentFeedback.rating)}
            </div>

            {/* Feedback Text */}
            <blockquote className="text-gray-700 text-lg leading-relaxed mb-4 px-4">
              "{currentFeedback.text}"
            </blockquote>

            {/* Date */}
            <p className="text-sm text-gray-500 mb-6">
              {new Date(currentFeedback.date).toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={goToPrevious}
                className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-pink-600" />
              </button>

              <div className="flex items-center gap-2">
                {/* Progress Dots */}
                <div className="flex gap-1">
                  {MOCK_FEEDBACK.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsAutoPlaying(false);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-pink-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Auto-play Toggle */}
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`ml-4 px-3 py-1 text-xs rounded-full transition-colors ${
                    isAutoPlaying
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isAutoPlaying ? 'Auto' : 'Pausa'}
                </button>
              </div>

              <button
                onClick={goToNext}
                className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-pink-600" />
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-pink-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute top-4 right-4 text-purple-200">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-pink-600">{MOCK_FEEDBACK.length}</div>
              <div className="text-xs text-gray-500">Recensioni</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {(MOCK_FEEDBACK.reduce((acc, f) => acc + f.rating, 0) / MOCK_FEEDBACK.length).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Media Stelle</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {MOCK_FEEDBACK.filter(f => f.sentiment === 'positive').length}
              </div>
              <div className="text-xs text-gray-500">Positive</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}