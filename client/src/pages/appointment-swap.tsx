import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, User, MessageSquare, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SwapRequest {
  id: number;
  requesterClientId: number;
  requesterAppointmentId: number;
  targetClientId: number;
  targetAppointmentId: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestMessage: string | null;
  createdAt: string;
  respondedAt: string | null;
  requesterName: string;
  targetName: string;
  requesterDate: string;
  requesterTime: string;
  requesterService: string;
  targetDate: string;
  targetTime: string;
  targetService: string;
}

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  clientId: number;
}

export default function AppointmentSwapPage() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<number>(0);
  const [clientName, setClientName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const clientData = localStorage.getItem('frannie-client-data');
    if (clientData) {
      const client = JSON.parse(clientData);
      setClientId(client.id || 0);
      setClientName(client.fullName || "Cliente");
    }
  }, []);

  // Fetch swap requests for this client
  const { data: swapRequests = [] } = useQuery({
    queryKey: ['/api/swap-requests', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await fetch(`/api/swap-requests/${clientId}`);
      const result = await response.json();
      return result.success ? result.swapRequests : [];
    },
    enabled: !!clientId
  });

  // Fetch client's appointments for potential swaps
  const { data: appointments = [] } = useQuery({
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

  // Respond to swap request mutation
  const respondToSwapMutation = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: number; response: 'accepted' | 'rejected' }) => {
      const res = await fetch(`/api/swap-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Risposta inviata!",
        description: "La tua risposta alla richiesta di scambio è stata registrata.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Non è stato possibile rispondere alla richiesta.",
        variant: "destructive",
      });
    }
  });

  const handleRespondToSwap = (requestId: number, response: 'accepted' | 'rejected') => {
    respondToSwapMutation.mutate({ requestId, response });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Separate incoming and outgoing requests
  const incomingRequests = swapRequests.filter((req: SwapRequest) => req.targetClientId === clientId);
  const outgoingRequests = swapRequests.filter((req: SwapRequest) => req.requesterClientId === clientId);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/calendar')}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: '#d38a77' }} />
          </Button>
          <h1 className="text-xl font-semibold" style={{ color: '#d38a77' }}>
            Scambio Appuntamenti
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#d38a77' }}>
              Richieste Ricevute
            </h2>
            <div className="space-y-3">
              {incomingRequests.map((request: SwapRequest) => (
                <div key={request.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">{request.requesterName}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? 'In attesa' :
                       request.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Vuole scambiare:</h4>
                        <p className="text-sm text-gray-600">{request.requesterService}</p>
                        <p className="text-sm text-gray-600">{formatDate(request.requesterDate)}</p>
                        <p className="text-sm text-gray-600">ore {request.requesterTime}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Con il tuo:</h4>
                        <p className="text-sm text-gray-600">{request.targetService}</p>
                        <p className="text-sm text-gray-600">{formatDate(request.targetDate)}</p>
                        <p className="text-sm text-gray-600">ore {request.targetTime}</p>
                      </div>
                    </div>

                    {request.requestMessage && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Messaggio:</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{request.requestMessage}"</p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleRespondToSwap(request.id, 'accepted')}
                          disabled={respondToSwapMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accetta
                        </Button>
                        <Button
                          onClick={() => handleRespondToSwap(request.id, 'rejected')}
                          disabled={respondToSwapMutation.isPending}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rifiuta
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Requests */}
        {outgoingRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#d38a77' }}>
              Richieste Inviate
            </h2>
            <div className="space-y-3">
              {outgoingRequests.map((request: SwapRequest) => (
                <div key={request.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-800">A: {request.targetName}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? 'In attesa' :
                       request.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Il tuo appuntamento:</h4>
                      <p className="text-sm text-gray-600">{request.requesterService}</p>
                      <p className="text-sm text-gray-600">{formatDate(request.requesterDate)}</p>
                      <p className="text-sm text-gray-600">ore {request.requesterTime}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Richiesto:</h4>
                      <p className="text-sm text-gray-600">{request.targetService}</p>
                      <p className="text-sm text-gray-600">{formatDate(request.targetDate)}</p>
                      <p className="text-sm text-gray-600">ore {request.targetTime}</p>
                    </div>
                  </div>

                  {request.requestMessage && (
                    <div className="bg-white rounded-lg p-3 mt-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Il tuo messaggio:</span>
                      </div>
                      <p className="text-sm text-gray-600 italic">"{request.requestMessage}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: '#d38a77' }} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna richiesta di scambio
            </h3>
            <p className="text-gray-500 mb-4">
              Non hai richieste di scambio appuntamenti al momento.
            </p>
            <Button
              onClick={() => setLocation('/calendar')}
              style={{ backgroundColor: '#d38a77' }}
              className="text-white hover:opacity-90"
            >
              Vai al Calendario
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}