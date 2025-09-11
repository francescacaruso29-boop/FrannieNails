import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Euro, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  PlusCircle,
  Calculator,
  Send,
  MessageSquare,
  MessageCircle,
  Phone
} from 'lucide-react';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TomorrowAppointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  service: string;
  appointmentTime: string;
  appointmentDate: string;
  hasPreCheck: boolean;
  preCheck?: {
    id: number;
    brokenNails: number;
    notes: string;
    completed: boolean;
  };
}

interface CalculationResult {
  basePrice: number;
  brokenNails: number;
  brokenNailsCost: number;
  advanceBalance: number;
  finalAmount: number;
  service: string;
  clientName: string;
}

interface ClientResponse {
  id: number;
  appointmentId: number;
  clientId: number;
  responseMessage: string;
  brokenNailsCount: number | null;
  responseType: string;
  processed: boolean;
  receivedAt: string;
  phoneNumber: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
}

export default function AdminPreChecks() {
  const [selectedAppointment, setSelectedAppointment] = useState<TomorrowAppointment | null>(null);
  const [brokenNails, setBrokenNails] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send pre-check requests to all tomorrow's clients
  const sendPreChecksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/send-pre-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to send pre-checks');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pre-Check Inviati",
        description: `Inviati ${data.details.successful} messaggi su ${data.details.total} appuntamenti`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tomorrow-appointments'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'invio dei pre-check",
        variant: "destructive"
      });
    }
  });

  // Get tomorrow's appointments that need pre-checks
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/tomorrow-appointments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tomorrow-appointments');
      const result = await response.json();
      return result.success ? result.appointments : [];
    }
  });

  // Get unprocessed client responses
  const { data: clientResponses = [] } = useQuery({
    queryKey: ['/api/admin/client-responses/unprocessed'],
    queryFn: async () => {
      const response = await fetch('/api/admin/client-responses/unprocessed');
      const result = await response.json();
      return result.success ? result.responses : [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds for real-time updates
  });

  // Create/update pre-check mutation
  const createPreCheckMutation = useMutation({
    mutationFn: async (data: { appointmentId: number; clientId: number; brokenNails: number; notes: string }) => {
      const response = await fetch('/api/admin/pre-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create pre-check');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tomorrow-appointments'] });
      toast({
        title: "Controllo Salvato",
        description: "Il controllo pre-appuntamento è stato salvato correttamente",
      });
      calculateFinalAmount();
    }
  });

  // Process client response mutation
  const processResponseMutation = useMutation({
    mutationFn: async (data: { responseId: number; brokenNails: number; notes?: string }) => {
      const response = await fetch(`/api/admin/process-response/${data.responseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brokenNails: data.brokenNails, 
          notes: data.notes || '' 
        })
      });
      if (!response.ok) throw new Error('Failed to process response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/client-responses/unprocessed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tomorrow-appointments'] });
      toast({
        title: "Risposta Processata",
        description: "La risposta del cliente è stata processata e il pre-check aggiornato",
      });
    }
  });

  // Calculate final amount
  const calculateFinalAmount = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/admin/final-amount/${selectedAppointment.id}`);
      const result = await response.json();
      
      if (result.success) {
        setCalculation(result.calculation);
      }
    } catch (error) {
      console.error('Error calculating final amount:', error);
    }
  };

  // Handle appointment selection
  const handleSelectAppointment = async (appointment: TomorrowAppointment) => {
    setSelectedAppointment(appointment);
    setBrokenNails(appointment.preCheck?.brokenNails || 0);
    setNotes(appointment.preCheck?.notes || '');
    
    // Calculate final amount immediately
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/final-amount/${appointment.id}`);
        const result = await response.json();
        if (result.success) {
          setCalculation(result.calculation);
        }
      } catch (error) {
        console.error('Error calculating:', error);
      }
    }, 100);
  };

  // Save pre-check
  const handleSavePreCheck = () => {
    if (!selectedAppointment) return;
    
    createPreCheckMutation.mutate({
      appointmentId: selectedAppointment.id,
      clientId: selectedAppointment.clientId,
      brokenNails,
      notes
    });
  };

  // Send notification with final amount
  const sendNotificationWithAmount = async () => {
    if (!selectedAppointment || !calculation) return;
    
    try {
      const message = `🔔 Promemoria Appuntamento
Il tuo appuntamento è domani ${selectedAppointment.appointmentTime} per ${calculation.service}

💰 IMPORTO DA PORTARE: €${calculation.finalAmount}

Dettaglio:
• ${calculation.service}: €${calculation.basePrice}
${calculation.brokenNails > 0 ? `• Unghie rotte (${calculation.brokenNails}): €${calculation.brokenNailsCost}\n` : ''}${calculation.advanceBalance > 0 ? `• Anticipo già versato: -€${calculation.advanceBalance}\n` : ''}
A presto! 💅✨`;

      // Here you would integrate with your notification system (Twilio, etc.)
      console.log('Sending notification:', message);
      
      toast({
        title: "Promemoria Inviato",
        description: `Notifica inviata a ${calculation.clientName} con l'importo di €${calculation.finalAmount}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nell'invio della notifica",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-pink-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Caricamento controlli...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 via-purple-100/20 to-indigo-100/20"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      {/* Hamburger Menu */}
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-lg shadow-purple-100/20">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✨ Controlli Pre-Appuntamento
              </h1>
              <p className="text-sm text-purple-600/70 font-medium">Gestisci i controlli per gli appuntamenti di domani</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Action Bar */}
          <div className="mb-6">
            <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl shadow-purple-100/25 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
              <CardContent className="relative p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 mb-0.5">✨ Gestione Pre-Controlli</h3>
                      <p className="text-sm text-purple-600/70 font-medium">Invio automatico e controllo risposte clienti</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        // Simulate a client response for testing - use appointment ID 5
                        fetch('/api/admin/simulate-client-response', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            appointmentId: 5,
                            clientId: 1,
                            responseMessage: "Ho 2 unghie rotte",
                            brokenNailsCount: 2
                          })
                        }).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/client-responses/unprocessed'] });
                          toast({
                            title: "Risposta Simulata",
                            description: "Creata una risposta di test per provare il sistema"
                          });
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="border-purple-200/50 text-purple-600 hover:text-purple-700 hover:bg-purple-50 backdrop-blur-sm bg-white/50 shadow-lg rounded-lg transition-all duration-300"
                    >
                      🧪 Test
                    </Button>
                    <Button
                      onClick={() => sendPreChecksMutation.mutate()}
                      disabled={sendPreChecksMutation.isPending || appointments.length === 0}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg shadow-lg shadow-purple-200/50 transition-all duration-300 flex-1 sm:flex-none"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {sendPreChecksMutation.isPending ? '✨ Invio...' : '🚀 Invia Pre-Check'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            
            {/* Appointments List */}
            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-pink-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 to-purple-500/3"></div>
              <CardHeader className="relative pb-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-b border-pink-100/30">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Appuntamenti di Domani</h3>
                    <p className="text-sm text-purple-600/70 font-medium">
                      {appointments.length} {appointments.length === 1 ? 'appuntamento' : 'appuntamenti'}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Nessun appuntamento domani</p>
                    <p className="text-sm text-gray-400 mt-1">Le notifiche saranno inviate automaticamente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appointment: TomorrowAppointment) => (
                      <div 
                        key={appointment.id}
                        onClick={() => handleSelectAppointment(appointment)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedAppointment?.id === appointment.id 
                            ? 'border-pink-300/50 bg-gradient-to-r from-pink-50/80 to-purple-50/80 shadow-lg' 
                            : 'border-gray-200/50 hover:border-pink-300/40 hover:bg-white/80 bg-white/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{appointment.clientName}</h3>
                            <p className="text-sm text-gray-600">{appointment.service} - {appointment.appointmentTime}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.hasPreCheck ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {appointment.hasPreCheck ? 'Controllo completato' : 'Controllo richiesto'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - Check Details */}
            <Card className="rounded-xl shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  {selectedAppointment ? `Controllo per ${selectedAppointment.clientName}` : 'Seleziona un Appuntamento'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAppointment ? (
                  <div className="space-y-6">
                    {/* Appointment Details */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Dettagli Appuntamento</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600">Cliente:</p>
                          <p className="font-medium">{selectedAppointment.clientName}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Servizio:</p>
                          <p className="font-medium">{selectedAppointment.service}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Orario:</p>
                          <p className="font-medium">{selectedAppointment.appointmentTime}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Telefono:</p>
                          <p className="font-medium">{selectedAppointment.clientPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Broken Nails Input */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Numero Unghie Rotte
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={brokenNails}
                        onChange={(e) => setBrokenNails(parseInt(e.target.value) || 0)}
                        className="rounded-lg border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">+€2 per ogni unghia rotta</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Note (opzionale)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="rounded-lg border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                        placeholder="Condizioni particolari delle unghie..."
                        rows={3}
                      />
                    </div>

                    {/* Calculation */}
                    {calculation && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Calcolo Importo Finale
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Prezzo base ({calculation.service}):</span>
                            <span className="font-medium">€{calculation.basePrice}</span>
                          </div>
                          {calculation.brokenNails > 0 && (
                            <div className="flex justify-between">
                              <span>Unghie rotte ({calculation.brokenNails} x €2):</span>
                              <span className="font-medium">+€{calculation.brokenNailsCost}</span>
                            </div>
                          )}
                          {calculation.advanceBalance > 0 && (
                            <div className="flex justify-between">
                              <span>Anticipo già versato:</span>
                              <span className="font-medium text-blue-600">-€{calculation.advanceBalance}</span>
                            </div>
                          )}
                          <hr className="my-2" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>TOTALE DA PORTARE:</span>
                            <span className="text-green-600">€{calculation.finalAmount}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSavePreCheck}
                        disabled={createPreCheckMutation.isPending}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {createPreCheckMutation.isPending ? 'Salvando...' : 'Salva Controllo'}
                      </Button>
                      
                      {calculation && (
                        <Button
                          onClick={sendNotificationWithAmount}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Invia Promemoria
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Seleziona un appuntamento dalla lista per iniziare il controllo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client Responses Dashboard */}
          {clientResponses.length > 0 && (
            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-blue-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3"></div>
              <CardHeader className="relative pb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-blue-100/30">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-800">Risposte dei Clienti</h3>
                    <p className="text-sm text-purple-600/70 font-medium">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        {clientResponses.length} da processare
                      </span>
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-4">

                <div className="space-y-4">
                  {clientResponses.map((response: ClientResponse) => (
                    <Card key={response.id} className="border-l-4 border-l-blue-400 bg-white/70 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="font-semibold text-gray-900 text-base">{response.clientName}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 text-xs">
                              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {new Date(response.appointmentDate).toLocaleDateString('it-IT')} alle {response.appointmentTime}
                              </span>
                              <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                {new Date(response.receivedAt).toLocaleString('it-IT')}
                              </span>
                            </div>
                          </div>

                          {/* Message */}
                          <div>
                            <p className="text-sm text-gray-600 mb-2 font-medium">Messaggio ricevuto:</p>
                            <div className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-3">
                              <p className="text-blue-800 font-semibold text-base">"{response.responseMessage}"</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-700">Conferma numero unghie rotte:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                              <Button
                                onClick={() => processResponseMutation.mutate({
                                  responseId: response.id,
                                  brokenNails: 0,
                                  notes: `Risposta automatica: ${response.responseMessage}`
                                })}
                                disabled={processResponseMutation.isPending}
                                size="sm"
                                variant="outline"
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs h-10"
                              >
                                ✅ Nessuna
                              </Button>

                              {[1, 2, 3, 4, 5].map(num => (
                                <Button
                                  key={num}
                                  onClick={() => processResponseMutation.mutate({
                                    responseId: response.id,
                                    brokenNails: num,
                                    notes: `Risposta automatica: ${response.responseMessage}`
                                  })}
                                  disabled={processResponseMutation.isPending}
                                  size="sm"
                                  variant="outline"
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 text-xs h-10"
                                >
                                  {num} Rotta{num > 1 ? 'e' : ''}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Show calculated amount if response processed */}
                          {response.finalAmount && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-green-800 font-semibold text-center">
                                💰 Importo calcolato: €{response.finalAmount}
                              </p>
                            </div>
                          )}

                          {processResponseMutation.isPending && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Processando risposta...
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}