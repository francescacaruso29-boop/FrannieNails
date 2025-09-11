import { useState, useEffect } from "react";
import { Search, X, Camera, LogOut, MoreHorizontal, Heart, Settings, FileText, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { AdminHamburgerMenu } from "@/components/admin-hamburger-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { calculateAppointmentCost, getServicePrice } from "@shared/service-prices";

interface Photo {
  id: number;
  imageUrl: string;
  clientName: string;
  approved: boolean;
  createdAt: string;
}

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  clientId: number;
}

interface ClientData {
  id: number;
  fullName: string;
  phoneNumber: string;
  creditBalance: number;
  advanceBalance: number;
}

export default function ProfilePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientName, setClientName] = useState("Maria Rossi");
  const [clientId, setClientId] = useState<number>(0);
  const [profileImage, setProfileImage] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageType, setImageType] = useState<'profile' | 'header'>('profile');
  const [activeTab, setActiveTab] = useState<'photos' | 'appointments' | 'balance'>('photos');
  const [, setLocation] = useLocation();

  useEffect(() => {
    const clientData = localStorage.getItem('frannie-client-data');
    if (clientData) {
      const client = JSON.parse(clientData);
      setClientName(client.fullName || client.clientName || "Cliente");
      setClientId(client.id || 0);
    }
  }, []);

  // Fetch user's photos from gallery
  const { data: photosData = [] } = useQuery({
    queryKey: ['/api/photos/approved'],
    queryFn: async () => {
      const response = await fetch('/api/photos/approved');
      const result = await response.json();
      return result.success ? result.photos : [];
    }
  });

  // Fetch client's appointments
  const { data: appointmentsData = [] } = useQuery({
    queryKey: ['/api/appointments', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await fetch('/api/appointments');
      const result = await response.json();
      if (result.success) {
        return result.appointments.filter((apt: Appointment) => apt.clientId === clientId);
      }
      return [];
    },
    enabled: !!clientId
  });

  // Fetch client data for balance
  const { data: clientData } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await fetch(`/api/clients/${clientId}`);
      const result = await response.json();
      return result.success ? result.client : null;
    },
    enabled: !!clientId
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'header') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'profile') {
          setProfileImage(result);
        } else {
          setHeaderImage(result);
        }
        // Store in localStorage with error handling
        try {
          localStorage.setItem(`frannie-${type}-image`, result);
        } catch (error) {
          console.warn('Unable to save image (quota exceeded):', error);
          // Clear old images and retry
          try {
            localStorage.removeItem('frannie-profile-image');
            localStorage.removeItem('frannie-header-image');
            localStorage.setItem(`frannie-${type}-image`, result);
          } catch (retryError) {
            console.warn('Failed to save image after clearing:', retryError);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openImageModal = (type: 'profile' | 'header') => {
    setImageType(type);
    setShowImageModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('frannie-client-data');
    localStorage.removeItem('frannie-remember-data');
    localStorage.removeItem('frannie-profile-image');
    localStorage.removeItem('frannie-header-image');
    setLocation('/');
  };

  // Load saved images with error handling
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('frannie-profile-image');
      const savedHeader = localStorage.getItem('frannie-header-image');
      if (savedProfile) setProfileImage(savedProfile);
      if (savedHeader) setHeaderImage(savedHeader);
    } catch (error) {
      console.warn('Error loading profile images from localStorage:', error);
    }
  }, []);

  // Filter photos for this user
  const userPhotos = Array.isArray(photosData) ? photosData.filter((photo: Photo) => 
    photo.clientName.toLowerCase() === clientName.toLowerCase()
  ) : [];

  // Separate past and future appointments
  const today = new Date();
  const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : [];
  const pastAppointments = appointmentsArray.filter((apt: Appointment) => 
    new Date(apt.appointmentDate) < today
  ).sort((a: Appointment, b: Appointment) => 
    new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );

  const futureAppointments = appointmentsArray.filter((apt: Appointment) => 
    new Date(apt.appointmentDate) >= today
  ).sort((a: Appointment, b: Appointment) => 
    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate total spent from appointments
  const totalSpent = calculateAppointmentCost(pastAppointments);

  return (
    <div className="min-h-screen bg-white pb-20">
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />

      {/* Header Image with Profile Picture */}
      <div className="relative">
        {/* Header Background */}
        <div 
          className="h-48 w-full relative cursor-pointer"
          style={{ backgroundColor: '#d38a77' }}
          onClick={() => openImageModal('header')}
        >
          {headerImage && (
            <img 
              src={headerImage} 
              alt="Header" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div 
            className="relative cursor-pointer"
            onClick={() => openImageModal('profile')}
          >
            <div 
              className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: profileImage ? 'transparent' : '#d38a77' }}
            >
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                clientName.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <Camera className="h-4 w-4" style={{ color: '#d38a77' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-16 px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{clientName}</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 justify-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'photos' 
                ? 'text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={activeTab === 'photos' ? { backgroundColor: '#d38a77' } : {}}
          >
            Foto
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'appointments' 
                ? 'text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={activeTab === 'appointments' ? { backgroundColor: '#d38a77' } : {}}
          >
            Appuntamenti
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'balance' 
                ? 'text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={activeTab === 'balance' ? { backgroundColor: '#d38a77' } : {}}
          >
            Saldo
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-3 gap-1">
            {userPhotos.length > 0 ? (
              userPhotos.map((photo: Photo) => (
                <div key={photo.id} className="aspect-square">
                  <img 
                    src={photo.imageUrl} 
                    alt="Gallery" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-2" style={{ color: '#d38a77' }} />
                <p>Nessuna foto caricata</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Swap Appointments Button */}
            <div className="text-center">
              <Button
                onClick={() => setLocation('/swap')}
                className="text-white mb-4"
                style={{ backgroundColor: '#d38a77' }}
              >
                🔄 Scambia Appuntamenti
              </Button>
            </div>

            {/* Future Appointments */}
            {futureAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#d38a77' }}>
                  Appuntamenti Futuri
                </h3>
                <div className="space-y-3">
                  {futureAppointments.map((apt: Appointment) => (
                    <div key={apt.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">{apt.service}</p>
                          <p className="text-sm text-green-600">{formatDate(apt.appointmentDate)}</p>
                          <p className="text-sm text-green-600">ore {apt.appointmentTime}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500">📅</div>
                          <p className="text-xs text-green-600 mt-1">€{getServicePrice(apt.service)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#d38a77' }}>
                  Storico Appuntamenti
                </h3>
                <div className="space-y-3">
                  {pastAppointments.slice(0, 5).map((apt: Appointment) => (
                    <div key={apt.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{apt.service}</p>
                          <p className="text-sm text-gray-600">{formatDate(apt.appointmentDate)}</p>
                          <p className="text-sm text-gray-600">ore {apt.appointmentTime}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400">✓</div>
                          <p className="text-xs text-gray-600 mt-1">€{getServicePrice(apt.service)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {futureAppointments.length === 0 && pastAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nessun appuntamento trovato</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-4">
            {/* Credit Balance */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">Credito Disponibile</h3>
                  <p className="text-sm text-green-600">Soldi che hai di credito</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-800">
                    €{(clientData?.creditBalance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">Disponibile</p>
                </div>
              </div>
            </div>

            {/* Advance Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800">Anticipo Versato</h3>
                  <p className="text-sm text-blue-600">Soldi che hai anticipato</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-800">
                    €{(clientData?.advanceBalance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600">Anticipato</p>
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-800">Totale Speso</h3>
                  <p className="text-sm text-orange-600">Costo dei trattamenti effettuati</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-800">
                    €{totalSpent.toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-600">{pastAppointments.length} trattamenti</p>
                </div>
              </div>
            </div>

            {/* Total Balance Summary */}
            <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: '#d38a77' }}>
              <div className="text-center">
                <h3 className="font-semibold mb-3" style={{ color: '#d38a77' }}>
                  Situazione Finanziaria
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credito disponibile:</span>
                    <span className="font-medium text-green-600">€{(clientData?.creditBalance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anticipo versato:</span>
                    <span className="font-medium text-blue-600">€{(clientData?.advanceBalance || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totale speso:</span>
                    <span className="font-medium text-orange-600">€{totalSpent.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Saldo complessivo:</span>
                      <span className="font-bold" style={{ color: '#d38a77' }}>
                        €{((clientData?.creditBalance || 0) + (clientData?.advanceBalance || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View All Data Button */}
        <Button 
          onClick={() => setLocation('/client-data')}
          className="mt-8 mb-3 w-full text-white"
          style={{ backgroundColor: '#d38a77' }}
        >
          <FileText className="h-4 w-4 mr-2" />
          Vedi tutti i miei dati
        </Button>

        {/* Client Card Button */}
        <Button 
          onClick={() => setLocation('/client-card')}
          variant="outline" 
          className="mb-3 w-full"
          style={{ borderColor: '#d38a77', color: '#d38a77' }}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Scheda Cliente
        </Button>

        {/* Settings Button */}
        <Button 
          onClick={() => setLocation('/settings')}
          variant="outline" 
          className="mb-2 w-full"
          style={{ borderColor: '#d38a77', color: '#d38a77' }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Impostazioni
        </Button>

        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="mb-4 w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Image Upload Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Cambia {imageType === 'profile' ? 'Foto Profilo' : 'Header'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleImageUpload(e, imageType);
                setShowImageModal(false);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}