import { useState, useEffect } from "react";
import { useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, Phone, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { it } from "date-fns/locale";

const services = [
  { name: "Gel", price: 25, duration: "1h" },
  { name: "Semipermanente", price: 15, duration: "45min" },
  { name: "Ricostruzione", price: 45, duration: "1h 30min" },
  { name: "Semipermanente Piedi", price: 20, duration: "1h" },
  { name: "Epilazione", price: 15, duration: "30min" },
  { name: "Ceretta Brasiliana", price: 30, duration: "45min" },
  { name: "Laminazione Ciglia", price: 35, duration: "1h" },
  { name: "Trucco", price: 25, duration: "45min" }
];

const timeSlots = [
  "9:00", "10:30", "15:00", "16:30"
];

interface Appointment {
  id: number;
  clientId: number;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  clientName?: string;
}

export default function AdminCalendar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [showOverview, setShowOverview] = useState(false);
  const [, setLocation] = useLocation();
  


  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
    // Fetch booked slots for this date
    checkAvailability(format(date, "yyyy-MM-dd"));
  };

  const checkAvailability = async (date: string) => {
    try {
      const response = await fetch(`/api/appointments/date/${date}`);
      const appointments = await response.json();
      const bookedTimes = appointments.map((apt: any) => apt.appointmentTime);
      setBookedSlots(bookedTimes);
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !clientName || !clientPhone) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi richiesti",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    try {
      // Create or get client
      let client = null;
      try {
        const response = await fetch(`/api/clients/phone/${clientPhone}`);
        if (response.ok) {
          client = await response.json();
        } else {
          throw new Error('Client not found');
        }
      } catch {
        // Create new client
        const uniqueCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        const clientResponse = await apiRequest("POST", "/api/clients", {
          uniqueCode,
          fullName: clientName,
          phoneNumber: clientPhone,
          personalCode: `ADMIN-${Date.now()}`
        });
        client = await clientResponse.json();
        console.log("✅ Cliente creato:", client);
      }

      // Create appointment (price tracking via daily earnings)
      const monthYear = format(selectedDate, "yyyy-MM");
      
      const appointmentResponse = await apiRequest("POST", "/api/appointments", {
        clientId: client.id,
        service: selectedService,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        monthYear
      });
      
      const appointmentResult = await appointmentResponse.json();
      console.log("✅ Appuntamento creato:", appointmentResult);

      toast({
        title: "Appuntamento Prenotato!",
        description: `${clientName} - ${selectedService} il ${format(selectedDate, "dd/MM/yyyy", { locale: it })} alle ${selectedTime}`,
        style: { backgroundColor: '#d38a77', color: 'white' }
      });

      // Reset form
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedService("");
      setClientName("");
      setClientPhone("");
      
      // Refresh availability
      if (selectedDate) {
        checkAvailability(format(selectedDate, "yyyy-MM-dd"));
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Errore",
        description: "Errore durante la prenotazione",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };



  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
      >
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="pl-6 pr-6 py-4">
          {/* Back Button */}
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setLocation('/admin')}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg border border-gray-200 transition-all"
              style={{ backgroundColor: '#d38a77' }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 mt-16">
            <h1 className="text-2xl font-bold text-gray-900">Calendario Rapido</h1>
            <p className="text-gray-600 mt-1">
              Prenota appuntamenti velocemente per i clienti
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" style={{ color: '#d38a77' }} />
                    {format(currentWeek, "MMMM yyyy", { locale: it })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"].map((day) => (
                    <div key={day} className="text-center font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((date) => {
                    const isSelected = selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    const isDisabled = isWeekend(date) || isPastDate(date);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayAppointments = weekAppointments.filter(apt => 
                      format(new Date(apt.appointmentDate), 'yyyy-MM-dd') === dateStr
                    );
                    
                    return (
                      <div key={date.toISOString()} className="relative">
                        <button
                          onClick={() => !isDisabled && handleDateSelect(date)}

                          disabled={isDisabled}
                          className={`
                            h-16 w-full rounded-lg border-2 flex flex-col items-center justify-center text-sm font-medium transition-all
                            ${isSelected 
                              ? 'border-pink-300 bg-pink-50 text-pink-700' 
                              : isDisabled 
                                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' 
                                : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                            }
                          `}

                        >
                          <span className="text-lg">{format(date, "d")}</span>
                          <span className="text-xs capitalize">{format(date, "EEE", { locale: it })}</span>
                        </button>
                        
                        {/* Appointments indicators */}
                        {dayAppointments.length > 0 && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {dayAppointments.slice(0, 3).map((apt) => (
                              <div
                                key={apt.id}
                                className="w-2 h-2 bg-green-500 rounded-full"
                                title={`${apt.clientName} - ${apt.service} (${apt.appointmentTime})`}
                              />
                            ))}
                            {dayAppointments.length > 3 && (
                              <div className="w-2 h-2 bg-gray-400 rounded-full" title={`+${dayAppointments.length - 3} altri`} />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: '#d38a77' }} />
                  Prenota Appuntamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Info */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="clientName">Nome Cliente</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Telefono</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Numero di telefono"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <Label>Servizio</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona servizio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.name} value={service.name}>
                          {service.name} - €{service.price} ({service.duration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div>
                  <Label>Data Selezionata</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    {selectedDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{format(selectedDate, "dd MMMM yyyy", { locale: it })}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Seleziona una data dal calendario</span>
                    )}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label>Orario</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          disabled={bookedSlots.includes(time)}
                          className={`
                            p-3 rounded-lg border text-sm font-medium transition-all
                            ${selectedTime === time 
                              ? 'border-pink-300 bg-pink-50 text-pink-700' 
                              : bookedSlots.includes(time)
                                ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50'
                            }
                          `}
                        >
                          <Clock className="w-4 h-4 mx-auto mb-1" />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <Button
                  onClick={handleBooking}
                  disabled={isBooking || !selectedDate || !selectedTime || !selectedService || !clientName || !clientPhone}
                  className="w-full"
                  style={{ backgroundColor: '#d38a77' }}
                >
                  {isBooking ? "Prenotando..." : "Prenota Appuntamento"}
                </Button>

                {/* Info */}
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <p className="text-sm text-blue-700">
                    Gli appuntamenti prenotati qui saranno automaticamente visibili ai clienti nella loro app.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}