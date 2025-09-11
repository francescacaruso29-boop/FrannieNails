import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import backgroundImage from "@assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg";
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Euro, Heart, MessageCircle, Phone, Search, Star, User, Edit, Lock, Unlock, Save, X, ChevronDown, ChevronUp, Plus, Minus, DollarSign } from 'lucide-react';
import { loadRapidBookings, getRapidBookingsForDate } from '@/utils/rapidBookings';
import { Link } from 'wouter';



// Interfaccia Client con codice app
interface Client {
  id: number;
  fullName: string;
  phoneNumber: string;
  uniqueCode: string;
  clientAppCode?: string;
  creditBalance: number;
  advanceBalance: number;
  lastVisit: string;
  nextAppointment: string | null;
  totalVisits: number;
  favoriteService: string;
  notes: string;
  isActive: boolean; // Nuovo campo per attivazione/disattivazione
}

// Mock data per demo (sostituiremo con API reali)
let mockClients: Client[] = [
  {
    id: 1,
    fullName: 'Maria Rossi',
    phoneNumber: '+39 333 1234567',
    uniqueCode: 'MR001',
    clientAppCode: 'MR12APPS',
    creditBalance: 50,
    advanceBalance: 0,
    lastVisit: '2024-08-10',
    nextAppointment: '2024-08-15',
    totalVisits: 12,
    favoriteService: 'Manicure Gel',
    notes: 'Preferisce colori pastello',
    isActive: true
  },
  {
    id: 2,
    fullName: 'Anna Bianchi',
    phoneNumber: '+39 333 2345678',
    uniqueCode: 'AB002',
    clientAppCode: 'AB34NAILZ',
    creditBalance: 0,
    advanceBalance: 30,
    lastVisit: '2024-08-08',
    nextAppointment: '2024-08-14',
    totalVisits: 8,
    favoriteService: 'Nail Art',
    notes: 'Ama i design creativi',
    isActive: true
  },
  {
    id: 3,
    fullName: 'Sofia Verde',
    phoneNumber: '+39 333 3456789',
    uniqueCode: 'SV003',
    clientAppCode: 'SV56BEAUTY',
    creditBalance: 25,
    advanceBalance: 0,
    lastVisit: '2024-08-05',
    nextAppointment: null,
    totalVisits: 15,
    favoriteService: 'Pedicure',
    notes: 'Cliente fedele da 2 anni',
    isActive: false
  }
];

// Timeline events mock data
const mockTimelineEvents = {
  1: [
    { date: '2024-08-10', type: 'appointment', service: 'Manicure Gel', amount: 35 },
    { date: '2024-08-03', type: 'appointment', service: 'Nail Art', amount: 45 },
    { date: '2024-07-28', type: 'payment', service: 'Ricarica credito', amount: 50 },
    { date: '2024-07-25', type: 'appointment', service: 'Manicure Classica', amount: 25 },
  ],
  2: [
    { date: '2024-08-08', type: 'appointment', service: 'Nail Art Deluxe', amount: 60 },
    { date: '2024-08-01', type: 'appointment', service: 'Manicure Gel', amount: 35 },
    { date: '2024-07-20', type: 'payment', service: 'Anticipo', amount: 30 },
  ],
  3: [
    { date: '2024-08-05', type: 'appointment', service: 'Pedicure Spa', amount: 40 },
    { date: '2024-07-30', type: 'appointment', service: 'Manicure + Pedicure', amount: 55 },
    { date: '2024-07-22', type: 'appointment', service: 'Nail Art', amount: 45 },
  ]
};

interface TimelineEvent {
  date: string;
  type: 'appointment' | 'payment';
  service: string;
  amount: number;
}

