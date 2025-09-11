import { useState } from "react";
import { Calendar, Users, MessageSquare, Camera, Package, Settings, Bell, Search, Plus, TrendingUp, Clock, Euro, Star, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Appointment {
  id: number;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  service: string;
  status: string;
}

interface Client {
  id: number;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
}

interface Photo {
  id: number;
  clientId: number;
  filename: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardModern() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments');
      const result = await response.json();
      return result.success ? result.appointments : [];
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      const result = await response.json();
      return result.success ? result.clients : [];
    }
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos/all'],
    queryFn: async () => {
      const response = await fetch('/api/photos/all');
      const result = await response.json();
      return result.success ? result.photos : [];
    }
  });

  // Calculate statistics
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((apt: Appointment) => apt.date === today);
  const pendingPhotos = photos.filter((photo: Photo) => photo.status === 'pending');
  const weeklyRevenue = appointments.filter((apt: Appointment) => {
    const appointmentDate = new Date(apt.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return appointmentDate >= weekAgo;
  }).length * 35; // Average service price

  const quickActions = [

    { icon: Users, label: "Clienti", path: "/admin-clients", color: "bg-gradient-to-br from-purple-400 to-purple-600" },
    { icon: Camera, label: "Galleria", path: "/admin-gallery", color: "bg-gradient-to-br from-green-400 to-green-600" },
    { icon: ArrowLeftRight, label: "Scambi", path: "/admin-swaps", color: "bg-gradient-to-br from-red-400 to-red-600" },
    { icon: Package, label: "Inventario", path: "/inventory", color: "bg-gradient-to-br from-orange-400 to-orange-600" },
    { icon: TrendingUp, label: "Statistiche", path: "/admin-stats", color: "bg-gradient-to-br from-indigo-400 to-indigo-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-pink-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Benvenuta Francesca ✨
              </h1>
              <p className="text-gray-600 text-sm">Il tuo salone in un click</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white/50 border-pink-200 focus:border-pink-400"
                />
              </div>
              
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifiche
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Appointments */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600">
            <div className="absolute inset-0 bg-white/10"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Oggi</p>
                  <p className="text-3xl font-bold text-white">{todayAppointments.length}</p>
                  <p className="text-pink-100 text-xs">Appuntamenti</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Clients */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="absolute inset-0 bg-white/10"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Clienti</p>
                  <p className="text-3xl font-bold text-white">{clients.length}</p>
                  <p className="text-purple-100 text-xs">Totali</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Photos */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="absolute inset-0 bg-white/10"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Foto</p>
                  <p className="text-3xl font-bold text-white">{pendingPhotos.length}</p>
                  <p className="text-blue-100 text-xs">Da approvare</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Revenue */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
            <div className="absolute inset-0 bg-white/10"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Settimana</p>
                  <p className="text-3xl font-bold text-white">€{weeklyRevenue}</p>
                  <p className="text-green-100 text-xs">Ricavi stimati</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Clock className="w-5 h-5 text-pink-500" />
                    Appuntamenti di Oggi
                  </CardTitle>
                  <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                    {todayAppointments.length} totali
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 5).map((appointment: Appointment) => (
                      <div key={appointment.id} 
                           className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {appointment.clientName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{appointment.clientName}</p>
                            <p className="text-sm text-gray-600">{appointment.service}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-pink-600">{appointment.time}</p>
                          <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nessun appuntamento oggi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Star className="w-5 h-5 text-pink-500" />
                  Azioni Rapide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      onClick={() => setLocation(action.path)}
                      className="h-20 flex-col gap-2 p-4 hover:scale-105 transition-all duration-200 rounded-xl border-0"
                      style={{
                        background: action.color,
                        color: 'white'
                      }}
                    >
                      <action.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              Attività Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* New Clients This Week */}
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {clients.filter((client: Client) => {
                    const clientDate = new Date(client.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return clientDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Nuovi clienti</p>
              </div>

              {/* Photos This Week */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {photos.filter((photo: Photo) => {
                    const photoDate = new Date(photo.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return photoDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Foto caricate</p>
              </div>

              {/* Appointments This Week */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {appointments.filter((apt: Appointment) => {
                    const appointmentDate = new Date(apt.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return appointmentDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Appuntamenti</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}