import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Camera, MessageSquare, TrendingUp, Send } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingPhotos: number;
  unreadMessages: number;
  totalClients: number;
  todayRevenue: number;
}

export default function AdminCleanMinimal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingPhotos: 0,
    unreadMessages: 0,
    totalClients: 0,
    todayRevenue: 0
  });

  useEffect(() => {
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
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen relative overflow-hidden" 
        style={{ 
          background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 30%, #ff9a8b 60%, #ffecd2 100%)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 15s ease infinite"
        }}
      >
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
        <div className="px-6 py-8 relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl text-white mb-8 elegant-script">Benvenuta Francesca</h1>
          </div>

          {/* Clean Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {/* Today's Appointments */}


            {/* Clients */}
            <Card 
              className="rounded-2xl border-0 bg-white/25 backdrop-blur-md cursor-pointer hover:bg-white/35 transition-all duration-300"
              onClick={() => window.location.href = '/admin-clients'}
            >
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-white mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">{stats.totalClients}</p>
                <p className="text-white/80 text-sm">Clienti</p>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card 
              className="rounded-2xl border-0 bg-white/25 backdrop-blur-md cursor-pointer hover:bg-white/35 transition-all duration-300"
              onClick={() => window.location.href = '/admin-gallery'}
            >
              <CardContent className="p-6 text-center">
                <Camera className="w-8 h-8 text-white mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">{stats.pendingPhotos}</p>
                <p className="text-white/80 text-sm">Foto</p>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card 
              className="rounded-2xl border-0 bg-white/25 backdrop-blur-md cursor-pointer hover:bg-white/35 transition-all duration-300"
              onClick={() => window.location.href = '/admin-messages'}
            >
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-white mx-auto mb-3" />
                <p className="text-3xl font-bold text-white mb-1">{stats.unreadMessages}</p>
                <p className="text-white/80 text-sm">Messaggi</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue */}
            <Card 
              className="rounded-2xl border-0 bg-white/25 backdrop-blur-md cursor-pointer hover:bg-white/35 transition-all duration-300"
              onClick={() => window.location.href = '/admin-stats'}
            >
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-white mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">€{stats.todayRevenue}</p>
                <p className="text-white/80 text-lg">Ricavo Oggi</p>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card 
              className="rounded-2xl border-0 bg-white/25 backdrop-blur-md cursor-pointer hover:bg-white/35 transition-all duration-300"
              onClick={() => window.location.href = '/admin-whatsapp-reminders'}
            >
              <CardContent className="p-8 text-center">
                <Send className="w-12 h-12 text-white mx-auto mb-4" />
                <p className="text-2xl font-bold text-white mb-2">WhatsApp</p>
                <p className="text-white/80 text-lg">Promemoria</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}