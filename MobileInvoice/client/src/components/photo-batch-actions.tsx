import { useState } from 'react';
import { Check, X, Trash2, Download, Share2, Eye, EyeOff } from 'lucide-react';

interface Photo {
  id: number;
  clientId: number;
  clientName: string;
  filename: string;
  description?: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PhotoBatchActionsProps {
  photos: Photo[];
  selectedPhotos: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onBatchAction: (action: string, photoIds: number[]) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export function PhotoBatchActions({ 
  photos, 
  selectedPhotos, 
  onSelectionChange, 
  onBatchAction,
  isSelectionMode,
  onToggleSelectionMode 
}: PhotoBatchActionsProps) {
  
  const selectAll = () => {
    const allIds = photos.map(p => p.id);
    onSelectionChange(allIds);
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const handleBatchApprove = () => {
    onBatchAction('approve', selectedPhotos);
    onSelectionChange([]);
  };

  const handleBatchReject = () => {
    onBatchAction('reject', selectedPhotos);
    onSelectionChange([]);
  };

  const handleBatchDelete = () => {
    if (confirm(`Vuoi davvero eliminare ${selectedPhotos.length} foto selezionate?`)) {
      onBatchAction('delete', selectedPhotos);
      onSelectionChange([]);
    }
  };

  if (!isSelectionMode) {
    return (
      <button
        onClick={onToggleSelectionMode}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
      >
        <Eye className="w-4 h-4" />
        Selezione Multipla
      </button>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm">
      {/* Selection Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSelectionMode}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
          >
            <EyeOff className="w-4 h-4" />
            Annulla
          </button>
          <span className="text-sm text-gray-600">
            {selectedPhotos.length} di {photos.length} selezionate
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-pink-500 hover:text-pink-600 font-medium"
          >
            Tutte
          </button>
          <button
            onClick={selectNone}
            className="text-xs text-gray-500 hover:text-gray-600 font-medium"
          >
            Nessuna
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBatchApprove}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md transition-colors"
          >
            <Check className="w-3 h-3" />
            Approva ({selectedPhotos.length})
          </button>
          
          <button
            onClick={handleBatchReject}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
            Rifiuta ({selectedPhotos.length})
          </button>
          
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Elimina ({selectedPhotos.length})
          </button>
          
          <button
            onClick={() => onBatchAction('download', selectedPhotos)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
          >
            <Download className="w-3 h-3" />
            Scarica ({selectedPhotos.length})
          </button>
          
          <button
            onClick={() => onBatchAction('share', selectedPhotos)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-md transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Condividi ({selectedPhotos.length})
          </button>
        </div>
      )}
    </div>
  );
}