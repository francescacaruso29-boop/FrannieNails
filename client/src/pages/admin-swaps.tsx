import { useState, useEffect } from "react";
import { ArrowLeft, Users, Calendar, Clock, Check, X, AlertCircle, MessageSquare, Palette, Sparkles, Bell, Eye, EyeOff, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { AIRecommendationEngine } from '@/components/ai-recommendation-engine';
import backgroundImage from "@assets/c87437e112fda59c5e94f3946e727529_1755444817051.jpg";

interface SwapRequest {
  id: number;
  requesterClientId: number;
  requesterAppointmentId: number;
  targetClientId: number;
  targetAppointmentId: number;
  status: string;
  requestMessage?: string;
  createdAt: string;
  respondedAt?: string;
  requesterClient?: {
    fullName: string;
    phoneNumber: string;
  };
  targetClient?: {
    fullName: string;
    phoneNumber: string;
  };
  requesterAppointment?: {
    date: string;
    time: string;
    service: string;
  };
  targetAppointment?: {
    date: string;
    time: string;
    service: string;
  };
}

export default function AdminSwapsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Advanced features state (onboarding removed)
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [activeSection, setActiveSection] = useState<'client-requests' | 'admin-moves' | 'history'>('client-requests');
  const [showNewSwapDialog, setShowNewSwapDialog] = useState(false);
  const [showClientSwapDialog, setShowClientSwapDialog] = useState(false);
  const [newSwapData, setNewSwapData] = useState({
    requesterClientId: '',
    requesterAppointmentId: '',
    targetClientId: '',
    targetAppointmentId: '',
    requestMessage: ''
  });
  const [clientSwapData, setClientSwapData] = useState({
    requesterClientId: '',
    requesterAppointmentId: '',
    targetClientId: '',
    targetAppointmentId: '',
    requestMessage: ''
  });
  const [currentTheme, setCurrentTheme] = useState({
    primary: '#EC4899',
    secondary: '#F3E8FF',
    accent: '#EDAFB8', 
    background: '#FDF2F8'
  });

  // Fetch swap requests
  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
    queryFn: async () => {
      const response = await fetch('/api/swap-requests');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/clients');
      const result = await response.json();
      return result.success ? result.clients : [];
    }
  });

  // Fetch appointments for dropdown
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/admin/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/appointments');
      const result = await response.json();
      return result.success ? result.appointments : [];
    }
  });

  // Fetch admin notifications
  const { data: adminNotifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();
      return result.success ? result.notifications : [];
    },
    refetchInterval: 30000 // Ricarica ogni 30 secondi
  });

  // Mutation per marcare notifica come letta
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/unread'] });
      refetchNotifications();
    }
  });

  // Mutation per simulare risposta cliente
  const simulateClientResponseMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number, response: 'accepted' | 'rejected' }) => {
      const res = await fetch(`/api/client/swap-requests/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error('Failed to respond to swap request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      refetchNotifications();
      toast({
        title: "Risposta simulata",
        description: "La cliente ha risposto alla richiesta di spostamento",
      });
    }
  });

  // Mutation for creating new swap
  const createSwapMutation = useMutation({
    mutationFn: async (swapData: any) => {
      const response = await fetch('/api/swap-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapData)
      });
      
      if (!response.ok) {
        throw new Error(`Errore server: ${response.status}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Risposta server non valida');
      }
      
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      
      // Determina il tipo di richiesta dal requestType
      const isAdminMove = variables.requestType === 'admin_move';
      
      // Chiudi il dialog corretto e resetta i dati
      if (isAdminMove) {
        setShowNewSwapDialog(false);
        setNewSwapData({
          requesterClientId: '',
          requesterAppointmentId: '',
          targetClientId: '',
          targetAppointmentId: '',
          requestMessage: ''
        });
      } else {
        setShowClientSwapDialog(false);
        setClientSwapData({
          requesterClientId: '',
          requesterAppointmentId: '',
          targetClientId: '',
          targetAppointmentId: '',
          requestMessage: ''
        });
      }
      
      toast({
        title: "Richiesta Creata",
        description: isAdminMove 
          ? "La richiesta di spostamento è stata inviata al cliente"
          : "La richiesta di scambio è stata creata. I clienti devono accettare tramite l'app",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione della richiesta",
        variant: "destructive",
      });
    }
  });

  // Mutation for approving/rejecting admin_move swaps ONLY
  const handleAdminSwapMutation = useMutation({
    mutationFn: async ({ swapId, action, requestType }: { swapId: number; action: 'approve' | 'reject'; requestType: string }) => {
      // Solo le richieste admin_move possono essere gestite dall'admin
      if (requestType !== 'admin_move') {
        throw new Error('Solo le richieste di spostamento admin possono essere gestite qui');
      }
      
      const response = await fetch(`/api/admin/swap-requests/${swapId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Errore server: ${response.status}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Risposta server non valida');
      }
      
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: variables.action === 'approve' ? "Scambio Approvato" : "Scambio Rifiutato",
        description: variables.action === 'approve' 
          ? "Gli appuntamenti sono stati scambiati. Il calendario si aggiornerà automaticamente."
          : "La richiesta di scambio è stata rifiutata",
      });

      // Refresh calendar data
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'operazione",
        variant: "destructive",
      });
    }
  });

  // Handle new swap submission
  const handleSubmitNewSwap = () => {
    // Per richieste admin (spostamento in slot libero), targetClientId può essere null
    if (!newSwapData.requesterClientId || !newSwapData.requesterAppointmentId || 
        !newSwapData.targetAppointmentId) {
      toast({
        title: "Errore", 
        description: "Seleziona cliente, appuntamento attuale e nuovo orario",
        variant: "destructive",
      });
      return;
    }
    
    // Creiamo una richiesta di spostamento admin
    createSwapMutation.mutate({
      requesterClientId: parseInt(newSwapData.requesterClientId),
      requesterAppointmentId: parseInt(newSwapData.requesterAppointmentId),
      targetClientId: null, // Null per slot libero
      targetAppointmentId: null, // Null per slot libero
      requestType: 'admin_move',
      requestMessage: newSwapData.requestMessage || 'L\'admin ha richiesto lo spostamento del tuo appuntamento',
      newSlotInfo: JSON.stringify({
        slotId: newSwapData.targetAppointmentId,
        date: getSlotDate(newSwapData.targetAppointmentId),
        time: getSlotTime(newSwapData.targetAppointmentId),
        service: getOriginalService(newSwapData.requesterAppointmentId)
      })
    });
  };

  // Helper functions per gestire gli slot liberi
  const getSlotDate = (slotId: string) => {
    switch (slotId) {
      case 'free-slot-1':
      case 'free-slot-2':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      case 'free-slot-3':
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
        return nextMonday.toISOString().split('T')[0];
      default:
        return new Date().toISOString().split('T')[0];
    }
  };

  const getSlotTime = (slotId: string) => {
    switch (slotId) {
      case 'free-slot-1': return '09:00';
      case 'free-slot-2': return '15:00';
      case 'free-slot-3': return '11:00';
      default: return '09:00';
    }
  };

  const getOriginalService = (appointmentId: string) => {
    const apt = appointments.find((a: any) => a.id.toString() === appointmentId);
    return apt?.service || 'Servizio Generico';
  };

  // Handle client-to-client swap submission  
  const handleSubmitClientSwap = () => {
    if (!clientSwapData.requesterClientId || !clientSwapData.requesterAppointmentId || 
        !clientSwapData.targetClientId || !clientSwapData.targetAppointmentId) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori per lo scambio tra clienti",
        variant: "destructive",
      });
      return;
    }
    
    // Creiamo una richiesta di scambio client-client
    createSwapMutation.mutate({
      requesterClientId: parseInt(clientSwapData.requesterClientId),
      requesterAppointmentId: parseInt(clientSwapData.requesterAppointmentId),
      targetClientId: parseInt(clientSwapData.targetClientId),
      targetAppointmentId: parseInt(clientSwapData.targetAppointmentId),
      requestType: 'client_swap',
      requestMessage: clientSwapData.requestMessage || 'L\'admin ha proposto questo scambio'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'accepted': return 'Approvato';
      case 'rejected': return 'Rifiutato';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Caricamento scambi...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      {/* Titolo Scambi centrato */}
      <div className="pt-8 flex justify-center mb-6">
        <h1 
          className="text-3xl text-center font-semibold"
          style={{ 
            fontFamily: 'DM Serif Text, serif',
            color: '#EDAFB8',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.6)'
          }}
        >
          Scambi
        </h1>
      </div>

      {/* Pulsanti Sezioni */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 justify-center flex-wrap">
          {/* Scambi Clienti */}
          <button 
            onClick={() => setActiveSection('client-requests')}
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-all ${
              activeSection === 'client-requests' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-blue-50'
            }`}
          >
            Scambi Clienti ({swapRequests.filter((req: SwapRequest) => req.status === 'pending').length})
          </button>

          {/* Sposta Appuntamenti */}
          <button 
            onClick={() => setActiveSection('admin-moves')}
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-all ${
              activeSection === 'admin-moves' 
                ? 'bg-purple-500 text-white border-purple-500' 
                : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-purple-50'
            }`}
          >
            Sposta Appuntamenti
          </button>



          {/* Storico */}
          <button 
            onClick={() => setActiveSection('history')}
            className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-all ${
              activeSection === 'history' 
                ? 'bg-gray-500 text-white border-gray-500' 
                : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Storico ({swapRequests.filter((req: SwapRequest) => req.status !== 'pending').length})
          </button>
        </div>
      </div>

      {/* Lista Scambi Filtrata */}
      <div className="px-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
          {(() => {
            if (activeSection === 'client-requests') {
              const pendingRequests = swapRequests.filter((req: SwapRequest) => req.status === 'pending');
              
              if (pendingRequests.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessuna richiesta di scambio tra clienti in attesa</p>
                    <p className="text-sm text-gray-400 mt-2">Le clienti possono richiedere scambi tramite l'app</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Richieste Scambi tra Clienti</h3>
                      <p className="text-sm text-gray-600">Le clienti hanno richiesto questi scambi. Le altre clienti devono accettare tramite l'app.</p>
                    </div>
                    <Button 
                      onClick={() => setShowClientSwapDialog(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Crea Scambio
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                  {pendingRequests.map((request: SwapRequest) => (
                    <div key={request.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {request.requesterClient?.fullName} → {request.targetClient?.fullName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(request.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          In attesa di risposta
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500 mb-1">Cede:</p>
                          <p className="font-medium">{request.requesterAppointment?.service}</p>
                          <p className="text-sm text-gray-600">
                            {request.requesterAppointment?.date} - {request.requesterAppointment?.time}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500 mb-1">Vuole:</p>
                          <p className="font-medium">{request.targetAppointment?.service}</p>
                          <p className="text-sm text-gray-600">
                            {request.targetAppointment?.date} - {request.targetAppointment?.time}
                          </p>
                        </div>
                      </div>

                      {request.requestMessage && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-gray-700">"{request.requestMessage}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              );
            }
            
            if (activeSection === 'admin-moves') {
              return (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <Calendar className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Sposta Appuntamenti</h3>
                    <p className="text-gray-600">
                      Quando hai un imprevisto, puoi spostare una cliente in uno slot libero.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => setShowNewSwapDialog(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Sposta Cliente
                  </Button>
                </div>
              );
            }
            

            if (activeSection === 'history') {
              const historyRequests = swapRequests.filter((req: SwapRequest) => req.status !== 'pending');
              
              if (historyRequests.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessuna attività storica</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Storico Attività</h3>
                    <p className="text-sm text-gray-600">Cronologia di scambi e spostamenti completati</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                  {historyRequests.map((request: SwapRequest) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {request.requesterClient?.fullName} → {request.targetClient?.fullName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(request.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500 mb-1">Cedeva:</p>
                          <p className="font-medium">{request.requesterAppointment?.service}</p>
                          <p className="text-sm text-gray-600">
                            {request.requesterAppointment?.date} - {request.requesterAppointment?.time}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500 mb-1">Voleva:</p>
                          <p className="font-medium">{request.targetAppointment?.service}</p>
                          <p className="text-sm text-gray-600">
                            {request.targetAppointment?.date} - {request.targetAppointment?.time}
                          </p>
                        </div>
                      </div>

                      {request.requestMessage && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm text-gray-700">"{request.requestMessage}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
        </div>
      </div>

      {/* Dialog Nuovo Scambio */}
      <Dialog open={showNewSwapDialog} onOpenChange={setShowNewSwapDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm mx-auto rounded-2xl shadow-2xl border-0 p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800 text-center">
              Sposta Cliente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                Sposta una cliente in uno slot libero quando hai un imprevisto.
              </p>
            </div>

            {/* Cliente da Spostare */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Cliente da Spostare
              </label>
              <Select
                value={newSwapData.requesterClientId}
                onValueChange={(value) => setNewSwapData(prev => ({ 
                  ...prev, 
                  requesterClientId: value,
                  requesterAppointmentId: '' // Reset appointment when client changes
                }))}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="Seleziona cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="rounded-lg">
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appuntamento Attuale */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Appuntamento Attuale
              </label>
              <Select
                value={newSwapData.requesterAppointmentId}
                onValueChange={(value) => setNewSwapData(prev => ({ ...prev, requesterAppointmentId: value }))}
                disabled={!newSwapData.requesterClientId}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="Seleziona appuntamento..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {appointments.filter((apt: any) => 
                    apt.clientId.toString() === newSwapData.requesterClientId
                  ).map((apt: any) => (
                    <SelectItem key={apt.id} value={apt.id.toString()} className="rounded-lg">
                      {new Date(apt.appointmentDate).toLocaleDateString('it-IT')} - {apt.appointmentTime} ({apt.service})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nuovo Slot (per ora simuliamo con slot vuoti) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Nuovo Orario
              </label>
              <Select
                value={newSwapData.targetAppointmentId}
                onValueChange={(value) => setNewSwapData(prev => ({ 
                  ...prev, 
                  targetAppointmentId: value,
                  targetClientId: '' // Questo sarà vuoto per gli slot liberi
                }))}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="Seleziona nuovo orario..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  <SelectItem value="free-slot-1" className="rounded-lg">
                    Domani - 09:00 (Slot Libero)
                  </SelectItem>
                  <SelectItem value="free-slot-2" className="rounded-lg">
                    Domani - 15:00 (Slot Libero)  
                  </SelectItem>
                  <SelectItem value="free-slot-3" className="rounded-lg">
                    Lunedì - 11:00 (Slot Libero)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo Spostamento */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Motivo Spostamento
              </label>
              <Textarea
                placeholder="Es: Imprevisto familiare, emergenza, altro..."
                value={newSwapData.requestMessage}
                onChange={(e) => setNewSwapData(prev => ({ ...prev, requestMessage: e.target.value }))}
                rows={2}
                className="rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none text-sm"
              />
            </div>

            {/* Pulsanti */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmitNewSwap}
                disabled={createSwapMutation.isPending || !newSwapData.requesterClientId || !newSwapData.requesterAppointmentId || !newSwapData.targetAppointmentId}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg py-2 text-sm font-medium"
              >
                {createSwapMutation.isPending ? 'Spostando...' : 'Sposta Cliente'}
              </Button>
              <Button
                onClick={() => {
                  setShowNewSwapDialog(false);
                  setNewSwapData({
                    requesterClientId: '',
                    requesterAppointmentId: '',
                    targetClientId: '',
                    targetAppointmentId: '',
                    requestMessage: ''
                  });
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2 text-sm font-medium"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Scambio Client-Client */}
      <Dialog open={showClientSwapDialog} onOpenChange={setShowClientSwapDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto rounded-2xl shadow-2xl border-0 p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800 text-center">
              Crea Scambio tra Clienti
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Proponi uno scambio tra due clienti. Entrambe dovranno accettare tramite l'app.
              </p>
            </div>

            {/* Prima Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Prima Cliente
              </label>
              <Select
                value={clientSwapData.requesterClientId}
                onValueChange={(value) => setClientSwapData(prev => ({ 
                  ...prev, 
                  requesterClientId: value,
                  requesterAppointmentId: ''
                }))}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Seleziona prima cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="rounded-lg">
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appuntamento Prima Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Suo Appuntamento
              </label>
              <Select
                value={clientSwapData.requesterAppointmentId}
                onValueChange={(value) => setClientSwapData(prev => ({ ...prev, requesterAppointmentId: value }))}
                disabled={!clientSwapData.requesterClientId}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Seleziona appuntamento..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {appointments.filter((apt: any) => 
                    apt.clientId.toString() === clientSwapData.requesterClientId
                  ).map((apt: any) => (
                    <SelectItem key={apt.id} value={apt.id.toString()} className="rounded-lg">
                      {new Date(apt.appointmentDate).toLocaleDateString('it-IT')} - {apt.appointmentTime} ({apt.service})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seconda Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Seconda Cliente
              </label>
              <Select
                value={clientSwapData.targetClientId}
                onValueChange={(value) => setClientSwapData(prev => ({ 
                  ...prev, 
                  targetClientId: value,
                  targetAppointmentId: ''
                }))}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Seleziona seconda cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {clients.filter((client: any) => client.id.toString() !== clientSwapData.requesterClientId).map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="rounded-lg">
                      {client.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appuntamento Seconda Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Suo Appuntamento
              </label>
              <Select
                value={clientSwapData.targetAppointmentId}
                onValueChange={(value) => setClientSwapData(prev => ({ ...prev, targetAppointmentId: value }))}
                disabled={!clientSwapData.targetClientId}
              >
                <SelectTrigger className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Seleziona appuntamento..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {appointments.filter((apt: any) => 
                    apt.clientId.toString() === clientSwapData.targetClientId
                  ).map((apt: any) => (
                    <SelectItem key={apt.id} value={apt.id.toString()} className="rounded-lg">
                      {new Date(apt.appointmentDate).toLocaleDateString('it-IT')} - {apt.appointmentTime} ({apt.service})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messaggio */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Messaggio (opzionale)
              </label>
              <Textarea
                placeholder="Motivo dello scambio..."
                value={clientSwapData.requestMessage}
                onChange={(e) => setClientSwapData(prev => ({ ...prev, requestMessage: e.target.value }))}
                className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmitClientSwap}
                disabled={createSwapMutation.isPending}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
              >
                {createSwapMutation.isPending ? 'Creando...' : 'Crea Scambio'}
              </Button>
              <Button
                onClick={() => {
                  setShowClientSwapDialog(false);
                  setClientSwapData({
                    requesterClientId: '',
                    requesterAppointmentId: '',
                    targetClientId: '',
                    targetAppointmentId: '',
                    requestMessage: ''
                  });
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-2 text-sm font-medium"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}