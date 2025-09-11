import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Camera, 
  MessageSquare, 
  TrendingUp, 
  Send,
  Clock,
  Euro,
  Star,
  ChevronRight,
  Bell,
  Settings,
  Plus,
  ArrowLeftRight
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';

interface DashboardStats {
  todayAppointments: number;
  totalClients: number;
  pendingPhotos: number;
  unreadMessages: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  newClients: number;
}

interface TodayAppointment {
  id: string;
  clientName: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export default function AdminNewDesign() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalClients: 0,
    pendingPhotos: 0,
    unreadMessages: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    newClients: 0
  });

  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'appointment', message: 'Nuovo appuntamento prenotato per domani', time: '5 min fa', read: false },
    { id: 2, type: 'photo', message: '3 foto in attesa di approvazione', time: '1 ora fa', read: false },
    { id: 3, type: 'message', message: 'Maria Rossi ha inviato un messaggio', time: '2 ore fa', read: false },
    { id: 4, type: 'payment', message: 'Pagamento ricevuto da Laura Bianchi', time: '3 ore fa', read: true },
  ]);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        todayAppointments: 6,
        totalClients: 127,
        pendingPhotos: 4,
        unreadMessages: 8,
        todayRevenue: 380,
        weekRevenue: 1850,
        monthRevenue: 7200,
        newClients: 12
      });

      setTodayAppointments([
        { id: '1', clientName: 'Maria Rossi', time: '09:00', service: 'Manicure Gel', status: 'completed' },
        { id: '2', clientName: 'Laura Bianchi', time: '10:30', service: 'Nail Art', status: 'completed' },
        { id: '3', clientName: 'Sofia Verdi', time: '14:00', service: 'Ricostruzione', status: 'confirmed' },
        { id: '4', clientName: 'Anna Neri', time: '15:30', service: 'Pedicure', status: 'confirmed' },
        { id: '5', clientName: 'Giulia Rosa', time: '17:00', service: 'Manicure + Nail Art', status: 'pending' },
        { id: '6', clientName: 'Elena Blu', time: '18:30', service: 'Gel Polish', status: 'pending' }
      ]);
    }, 800);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'confirmed': return 'Confermato';
      case 'pending': return 'In Attesa';
      default: return status;
    }
  };

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.relative')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Frannie Nails
                </h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-pink-600 relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                  
                  {/* Dropdown Notifiche */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800">Notifiche</h3>
                          <span className="text-sm text-gray-500">
                            {notifications.filter(n => !n.read).length} non lette
                          </span>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50/50' : ''
                            }`}
                            onClick={() => {
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.type === 'appointment' ? 'bg-blue-500' :
                                notification.type === 'photo' ? 'bg-orange-500' :
                                notification.type === 'message' ? 'bg-green-500' :
                                'bg-purple-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-pink-600 hover:bg-pink-50"
                          onClick={() => setLocation('/admin-notifications')}
                        >
                          Vedi tutte le notifiche
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-pink-600"
                  onClick={() => window.location.href = '/admin-settings'}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-4xl font-light text-gray-800 mb-2">
              Benvenuta, <span className="font-bold text-pink-600">Francesca</span>
            </h2>
            <p className="text-gray-600">Ecco la tua dashboard per oggi, {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Appuntamenti Oggi</p>
                    <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Incasso Oggi</p>
                    <p className="text-3xl font-bold">€{stats.todayRevenue}</p>
                  </div>
                  <Euro className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Clienti Totali</p>
                    <p className="text-3xl font-bold">{stats.totalClients}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Messaggi</p>
                    <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Today's Appointments */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Appuntamenti di Oggi
                    </CardTitle>

                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/client-detail?id=${appointment.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                            <span className="text-pink-600 font-medium">
                              {appointment.clientName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{appointment.clientName}</p>
                            <p className="text-sm text-gray-600">{appointment.service}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{appointment.time}</p>
                            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </Badge>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Revenue */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Azioni Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">

                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50"
                    onClick={() => window.location.href = '/admin-clients'}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestione Clienti
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => window.location.href = '/admin-gallery'}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Galleria Lavori
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => window.location.href = '/admin-messages'}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messaggi ({stats.unreadMessages})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-purple-200 text-purple-600 hover:bg-purple-50"
                    onClick={() => setLocation('/admin-swaps')}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Gestione Scambi
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => setLocation('/admin-notifications')}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Centro Notifiche
                  </Button>
                </CardContent>
              </Card>

              {/* Revenue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Incassi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Oggi</span>
                    <span className="font-semibold text-green-600">€{stats.todayRevenue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Questa Settimana</span>
                    <span className="font-semibold text-green-600">€{stats.weekRevenue}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-gray-600">Questo Mese</span>
                    <span className="font-semibold text-green-600">€{stats.monthRevenue}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => window.location.href = '/admin-finances'}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Dettagli Finanziari
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Notifiche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-blue-800">Nuovo appuntamento prenotato</p>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-orange-50">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm text-orange-800">{stats.pendingPhotos} foto in attesa</p>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-green-800">Promemoria WhatsApp inviati</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}