import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MessageSquare, Camera, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface AdminActivity {
  id: string;
  type: 'appointment' | 'photo' | 'message' | 'swap-request' | 'swap-response';
  title: string;
  description: string;
  clientName: string;
  timestamp: string;
  data?: any;
}

export function AdminDashboard() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stats, setStats] = useState({
    totalAppointments: 24,
    pendingPhotos: 3,
    unreadMessages: 5,
    pendingSwaps: 2
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate admin activities
    const mockActivities: AdminActivity[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'Nuovo Appuntamento',
        description: 'Francesca ha prenotato Gel per il 15 luglio alle 10:30',
        clientName: 'Francesca Rossi',
        timestamp: new Date().toISOString(),
        data: { service: 'Gel', date: '2025-07-15', time: '10:30' }
      },
      {
        id: '2',
        type: 'photo',
        title: 'Foto Caricata',
        description: 'Nuova foto richiede approvazione',
        clientName: 'Maria Bianchi',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        data: { photoId: 123 }
      },
      {
        id: '3',
        type: 'swap-request',
        title: 'Richiesta Scambio',
        description: 'Giulia vuole scambiare appuntamento con Sara per il 20 luglio',
        clientName: 'Giulia Verdi',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        data: { targetClient: 'Sara Neri', date: '2025-07-20' }
      }
    ];

    setActivities(mockActivities);
    setStats({
      totalAppointments: 24,
      pendingPhotos: 3,
      unreadMessages: 5,
      pendingSwaps: 2
    });
  }, []);

  const getActivityIcon = (type: AdminActivity['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'swap-request':
      case 'swap-response':
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: AdminActivity['type']) => {
    switch (type) {
      case 'appointment':
        return 'bg-green-100 text-green-800';
      case 'photo':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'swap-request':
      case 'swap-response':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const testNotifications = async () => {
    try {
      const response = await fetch('/api/admin/test-all-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('Notifiche di test inviate con successo!');
      }
    } catch (error) {
      console.error('Errore invio notifiche test:', error);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#d38a77] mb-2">
            Dashboard Amministratore
          </h1>
          <p className="text-gray-600">
            Gestione attività clienti e notifiche
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appuntamenti</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#d38a77]">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">Questo mese</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Foto Pendenti</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#d38a77]">{stats.pendingPhotos}</div>
              <p className="text-xs text-muted-foreground">Da approvare</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messaggi</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#d38a77]">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">Non letti</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scambi</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#d38a77]">{stats.pendingSwaps}</div>
              <p className="text-xs text-muted-foreground">In attesa</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button 
                onClick={testNotifications}
                className="bg-[#d38a77] hover:bg-[#c17a67] text-white"
              >
                Testa Notifiche
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin-advanced'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                🚀 Dashboard Avanzato AI
              </Button>
              <Button variant="outline">
                Approva Foto
              </Button>
              <Button variant="outline">
                Gestisci Appuntamenti
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border bg-white/50"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {format(new Date(activity.timestamp), 'HH:mm', { locale: it })}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cliente: {activity.clientName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}