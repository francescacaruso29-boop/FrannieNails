import { useState, useMemo } from 'react';
import { Shield, Eye, EyeOff, Filter, AlertTriangle } from 'lucide-react';

interface Comment {
  id: number;
  text: string;
  author: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  isFiltered?: boolean;
  filterReason?: string;
}

interface IntelligentCommentFilterProps {
  comments: Comment[];
  onFilteredCommentsChange: (filteredComments: Comment[]) => void;
}

const INAPPROPRIATE_KEYWORDS = [
  'schifoso', 'brutto', 'orribile', 'disgustoso', 'terrible',
  'pessimo', 'orrendo', 'schifo', 'ridicolo', 'imbarazzante'
];

const POSITIVE_KEYWORDS = [
  'bellissimo', 'stupendo', 'magnifico', 'perfetto', 'adorabile',
  'fantastico', 'incredibile', 'meraviglioso', 'splendido', 'eccellente',
  'bravissima', 'amore', 'adoro', '😍', '💕', '❤️', '👏', '✨'
];

export function IntelligentCommentFilter({ 
  comments, 
  onFilteredCommentsChange 
}: IntelligentCommentFilterProps) {
  const [filterLevel, setFilterLevel] = useState<'none' | 'moderate' | 'strict'>('moderate');
  const [showFilteredComments, setShowFilteredComments] = useState(false);

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const lowerText = text.toLowerCase();
    
    const positiveScore = POSITIVE_KEYWORDS.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    const negativeScore = INAPPROPRIATE_KEYWORDS.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (negativeScore > 0) return 'negative';
    if (positiveScore > 0) return 'positive';
    return 'neutral';
  };

  const filterComments = (comment: Comment): { isFiltered: boolean; reason?: string } => {
    if (filterLevel === 'none') return { isFiltered: false };
    
    const sentiment = analyzeSentiment(comment.text);
    const lowerText = comment.text.toLowerCase();
    
    // Strict filtering
    if (filterLevel === 'strict') {
      if (sentiment === 'negative') {
        return { isFiltered: true, reason: 'Contenuto negativo' };
      }
      if (lowerText.length < 3) {
        return { isFiltered: true, reason: 'Commento troppo breve' };
      }
    }
    
    // Moderate filtering (default)
    const hasInappropriate = INAPPROPRIATE_KEYWORDS.some(keyword => 
      lowerText.includes(keyword)
    );
    
    if (hasInappropriate) {
      return { isFiltered: true, reason: 'Linguaggio inappropriato' };
    }
    
    // Check for spam patterns
    const hasRepeatedChars = /(.)\1{4,}/.test(comment.text);
    const isAllCaps = comment.text.length > 10 && comment.text === comment.text.toUpperCase();
    
    if (hasRepeatedChars) {
      return { isFiltered: true, reason: 'Possibile spam - caratteri ripetuti' };
    }
    
    if (isAllCaps) {
      return { isFiltered: true, reason: 'Tutto maiuscolo (potrebbe essere spam)' };
    }
    
    return { isFiltered: false };
  };

  const processedComments = useMemo(() => {
    return comments.map(comment => {
      const sentiment = analyzeSentiment(comment.text);
      const filterResult = filterComments(comment);
      
      return {
        ...comment,
        sentiment,
        isFiltered: filterResult.isFiltered,
        filterReason: filterResult.reason
      };
    });
  }, [comments, filterLevel]);

  const filteredComments = processedComments.filter(comment => 
    showFilteredComments ? true : !comment.isFiltered
  );

  const stats = useMemo(() => {
    const total = processedComments.length;
    const filtered = processedComments.filter(c => c.isFiltered).length;
    const positive = processedComments.filter(c => c.sentiment === 'positive').length;
    
    return { total, filtered, positive };
  }, [processedComments]);

  // Update parent component with filtered results
  useMemo(() => {
    onFilteredCommentsChange(filteredComments);
  }, [filteredComments, onFilteredCommentsChange]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-pink-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Filtro Commenti Intelligente</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilteredComments(!showFilteredComments)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
              showFilteredComments 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showFilteredComments ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showFilteredComments ? 'Nascondi Filtrati' : 'Mostra Filtrati'}
          </button>
        </div>
      </div>

      {/* Filter Level Settings */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Livello di Filtro
        </label>
        <div className="flex gap-2">
          {[
            { value: 'none', label: 'Nessuno', color: 'gray' },
            { value: 'moderate', label: 'Moderato', color: 'blue' },
            { value: 'strict', label: 'Rigoroso', color: 'red' }
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setFilterLevel(value as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterLevel === value
                  ? `bg-${color}-500 text-white`
                  : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Totali</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{stats.positive}</div>
          <div className="text-xs text-gray-500">Positivi</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{stats.filtered}</div>
          <div className="text-xs text-gray-500">Filtrati</div>
        </div>
      </div>

      {/* Filtered Comments Preview */}
      {stats.filtered > 0 && showFilteredComments && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Commenti Filtrati ({stats.filtered})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {processedComments.filter(c => c.isFiltered).map(comment => (
              <div key={comment.id} className="bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 line-through">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">da {comment.author}</p>
                  </div>
                  <div className="ml-2">
                    <span className="px-2 py-1 bg-red-200 text-red-700 text-xs rounded-full">
                      {comment.filterReason}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Status */}
      <div className="text-xs text-gray-500 text-center mt-4">
        Mostrando {filteredComments.length} di {stats.total} commenti
        {stats.filtered > 0 && (
          <span className="text-red-600"> • {stats.filtered} filtrati</span>
        )}
      </div>
    </div>
  );
}