// Client Swaps Page - Frannie NAILS
// Interfaccia per clienti per gestire richieste di scambio appuntamenti

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Calendar, User, MessageSquare, Check, X, Bell, Eye, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { apiRequest } from "@/lib/queryClient";

interface SwapRequest {
  id: number;
  requesterClientId: number;
  requesterAppointmentId: number;
  targetClientId: number;
  targetAppointmentId: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestMessage?: string;
  requestType: 'client_swap' | 'admin_move';
  newSlotInfo?: string;
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
    appointmentDate: string;
    appointmentTime: string;
    service: string;
  };
  targetAppointment?: {
    appointmentDate: string;
    appointmentTime: string;
    service: string;
  };
}

interface SwapRequestsData {
  pendingForResponse: SwapRequest[];
  myRequests: SwapRequest[];
}

export default function ClientSwapsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'my-requests'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);

  // Get current client from localStorage
  const getCurrentClient = () => {
    const savedData = localStorage.getItem('frannie-client-data');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const currentClient = getCurrentClient();

  // Fetch current client from database to get ID
  const { data: dbClientData } = useQuery({
    queryKey: ["/api/clients/by-code", currentClient?.uniqueCode],
    queryFn: async () => {
      if (!currentClient?.uniqueCode) return null;
      const response = await fetch(`/api/clients/by-code/${currentClient.uniqueCode}`);
      return response.json();
    },
    enabled: !!currentClient?.uniqueCode,
  });

  const dbClient = (dbClientData as any)?.client;
  const clientId = dbClient?.id;

  // Fetch swap requests for current client
  const { data: swapRequestsData, isLoading } = useQuery({
    queryKey: [`/api/client/${clientId}/swap-requests`],
    queryFn: async () => {
      if (!clientId) return { pendingForResponse: [], myRequests: [] };
      const response = await fetch(`/api/client/${clientId}/swap-requests`);
      const result = await response.json();
      return result.success ? result.data : { pendingForResponse: [], myRequests: [] };
    },
    enabled: !!clientId,
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  const swapRequests: SwapRequestsData = swapRequestsData || { pendingForResponse: [], myRequests: [] };

  // Mutation to respond to swap requests
  const respondToSwapMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'accept' | 'reject' }) => {
      if (!clientId) throw new Error("Client ID not found");
      
      const response = await apiRequest("POST", `/api/client/swap-requests/${requestId}/${action}`, {
        clientId: clientId
      });
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/swap-requests`] });
      toast({
        title: action === 'accept' ? "Scambio Accettato!" : "Scambio Rifiutato",
        description: action === 'accept' 
          ? "Il tuo appuntamento è stato scambiato con successo" 
          : "Hai rifiutato la richiesta di scambio",
        variant: action === 'accept' ? 'default' : 'destructive'
      });
      setShowConfirmDialog(false);
      setSelectedRequest(null);
      setConfirmAction(null);
    },
    onError: (error) => {
      console.error('Error responding to swap request:', error);
      toast({
        title: "Errore",
        description: "Errore durante la risposta alla richiesta",
        variant: "destructive"
      });
      setShowConfirmDialog(false);
    }
  });

  const handleResponseClick = (request: SwapRequest, action: 'accept' | 'reject') => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const confirmResponse = () => {
    if (selectedRequest && confirmAction) {
      respondToSwapMutation.mutate({
        requestId: selectedRequest.id,
        action: confirmAction
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accettato</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rifiutato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!currentClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Accesso Richiesto</h2>
            <p className="text-gray-600 mb-4">Devi effettuare l'accesso per vedere le richieste di scambio</p>
            <Button onClick={() => setLocation('/')}>
              Vai al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 relative">
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="container mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-3xl font-normal mb-2" style={{ fontFamily: 'Voga, serif', color: '#d38a77' }}>
                Scambi Appuntamenti
              </h1>
              <p className="text-gray-600">Gestisci le tue richieste di scambio</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-pink-600" />
            <span className="text-sm text-pink-600 font-medium">
              {swapRequests.pendingForResponse.length} richieste in attesa
            </span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-6 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Da Rispondere ({swapRequests.pendingForResponse.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'my-requests'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>Mie Richieste ({swapRequests.myRequests.length})</span>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento richieste...</p>
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && !isLoading && (
          <div className="space-y-4">
            {swapRequests.pendingForResponse.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna Richiesta in Attesa</h3>
                  <p className="text-gray-500">Non hai richieste di scambio da gestire al momento</p>
                </CardContent>
              </Card>
            ) : (
              swapRequests.pendingForResponse.map((request) => (
                <Card key={request.id} className="bg-white border-l-4 border-l-yellow-400 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Users className="w-5 h-5 mr-2 text-pink-600" />
                        Richiesta di Scambio
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Requester Info */}
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-pink-900 mb-2">
                        {request.requesterClient?.fullName || 'Cliente'} vuole scambiare con te
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Il suo appuntamento:</p>
                          <p className="font-medium">{formatDate(request.requesterAppointment?.appointmentDate || '')}</p>
                          <p className="font-medium">{request.requesterAppointment?.appointmentTime}</p>
                          <p className="text-pink-600">{request.requesterAppointment?.service}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Il tuo appuntamento:</p>
                          <p className="font-medium">{formatDate(request.targetAppointment?.appointmentDate || '')}</p>
                          <p className="font-medium">{request.targetAppointment?.appointmentTime}</p>
                          <p className="text-pink-600">{request.targetAppointment?.service}</p>
                        </div>
                      </div>
                      {request.requestMessage && (
                        <div className="mt-3 p-3 bg-white rounded border-l-4 border-l-pink-400">
                          <div className="flex items-start">
                            <MessageSquare className="w-4 h-4 text-pink-600 mt-0.5 mr-2" />
                            <p className="text-sm text-gray-700">{request.requestMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={() => handleResponseClick(request, 'accept')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={respondToSwapMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accetta Scambio
                      </Button>
                      <Button
                        onClick={() => handleResponseClick(request, 'reject')}
                        variant="destructive"
                        className="flex-1"
                        disabled={respondToSwapMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rifiuta
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      Richiesta ricevuta il {formatDate(request.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && !isLoading && (
          <div className="space-y-4">
            {swapRequests.myRequests.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessuna Richiesta Inviata</h3>
                  <p className="text-gray-500">Non hai ancora fatto richieste di scambio</p>
                </CardContent>
              </Card>
            ) : (
              swapRequests.myRequests.map((request) => (
                <Card key={request.id} className="bg-white shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-5 h-5 mr-2 text-pink-600" />
                        La Tua Richiesta
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Richiesta a {request.targetClient?.fullName || 'Cliente'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Il tuo appuntamento:</p>
                          <p className="font-medium">{formatDate(request.requesterAppointment?.appointmentDate || '')}</p>
                          <p className="font-medium">{request.requesterAppointment?.appointmentTime}</p>
                          <p className="text-pink-600">{request.requesterAppointment?.service}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Appuntamento richiesto:</p>
                          <p className="font-medium">{formatDate(request.targetAppointment?.appointmentDate || '')}</p>
                          <p className="font-medium">{request.targetAppointment?.appointmentTime}</p>
                          <p className="text-pink-600">{request.targetAppointment?.service}</p>
                        </div>
                      </div>
                      {request.requestMessage && (
                        <div className="mt-3 p-3 bg-white rounded border-l-4 border-l-gray-400">
                          <div className="flex items-start">
                            <MessageSquare className="w-4 h-4 text-gray-600 mt-0.5 mr-2" />
                            <p className="text-sm text-gray-700">{request.requestMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
                      <span>Inviata il {formatDate(request.createdAt)}</span>
                      {request.respondedAt && (
                        <span>Risposta: {formatDate(request.respondedAt)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'accept' ? 'Conferma Scambio' : 'Conferma Rifiuto'}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                {confirmAction === 'accept' ? (
                  <p>Sei sicura di voler accettare questo scambio di appuntamenti?</p>
                ) : (
                  <p>Sei sicura di voler rifiutare questa richiesta di scambio?</p>
                )}
                {selectedRequest && (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Da:</strong> {selectedRequest.requesterClient?.fullName}</p>
                    <p><strong>Il tuo appuntamento diventerà:</strong> {selectedRequest.requesterAppointment?.appointmentDate} alle {selectedRequest.requesterAppointment?.appointmentTime}</p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={confirmResponse}
              className={`flex-1 ${
                confirmAction === 'accept' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
              disabled={respondToSwapMutation.isPending}
            >
              {respondToSwapMutation.isPending ? 'Elaborazione...' : 'Conferma'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}