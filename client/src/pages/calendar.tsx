import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { AdminHamburgerMenu } from "@/components/admin-hamburger-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePushNotifications } from "@/hooks/use-push-notifications";
// Ultra-lightweight CSS gradient background - completely eliminates video loading issues
const calendarBackground = "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)";

const monthNames = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function CalendarPage() {
  const { toast } = useToast();
  const { sendPushNotification } = usePushNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogMessage, setLimitDialogMessage] = useState("Hai già prenotato il numero massimo di appuntamenti consentiti.");
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>(["9:00", "10:30", "15:00", "16:30"]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [dayAvailability, setDayAvailability] = useState<{[key: number]: boolean | 'loading'}>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [stableColors, setStableColors] = useState<{[key: string]: {bg: string, text: string, hover: string}}>({});
  
  const availableServices = [
    "Gel",
    "Semipermanente", 
    "Ricostruzione",
    "Piedi",
    "Gel + Piedi",
    "Semipermanente + Piedi",
    "Ricostruzione + Piedi"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  useEffect(() => {
    const clientData = localStorage.getItem('frannie-client-data');
    if (clientData) {
      const client = JSON.parse(clientData);
      setCurrentClient(client);
    }
  }, []);

  // Check availability for each day of the month (stable version)
  useEffect(() => {
    const checkDayAvailability = async () => {
      setIsLoadingAvailability(true);
      const availability: {[key: number]: boolean} = {};
      
      // Create color cache to prevent color changes during scroll
      const colorCache: {[key: string]: {bg: string, text: string, hover: string}} = {};
      
      // First, set default values for all days to prevent color flickering
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month}-${day}`;
        
        if (isWeekend(day) || isPastDate(day)) {
          availability[day] = false;
          colorCache[dateKey] = {
            bg: '#9ca3af', // Gray for disabled
            text: 'text-white',
            hover: 'cursor-not-allowed'
          };
        } else {
          // Default to available until proven otherwise (prevents red flashing)
          availability[day] = true;
          colorCache[dateKey] = {
            bg: '#22c55e', // Green for available
            text: 'text-white',
            hover: 'hover:bg-[#16a34a] hover:scale-105 cursor-pointer'
          };
        }
      }
      
      // Set initial stable state with color cache
      setDayAvailability({...availability});
      setStableColors({...colorCache});
      
      // Then check actual availability
      const promises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        if (isWeekend(day) || isPastDate(day)) {
          continue;
        }
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        promises.push(
          fetch(`/api/appointments/available-times/${dateString}`)
            .then(response => response.json())
            .then(data => {
              const isAvailable = data.success && data.availableTimes && data.availableTimes.length > 0;
              availability[day] = isAvailable;
              
              // Update color cache with final result
              const dateKey = `${year}-${month}-${day}`;
              colorCache[dateKey] = isAvailable ? {
                bg: '#22c55e', // Green for available
                text: 'text-white',
                hover: 'hover:bg-[#16a34a] hover:scale-105 cursor-pointer'
              } : {
                bg: '#ef4444', // Red for fully booked
                text: 'text-white',
                hover: 'cursor-not-allowed'
              };
            })
            .catch(() => {
              availability[day] = false;
              // Keep red color for errors
              const dateKey = `${year}-${month}-${day}`;
              colorCache[dateKey] = {
                bg: '#ef4444', // Red for error/unavailable
                text: 'text-white',
                hover: 'cursor-not-allowed'
              };
            })
        );
      }
      
      // Wait for all requests to complete, then update once with final cache
      await Promise.allSettled(promises);
      setDayAvailability({...availability});
      setStableColors({...colorCache});
      setIsLoadingAvailability(false);
    };
    
    checkDayAvailability();
  }, [year, month, daysInMonth]);

  const isWeekend = (day: number) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    const dateToCheck = new Date(year, month, day);
    return dateToCheck < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const fetchAvailableTimes = async (selectedDate: string) => {
    setIsLoadingTimes(true);
    try {
      const response = await fetch(`/api/appointments/available-times/${selectedDate}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableTimes(data.availableTimes);
      } else {
        setAvailableTimes(["9:00", "10:30", "15:00", "16:30"]);
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes(["9:00", "10:30", "15:00", "16:30"]);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleDateClick = async (day: number) => {
    if (isWeekend(day) || isPastDate(day)) return;
    
    setSelectedDate(day);
    
    const clientData = localStorage.getItem('frannie-client-data');
    if (!clientData) return;
    
    const client = JSON.parse(clientData);
    const selectedDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    try {
      // Monthly limits removed - proceed directly to time selection
      await fetchAvailableTimes(selectedDateString);
      setShowTimePopup(true);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setShowTimePopup(true);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowTimePopup(false);
    setShowServicePopup(true);
  };

  const handleServiceSelect = async (service: string) => {
    if (!currentClient || !selectedDate || !selectedTime) return;
    
    setSelectedService(service);
    
    const appointmentDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: currentClient.id || 1,
          appointmentDate,
          appointmentTime: selectedTime,
          service: service
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Prenotazione confermata!",
          description: `${service} fissato per il ${selectedDate} ${monthNames[month]} alle ${selectedTime}`,
        });
        
        // Send push notification to phone
        await sendPushNotification(
          "Prenotazione Confermata! 💅",
          `${service} fissato per il ${selectedDate} ${monthNames[month]} alle ${selectedTime}`
        );
        
        // Send WhatsApp confirmation
        try {
          await fetch('/api/send-whatsapp-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientName: currentClient?.fullName || 'Cliente',
              phoneNumber: currentClient?.phoneNumber || '',
              service: service,
              date: `${selectedDate} ${monthNames[month]}`,
              time: selectedTime
            }),
          });
        } catch (error) {
          console.log('WhatsApp notification failed:', error);
        }
        
        setShowServicePopup(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedService(null);
      } else {
        toast({
          title: "Errore",
          description: result.message || "Impossibile prenotare l'appuntamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile prenotare l'appuntamento",
        variant: "destructive",
      });
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Stable calendar rendering function
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = isWeekend(day) || isPastDate(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === month && 
                     new Date().getFullYear() === year;
      const hasAvailability = dayAvailability[day];
      
      // Use stable color cache to prevent color changes during scroll
      const dateKey = `${year}-${month}-${day}`;
      const colorData = stableColors[dateKey];
      
      let backgroundColor = '';
      let textColor = '';
      let hoverClass = '';
      
      if (isToday) {
        backgroundColor = '#d38a77';
        textColor = 'text-white';
        hoverClass = 'hover:bg-[#c47968] cursor-pointer';
      } else if (isDisabled) {
        backgroundColor = '';
        textColor = 'text-gray-300';
        hoverClass = 'cursor-not-allowed';
      } else if (colorData) {
        // Use cached colors to prevent flickering
        backgroundColor = colorData.bg;
        textColor = colorData.text;
        hoverClass = colorData.hover;
      } else {
        // Fallback to green (available) during loading
        backgroundColor = '#22c55e';
        textColor = 'text-white';
        hoverClass = 'hover:bg-[#16a34a] hover:scale-105 cursor-pointer';
      }
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled || hasAvailability === false}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${textColor} ${hoverClass} shadow-sm`}
          style={{ backgroundColor }}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const openWhatsApp = () => {
    const phoneNumber = "3517468491";
    const message = encodeURIComponent("Ciao Frannie! Ho bisogno di aiuto per prenotare un appuntamento urgente. Puoi aiutarmi?");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ background: calendarBackground }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      {/* Decorative elements for visual interest */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-16 right-12 w-24 h-24 rounded-full bg-white/30 blur-xl"></div>
        <div className="absolute bottom-24 left-8 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
        <div className="absolute top-32 left-16 w-16 h-16 rounded-full bg-white/25 blur-lg"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
        {/* Calendar Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-pink-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" style={{ color: '#d38a77' }} />
            </button>
            
            <h2 className="text-xl font-semibold" style={{ color: '#d38a77' }}>
              {monthNames[month]} {year}
            </h2>
            
            <button onClick={nextMonth} className="p-2 hover:bg-pink-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" style={{ color: '#d38a77' }} />
            </button>
          </div>
          
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="h-8 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
          

        </div>

        {/* Action Buttons - Closer together */}
        <div className="mt-6 text-center">
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.href = '/swap'}
              className="flex-1 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#d38a77' }}
            >
              🔄 Scambia
            </Button>
            
            <Button
              onClick={openWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Time Selection Dialog */}
      <Dialog open={showTimePopup} onOpenChange={setShowTimePopup}>
        <DialogContent className="bg-white/80 backdrop-blur-lg border border-pink-200/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#d38a77' }}>Scegli l'orario</DialogTitle>
            <DialogDescription className="text-gray-600">
              Seleziona l'orario preferito per il {selectedDate} {monthNames[month]}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingTimes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#d38a77' }}></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className="text-white py-3 rounded-xl transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: '#d38a77' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c17968'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d38a77'}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Selection Dialog */}
      <Dialog open={showServicePopup} onOpenChange={setShowServicePopup}>
        <DialogContent className="bg-white/80 backdrop-blur-lg border border-pink-200/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#d38a77' }}>Scegli il servizio</DialogTitle>
            <DialogDescription className="text-gray-600">
              Seleziona il tipo di trattamento per il {selectedDate} {monthNames[month]} alle {selectedTime}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-3 mt-4">
            {availableServices.map((service) => (
              <Button
                key={service}
                onClick={() => handleServiceSelect(service)}
                className="text-white py-3 rounded-xl transition-all duration-200 hover:scale-105 text-left justify-start"
                style={{ backgroundColor: '#d38a77' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c17968'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d38a77'}
              >
                {service}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowServicePopup(false)}
              variant="outline"
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              Annulla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Limit Drawer - swipe up to dismiss */}
      <Drawer open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DrawerContent className="max-h-[50vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-6" />
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle style={{ color: '#d38a77', fontSize: '1.25rem' }}>
              Limite raggiunto
            </DrawerTitle>
            <DrawerDescription className="text-gray-600 text-center px-4 mt-2">
              {limitDialogMessage}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex justify-center pb-8 px-4">
            <Button
              onClick={() => setShowLimitDialog(false)}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl w-full max-w-xs"
            >
              Ho capito
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-400 pb-4">
            💡 Scorri verso l'alto per chiudere
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
}