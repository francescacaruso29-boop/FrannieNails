import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Calendar, Camera, Star, Clock, MapPin, Mail, Heart, MessageSquare, Edit, Euro, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function ClientCardPage() {
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
  const lastAppointment = appointmentsData
    .filter((apt: Appointment) => new Date(apt.date) < new Date())
    .sort((a: Appointment, b: Appointment) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const nextAppointment = appointmentsData
    .filter((apt: Appointment) => new Date(apt.date) >= new Date())
    .sort((a: Appointment, b: Appointment) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const goBack = () => {
    setLocation("/profile");
  };

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}>
        <p className="text-white text-lg">Caricamento scheda cliente...</p>
      </div>
    );
  }

  const clientInitials = clientData.fullName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header con sfondo rosa */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}>
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Navigation */}
        <div className="relative z-10 flex items-center gap-4 p-4 pb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack}
            className="p-2 hover:bg-white/20 rounded-full text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Scheda Cliente</h1>
            <p className="text-sm text-white/80">Informazioni dettagliate profilo</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="p-2 hover:bg-white/20 rounded-full text-white"
            onClick={() => setLocation('/settings')}
          >
            <Edit className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Header Card */}
        <div className="relative z-10 mx-4 pb-6">
          <Card className="rounded-3xl border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback 
                    className="text-xl font-bold text-white"
                    style={{ backgroundColor: '#d38a77' }}
                  >
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{clientData.fullName}</h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    {clientData.phoneNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Cliente #{clientData.id}
                    </Badge>
                    <Badge className="text-xs text-white" style={{ backgroundColor: '#d38a77' }}>
                      {clientData.uniqueCode}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#d38a77' }}>{appointmentsData.length}</p>
                  <p className="text-sm text-gray-600">Appuntamenti</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{photosData.length}</p>
                  <p className="text-sm text-gray-600">Foto</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{completedAppointments}</p>
                  <p className="text-sm text-gray-600">Completati</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        
        {/* Informazioni Cliente */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nome Completo</p>
                  <p className="font-semibold text-gray-800">{clientData.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-semibold text-gray-800">{clientData.phoneNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                     style={{ backgroundColor: '#f3e8ff' }}>
                  <Star className="w-6 h-6" style={{ color: '#d38a77' }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Codice Univoco</p>
                  <p className="font-semibold text-gray-800">{clientData.uniqueCode}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
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

        {/* Situazione Finanziaria */}
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
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credito Disponibile</p>
                  <p className="text-xl font-bold text-green-600">€{clientData.creditBalance || 0}</p>
                  <p className="text-xs text-gray-500">Soldi che hai a disposizione</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
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

        {/* Appuntamenti */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Riepilogo Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistiche appuntamenti */}
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

            {/* Ultimo e prossimo appuntamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {lastAppointment && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ultimo Appuntamento
                  </h4>
                  <p className="font-medium text-gray-800">{lastAppointment.service}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(lastAppointment.date).toLocaleDateString('it-IT')} - {lastAppointment.time}
                  </p>

                </div>
              )}
              
              {nextAppointment && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Prossimo Appuntamento
                  </h4>
                  <p className="font-medium text-gray-800">{nextAppointment.service}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(nextAppointment.date).toLocaleDateString('it-IT')} - {nextAppointment.time}
                  </p>

                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Galleria Foto */}
        <Card className="rounded-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: '#d38a77' }}>
                <Camera className="w-5 h-5 text-white" />
              </div>
              Galleria Foto Personale
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photosData.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photosData.map((photo: Photo) => (
                  <div key={photo.id} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-md">
                    <img 
                      src={`/uploads/${photo.filename}`} 
                      alt="Foto del cliente" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nessuna foto caricata</p>
                <p className="text-sm text-gray-400 mt-1">Le foto caricate appariranno qui</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note Privacy */}
        <Card className="rounded-3xl border-0 shadow-lg bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Informazioni Privacy</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Questa scheda contiene tutte le informazioni del tuo profilo cliente presso Frannie Nails. 
                  I dati sono protetti secondo le normative sulla privacy e utilizzati esclusivamente per 
                  fornire i nostri servizi. Per modifiche ai dati personali, utilizza le impostazioni 
                  o contatta direttamente il salone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}