export default function AdminClients() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [showTimelineSection, setShowTimelineSection] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBalanceEditor, setShowBalanceEditor] = useState(false);
  const [balanceChange, setBalanceChange] = useState({ amount: '', type: 'credit', description: '', operation: 'add' });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    fullName: '',
    phoneNumber: '',
    favoriteService: '',
    clientAppCode: ''
  });
  
  // Carica dati reali delle clienti
  const { data: clientsData, isLoading: isLoadingClients, refetch: refetchClients } = useQuery({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/clients');
      if (!response.ok) throw new Error('Errore nel caricamento clienti');
      const data = await response.json();
      return data.clients || [];
    }
  });
  
  // Usa dati reali se disponibili, altrimenti usa mock
  const clients = clientsData || mockClients;
  
  // Funzione per attivare/disattivare cliente
  const handleToggleClientStatus = async (clientId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Previene l'apertura del modal
    
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/toggle-status`, {
        method: 'PATCH'
      });
      
      if (!response.ok) throw new Error('Errore nel cambio stato');
      
      // Ricarica i dati delle clienti
      if (clientsData) {
        refetchClients();
      } else {
        // Per i mock data, aggiorna localmente
        const clientIndex = mockClients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          mockClients[clientIndex].isActive = !mockClients[clientIndex].isActive;
        }
      }
      
    } catch (error) {
      console.error('Error toggling client status:', error);
    }
  };
  
  // Carica prenotazioni rapide per mostrare slot occupati
  const [rapidBookings, setRapidBookings] = useState<{[key: string]: any[]}>({});
  
  useEffect(() => {
    const bookings = loadRapidBookings();
    setRapidBookings(bookings);
  }, []);

  // Prevent body scroll when modal is open - optimized for Replit app
  useEffect(() => {
    if (showClientModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.height = '';
      };
    }
  }, [showClientModal]);

  // Handle add new client
  const handleAddClient = () => {
    if (!newClientForm.fullName || !newClientForm.phoneNumber || !newClientForm.clientAppCode) return;
    
    const newClient: Client = {
      id: mockClients.length + 1,
      fullName: newClientForm.fullName,
      phoneNumber: newClientForm.phoneNumber,
      uniqueCode: generateUniqueCode(newClientForm.fullName),
      clientAppCode: newClientForm.clientAppCode,
      creditBalance: 0,
      advanceBalance: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      nextAppointment: null,
      totalVisits: 0,
      favoriteService: newClientForm.favoriteService || 'Da definire',
      notes: '',
      isActive: true // Nuove clienti sono attive di default
    };
    
    mockClients.unshift(newClient);
    setNewClientForm({ fullName: '', phoneNumber: '', favoriteService: '', clientAppCode: '' });
    setShowAddClientModal(false);
  };

  // Generate unique code
  const generateUniqueCode = (fullName: string) => {
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    const number = String(mockClients.length + 1).padStart(3, '0');
    return `${initials}${number}`;
  };

  // Generate client app access code
  const generateClientAppCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Prevent scroll jump when balance editor toggles
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Disable smooth scrolling temporarily
      container.style.scrollBehavior = 'auto';
      
      return () => {
        container.style.scrollBehavior = '';
      };
    }
  }, [showBalanceEditor]);

  // Filter clients based on search query
  const filteredClients = mockClients.filter(client =>
    client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phoneNumber.includes(searchQuery) ||
    client.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.favoriteService.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ClientCard = ({ client }: { client: Client }) => (
    <div
      className={`backdrop-blur-md rounded-lg p-2 shadow-lg cursor-pointer group border transition-all ${
        client.isActive 
          ? 'bg-white/90 border-pink-100 hover:shadow-xl' 
          : 'bg-gray-100/70 border-gray-300 opacity-75'
      }`}
      onClick={() => {
        if (!client.isActive) return; // Non aprire modal per clienti disattivate
        setSelectedClient(client);
        setEditForm(client);
        setIsBlocked(false); // Reset blocked status
        setShowClientModal(true);
      }}
    >
      {/* Animated Card Hover Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 to-blue-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform duration-300 ${
              client.isActive 
                ? 'bg-gradient-to-br from-pink-400 to-purple-500' 
                : 'bg-gray-400'
            }`}>
              {client.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                client.isActive 
                  ? 'text-gray-800 group-hover:text-pink-600' 
                  : 'text-gray-500'
              }`}>{client.fullName}</h3>
              <div className="flex items-center gap-1">
                <p className={`text-xs ${
                  client.isActive ? 'text-gray-500' : 'text-gray-400'
                }`}>{client.uniqueCode}</p>
                {!client.isActive && (
                  <span className="text-xs bg-red-100 text-red-600 px-1 rounded font-medium">Disattivata</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end space-y-1">
            {/* Toggle Button - Mobile Optimized */}
            <button
              onClick={(e) => handleToggleClientStatus(client.id, e)}
              className={`p-3 rounded-lg transition-all hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                client.isActive 
                  ? 'text-green-600 hover:bg-green-100 active:bg-green-200' 
                  : 'text-red-600 hover:bg-red-100 active:bg-red-200'
              }`}
              title={client.isActive ? 'Disattiva cliente' : 'Attiva cliente'}
            >
              {client.isActive ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
            {client.creditBalance > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                +€{client.creditBalance}
              </span>
            )}
            {client.advanceBalance > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                A€{client.advanceBalance}
              </span>
            )}
            {client.creditBalance === 0 && client.advanceBalance === 0 && (
              <span className="text-xs text-gray-400">
                €0
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">{client.phoneNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{client.totalVisits} visite</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2">
            <Heart className="w-5 h-5 text-pink-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">{client.favoriteService}</span>
          </div>
          <div className="flex items-center space-x-2 col-span-2">
            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">
              {client.nextAppointment ? new Date(client.nextAppointment).toLocaleDateString('it-IT') : 'Nessun appuntamento'}
            </span>
          </div>
        </div>

        {/* Mobile-optimized action buttons */}
        <div className="mt-2 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0">
          <button 
            className="p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Invia messaggio"
          >
            <MessageCircle className="w-6 h-6 text-blue-500" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-green-50 active:bg-green-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Visualizza calendario"
          >
            <Calendar className="w-6 h-6 text-green-500" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-yellow-50 active:bg-yellow-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Aggiungi ai preferiti"
          >
            <Star className="w-6 h-6 text-yellow-500" />
          </button>
        </div>
      </div>
    </div>
  );

  // Comprehensive Client Management Modal
  const ClientManagementModal = () => {
    const events = mockTimelineEvents[selectedClient?.id as keyof typeof mockTimelineEvents] || [];
    
    const handleSave = () => {
      console.log('Saving client data:', editForm);
      setIsEditing(false);
      setShowClientModal(false);
    };

    const handleToggleBlock = () => {
      setIsBlocked(!isBlocked);
    };

    const handleBalanceChange = () => {
      const amount = parseFloat(balanceChange.amount);
      if (isNaN(amount) || amount <= 0 || !selectedClient) return;
      
      // Calculate new balance based on operation
      const currentClient = mockClients.find(c => c.id === selectedClient.id);
      if (!currentClient) return;

      let newCreditBalance = currentClient.creditBalance;
      let newAdvanceBalance = currentClient.advanceBalance;

      if (balanceChange.type === 'credit') {
        if (balanceChange.operation === 'add') {
          newCreditBalance += amount;
        } else {
          newCreditBalance = Math.max(0, newCreditBalance - amount);
        }
      } else { // advance
        if (balanceChange.operation === 'add') {
          newAdvanceBalance += amount;
        } else {
          newAdvanceBalance = Math.max(0, newAdvanceBalance - amount);
        }
      }

      // Update the client data (in real app, this would be an API call)
      mockClients = mockClients.map(client => 
        client.id === selectedClient.id 
          ? { ...client, creditBalance: newCreditBalance, advanceBalance: newAdvanceBalance }
          : client
      );
      
      // Update selected client
      setSelectedClient({ ...selectedClient, creditBalance: newCreditBalance, advanceBalance: newAdvanceBalance });
      
      console.log('Balance updated:', {
        clientId: selectedClient.id,
        operation: balanceChange.operation,
        amount: amount,
        type: balanceChange.type,
        newCreditBalance,
        newAdvanceBalance
      });
      
      // Reset form
      setBalanceChange({ amount: '', type: 'credit', description: '', operation: 'add' });
      setShowBalanceEditor(false);
    };

    if (!selectedClient) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
        onClick={() => setShowClientModal(false)}
      >
        <div 
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fisso */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedClient.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedClient.fullName}</h2>
                  <p className="text-gray-500">{selectedClient.uniqueCode}</p>
                  {selectedClient.clientAppCode && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-mono">
                        App: {selectedClient.clientAppCode}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedClient.clientAppCode || '')}
                        className="text-xs bg-green-200 text-green-700 px-1 py-0.5 rounded"
                        title="Copia codice cliente"
                      >
                        📋
                      </button>
                    </div>
                  )}
                  {isBlocked && <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">BLOCCATA</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBlock();
                  }}
                  className={`p-2 rounded-lg ${isBlocked ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                  title={isBlocked ? 'Sblocca cliente' : 'Blocca cliente'}
                >
                  {isBlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(!isEditing);
                  }}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg"
                  title="Modifica dati"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowClientModal(false);
                  }}
                  className="p-2 text-gray-400 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenuto scrollabile */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 modal-scrollable-content" 
            style={{ 
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Dati Cliente */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Informazioni Cliente</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.fullName || ''}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEditForm({...editForm, fullName: e.target.value});
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">{selectedClient.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phoneNumber || ''}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEditForm({...editForm, phoneNumber: e.target.value});
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">{selectedClient.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Servizio Preferito</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.favoriteService || ''}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEditForm({...editForm, favoriteService: e.target.value});
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">{selectedClient.favoriteService}</p>
                    )}
                  </div>
                </div>

                {/* Saldo */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Situazione Finanziaria</h4>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Salva la posizione scroll corrente
                        const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                        
                        // Usa flushSync per rendering sincrono
                        flushSync(() => {
                          setShowBalanceEditor(!showBalanceEditor);
                        });
                        
                        // Ripristina immediatamente la posizione
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTop = currentScroll;
                        }
                      }}
                      className="p-1 bg-pink-100 text-pink-600 rounded-lg focus:outline-none"
                      title="Modifica saldo"

                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-green-600 font-bold text-xl">
                        <Euro className="w-5 h-5" />
                        <span>{selectedClient.creditBalance}</span>
                      </div>
                      <p className="text-sm text-gray-600">Credito</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-blue-600 font-bold text-xl">
                        <Euro className="w-5 h-5" />
                        <span>{selectedClient.advanceBalance}</span>
                      </div>
                      <p className="text-sm text-gray-600">Anticipo</p>
                    </div>
                  </div>

                  {/* Balance Editor */}
                  {showBalanceEditor && (
                    <div className="border-t pt-4 space-y-3">
                      {/* Operation Type */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                            setBalanceChange({...balanceChange, operation: 'add'});
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollTop = currentScroll;
                            }
                          }}
                          className={`p-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 focus:outline-none ${
                            balanceChange.operation === 'add' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Aggiungi</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                            setBalanceChange({...balanceChange, operation: 'subtract'});
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollTop = currentScroll;
                            }
                          }}
                          className={`p-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 focus:outline-none ${
                            balanceChange.operation === 'subtract' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                          <span>Sottrai</span>
                        </button>
                      </div>

                      {/* Balance Type */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                            setBalanceChange({...balanceChange, type: 'credit'});
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollTop = currentScroll;
                            }
                          }}
                          className={`p-2 rounded-lg text-sm font-medium focus:outline-none ${
                            balanceChange.type === 'credit' 
                              ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {balanceChange.operation === 'add' ? 'Credito' : 'Usa Credito'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                            setBalanceChange({...balanceChange, type: 'advance'});
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollTop = currentScroll;
                            }
                          }}
                          className={`p-2 rounded-lg text-sm font-medium focus:outline-none ${
                            balanceChange.type === 'advance' 
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {balanceChange.operation === 'add' ? 'Anticipo' : 'Usa Anticipo'}
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Display dell'importo */}
                        <div className="w-full p-3 border-2 border-pink-300 rounded-lg text-base bg-pink-50 text-center">
                          <span className="text-gray-600">Importo: </span>
                          <span className="font-bold text-pink-600 text-lg">
                            €{balanceChange.amount || '0'}
                          </span>
                        </div>
                        
                        {/* Tastiera numerica personalizzata */}
                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg">
                          {[1,2,3,4,5,6,7,8,9].map(num => (
                            <button
                              key={num}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                                const newAmount = (balanceChange.amount || '') + num.toString();
                                setBalanceChange({...balanceChange, amount: newAmount});
                                requestAnimationFrame(() => {
                                  if (scrollContainerRef.current) {
                                    scrollContainerRef.current.scrollTop = currentScroll;
                                  }
                                });
                              }}
                              className="h-12 bg-white border border-gray-300 rounded-lg text-lg font-semibold text-gray-800 focus:outline-none active:bg-gray-200"
                              type="button"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                              if (balanceChange.amount && !balanceChange.amount.includes('.')) {
                                setBalanceChange({...balanceChange, amount: balanceChange.amount + '.'});
                              }
                              requestAnimationFrame(() => {
                                if (scrollContainerRef.current) {
                                  scrollContainerRef.current.scrollTop = currentScroll;
                                }
                              });
                            }}
                            className="h-12 bg-white border border-gray-300 rounded-lg text-lg font-semibold text-gray-800 focus:outline-none active:bg-gray-200"
                            type="button"
                          >
                            .
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                              const newAmount = (balanceChange.amount || '') + '0';
                              setBalanceChange({...balanceChange, amount: newAmount});
                              requestAnimationFrame(() => {
                                if (scrollContainerRef.current) {
                                  scrollContainerRef.current.scrollTop = currentScroll;
                                }
                              });
                            }}
                            className="h-12 bg-white border border-gray-300 rounded-lg text-lg font-semibold text-gray-800 focus:outline-none active:bg-gray-200"
                            type="button"
                          >
                            0
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                              const newAmount = balanceChange.amount?.slice(0, -1) || '';
                              setBalanceChange({...balanceChange, amount: newAmount});
                              requestAnimationFrame(() => {
                                if (scrollContainerRef.current) {
                                  scrollContainerRef.current.scrollTop = currentScroll;
                                }
                              });
                            }}
                            className="h-12 bg-red-100 border border-red-300 rounded-lg text-lg font-semibold text-red-600 focus:outline-none active:bg-red-300 flex items-center justify-center"
                            type="button"
                          >
                            ⌫
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Descrizione (opzionale)"
                          value={balanceChange.description}
                          autoComplete="off"
                          autoFocus={false}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.focus();
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            const currentScroll = scrollContainerRef.current?.scrollTop || 0;
                            setBalanceChange({...balanceChange, description: e.target.value});
                            requestAnimationFrame(() => {
                              if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollTop = currentScroll;
                              }
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBalanceEditor(false);
                          }}
                          className="flex-1 p-2 text-gray-600 bg-gray-100 rounded-lg text-sm focus:outline-none"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBalanceChange();
                          }}
                          disabled={!balanceChange.amount || parseFloat(balanceChange.amount) <= 0}
                          className={`flex-1 p-2 text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-sm focus:outline-none ${
                            balanceChange.operation === 'add' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {balanceChange.operation === 'add' ? 'Aggiungi' : 'Sottrai'} €{balanceChange.amount || '0'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistiche */}
                <div className="bg-pink-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">Statistiche</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <span className="text-2xl font-bold text-pink-600">{selectedClient.totalVisits}</span>
                      <p className="text-sm text-gray-600">Visite Totali</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Ultima Visita</span>
                      <p className="font-semibold">{new Date(selectedClient.lastVisit).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Appuntamenti */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">Timeline Appuntamenti</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTimelineSection(!showTimelineSection);
                    }}
                    className="flex items-center space-x-1 text-pink-600 focus:outline-none"
                  >
                    <span className="text-sm">{showTimelineSection ? 'Nascondi' : 'Mostra'}</span>
                    {showTimelineSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {showTimelineSection && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Mostra prenotazioni rapide per oggi */}
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayBookings = rapidBookings[today] || [];
                      const clientBookings = todayBookings.filter(booking => 
                        booking.phone === selectedClient?.phoneNumber || 
                        booking.name.toLowerCase().includes(selectedClient?.fullName.toLowerCase() || '')
                      );
                      
                      return clientBookings.map((booking, index) => (
                        <div key={`rapid-${index}`} className="flex items-start space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 rounded-full mt-2 bg-pink-500"></div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-800">{booking.service}</h5>
                              <span className="text-xs text-gray-500">Oggi - {booking.time}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-800">
                                Prenotazione Rapida
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                    
                    {events.map((event, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full mt-2 ${event.type === 'appointment' ? 'bg-pink-500' : 'bg-green-500'}`}></div>
                          {index < events.length - 1 && <div className="w-0.5 h-6 bg-gray-300 ml-1 mt-2"></div>}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-800">{event.service}</h5>
                            <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('it-IT')}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Euro className="w-3 h-3 text-green-600" />
                            <span className="text-green-600 font-semibold text-sm">€{event.amount}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${event.type === 'appointment' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'}`}>
                              {event.type === 'appointment' ? 'Servizio' : 'Pagamento'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              {/* Removed: Scheda Cliente (cartaceo) */}

              {/* Pulsanti Edit/Save */}
              {isEditing ? (
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(false);
                    }}
                    className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    className="px-6 py-2 bg-pink-500 text-white rounded-lg flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salva Modifiche</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InteractiveTimeline = ({ clientId }: { clientId: number }) => {
    const events = mockTimelineEvents[clientId as keyof typeof mockTimelineEvents] || [];
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTimeline(false)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Timeline - {selectedClient?.fullName}</h2>
              <button 
                onClick={() => setShowTimeline(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-96">
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer group">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-2 ${event.type === 'appointment' ? 'bg-pink-500' : 'bg-green-500'}`}></div>
                    {index < events.length - 1 && <div className="w-0.5 h-8 bg-gray-300 ml-1.5 mt-2"></div>}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">{event.service}</h4>
                      <span className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('it-IT')}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Euro className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">€{event.amount}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${event.type === 'appointment' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'}`}>
                        {event.type === 'appointment' ? 'Servizio' : 'Pagamento'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="h-screen bg-cover bg-center bg-no-repeat flex flex-col" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        {/* Header fisso */}
        <div className="flex-shrink-0">
          {/* Pulsante Aggiungi Cliente */}
          <div className="absolute top-6 right-6 z-20">
            <button
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center group"
              onClick={() => setShowAddClientModal(true)}
            >
              <span className="text-2xl font-light text-pink-500">+</span>
            </button>
          </div>
          
          {/* Titolo Clienti centrato */}
          <div className="pt-8 flex justify-center mb-6">
            <h1 
              className="text-4xl text-center font-semibold"
              style={{ 
                fontFamily: 'DM Serif Text, serif',
                color: '#EDAFB8',
                textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.6)'
              }}
            >
              Clienti
            </h1>
          </div>

          {/* Barra di Ricerca */}
          <div className="px-6 mb-6">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cerca per nome, telefono, codice o servizio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-md rounded-xl border border-pink-200 focus:outline-none text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-center text-sm text-gray-600">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 'i' : 'e'} trovata/e
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sezione scrollabile delle carte clienti - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">Nessuna cliente trovata</h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? `Nessun risultato per "${searchQuery}"`
                  : 'Non ci sono clienti da mostrare'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Cancella ricerca
                </button>
              )}
            </div>
          )}
        </div>

        {/* Client Management Modal */}
        {showClientModal && selectedClient && (
          <ClientManagementModal />
        )}

        {/* Timeline Interattiva */}
        {showTimeline && selectedClient && (
          <InteractiveTimeline clientId={selectedClient.id} />
        )}

        {/* Add Client Modal */}
        {showAddClientModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddClientModal(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Aggiungi Nuovo Cliente</h2>
                  <button 
                    onClick={() => setShowAddClientModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo*</label>
                  <input
                    type="text"
                    placeholder="Es: Maria Rossi"
                    value={newClientForm.fullName}
                    onChange={(e) => setNewClientForm({...newClientForm, fullName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numero di Telefono*</label>
                  <input
                    type="tel"
                    placeholder="Es: +39 333 1234567"
                    value={newClientForm.phoneNumber}
                    onChange={(e) => setNewClientForm({...newClientForm, phoneNumber: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servizio Preferito</label>
                  <input
                    type="text"
                    placeholder="Es: Manicure Gel, Ricostruzione..."
                    value={newClientForm.favoriteService}
                    onChange={(e) => setNewClientForm({...newClientForm, favoriteService: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Codice Accesso Cliente*</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Codice per l'app cliente"
                      value={newClientForm.clientAppCode}
                      onChange={(e) => setNewClientForm({...newClientForm, clientAppCode: e.target.value.toUpperCase()})}
                      className="flex-1 p-3 border border-gray-300 rounded-lg font-mono tracking-wider focus:outline-none"
                      maxLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setNewClientForm({...newClientForm, clientAppCode: generateClientAppCode()})}
                      className="px-4 py-3 bg-pink-500 text-white rounded-lg font-medium focus:outline-none"
                    >
                      Genera
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Questo codice verrà dato alla cliente per accedere alla sua app</p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddClientModal(false)}
                    className="flex-1 p-3 text-gray-600 bg-gray-100 rounded-lg font-medium focus:outline-none"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddClient}
                    disabled={!newClientForm.fullName || !newClientForm.phoneNumber || !newClientForm.clientAppCode}
                    className="flex-1 p-3 bg-pink-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none"
                  >
                    Aggiungi Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}