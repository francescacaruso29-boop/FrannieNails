import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  Camera, 
  Bell, 
  TrendingUp,
  Clock,
  Star,
  Heart,
  ArrowUpRight,
  Activity,
  Sparkles,
  Crown
} from 'lucide-react';

export default function AdminDashboardNew() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100">
      {/* Elegant Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-pink-200/50 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                ✨ Frannie Nails Dashboard ✨
              </h1>
              <p className="text-lg text-gray-600 mt-1 font-light">Centro di controllo del tuo regno di bellezza</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-medium">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Sistema Attivo
              </Badge>
              <Button 
                variant="outline" 
                className="border-pink-300 text-pink-600 hover:bg-pink-50 transition-all duration-300"
                onClick={() => setLocation('/admin-notifications')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifiche Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats Overview - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Oggi</p>
                      <p className="text-3xl font-bold">8</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-200" />
                  </div>
                  <p className="text-blue-100 text-sm mt-2">Appuntamenti</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Clienti</p>
                      <p className="text-3xl font-bold">127</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-200" />
                  </div>
                  <p className="text-emerald-100 text-sm mt-2">Totali</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Messaggi</p>
                      <p className="text-3xl font-bold">3</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-200" />
                  </div>
                  <p className="text-purple-100 text-sm mt-2">Non letti</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium">Incasso</p>
                      <p className="text-3xl font-bold">€420</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-pink-200" />
                  </div>
                  <p className="text-pink-100 text-sm mt-2">Oggi</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              


              {/* Client Management */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      Gestione Clienti
                    </CardTitle>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Visualizza profili, storico e preferenze clienti</p>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setLocation('/admin-clients')}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex-1"
                    >
                      Gestisci Clienti
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => setLocation('/admin-clients')}
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Management */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg mr-3">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      Galleria Lavori
                    </CardTitle>
                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Gestisci foto dei lavori e approvazioni</p>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setLocation('/admin-gallery')}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex-1"
                    >
                      Gestisci Galleria
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                      onClick={() => setLocation('/admin-gallery')}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Activity Feed */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <Activity className="h-5 w-5 mr-2 text-orange-500" />
                  Attività Recenti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Maria ha prenotato</p>
                      <p className="text-xs text-gray-500">Manicure - Domani 14:30</p>
                    </div>
                    <span className="text-xs text-gray-400">2min fa</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sofia ha caricato foto</p>
                      <p className="text-xs text-gray-500">Richiede approvazione</p>
                    </div>
                    <span className="text-xs text-gray-400">5min fa</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Giulia ha scritto</p>
                      <p className="text-xs text-gray-500">Nuovo messaggio</p>
                    </div>
                    <span className="text-xs text-gray-400">12min fa</span>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-pink-600 hover:bg-pink-50"
                  onClick={() => setLocation('/admin-notifications')}
                >
                  Vedi tutto →
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Azioni Veloci
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setLocation('/admin-swaps')}
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white"
                >
                  Gestisci Scambi
                </Button>
                <Button 
                  onClick={() => setLocation('/admin-finances')}
                  variant="outline" 
                  className="w-full border-green-200 text-green-600 hover:bg-green-50"
                >
                  Finanze
                </Button>
                <Button 
                  onClick={() => setLocation('/admin-whatsapp-reminders')}
                  variant="outline" 
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Promemoria WhatsApp
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}