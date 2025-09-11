import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, User, Phone, Calendar, Camera, MessageSquare, Edit, Save, X, Euro, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: number;
  uniqueCode: string;
  fullName: string;
  phoneNumber: string;
  creditBalance: number;
  advanceBalance: number;
  createdAt: string;
  notes?: string;
}

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  status: string;
  createdAt: string;
}

interface Photo {
  id: number;
  filename: string;
  status: string;
  createdAt: string;
}

export default function ClientDetailPage() {
  const [match] = useRoute("/client-detail/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const clientId = match && typeof match === 'object' && 'params' in match ? parseInt(match.params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      const result = await response.json();
      return result.success ? result.client : null;
    },
    enabled: !!clientId
  });

  // Fetch client appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments/client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/client/${clientId}`);
      const result = await response.json();
      return result.success ? result.appointments : [];
    },
    enabled: !!clientId
  });

  // Fetch client photos
  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos/client', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/photos/client/${clientId}`);
      const result = await response.json();
      return result.success ? result.photos : [];
    },
    enabled: !!clientId
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (updates: Partial<Client>) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId] });
      setIsEditing(false);
      setEditedClient({});
      toast({
        title: "Cliente Aggiornato",
        description: "Le informazioni del cliente sono state salvate con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del cliente",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (client && isEditing) {
      setEditedClient({
        fullName: client.fullName,
        phoneNumber: client.phoneNumber,
        creditBalance: client.creditBalance,
        advanceBalance: client.advanceBalance,
        notes: client.notes || ''
      });
    }
  }, [client, isEditing]);

  const handleSave = () => {
    if (editedClient) {
      updateClientMutation.mutate(editedClient);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedClient({});
  };

  const getServicePrice = (service: string) => {
    const prices: { [key: string]: number } = {
      'Gel': 25,
      'Semipermanente': 15,
      'Ricostruzione': 45,
      'Semipermanente Piedi': 20,
      'Epilazione': 30,
      'Ceretta Brasiliana': 35,
      'Laminazione Ciglia': 25,
      'Trucco': 40
    };
    return prices[service] || 0;
  };

  const getTotalSpent = () => {
    return appointments.reduce((total: number, apt: Appointment) => total + getServicePrice(apt.service), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confermato';
      case 'pending': return 'In Attesa';
      case 'cancelled': return 'Cancellato';
      case 'completed': return 'Completato';
      default: return status;
    }
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Cliente non trovato</h2>
          <Button onClick={() => setLocation("/admin-clients")}>
            Torna alla lista clienti
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/admin-clients")}
                className="p-2 hover:bg-pink-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-pink-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {client.fullName}
                </h1>
                <p className="text-gray-600 text-sm">Scheda Cliente Completa</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateClientMutation.isPending}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salva
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="w-5 h-5 text-pink-500" />
                Informazioni Personali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                {isEditing ? (
                  <Input
                    value={editedClient.fullName || ''}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800">{client.fullName}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Numero di Telefono</label>
                {isEditing ? (
                  <Input
                    value={editedClient.phoneNumber || ''}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {client.phoneNumber}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Codice Univoco</label>
                <p className="text-lg font-semibold text-pink-600">{client.uniqueCode}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Cliente dal</label>
                <p className="text-gray-600">
                  {new Date(client.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Euro className="w-5 h-5 text-green-500" />
                Situazione Finanziaria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Credito Disponibile</label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editedClient.creditBalance || 0}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, creditBalance: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-xl font-bold text-green-600">€{client.creditBalance.toFixed(2)}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Anticipo Versato</label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editedClient.advanceBalance || 0}
                    onChange={(e) => setEditedClient(prev => ({ ...prev, advanceBalance: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-xl font-bold text-blue-600">€{client.advanceBalance.toFixed(2)}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Totale Speso</label>
                <p className="text-xl font-bold text-purple-600">€{getTotalSpent().toFixed(2)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Bilancio Totale</label>
                <p className={`text-xl font-bold ${
                  (client.creditBalance + client.advanceBalance - getTotalSpent()) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  €{(client.creditBalance + client.advanceBalance - getTotalSpent()).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Note Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedClient.notes || ''}
                onChange={(e) => setEditedClient(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Aggiungi note sul cliente..."
                className="min-h-24"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {client.notes || 'Nessuna nota disponibile'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
              <p className="text-sm text-gray-600">Appuntamenti</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{photos.length}</p>
              <p className="text-sm text-gray-600">Foto</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {appointments.filter((apt: Appointment) => apt.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completati</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {appointments.filter((apt: Appointment) => apt.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-600">Prossimi</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments History */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Calendar className="w-5 h-5 text-blue-500" />
              Storico Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment: Appointment) => (
                  <div key={appointment.id} 
                       className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{appointment.service}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.appointmentDate).toLocaleDateString('it-IT')} - {appointment.appointmentTime}
                        </p>
                        <p className="text-sm font-medium text-purple-600">€{getServicePrice(appointment.service)}</p>
                      </div>
                      <Badge 
                        className={`${getStatusColor(appointment.status)} text-white`}
                      >
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nessun appuntamento trovato</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Camera className="w-5 h-5 text-green-500" />
              Galleria Foto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo: Photo) => (
                  <div key={photo.id} className="relative">
                    <img 
                      src={`/uploads/${photo.filename}`}
                      alt="Cliente foto"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        photo.status === 'approved' ? 'bg-green-500' : 
                        photo.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white`}
                    >
                      {photo.status === 'approved' ? 'Approvata' : 
                       photo.status === 'pending' ? 'In Attesa' : 'Rifiutata'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nessuna foto caricata</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}