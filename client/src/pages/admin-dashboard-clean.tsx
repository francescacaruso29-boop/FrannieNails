import { useState } from "react";
import { Calendar, Users, MessageSquare, Camera, Euro, Clock, TrendingUp, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';

export default function AdminDashboardClean() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prezzi servizi
  const servicePrices = {
    'Gel': 25,
    'Ricostruzione': 45,
    'Semipermanente': 15,
    'Semipermanente Piedi': 20,
    'Epilazione': 30,
    'Ceretta Brasiliana': 35,
    'Laminazione Ciglia': 25,
    'Trucco': 40
  };

  // Appuntamenti della settimana per calcolo incasso
  const weeklyAppointments = [
    { service: 'Gel', date: '2025-07-30', completed: true },
    { service: 'Ricostruzione', date: '2025-07-30', completed: true },
    { service: 'Semipermanente', date: '2025-07-29', completed: true },
    { service: 'Laminazione Ciglia', date: '2025-07-29', completed: true },
    { service: 'Gel', date: '2025-07-28', completed: true },
    { service: 'Ceretta Brasiliana', date: '2025-07-28', completed: true },
    { service: 'Epilazione', date: '2025-07-27', completed: true },
    { service: 'Semipermanente', date: '2025-07-27', completed: true },
    { service: 'Ricostruzione', date: '2025-07-26', completed: true },
    { service: 'Gel', date: '2025-07-26', completed: true },
    { service: 'Trucco', date: '2025-07-25', completed: true },
    { service: 'Laminazione Ciglia', date: '2025-07-25', completed: true },
    { service: 'Semipermanente Piedi', date: '2025-07-24', completed: true }
  ];

  // Calcolo incasso settimanale reale
  const weeklyRevenue = weeklyAppointments
    .filter(apt => apt.completed)
    .reduce((total, apt) => total + (servicePrices[apt.service as keyof typeof servicePrices] || 0), 0);

  // Appuntamenti di oggi
  const todayAppointments = [
    { id: 1, clientName: "Francesca Rossi", service: "Gel", time: "09:00", phone: "123-456-789" },
    { id: 2, clientName: "Maria Bianchi", service: "Ricostruzione", time: "10:30", phone: "987-654-321" },
    { id: 3, clientName: "Giulia Verdi", service: "Semipermanente", time: "15:00", phone: "555-666-777" },
    { id: 4, clientName: "Sara Neri", service: "Laminazione Ciglia", time: "16:30", phone: "444-333-222" },
  ];

  const stats = [
    {
      title: "Appuntamenti Oggi",
      value: todayAppointments.length,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    {
      title: "Clienti Totali",
      value: 127,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100"
    },
    {
      title: "Foto in Attesa",
      value: 8,
      icon: Camera,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    {
      title: "Incasso Settimana",
      value: `€${weeklyRevenue}`,
      icon: Euro,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    }
  ];

  const quickActions = [

    { title: "Clienti", icon: Users, path: "/admin-clients", color: "bg-green-500" },
    { title: "Messaggi", icon: MessageSquare, path: "/admin-messages", color: "bg-purple-500" },
    { title: "Galleria", icon: Camera, path: "/admin-gallery", color: "bg-pink-500" },
    { title: "Statistiche", icon: BarChart3, path: "/admin-statistics", color: "bg-indigo-500" },
    { title: "Scambi", icon: Activity, path: "/admin-swaps", color: "bg-orange-500" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f8f0ef 0%, #e8c5c5 25%, #d4a5a5 50%, #c18585 75%, #d38a77 100%)'
    }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-white/15 blur-xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full bg-white/8 blur-3xl"></div>
        <div className="absolute top-1/2 right-10 w-20 h-20 rounded-full bg-white/12 blur-xl"></div>
        <div className="absolute bottom-40 right-1/4 w-28 h-28 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute top-32 left-1/2 w-16 h-16 rounded-full bg-white/20 blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-6 h-6 rounded-full bg-white/25 blur-sm"></div>
      </div>
      
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="px-4 md:px-6 py-6 relative z-10">
        {/* Header */}
        <div className="mb-8 mt-8">
          <div className="text-center mb-6">
            <h1 className="text-5xl text-white mb-2 elegant-script">Benvenuta Francesca</h1>
            <p className="text-white/80 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Il tuo salone in un click ✨</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-white/80 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Appuntamenti di Oggi */}
          <Card className="lg:col-span-2 border-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-white">Appuntamenti di Oggi</CardTitle>

              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{appointment.clientName}</h4>
                        <p className="text-sm text-white/80">{appointment.service}</p>
                        <p className="text-xs text-white/60">{appointment.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-white">{appointment.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-white">Riepilogo Rapido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Appuntamenti Completati</span>
                  <span className="font-semibold text-white">13</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Messaggi Non Letti</span>
                  <span className="font-semibold text-red-300">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Foto Approvate</span>
                  <span className="font-semibold text-white">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Nuovi Clienti</span>
                  <span className="font-semibold text-green-300">5</span>
                </div>
                <hr className="my-4 border-white/20" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Incasso Oggi</span>
                  <span className="font-bold text-xl text-green-300">€115</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-white">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setLocation(action.path)}
                  className="flex flex-col items-center p-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 hover:shadow-lg transition-all group"
                >
                  <div className={`${action.color} p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{action.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}