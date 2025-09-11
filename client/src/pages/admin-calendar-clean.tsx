import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock,
  User,
  ArrowLeft,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { it } from 'date-fns/locale';

interface Appointment {
  id: number;
  clientName: string;
  service: string;
  time: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export default function AdminCalendarClean() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setLocation] = useLocation();
  
  // Get current month days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get week days for header
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Sample appointments for today
  const todayAppointments = [
    { id: 1, clientName: "Maria Rossi", service: "Gel", time: "9:00", date: format(new Date(), 'yyyy-MM-dd'), status: 'confirmed' as const },
    { id: 2, clientName: "Elena Bianchi", service: "Ricostruzione", time: "10:30", date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' as const },
    { id: 3, clientName: "Giulia Verdi", service: "Semipermanente", time: "15:00", date: format(new Date(), 'yyyy-MM-dd'), status: 'confirmed' as const }
  ];

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    );
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen" 
        style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}
      >
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="mb-8 mt-8">
            <h1 className="text-2xl font-bold text-white mb-2">Calendario</h1>
            <p className="text-white/80">
              Gestisci gli appuntamenti del salone
            </p>
          </div>

          {/* Modern Clean Layout */}
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Today Card */}
            <Card className="bg-white rounded-3xl shadow-sm border-0 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Today</h2>
                  <button className="text-gray-400">
                    <MoreHorizontal className="w-6 h-6" />
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
                    const dayAppointments = getAppointmentsForDate(date);
                    
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

            {/* Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Schedule Card */}
              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Today's Schedule</h2>
                    <Button size="sm" className="rounded-full bg-pink-500 hover:bg-pink-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Appointments List */}
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{appointment.clientName}</div>
                            <div className="text-sm text-gray-600">{appointment.service}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{appointment.time}</div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {appointment.status === 'confirmed' ? 'Confermato' : 
                               appointment.status === 'pending' ? 'In attesa' : 'Completato'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {todayAppointments.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nessun appuntamento oggi</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Calendar */}
              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      {format(currentDate, 'MMMM yyyy', { locale: it })}
                    </h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentDate(addDays(currentDate, -30))}
                        className="rounded-full w-8 h-8 p-0"
                      >
                        ‹
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentDate(addDays(currentDate, 30))}
                        className="rounded-full w-8 h-8 p-0"
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                  
                  {/* Month Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, index) => (
                      <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day, index) => {
                      const isToday = isSameDay(day, new Date());
                      const hasAppointments = getAppointmentsForDate(day).length > 0;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            h-10 w-10 rounded-xl text-sm font-medium transition-all
                            ${isToday 
                              ? 'bg-pink-500 text-white' 
                              : hasAppointments
                              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-pink-500">12</div>
                        <div className="text-sm text-gray-600">days</div>
                        <div className="text-xs text-gray-500">Your current streak</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-pink-600" />
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-700 hover:text-pink-600"
                    onClick={() => setLocation('/admin-calendar')}
                  >
                    Nuovo Appuntamento
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <Button variant="ghost" className="w-full text-gray-700 hover:text-blue-600">
                    Vista Settimanale
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <Button variant="ghost" className="w-full text-gray-700 hover:text-purple-600">
                    Orari Salone
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}