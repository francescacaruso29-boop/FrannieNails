import { useState, useEffect } from 'react';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ChevronLeft, ChevronRight, Check, X, Palette, Sparkles, Eye } from 'lucide-react';

// import { OnboardingTooltips } from '@/components/onboarding-tooltips';
import { ThemeCustomizer } from '@/components/theme-customizer';

import { AIRecommendationEngine } from '@/components/ai-recommendation-engine';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import backgroundImage from "@assets/c87437e112fda59c5e94f3946e727529_1755382919813.jpg";

interface Photo {
  id: number;
  clientId: number;
  clientName: string;
  filename: string;
  description?: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminGallery() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'pending' | 'approved' | 'rejected'>('home');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPhotoForComment, setSelectedPhotoForComment] = useState<Photo | null>(null);
  const [commentViewIndex, setCommentViewIndex] = useState(0);

  // const [showOnboarding, setShowOnboarding] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [currentTheme, setCurrentTheme] = useState({
    primary: '#EC4899',
    secondary: '#F3E8FF', 
    accent: '#EDAFB8',
    background: '#FDF2F8'
  });
  const queryClient = useQueryClient();

  // Onboarding removed per user request


  // Load photos from database
  const { data: photosData, isLoading: photosLoading, error } = useQuery({
    queryKey: ['/api/admin/photos'],
    queryFn: async () => {
      const response = await fetch('/api/admin/photos');
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (photosData?.success) {
      setPhotos(photosData.photos);
    }
  }, [photosData]);

  // Reset current index when changing sections
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSection]);

  const isLoading = photosLoading;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const filteredPhotos = getFilteredPhotos();
    if (isLeftSwipe && currentIndex < filteredPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToPrevious = () => {
    const filteredPhotos = getFilteredPhotos();
    setCurrentIndex(prev => prev > 0 ? prev - 1 : filteredPhotos.length - 1);
  };

  const goToNext = () => {
    const filteredPhotos = getFilteredPhotos();
    setCurrentIndex(prev => prev < filteredPhotos.length - 1 ? prev + 1 : 0);
  };

  const handleApprove = () => {
    const filteredPhotos = getFilteredPhotos();
    const currentPhoto = filteredPhotos[currentIndex];
    setPhotos(prev => prev.map(photo => 
      photo.id === currentPhoto.id 
        ? { ...photo, status: 'approved' as const }
        : photo
    ));
    alert(`Foto di ${currentPhoto.clientName} approvata!`);
  };

  const handleReject = () => {
    const filteredPhotos = getFilteredPhotos();
    const currentPhoto = filteredPhotos[currentIndex];
    setPhotos(prev => prev.map(photo => 
      photo.id === currentPhoto.id 
        ? { ...photo, status: 'rejected' as const }
        : photo
    ));
    alert(`Foto di ${currentPhoto.clientName} rifiutata!`);
  };

  const getFilteredPhotos = () => {
    switch (activeSection) {
      case 'pending':
        return photos.filter(p => p.status === 'pending');
      case 'approved':
        return photos.filter(p => p.status === 'approved');
      case 'rejected':
        return photos.filter(p => p.status === 'rejected');
      default:
        return photos.filter(p => p.status === 'approved'); // Home mostra solo approvate
    }
  };

  const PhotoDisplay = () => {
    const filteredPhotos = getFilteredPhotos();

    if (activeSection === 'home') {
      // Vista come la vedono le clienti - foto singola con swipe
      if (filteredPhotos.length === 0) {
        return (
          <div className="text-center text-white bg-black/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
            <p className="text-xl mb-2">Nessuna foto approvata</p>
            <p className="text-sm opacity-75">Le foto approvate appariranno qui per i clienti</p>
          </div>
        );
      }

      return (
        <div className="relative w-full max-w-md mx-auto">
          {/* Main Photo Display */}
          <div 
            className="relative aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              setCommentViewIndex(0);
              setShowCommentModal(true);
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="text-4xl mb-2">💅</div>
                <p className="text-sm font-medium">{filteredPhotos[currentIndex]?.clientName}</p>
                <p className="text-xs opacity-75">Nail Art Photo</p>
              </div>
            </div>
            
            {/* Photo Info Overlay - Solo nome cliente per home */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-semibold text-center">{filteredPhotos[currentIndex]?.clientName}</p>
            </div>

            {/* Navigation Arrows */}
            {filteredPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Photo Counter */}
          {filteredPhotos.length > 1 && (
            <div className="text-center mt-2">
              <span className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-gray-700">
                {currentIndex + 1} di {filteredPhotos.length}
              </span>
            </div>
          )}

          {/* Click hint */}
          <div className="text-center mt-2">
            <p className="text-xs text-white/70">Clicca sulla foto per vedere i commenti</p>
          </div>
        </div>
      );
    }

    // Vista admin per gestire foto (singola foto con controlli)
    if (filteredPhotos.length === 0) {
      return (
        <div className="text-center text-white bg-black/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
          <p className="text-xl mb-2">Nessuna foto in questa sezione</p>
          <p className="text-sm opacity-75">
            {activeSection === 'pending' && 'Le foto in attesa di approvazione appariranno qui'}
            {activeSection === 'approved' && 'Le foto approvate appariranno qui'}
            {activeSection === 'rejected' && 'Le foto rifiutate appariranno qui'}
          </p>
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-md mx-auto">
        {/* Main Photo Display */}
        <div 
          className="relative aspect-square bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            setCommentViewIndex(0);
            setShowCommentModal(true);
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-2">💅</div>
              <p className="text-sm font-medium">{filteredPhotos[currentIndex]?.clientName}</p>
              <p className="text-xs opacity-75">Nail Art Photo</p>
            </div>
          </div>
          
          {/* Photo Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{filteredPhotos[currentIndex]?.clientName}</p>
                {filteredPhotos[currentIndex]?.description && (
                  <p className="text-white/80 text-sm">{filteredPhotos[currentIndex].description}</p>
                )}
              </div>
              {/* Status Badge */}
              {filteredPhotos[currentIndex]?.status === 'approved' && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Approvata
                </span>
              )}
              {filteredPhotos[currentIndex]?.status === 'rejected' && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  ✗ Rifiutata
                </span>
              )}
              {filteredPhotos[currentIndex]?.status === 'pending' && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  ⏳ In Attesa
                </span>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}
        </div>

        {/* Photo Counter */}
        {filteredPhotos.length > 1 && (
          <div className="text-center mt-2">
            <span className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-gray-700">
              {currentIndex + 1} di {filteredPhotos.length}
            </span>
          </div>
        )}

        {/* Action Buttons - Solo se la foto è in attesa */}
        {activeSection === 'pending' && filteredPhotos[currentIndex] && (
          <div>
            <div className="text-center mb-2 text-xs text-white/70">
              Status: {filteredPhotos[currentIndex]?.status} | Section: {activeSection}
            </div>
            {filteredPhotos[currentIndex]?.status === 'pending' ? (
              <div className="flex justify-center gap-2 mt-2">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Approving photo:', filteredPhotos[currentIndex].id);
                    updatePhotoStatus(filteredPhotos[currentIndex].id, 'approved');
                  }}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md shadow-md transition-colors text-sm"
                >
                  <Check className="w-3 h-3" />
                  Approva
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Rejecting photo:', filteredPhotos[currentIndex].id);
                    updatePhotoStatus(filteredPhotos[currentIndex].id, 'rejected');
                  }}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md shadow-md transition-colors text-sm"
                >
                  <X className="w-3 h-3" />
                  Rifiuta
                </button>
              </div>
            ) : (
              <div className="text-center text-xs text-white/70">
                Questa foto non è più in attesa di approvazione
              </div>
            )}
          </div>
        )}


      </div>
    );
  };

  const handlePhotoUpload = async (imageUrl: string, description?: string, clientName?: string) => {
    try {
      // Save photo to database (when database is ready)
      const photoData = {
        imageUrl,
        description,
        clientName,
        status: 'pending'
      };
      
      console.log('Photo uploaded:', photoData);
      
      // For now, add to local state as demo
      const newPhoto: Photo = {
        id: Date.now(),
        clientId: 0,
        clientName: clientName || 'Cliente Sconosciuto',
        filename: imageUrl,
        description,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      setPhotos(prev => [newPhoto, ...prev]);
      
      // Refresh photos from database
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
      
      // Switch to pending section to see the new photo
      setActiveSection('pending');
      
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  const updatePhotoStatus = async (photoId: number, status: 'approved' | 'rejected') => {
    try {
      console.log(`Updating photo ${photoId} to status: ${status}`);
      
      const response = await fetch(`/api/admin/photos/${photoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Photo status update result:', result);
        
        // Update local state immediately
        setPhotos(prev => 
          prev.map(photo => 
            photo.id === photoId 
              ? { ...photo, status }
              : photo
          )
        );
        
        // Force refresh from database
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
        await queryClient.refetchQueries({ queryKey: ['/api/admin/photos'] });
        
        console.log('Photo status updated successfully, refreshing gallery');
      } else {
        console.error('Error response:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error updating photo status:', error);
    }
  };

  // Onboarding removed

  // Modal per gestire i commenti
  const CommentModal = () => {
    if (!showCommentModal) return null;

    // Ottieni tutte le foto con commenti
    const photosWithComments = photos.filter(photo => photo.description && photo.description.trim() !== '');
    
    if (photosWithComments.length === 0) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Tutti i Commenti</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-500">Nessun commento disponibile</p>
            </div>
          </div>
        </div>
      );
    }

    const currentPhoto = photosWithComments[commentViewIndex];

    const deleteComment = () => {
      const updatedPhotos = photos.map(photo => 
        photo.id === currentPhoto.id 
          ? { ...photo, description: '' }
          : photo
      );
      setPhotos(updatedPhotos);
      
      // Aggiorna l'indice se necessario
      const newPhotosWithComments = updatedPhotos.filter(photo => photo.description && photo.description.trim() !== '');
      if (newPhotosWithComments.length === 0) {
        setShowCommentModal(false);
      } else if (commentViewIndex >= newPhotosWithComments.length) {
        setCommentViewIndex(newPhotosWithComments.length - 1);
      }
    };

    const goToPreviousComment = () => {
      setCommentViewIndex(prev => prev > 0 ? prev - 1 : photosWithComments.length - 1);
    };

    const goToNextComment = () => {
      setCommentViewIndex(prev => prev < photosWithComments.length - 1 ? prev + 1 : 0);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Tutti i Commenti ({commentViewIndex + 1}/{photosWithComments.length})
            </h3>
            <button
              onClick={() => setShowCommentModal(false)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 relative">
              <p className="text-gray-700 italic">"{currentPhoto.description}"</p>
              <p className="text-xs text-gray-500 mt-2 font-medium">- {currentPhoto.clientName}</p>
            </div>

            {/* Navigation arrows for comments */}
            {photosWithComments.length > 1 && (
              <div className="flex justify-between items-center">
                <button
                  onClick={goToPreviousComment}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <span className="text-sm text-gray-500">
                  Scorri i commenti con le frecce
                </span>
                
                <button
                  onClick={goToNextComment}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}

            <button
              onClick={deleteComment}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ Elimina Questo Commento
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Eliminando il commento, sparirà anche dalla galleria delle clienti
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="text-white text-xl">Caricamento galleria...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      {/* Titolo Galleria centrato */}
      <div className="pt-16 flex justify-center mb-2">
        <h1 
          className="text-3xl text-center font-semibold"
          style={{ 
            fontFamily: 'DM Serif Text, serif',
            color: '#EDAFB8',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.6)'
          }}
        >
          Galleria
        </h1>
      </div>

      {/* Section Tabs */}
      <div className="px-6 mb-4">
        <div className="flex justify-center gap-1 max-w-lg mx-auto">
          <button
            onClick={() => setActiveSection('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === 'home' 
                ? 'bg-pink-500 text-white shadow-md' 
                : 'bg-white/70 text-gray-700 hover:bg-white/85'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveSection('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === 'pending' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'bg-white/70 text-gray-700 hover:bg-white/85'
            }`}
          >
            Da Approvare
          </button>
          <button
            onClick={() => setActiveSection('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === 'approved' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-white/70 text-gray-700 hover:bg-white/85'
            }`}
          >
            Approvate
          </button>
          <button
            onClick={() => setActiveSection('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === 'rejected' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-white/70 text-gray-700 hover:bg-white/85'
            }`}
          >
            Rifiutate
          </button>
        </div>
        

      </div>

      {/* Content Container */}
      <div className="flex-1 px-4" data-tour="main-gallery">

        
        <PhotoDisplay />
      </div>

      {/* Comment Modal */}
      <CommentModal />
      


      {/* Advanced Feature Modals */}
      
      <ThemeCustomizer
        isOpen={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
        onThemeChange={setCurrentTheme}
        currentTheme={currentTheme}
      />
      
      <AIRecommendationEngine
        isOpen={showAIRecommendations}
        onClose={() => setShowAIRecommendations(false)}
        userPreferences={{
          favoriteColors: [currentTheme.primary, currentTheme.accent],
          preferredStyles: ['elegante', 'moderno'],
          lifestyle: 'business'
        }}
      />
    </div>
  );
}

