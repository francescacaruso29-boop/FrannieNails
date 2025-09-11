import { useState } from "react";
import { ArrowLeft, Clock, Calendar, User, Check, X, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SwapRequest {
  id: number;
  requesterClientId: number;
  requesterAppointmentId: number;
  targetClientId: number;
  targetAppointmentId: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestMessage?: string;
  createdAt: string;
  respondedAt?: string;
  requester: {
    fullName: string;
    phoneNumber: string;
    appointment: {
      date: string;
      time: string;
      service: string;
    };
  };
  target: {
    fullName: string;
    phoneNumber: string;
    appointment: {
      date: string;
      time: string;
      service: string;
    };
  };
}

export default function SwapRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current client ID (in real app, from session/auth)
  const currentClientId = parseInt(localStorage.getItem('clientId') || '1');

  // Fetch swap requests for current client
  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: [`/api/swap-requests/${currentClientId}`],
    queryFn: async () => {
      const response = await fetch(`/api/swap-requests/${currentClientId}`);
      const result = await response.json();
      return result.success ? result.swapRequests : [];
    }
  });

  // Mutation for responding to swap requests
  const respondMutation = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: number; response: 'accepted' | 'rejected' }) => {
      const res = await fetch(`/api/swap-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/swap-requests/${currentClientId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: variables.response === 'accepted' ? "Scambio Accettato" : "Scambio Rifiutato",
        description: variables.response === 'accepted' 
          ? "Gli appuntamenti sono stati scambiati con successo!"
          : "La richiesta di scambio è stata rifiutata",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'operazione",
        variant: "destructive",
      });
    }
  });

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
      case 'accepted': return 'Accettato';
      case 'rejected': return 'Rifiutato';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento richieste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/dashboard")}
              className="p-2 hover:bg-pink-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#d38a77' }} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Scambi Appuntamenti</h1>
              <p className="text-sm text-gray-600">Le tue richieste di scambio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {swapRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna richiesta</h3>
            <p className="text-gray-600">Non hai richieste di scambio al momento</p>
          </div>
        ) : (
          <div className="space-y-6">
            {swapRequests.map((request: SwapRequest) => (
              <Card key={request.id} className="rounded-xl border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" style={{ color: '#d38a77' }} />
                      Richiesta di Scambio
                    </CardTitle>
                    <Badge 
                      className={`${getStatusColor(request.status)} text-white`}
                    >
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Request Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Requester Info */}
                      <div className="border-r border-gray-200 pr-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Da: {request.requester.fullName}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {request.requester.appointment.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {request.requester.appointment.time}
                          </div>
                          <div className="font-medium">
                            {request.requester.appointment.service}
                          </div>
                        </div>
                      </div>
                      
                      {/* Target Info */}
                      <div className="pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">A: {request.target.fullName}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {request.target.appointment.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {request.target.appointment.time}
                          </div>
                          <div className="font-medium">
                            {request.target.appointment.service}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.requestMessage && (
                    <div className="bg-pink-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Messaggio:</strong> {request.requestMessage}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'pending' && request.targetClientId === currentClientId && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => respondMutation.mutate({ requestId: request.id, response: 'accepted' })}
                        disabled={respondMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accetta
                      </Button>
                      <Button 
                        onClick={() => respondMutation.mutate({ requestId: request.id, response: 'rejected' })}
                        disabled={respondMutation.isPending}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rifiuta
                      </Button>
                    </div>
                  )}

                  {/* Status Info */}
                  <div className="text-xs text-gray-500 mt-4">
                    Richiesta del {new Date(request.createdAt).toLocaleDateString('it-IT')}
                    {request.respondedAt && (
                      <span> • Risposta del {new Date(request.respondedAt).toLocaleDateString('it-IT')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}