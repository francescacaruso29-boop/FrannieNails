import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft,
  GripVertical,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number; // in minutes
  price: number;
  status: 'confirmed' | 'pending' | 'completed';
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

interface DraggedAppointment {
  appointment: Appointment;
  originalSlot: string;
}

export default function AdminDragCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedAppointment | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate time slots for the day (9:00 AM to 7:00 PM, 30-minute intervals)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: true,
          appointment: undefined
        });
      }
    }
    return slots;
  };

  // Get appointments for the selected date with real API
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', 'date', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/date/${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    }
  });

  // Get clients data for appointment display
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  // Reschedule appointment mutation
  const rescheduleAppointment = useMutation({
    mutationFn: async ({ appointmentId, newTime, newDate }: { appointmentId: number, newTime: string, newDate: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTime, newDate })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore nello spostamento appuntamento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "✅ Appuntamento spostato!",
        description: "L'appuntamento è stato spostato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Service duration mapping
  function getServiceDuration(service: string): number {
    const durations: Record<string, number> = {
      'Gel': 60,
      'Ricostruzione': 90,
      'Semipermanente': 45,
      'Semipermanente Piedi': 45,
      'Epilazione': 30,
      'Ceretta Brasiliana': 45,
      'Laminazione Ciglia': 60,
      'Trucco': 45
    };
    return durations[service] || 60;
  }

  // Service price mapping
  function getServicePrice(service: string): number {
    const prices: Record<string, number> = {
      'Gel': 25,
      'Ricostruzione': 45,
      'Semipermanente': 15,
      'Semipermanente Piedi': 20,
      'Epilazione': 25,
      'Ceretta Brasiliana': 35,
      'Laminazione Ciglia': 30,
      'Trucco': 25
    };
    return prices[service] || 25;
  }

  // Transform real appointment data to match interface
  const appointments: Appointment[] = (appointmentsData?.appointments || []).map((apt: any) => {
    const client = clientsData?.clients?.find((c: any) => c.id === apt.clientId);
    return {
      id: apt.id,
      clientId: apt.clientId,
      clientName: client?.fullName || 'Cliente sconosciuto',
      clientPhone: client?.phoneNumber || '',
      service: apt.service,
      date: format(apt.appointmentDate, 'yyyy-MM-dd'),
      time: apt.appointmentTime,
      duration: getServiceDuration(apt.service),
      price: getServicePrice(apt.service),
      status: 'confirmed' as const
    };
  });

  useEffect(() => {
    const slots = generateTimeSlots();
    
    // Map real appointments to time slots
    const slotsWithAppointments = slots.map(slot => {
      const appointment = appointments.find(apt => apt.time === slot.time);
      return {
        ...slot,
        available: !appointment,
        appointment
      };
    });
    
    setTimeSlots(slotsWithAppointments);
  }, [selectedDate, appointments]);

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedItem({
      appointment,
      originalSlot: appointment.time
    });
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(timeSlot);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTimeSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (!draggedItem) return;

    const { appointment, originalSlot } = draggedItem;

    // Check if target slot is available
    const targetSlot = timeSlots.find(slot => slot.time === targetTimeSlot);
    if (!targetSlot?.available) {
      toast({
        title: "❌ Slot Non Disponibile",
        description: "Questo orario è già occupato da un altro appuntamento.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow dropping on the same slot
    if (originalSlot === targetTimeSlot) {
      return;
    }

    // Call the real API to reschedule the appointment
    rescheduleAppointment.mutate({
      appointmentId: appointment.id,
      newTime: targetTimeSlot,
      newDate: format(selectedDate, 'yyyy-MM-dd')
    });

    // Log for admin tracking
    console.log(`📅 APPUNTAMENTO SPOSTATO VIA DRAG & DROP:`);
    console.log(`   Cliente: ${appointment.clientName}`);
    console.log(`   Da: ${originalSlot} → A: ${targetTimeSlot}`);
    console.log(`   Servizio: ${appointment.service}`);
    console.log(`   Data: ${format(selectedDate, 'yyyy-MM-dd')}`);
  };

  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 border-gray-200 text-gray-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Show loading state
  if (appointmentsLoading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-gray-50">
          <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
          
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-[#d38a77] mx-auto mb-4" />
                <p className="text-gray-600">Caricamento appuntamenti...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Calendario Drag & Drop
                </h1>
                <p className="text-gray-600 mt-1">
                  Trascina gli appuntamenti per riorganizzare la giornata
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#d38a77]" />
              <span className="text-lg font-medium text-gray-700">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: it })}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <Card className="border-[#d38a77] bg-gradient-to-r from-pink-50 to-rose-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-[#d38a77]" />
                <div>
                  <h3 className="font-medium text-[#d38a77]">Come usare il sistema drag & drop</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Clicca e trascina un appuntamento su un nuovo orario per spostarlo. 
                    Gli slot verdi sono disponibili, quelli rossi sono occupati.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Time Slots Column */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Orari Disponibili
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className={`
                        p-2 rounded text-center text-sm font-medium transition-colors
                        ${slot.available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {slot.time}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Calendar Column */}
            <div className="lg:col-span-10">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#d38a77]" />
                    Timeline Appuntamenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.time}
                        className={`
                          min-h-[80px] border-2 border-dashed rounded-lg p-3 transition-all duration-200
                          ${dragOverSlot === slot.time 
                            ? 'border-[#d38a77] bg-pink-50' 
                            : slot.available 
                              ? 'border-green-200 bg-green-50/50 hover:bg-green-50' 
                              : 'border-gray-200 bg-gray-50/50'
                          }
                        `}
                        onDragOver={(e) => slot.available && handleDragOver(e, slot.time)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => slot.available && handleDrop(e, slot.time)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            {slot.time}
                          </span>
                          {slot.available && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Disponibile
                            </Badge>
                          )}
                        </div>

                        {slot.appointment && (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, slot.appointment!)}
                            onDragEnd={handleDragEnd}
                            className={`
                              ${getAppointmentColor(slot.appointment.status)}
                              border-2 rounded-lg p-3 cursor-move hover:shadow-md transition-all
                              transform hover:scale-[1.02] active:scale-95
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 opacity-60" />
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {slot.appointment.clientName}
                                  </h4>
                                  <p className="text-xs opacity-80">
                                    {slot.appointment.service} • €{slot.appointment.price}
                                  </p>
                                  <p className="text-xs opacity-60">
                                    {slot.appointment.duration} min • {slot.appointment.clientPhone}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(slot.appointment.status)}
                              </div>
                            </div>
                          </div>
                        )}

                        {slot.available && (
                          <div className="text-center text-gray-400 text-sm py-4 border-2 border-dashed border-gray-200 rounded">
                            Trascina qui un appuntamento
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Appuntamenti Confermati</p>
                    <p className="text-lg font-bold text-gray-900">
                      {appointments.filter(apt => apt.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Attesa Conferma</p>
                    <p className="text-lg font-bold text-gray-900">
                      {appointments.filter(apt => apt.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Slot Disponibili</p>
                    <p className="text-lg font-bold text-gray-900">
                      {timeSlots.filter(slot => slot.available).length}
                    </p>
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