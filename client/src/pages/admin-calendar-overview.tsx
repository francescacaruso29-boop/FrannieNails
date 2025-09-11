import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Phone,
  Settings,
  Plus,
  X,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Mail,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks, getWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  service: string;
  time: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'completed';
  price: number;
}

export default function AdminCalendarOverview() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [appointments, setAppointments] = useState<{ [key: string]: Appointment[] }>({});
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const [, setLocation] = useLocation();

  const { toast } = useToast();

  // Load appointments
  useEffect(() => {
    const sampleAppointments = {
      '2025-07-16': [
        { id: 1, clientId: 101, clientName: 'Maria Rossi', service: 'Gel', time: '10:00', phone: '+39 333 1234567', status: 'confirmed' as const, price: 25 },
        { id: 2, clientId: 102, clientName: 'Giulia Bianchi', service: 'Ricostruzione', time: '15:30', phone: '+39 333 2345678', status: 'confirmed' as const, price: 45 },
        { id: 3, clientId: 103, clientName: 'Anna Verde', service: 'Semipermanente', time: '16:30', phone: '+39 333 3456789', status: 'pending' as const, price: 15 }
      ],
      '2025-07-17': [
        { id: 4, clientId: 104, clientName: 'Laura Blu', service: 'Laminazione Ciglia', time: '09:30', phone: '+39 333 4567890', status: 'confirmed' as const, price: 35 },
        { id: 5, clientId: 105, clientName: 'Sara Neri', service: 'Gel', time: '14:00', phone: '+39 333 5678901', status: 'confirmed' as const, price: 25 }
      ],
      '2025-07-18': [
        { id: 6, clientId: 106, clientName: 'Elena Ferrari', service: 'Ceretta Brasiliana', time: '11:00', phone: '+39 333 6789012', status: 'confirmed' as const, price: 30 },
        { id: 7, clientId: 107, clientName: 'Francesca Rossi', service: 'Epilazione', time: '16:00', phone: '+39 333 7890123', status: 'pending' as const, price: 15 }
      ],
      '2025-07-19': [
        { id: 8, clientId: 108, clientName: 'Valentina Gialli', service: 'Trucco', time: '10:30', phone: '+39 333 8901234', status: 'confirmed' as const, price: 25 },
        { id: 9, clientId: 109, clientName: 'Chiara Rosa', service: 'Semipermanente Piedi', time: '15:00', phone: '+39 333 9012345', status: 'confirmed' as const, price: 20 }
      ],
      '2025-07-20': [
        { id: 10, clientId: 110, clientName: 'Martina Viola', service: 'Ricostruzione', time: '09:00', phone: '+39 333 0123456', status: 'confirmed' as const, price: 45 }
      ]
    };
    
    setAppointments(sampleAppointments);
  }, []);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const weekDays = [];
  let day = weekStart;
  while (day <= weekEnd) {
    weekDays.push(day);
    day = addDays(day, 1);
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowPopup(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments[dateStr] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentMonth = format(currentWeek, 'MMMM', { locale: it });
  const selectedDateDay = selectedDate ? format(selectedDate, 'd') : '';
  const selectedDayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Get sample appointments for the schedule list
  const sampleAppointments = Object.values(appointments).flat();

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const allAppointments = Object.values(appointments).flat();
    const filtered = allAppointments.filter(appointment => 
      appointment.clientName.toLowerCase().includes(query.toLowerCase()) ||
      appointment.phone.includes(query) ||
      appointment.service.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };



  // Function to send automatic notification to client
  const sendCalendarAction = async (action: string, clientId: number, data: any) => {
    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          clientId,
          data
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✓ Notifica automatica inviata: ${action}`);
        alert(`✅ Notifica automatica inviata a ${result.client}!\n\nDettagli: ${result.details}\n\nControlla i log del server per vedere i dettagli completi.`);
      } else {
        console.error('Errore nell\'invio notifica:', result.message);
        alert('❌ Errore nell\'invio della notifica: ' + result.message);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('❌ Errore di connessione nell\'invio della notifica');
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
      >
        {/* Decorative pattern overlay for depth */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
          <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-white/15 blur-lg"></div>
          <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-white/25 blur-lg"></div>
        </div>
        
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="p-6 relative z-10">
          {/* Header with Back Button */}
          <div className="mb-8 mt-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setLocation('/admin')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" style={{ color: '#d38a77' }} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Calendario Generale</h1>
              </div>
            </div>
            <p className="text-white/80 ml-14">
              Visualizza e gestisci tutti gli appuntamenti del salone
            </p>
          </div>



          {/* Modern Clean Layout */}
          <div className="max-w-4xl mx-auto">
            
            {/* Today Card */}
            <Card className="bg-white rounded-3xl shadow-sm border-0 mb-6 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Today</h2>
                  <button className="text-gray-400">
                    <Calendar className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className="text-center text-sm text-gray-500 font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {weekDays.map((date, index) => {
                    const isToday = isSameDay(date, new Date());
                    const dayAppointments = weekAppointments.filter(apt => 
                      isSameDay(new Date(apt.appointmentDate), date)
                    );
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          h-12 w-12 rounded-2xl text-sm font-medium transition-all duration-200
                          ${isToday 
                            ? 'bg-pink-500 text-white shadow-lg' 
                            : dayAppointments.length > 0
                            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
                
                {/* Time Period Tabs */}
                <div className="flex bg-gray-50 rounded-2xl p-1 mb-6">
                  <button className="flex-1 py-3 text-sm font-medium text-gray-600">
                    Morning
                  </button>
                  <button className="flex-1 py-3 px-6 bg-white rounded-xl text-sm font-medium text-gray-900 shadow-sm">
                    Afternoon
                  </button>
                  <button className="flex-1 py-3 text-sm font-medium text-gray-600">
                    Evening
                  </button>
                </div>
                
                {/* Today's Summary */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Appuntamenti Oggi</h3>
                      <p className="text-gray-600 text-sm">Hai {todayAppointments.length} appuntamenti</p>
                    </div>
                    <div className="text-3xl font-bold text-pink-500">
                      {todayAppointments.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Appointments List */}
              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Appuntamenti</h2>
                    <button 
                      onClick={toggleSearch}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Search className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  {showSearch && (
                    <div className="mb-6">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cerca clienti..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        />
                        <Search className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  )}
                  
                  {/* Appointments List */}
                  <div className="space-y-4">
                    {(searchResults.length > 0 ? searchResults : todayAppointments).map((appointment, index) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{appointment.clientName}</div>
                              <div className="text-sm text-gray-600">{appointment.phone}</div>
                                <div className="text-sm text-gray-500">{appointment.service} - {appointment.time}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-pink-600">€{appointment.price}</div>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status === 'confirmed' ? 'Confermato' : 
                                   appointment.status === 'pending' ? 'In attesa' : 'Completato'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {searchQuery && searchResults.length === 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-center text-gray-500">
                        Nessun risultato trovato per "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}

                {/* Month Title */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 capitalize mb-2">
                    {currentMonth} 2025
                  </h2>
                </div>

                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => (
                    <div key={index} className="text-center text-sm font-medium text-gray-500 py-3">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {weekDays.map((day, index) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    
                    const dateStr = format(day, 'yyyy-MM-dd');
                    return (
                      <div key={index} className="text-center">
                        <button
                          onClick={() => handleDateClick(day)}

                          className={`w-12 h-12 rounded-xl font-semibold text-lg transition-all ${
                            isSelected 
                              ? 'bg-pink-500 text-white shadow-lg' 
                              : isToday
                              ? 'bg-pink-100 text-pink-600 ring-2 ring-pink-300'
                              : dayAppointments.length > 0
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}

                        >
                          {format(day, 'd')}
                        </button>
                      </div>
                    );
                  })}
                </div>


              </div>
            </Card>
          </div>
        </div>

        {/* Popup for Day Details */}
        {showPopup && selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {format(selectedDate, 'EEEE d MMMM', { locale: it })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPopup(false)}
                    className="text-gray-500 hover:text-gray-700 rounded-full w-8 h-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedDayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{appointment.time}</span>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status === 'confirmed' ? 'Confermato' : 
                             appointment.status === 'pending' ? 'In attesa' : 'Completato'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900">{appointment.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-600">{appointment.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{appointment.service}</span>
                          <span className="font-bold" style={{ color: '#d38a77' }}>€{appointment.price}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => sendCalendarAction('send_reminder', appointment.clientId, {
                              date: format(selectedDate, 'dd/MM/yyyy'),
                              time: appointment.time,
                              service: appointment.service
                            })}
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Promemoria
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => sendCalendarAction('cancel_appointment', appointment.clientId, {
                              appointmentId: appointment.id,
                              date: format(selectedDate, 'dd/MM/yyyy'),
                              time: appointment.time,
                              service: appointment.service
                            })}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancella
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nessun appuntamento per questo giorno</p>
                  </div>
                )}


              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}