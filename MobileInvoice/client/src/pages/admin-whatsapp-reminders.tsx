import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  MessageCircle, 
  Clock, 
  Send, 
  Settings, 
  Users, 
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReminderSettings {
  enabled: boolean;
  hoursBefore: number;
  message: string;
  sendWhatsApp: boolean;
}

interface UpcomingReminder {
  id: number;
  clientName: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  reminderTime: string;
  status: 'pending' | 'sent' | 'failed';
}

export default function AdminWhatsAppReminders() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    hoursBefore: 24,
    message: "Ciao {nome}! Ti ricordiamo il tuo appuntamento per {servizio} domani alle {ora}. Ci vediamo da Frannie Nails! 💅",
    sendWhatsApp: true
  });

  const [upcomingReminders] = useState<UpcomingReminder[]>([
    {
      id: 1,
      clientName: "Maria Rossi",
      phone: "3517468491",
      appointmentDate: "2025-07-28",
      appointmentTime: "10:00",
      service: "Gel",
      reminderTime: "2025-07-27 10:00",
      status: 'pending'
    },
    {
      id: 2,
      clientName: "Elena Bianchi", 
      phone: "3456789012",
      appointmentDate: "2025-07-28",
      appointmentTime: "15:30",
      service: "Ricostruzione",
      reminderTime: "2025-07-27 15:30",
      status: 'sent'
    }
  ]);

  const handleSaveSettings = () => {
    toast({
      title: "Impostazioni Salvate",
      description: "Le impostazioni dei promemoria sono state aggiornate con successo."
    });
  };

  const handleTestReminder = async () => {
    toast({
      title: "Test Inviato",
      description: "Promemoria di test inviato con successo!"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const pendingCount = upcomingReminders.filter(r => r.status === 'pending').length;
  const sentCount = upcomingReminders.filter(r => r.status === 'sent').length;

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat relative"
        style={{ 
          backgroundImage: `url('/attached_assets/8ea4414806c43a94b63a32b38236624f_1757369729149.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
        
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="mb-6 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-0">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">💬 Promemoria WhatsApp</h1>
              <p className="text-gray-600">
                Gestisci i promemoria automatici per gli appuntamenti
              </p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center hover:bg-white/90 transition-colors border-0">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-xl font-bold text-gray-800">{pendingCount}</div>
                <div className="text-xs text-gray-600">In attesa</div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center hover:bg-white/90 transition-colors border-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-xl font-bold text-gray-800">{sentCount}</div>
                <div className="text-xs text-gray-600">Inviati</div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center hover:bg-white/90 transition-colors border-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-gray-800">{settings.hoursBefore}h</div>
                <div className="text-xs text-gray-600">Anticipo</div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center hover:bg-white/90 transition-colors border-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-gray-800">{upcomingReminders.length}</div>
                <div className="text-xs text-gray-600">Prossimi</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Settings Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 hover:bg-white/90 transition-all">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Settings className="w-5 h-5 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Impostazioni Promemoria</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Promemoria Automatici</Label>
                        <p className="text-xs text-gray-500">Attiva/disattiva il sistema</p>
                      </div>
                      <Switch 
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="hoursBefore" className="text-sm font-medium">
                        Ore di Anticipo
                      </Label>
                      <Input
                        id="hoursBefore"
                        type="number"
                        value={settings.hoursBefore}
                        onChange={(e) => setSettings(prev => ({ ...prev, hoursBefore: parseInt(e.target.value) }))}
                        className="mt-1 h-9"
                        min="1"
                        max="72"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-sm font-medium">
                        Messaggio Template
                      </Label>
                      <Textarea
                        id="message"
                        value={settings.message}
                        onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                        className="mt-1"
                        rows={3}
                        placeholder="Usa {nome}, {servizio}, {ora}"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <Label className="text-sm">Invia WhatsApp</Label>
                      </div>
                      <Switch 
                        checked={settings.sendWhatsApp}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendWhatsApp: checked }))}
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button 
                        onClick={handleSaveSettings} 
                        className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 text-white h-9"
                        size="sm"
                      >
                        Salva Impostazioni
                      </Button>
                      <Button 
                        onClick={handleTestReminder} 
                        variant="outline" 
                        className="w-full rounded-lg h-9"
                        size="sm"
                      >
                        <Send className="w-3 h-3 mr-2" />
                        Invia Test
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Reminders */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 hover:bg-white/90 transition-all">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Prossimi Promemoria</h3>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {upcomingReminders.map((reminder) => (
                      <div key={reminder.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 hover:bg-white/80 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{reminder.clientName}</div>
                            <div className="text-xs text-gray-600">{reminder.phone}</div>
                          </div>
                          <Badge className={`${getStatusColor(reminder.status)} text-xs`}>
                            {reminder.status === 'pending' ? 'In attesa' :
                             reminder.status === 'sent' ? 'Inviato' : 'Fallito'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-700 mb-2">
                          <div className="font-medium">{reminder.service}</div>
                          <div>{reminder.appointmentDate} alle {reminder.appointmentTime}</div>
                          <div className="text-gray-500">
                            Promemoria: {reminder.reminderTime}
                          </div>
                        </div>

                        {reminder.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className="rounded-lg h-7 bg-green-500 hover:bg-green-600 text-white text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Invia Ora
                          </Button>
                        )}
                      </div>
                    ))}

                    {upcomingReminders.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Nessun promemoria programmato</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}