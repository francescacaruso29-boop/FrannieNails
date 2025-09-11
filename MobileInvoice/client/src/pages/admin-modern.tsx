import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Camera, 
  MessageSquare, 
  Clock,
  ArrowLeftRight,
  Send,
  Bell,
  ArrowLeft,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingPhotos: number;
  unreadMessages: number;
  totalClients: number;
  todayRevenue: number;
}

interface TomorrowAppointment {
  id: number;
  clientName: string;
  clientPhone: string;
  time: string;
  service: string;
  date: string;
}



export default function AdminModern() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingPhotos: 0,
    unreadMessages: 0,
    totalClients: 0,
    todayRevenue: 0
  });
  const [tomorrowAppointments, setTomorrowAppointments] = useState<TomorrowAppointment[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();


  const sendWhatsAppReminder = async (appointment: TomorrowAppointment) => {
    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reminder',
          clientId: 999,
          data: {
            name: appointment.clientName,
            phone: appointment.clientPhone,
            date: appointment.date,
            time: appointment.time,
            service: appointment.service
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        // Apri WhatsApp direttamente
        const phone = appointment.clientPhone.replace(/\s+/g, '').replace('+', '');
        const message = encodeURIComponent(result.whatsappPreview);
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: "WhatsApp Aperto",
          description: `Promemoria pronto per ${appointment.clientName}`,
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile preparare il promemoria",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Load dashboard stats
    setTimeout(() => {
      setStats({
        totalAppointments: 156,
        todayAppointments: 8,
        pendingPhotos: 3,
        unreadMessages: 12,
        totalClients: 89,
        todayRevenue: 245
      });
    }, 1000);

    // Load tomorrow's appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = format(tomorrow, 'dd/MM/yyyy');
    
    setTomorrowAppointments([
      {
        id: 1,
        clientName: "Maria Rossi",
        clientPhone: "+39 333 123 4567",
        time: "09:00",
        service: "Gel Manicure",
        date: tomorrowDate
      },
      {
        id: 2,
        clientName: "Giulia Bianchi", 
        clientPhone: "+39 333 234 5678",
        time: "10:30",
        service: "Ricostruzione",
        date: tomorrowDate
      },
      {
        id: 3,
        clientName: "Anna Verde",
        clientPhone: "+39 333 345 6789", 
        time: "15:00",
        service: "Semipermanente",
        date: tomorrowDate
      },
      {
        id: 4,
        clientName: "Laura Neri",
        clientPhone: "+39 333 456 7890",
        time: "16:30", 
        service: "Pedicure",
        date: tomorrowDate
      }
    ]);
  }, []);



  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
      >
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        {/* Decorative pattern overlay for depth */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-12 h-12 rounded-full bg-white/20 blur-lg"></div>
          <div className="absolute top-40 right-16 w-8 h-8 rounded-full bg-white/15 blur-md"></div>
          <div className="absolute bottom-32 left-20 w-6 h-6 rounded-full bg-white/25 blur-sm"></div>
        </div>
        
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="px-4 md:px-6 py-6 relative z-10">
        {/* Modern Header */}
        <div className="mb-8 mt-8">
          <div className="text-center mb-6">
            <h1 className="text-5xl text-white mb-2 elegant-script">Benvenuta Francesca</h1>
          </div>
          
          {/* Date and Time */}
          <div className="flex items-center gap-6 text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-lg">{new Date().toLocaleDateString('it-IT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{new Date().toLocaleTimeString('it-IT', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Appointments - Large Card */}


          {/* Clients Card */}
          <Card 
            className="rounded-3xl border-0 bg-white/20 backdrop-blur-md cursor-pointer hover:scale-105 hover:shadow-2xl transform transition-all duration-300"
            onClick={() => window.location.href = '/admin-clients'}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
                  <p className="text-white/80 text-sm">Clienti totali</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <p className="text-white/80 text-sm">+3 questo mese</p>
              </div>
            </CardContent>
          </Card>



          {/* Messages & Photos Combined */}
          <Card 
            className="rounded-3xl border-0 bg-white/20 backdrop-blur-md cursor-pointer hover:scale-105 hover:shadow-2xl transform transition-all duration-300"
            onClick={() => window.location.href = '/admin-gallery'}
            style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', boxShadow: '0 10px 30px rgba(252, 182, 159, 0.3)' }}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Photos Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <Camera className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{stats.pendingPhotos}</p>
                      <p className="text-gray-600 text-sm">Foto in attesa</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 text-xs">Nuovo</Badge>
                </div>
                
                {/* Messages Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/20">
                      <MessageSquare className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{stats.unreadMessages}</p>
                      <p className="text-gray-600 text-sm">Nuovi messaggi</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Priorità</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card 
            className="rounded-3xl border-0 bg-white/20 backdrop-blur-md cursor-pointer hover:bg-white/30 transition-all duration-300"
            onClick={() => window.location.href = '/admin-stats'}
            style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/20">
                  <TrendingUp className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">€{stats.todayRevenue}</p>
                  <p className="text-gray-600 text-sm">Oggi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-gray-600 text-sm">+12% vs ieri</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="rounded-3xl border-0 bg-white/20 backdrop-blur-md cursor-pointer hover:bg-white/30 transition-all duration-300"
            onClick={() => window.location.href = '/admin-whatsapp-reminders'}
            style={{ background: 'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/20">
                  <Send className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">WhatsApp</p>
                  <p className="text-gray-600 text-sm">Promemoria</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-gray-600 text-sm">Sistema attivo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tomorrow's Appointments - WhatsApp Reminders */}
        <Card className="rounded-2xl shadow-sm border-0 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Send className="w-6 h-6" style={{ color: '#25D366' }} />
              Promemoria WhatsApp
            </CardTitle>
            <p className="text-base text-gray-600 mt-2">
              Clienti di domani - Clicca per inviare promemoria automatici
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {tomorrowAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg bg-green-50 border border-green-100 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-lg text-gray-900 truncate">{appointment.clientName}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-base text-gray-700">
                          <span className="font-medium">{appointment.time}</span>
                          <span>•</span>
                          <span>{appointment.service}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{appointment.clientPhone}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => sendWhatsAppReminder(appointment)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 text-base font-medium"
                  >
                    <Send className="w-5 h-5" />
                    Invia Promemoria WhatsApp
                  </Button>
                </div>
              ))}
              
              {tomorrowAppointments.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nessun appuntamento domani</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <div className="max-w-3xl mx-auto mt-8">
          {/* Calendar Overview */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: '#d38a77' }} />
                Appuntamenti Oggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Today's appointments */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">10:00 - Maria Rossi</h4>
                      <p className="text-sm text-gray-600">Gel • €25</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Confermato</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">15:30 - Giulia Bianchi</h4>
                      <p className="text-sm text-gray-600">Ricostruzione • €45</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Confermato</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">16:30 - Anna Verde</h4>
                      <p className="text-sm text-gray-600">Semipermanente • €15</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Confermato</Badge>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ricavo Giornaliero</span>
                    <span className="font-bold text-lg" style={{ color: '#d38a77' }}>€85</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">

                  
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => window.open('/notification-test', '_blank')}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Test Notifiche Push Popup
                  </Button>
                  

                </div>
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
    </ProtectedRoute>
  );
}