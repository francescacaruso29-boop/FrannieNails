import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Calendar, Camera, MapPin, Clock, Star, Euro, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ClientData {
  id: number;
  uniqueCode: string;
  personalCode?: string;
  fullName: string;
  phoneNumber: string;
  creditBalance?: number;
  advanceBalance?: number;
  createdAt: string;
}

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  service: string;
  status: string;
}

interface Photo {
  id: number;
  clientId: number;
  filename: string;
  status: string;
  createdAt: string;
}

export default function ClientDataPage() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedData = localStorage.getItem('frannie-client-data');
    if (storedData) {
      const client = JSON.parse(storedData);
      setClientData(client);
    }
  }, []);

  // Fetch client's appointments
  const { data: appointmentsData = [] } = useQuery({
    queryKey: ['/api/appointments', clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];
      const response = await fetch('/api/appointments');
      const result = await response.json();
      if (result.success) {
        return result.appointments.filter((apt: Appointment) => apt.clientId === clientData.id);
      }
      return [];
    },
    enabled: !!clientData?.id
  });

  // Fetch client's photos
  const { data: photosData = [] } = useQuery({
    queryKey: ['/api/photos/client', clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];
      const response = await fetch('/api/photos/approved');
      const result = await response.json();
      if (result.success) {
        return result.photos.filter((photo: Photo) => photo.clientId === clientData.id);
      }
      return [];
    },
    enabled: !!clientData?.id
  });

  // Calculate statistics
  const completedAppointments = appointmentsData.filter((apt: Appointment) => 
    new Date(apt.date) < new Date()
  ).length;
  const upcomingAppointments = appointmentsData.filter((apt: Appointment) => 
    new Date(apt.date) >= new Date()
  ).length;

  const goBack = () => {
    setLocation("/profile");
  };

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}>
        <p className="text-white text-lg">Caricamento dati...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" 
         style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}>
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4 p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#d38a77' }} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">I Miei Dati</h1>
            <p className="text-sm text-gray-600">Informazioni complete del profilo</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Personal Information */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              Informazioni Personali
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Nome Completo</p>
                  <p className="font-semibold text-gray-800">{clientData.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Numero di Telefono</p>
                  <p className="font-semibold text-gray-800">{clientData.phoneNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Star className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Codice Univoco</p>
                  <p className="font-semibold text-gray-800">{clientData.uniqueCode}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Cliente dal</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(clientData.createdAt || Date.now()).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Euro className="w-5 h-5 text-white" />
              </div>
              Situazione Finanziaria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Euro className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credito Disponibile</p>
                  <p className="text-xl font-bold text-green-600">€{clientData.creditBalance || 0}</p>
                  <p className="text-xs text-gray-500">Soldi che hai a disposizione</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Anticipo Versato</p>
                  <p className="text-xl font-bold text-blue-600">€{clientData.advanceBalance || 0}</p>
                  <p className="text-xs text-gray-500">Soldi che hai già pagato</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Saldo Totale:</span>
                <span className="text-lg font-bold" 
                      style={{ color: (clientData.creditBalance || 0) - (clientData.advanceBalance || 0) >= 0 ? '#059669' : '#dc2626' }}>
                  €{(clientData.creditBalance || 0) - (clientData.advanceBalance || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(clientData.creditBalance || 0) - (clientData.advanceBalance || 0) >= 0 
                  ? "Hai un credito disponibile" 
                  : "Devi ancora versare questo importo"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Statistiche Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold" style={{ color: '#d38a77' }}>{appointmentsData.length}</p>
                <p className="text-sm text-gray-600">Totali</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-green-600">{completedAppointments}</p>
                <p className="text-sm text-gray-600">Completati</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-blue-600">{upcomingAppointments}</p>
                <p className="text-sm text-gray-600">Prossimi</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <p className="text-2xl font-bold text-orange-600">{photosData.length}</p>
                <p className="text-sm text-gray-600">Foto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Ultimi Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsData.length > 0 ? (
              <div className="space-y-3">
                {appointmentsData.slice(-5).reverse().map((appointment: Appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        new Date(appointment.date) > new Date() ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-gray-800">{appointment.service}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString('it-IT')} - {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={new Date(appointment.date) > new Date() ? "default" : "secondary"}>
                        {new Date(appointment.date) > new Date() ? 'Prossimo' : 'Completato'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Nessun appuntamento trovato</p>
            )}
          </CardContent>
        </Card>

        {/* Photo Gallery Summary */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Camera className="w-5 h-5 text-white" />
              </div>
              Le Mie Foto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photosData.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photosData.slice(0, 8).map((photo: Photo) => (
                  <div key={photo.id} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                    <img 
                      src={`/uploads/${photo.filename}`} 
                      alt="Foto del cliente" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nessuna foto caricata</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="rounded-3xl border-0 shadow-lg bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Privacy e Sicurezza</h3>
                <p className="text-sm text-blue-700">
                  I tuoi dati sono protetti e utilizzati esclusivamente per fornire i servizi del salone. 
                  Per modificare le tue informazioni, vai alle Impostazioni o contatta direttamente il salone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}