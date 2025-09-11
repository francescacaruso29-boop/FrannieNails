import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { robustFetch } from '@/lib/error-handler';

interface PhotoUploadProps {
  onUpload: (imageUrl: string, description?: string, clientName?: string) => void;
  clientId?: number;
  className?: string;
}

export function PhotoUpload({ onUpload, clientId, className = '' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Solo file immagine sono permessi');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File troppo grande. Massimo 10MB');
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', fileInputRef.current.files[0]);

      // 🛡️ FETCH CON RETRY AUTOMATICO
      const response = await robustFetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      }, {
        maxRetries: 3,
        retryDelay: 1000,
        showToast: false // Gestiamo noi il toast
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Risposta server non valida');
      }

      if (!result.success) {
        throw new Error(result.error || 'Errore durante il caricamento');
      }

      // Call the parent callback with the uploaded image URL
      onUpload(result.imageUrl, description.trim() || undefined, clientName.trim() || undefined);
      
      // Reset form
      setPreview(null);
      setDescription('');
      setClientName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('🚨 Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Errore durante il caricamento';
      setError(`${errorMsg}. Verifica la connessione e riprova.`);
      
      // 🔔 Toast notification per errori gravi
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: "Errore Caricamento",
          description: errorMsg,
          variant: "destructive",
        });
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setDescription('');
    setClientName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Carica Nuova Foto</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {!preview ? (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Clicca per selezionare una foto</p>
            <p className="text-sm text-gray-400">PNG, JPG, GIF fino a 10MB</p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={handleCancel}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome della cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione (opzionale)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aggiungi una descrizione..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !clientName.trim()}
              className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Carica Foto
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}