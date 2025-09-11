import backgroundImage from "@assets/c87437e112fda59c5e94f3946e727529_1755382475644.jpg";
import titleImage from "@assets/1754852180176_1754852222894.png";
import calendarImage from "@assets/Dark Brown Minimalist September 2024 Calendar Phone Wallpaper_20250811_130725_0000_1754910466024.png";
import notificationIcon from "@assets/—Pngtree—png free buckle notification icon_3794692_1754917870857.png";
import { MoreVertical, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';

export default function AdminDashboardSimple() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentClientIndex, setCurrentClientIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCalendarTransitioning, setIsCalendarTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isNotificationShaking, setIsNotificationShaking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [selectedDayForSlots, setSelectedDayForSlots] = useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedDay, setLastClickedDay] = useState<number | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [selectedDayForBooking, setSelectedDayForBooking] = useState<number | null>(null);
  const [quickBookings, setQuickBookings] = useState<{[key: string]: Array<{name: string, phone: string, time: string, service: string}>}>(() => {
    // Carica prenotazioni dal localStorage all'avvio
    try {
      const stored = localStorage.getItem('frannie_rapid_bookings');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);


  // Fetch notifiche non lette
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications');
      const result = await response.json();
      return result.success ? result.notifications : [];
    },
    refetchInterval: 30000 // Ricarica ogni 30 secondi
  });

  // Conta notifiche non lette
  const unreadCount = notifications.filter((notif: any) => 
    notif.status !== 'read' && notif.status !== 'approved'
  ).length;

  // Funzione per marcare notifiche come lette
  const markNotificationsAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Ricarica i dati senza fare reload della pagina
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Errore nel marcare le notifiche come lette:', error);
    }
  };

  // Funzione per navigare alle sezioni appropriate quando si clicca una notifica
  const handleNotificationClick = (notification: any) => {
    // Chiudi il dropdown delle notifiche
    setShowNotifications(false);
    
    // Naviga alla sezione appropriata in base al tipo di notifica
    switch (notification.type) {
      case 'swap_accepted':
      case 'swap_rejected':
      case 'swap_request':
        setLocation('/admin-swaps');
        break;
      case 'photo_upload':
        setLocation('/admin-gallery');
        break;
      case 'appointment':
        // Resta nella dashboard principale per vedere il calendario
        break;
      case 'message':
        // Potresti aggiungere una sezione messaggi in futuro
        break;
      case 'daily_earnings':
        setLocation('/daily-earnings-input');
        break;
      default:
        // Per altri tipi, resta nella dashboard
        break;
    }
  };

  // Animazione campanella quando ci sono nuove notifiche
  useEffect(() => {
    if (unreadCount > 0) {
      setIsNotificationShaking(true);
      const timer = setTimeout(() => setIsNotificationShaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Chiudi dropdown cliccando fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('.notification-dropdown') && !target.closest('.notification-bell')) {
        setShowNotifications(false);
      }

      if (showSlotManager && !target.closest('.slot-manager-modal')) {
        setShowSlotManager(false);
      }
      if (showQuickBooking && !target.closest('.quick-booking-modal')) {
        setShowQuickBooking(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showSlotManager, showQuickBooking]);
  
  // Data di oggi per evidenziare il giorno corrente
  const today = new Date();
  
  // Calcola i giorni del mese
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = domenica, 1 = lunedì, etc.
  
  // Array per i giorni della settimana
  const dayNames = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
  
  // Crea array dei giorni del calendario
  const calendarDays = [];
  
  // Aggiungi spazi vuoti per i giorni prima del primo del mese
  for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
    calendarDays.push(null);
  }
  
  // Aggiungi i giorni del mese
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Funzione per gestire il click su un giorno
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setCurrentClientIndex(0); // Reset client index quando cambia giorno
  };

  // Funzioni per gestire lo swipe del calendario
  const handleCalendarTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleCalendarTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Verifica che sia uno swipe orizzontale (non verticale)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setIsCalendarTransitioning(true);
      
      setTimeout(() => {
        if (deltaX > 0) {
          // Swipe verso sinistra - mese successivo
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
          // Swipe verso destra - mese precedente
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        }
        
        setTimeout(() => {
          setIsCalendarTransitioning(false);
        }, 50);
      }, 150);
    }
    
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Festività 2025 (principali festività italiane)
  const holidays2025 = [
    '2025-01-01', // Capodanno
    '2025-01-06', // Epifania
    '2025-04-21', // Pasquetta
    '2025-04-25', // Festa della Liberazione
    '2025-05-01', // Festa del Lavoro
    '2025-06-02', // Festa della Repubblica
    '2025-08-15', // Ferragosto
    '2025-11-01', // Ognissanti
    '2025-12-08', // Immacolata
    '2025-12-25', // Natale
    '2025-12-26'  // Santo Stefano
  ];

  // Orari di lavoro (4 slot fissi)
  const workingHours = [
    '09:00', '10:30', '15:00', '16:30'
  ];

  // Stato per gestire disponibilità personalizzate
  const [customUnavailable, setCustomUnavailable] = useState<{[key: string]: string[]}>({});

  // Determina lo stato di disponibilità di un giorno
  const getDayAvailabilityStatus = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = domenica, 6 = sabato
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Controllo weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'weekend'; // Sabato e domenica non disponibili
    }
    
    // Controllo festività
    if (holidays2025.includes(dateString)) {
      return 'holiday'; // Festività non disponibili
    }
    
    // Controllo disponibilità personalizzate e prenotazioni rapide
    const customBlocked = customUnavailable[dateString] || [];
    const rapidBookings = quickBookings[dateString] || [];
    const totalOccupied = customBlocked.length + rapidBookings.length;
    
    if (totalOccupied >= workingHours.length) {
      return 'full'; // Tutto occupato - rosso
    } else if (totalOccupied === 0) {
      return 'free'; // Tutto libero - verde
    } else {
      return 'partial'; // Parzialmente occupato - gradiente verde-rosso
    }
  };

  // Funzione per ottenere la classe CSS del giorno
  const getDayClassName = (day: number | null, isToday: boolean) => {
    if (!day) return '';
    
    const status = getDayAvailabilityStatus(day, currentDate.getMonth(), currentDate.getFullYear());
    
    let baseClass = 'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200';
    
    if (isToday) {
      baseClass += ' ring-2 ring-gray-800';
    }
    
    switch (status) {
      case 'weekend':
      case 'holiday':
        return baseClass + ' bg-gray-300 text-gray-500 cursor-not-allowed';
      case 'full':
        return baseClass + ' bg-red-500 text-white cursor-pointer hover:bg-red-600';
      case 'free':
        return baseClass + ' bg-green-500 text-white cursor-pointer hover:bg-green-600';
      case 'partial':
        return baseClass + ' bg-gradient-to-r from-green-500 to-red-500 text-white cursor-pointer hover:from-green-600 hover:to-red-600';
      default:
        return baseClass + ' bg-transparent text-gray-600 cursor-pointer hover:bg-gray-200';
    }
  };

  // Dati fittizi dei clienti per esempio + prenotazioni rapide
  const getClientsForDay = (day: number) => {
    const clients = [
      { id: 1, name: "Maria Rossi", time: "09:00", service: "Manicure" },
      { id: 2, name: "Anna Bianchi", time: "11:30", service: "Pedicure" },
      { id: 3, name: "Sofia Verde", time: "14:00", service: "Gel Polish" },
      { id: 4, name: "Laura Neri", time: "16:30", service: "Nail Art" }
    ];
    
    // Simula clienti diversi per giorni diversi
    let dayClients: Array<{id: number, name: string, time: string, service: string, isRapidBooking?: boolean}> = [];
    if (day % 3 === 0) dayClients = clients.slice(0, 2);
    else if (day % 2 === 0) dayClients = clients.slice(1, 4);
    else dayClients = clients.slice(0, 3);
    
    // Aggiungi prenotazioni rapide per questo giorno
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rapidBookings = quickBookings[dateString] || [];
    
    // Combina clienti esistenti e prenotazioni rapide
    const combinedClients = [
      ...dayClients,
      ...rapidBookings.map((booking, index) => ({
        id: 1000 + index, // ID unico per prenotazioni rapide
        name: booking.name,
        time: booking.time,
        service: booking.service,
        isRapidBooking: true // Flag per identificare prenotazioni rapide
      }))
    ];
    
    // Ordina per orario
    return combinedClients.sort((a, b) => {
      const timeA = parseInt(a.time.replace(':', ''));
      const timeB = parseInt(b.time.replace(':', ''));
      return timeA - timeB;
    });
  };

  return (
    <div 
      className="h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />

      {/* Campanella notifiche animata */}
      <div className="absolute top-6 right-6">
        <button 
          className={`notification-bell relative transition-all duration-300 ${
            isNotificationShaking ? 'animate-bounce' : ''
          }`}
          onClick={() => {
            if (!showNotifications && unreadCount > 0) {
              // Quando si aprono le notifiche, marcale come lette
              markNotificationsAsRead();
            }
            setShowNotifications(!showNotifications);
          }}
        >
          <div className={`transition-transform duration-200 ${
            isNotificationShaking ? 'animate-wiggle' : ''
          }`}>
            <img 
              src={notificationIcon} 
              alt="Notifiche" 
              className="transition-all duration-300"
              style={{ 
                width: '60px', 
                height: '60px',
                filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
              }}
            />
          </div>
          
          {/* Pallino rosso per notifiche */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-4 h-4 flex items-center justify-center notification-badge border-1 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
        
        {/* Dropdown notifiche */}
        {showNotifications && (
          <div className="notification-dropdown absolute top-20 right-0 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-50">
            <div className="p-4 border-b border-gray-200/50">
              <h3 className="font-semibold text-gray-800">Notifiche ({notifications.length})</h3>
              <p className="text-xs text-gray-500 mt-1">Scorri per vedere tutte</p>
            </div>
            
            {/* Area scrollabile per tutte le notifiche */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-gray-100">
              {notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <div 
                    key={notif.id} 
                    className="p-3 border-b border-gray-100/50 hover:bg-pink-50/50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icona status */}
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notif.status === 'unread' || notif.status === 'pending' ? 'bg-red-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Contenuto notifica */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(notif.timestamp).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            notif.type === 'message' ? 'bg-purple-100 text-purple-700' :
                            notif.type === 'appointment' ? 'bg-green-100 text-green-700' :
                            notif.type === 'photo_upload' ? 'bg-yellow-100 text-yellow-700' :
                            notif.type === 'swap_request' ? 'bg-orange-100 text-orange-700' :
                            notif.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                            notif.type === 'review' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {notif.type === 'message' ? 'Messaggio' :
                             notif.type === 'appointment' ? 'Appuntamento' :
                             notif.type === 'photo_upload' ? 'Foto' :
                             notif.type === 'swap_request' ? 'Scambio' :
                             notif.type === 'payment' ? 'Pagamento' :
                             notif.type === 'review' ? 'Recensione' :
                             notif.type === 'cancellation' ? 'Cancellazione' :
                             'Altro'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className="mb-2">🔔</div>
                  <p>Nessuna notifica</p>
                </div>
              )}
            </div>
            
            {/* Footer con statistiche */}
            <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
              <div className="text-xs text-gray-600 text-center">
                {notifications.filter((n: any) => n.status === 'unread' || n.status === 'pending').length} non lette • 
                {notifications.length} totali
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Titolo Benvenuta Francesca */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <img 
          src={titleImage} 
          alt="Benvenuta Francesca" 
          className="w-72 h-auto drop-shadow-lg"
        />
      </div>

      {/* Calendario Custom */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
        {/* Header del mese */}
        <div className="bg-gray-100 bg-opacity-50 rounded-full px-6 py-2 text-center mb-4 shadow-sm" style={{ width: '280px' }}>
          <h2 className="text-lg font-bold text-black tracking-[0.1em] uppercase" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            {currentDate.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase()}
          </h2>
        </div>
        
        {/* Box calendario */}
        <div 
          className={`bg-gray-100 bg-opacity-50 rounded-2xl p-3 shadow-lg transition-all duration-300 ease-in-out transform ${
            isCalendarTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{ width: '280px' }}
          onTouchStart={handleCalendarTouchStart}
          onTouchEnd={handleCalendarTouchEnd}
        >          
          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {dayNames.map((day, index) => (
              <div key={index} className="text-center py-1">
                <span className="text-gray-500 text-sm font-medium" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  {day}
                </span>
              </div>
            ))}
          </div>
          
          {/* Griglia dei giorni */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, index) => {
              // Controlla se questo è il giorno corrente
              const isToday = day && 
                currentDate.getMonth() === today.getMonth() && 
                currentDate.getFullYear() === today.getFullYear() && 
                day === today.getDate();
              
              return (
                <div key={index} className="flex items-center justify-center py-0.5">
                  {day && (
                    <button
                      onMouseDown={() => {
                        const status = getDayAvailabilityStatus(day, currentDate.getMonth(), currentDate.getFullYear());
                        if (status === 'weekend' || status === 'holiday') {
                          return;
                        }
                        
                        setIsLongPress(false);
                        
                        // Avvia timer per long press (500ms)
                        const timer = setTimeout(() => {
                          setIsLongPress(true);
                          setSelectedDayForBooking(day);
                          setShowQuickBooking(true);
                        }, 500);
                        
                        setLongPressTimer(timer);
                      }}
                      
                      onMouseUp={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer);
                          setLongPressTimer(null);
                        }
                        
                        // Se non è stato long press, gestisci click normale
                        if (!isLongPress) {
                          const status = getDayAvailabilityStatus(day, currentDate.getMonth(), currentDate.getFullYear());
                          if (status === 'weekend' || status === 'holiday') {
                            return;
                          }
                          
                          const now = Date.now();
                          if (lastClickedDay === day && now - lastClickTime < 500) {
                            // Doppio click - gestione slot
                            setSelectedDayForSlots(day);
                            setShowSlotManager(true);
                          } else {
                            // Singolo click - selezione normale
                            handleDayClick(day);
                          }
                          
                          setLastClickTime(now);
                          setLastClickedDay(day);
                        }
                        
                        setIsLongPress(false);
                      }}
                      
                      onMouseLeave={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer);
                          setLongPressTimer(null);
                        }
                        setIsLongPress(false);
                      }}
                      
                      // Touch events per mobile
                      onTouchStart={() => {
                        const status = getDayAvailabilityStatus(day, currentDate.getMonth(), currentDate.getFullYear());
                        if (status === 'weekend' || status === 'holiday') {
                          return;
                        }
                        
                        setIsLongPress(false);
                        
                        const timer = setTimeout(() => {
                          setIsLongPress(true);
                          setSelectedDayForBooking(day);
                          setShowQuickBooking(true);
                        }, 500);
                        
                        setLongPressTimer(timer);
                      }}
                      
                      onTouchEnd={() => {
                        if (longPressTimer) {
                          clearTimeout(longPressTimer);
                          setLongPressTimer(null);
                        }
                        
                        if (!isLongPress) {
                          const status = getDayAvailabilityStatus(day, currentDate.getMonth(), currentDate.getFullYear());
                          if (status === 'weekend' || status === 'holiday') {
                            return;
                          }
                          
                          const now = Date.now();
                          if (lastClickedDay === day && now - lastClickTime < 500) {
                            setSelectedDayForSlots(day);
                            setShowSlotManager(true);
                          } else {
                            handleDayClick(day);
                          }
                          
                          setLastClickTime(now);
                          setLastClickedDay(day);
                        }
                        
                        setIsLongPress(false);
                      }}
                      
                      className={getDayClassName(day, Boolean(isToday))}
                    >
                      <span 
                        className={`text-sm font-normal ${
                          isToday 
                            ? 'text-black font-medium' 
                            : 'text-gray-600'
                        }`} 
                        style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                      >
                        {day}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sezione clienti del giorno corrente - Swipe */}
<div className="bg-gray-100 bg-opacity-50 rounded-2xl p-3 mt-4 shadow-lg pb-2" style={{ width: '280px' }}>
          <h3 className="text-base font-medium text-black mb-3 text-center" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            {selectedDay ? (
              `Clienti di ${selectedDay} ${currentDate.toLocaleDateString('it-IT', { month: 'long' })}`
            ) : (
              'Clienti di Oggi'
            )}
          </h3>
          
          {(() => {
            const dayToShow = selectedDay || today.getDate();
            return getClientsForDay(dayToShow).length > 0;
          })() ? (
            <div className="relative overflow-hidden">
              {/* Cliente corrente */}
              <div 
                className={`bg-white bg-opacity-70 rounded-xl p-3 touch-pan-y transition-all duration-300 ease-in-out transform ${
                  isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                onTouchStart={(e) => {
                  const touchStartX = e.touches[0].clientX;
                  e.currentTarget.dataset.touchStartX = touchStartX.toString();
                }}
                onTouchEnd={(e) => {
                  const touchStartX = parseInt(e.currentTarget.dataset.touchStartX || '0');
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartX - touchEndX;
                  
                  const dayToShow = selectedDay || today.getDate();
                  const dayClients = getClientsForDay(dayToShow);
                  
                  if (Math.abs(diff) > 50) { // Soglia minima per swipe
                    setIsTransitioning(true);
                    
                    setTimeout(() => {
                      if (diff > 0 && currentClientIndex < dayClients.length - 1) {
                        // Swipe verso sinistra - cliente successivo
                        setCurrentClientIndex(currentClientIndex + 1);
                      } else if (diff < 0 && currentClientIndex > 0) {
                        // Swipe verso destra - cliente precedente
                        setCurrentClientIndex(currentClientIndex - 1);
                      }
                      
                      setTimeout(() => {
                        setIsTransitioning(false);
                      }, 50);
                    }, 150);
                  }
                }}
              >
                {(() => {
                  const dayToShow = selectedDay || today.getDate();
                  const dayClients = getClientsForDay(dayToShow);
                  const currentClient = dayClients[currentClientIndex];
                  
                  if (currentClient) {
                    return (
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-medium text-gray-800" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                              {currentClient.name}
                            </p>
                            {currentClient.isRapidBooking && (
                              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                                Rapida
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {currentClient.service}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-medium text-gray-700">
                            {currentClient.time}
                          </p>
                          {currentClient.isRapidBooking && (
                            <button
                              onClick={() => {
                                // Rimuovi prenotazione rapida
                                const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay || today.getDate()).padStart(2, '0')}`;
                                const newBookings = { ...quickBookings };
                                if (newBookings[dateString]) {
                                  newBookings[dateString] = newBookings[dateString].filter(
                                    b => !(b.name === currentClient.name && b.time === currentClient.time)
                                  );
                                  if (newBookings[dateString].length === 0) {
                                    delete newBookings[dateString];
                                  }
                                }
                                setQuickBookings(newBookings);
                                // Salva nel localStorage
                                localStorage.setItem('frannie_rapid_bookings', JSON.stringify(newBookings));
                              }}
                              className="text-xs text-red-500 hover:text-red-700 mt-1"
                            >
                              Elimina
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              {/* Indicatori di posizione */}
              {(() => {
                const dayToShow = selectedDay || today.getDate();
                const dayClients = getClientsForDay(dayToShow);
                return dayClients.length > 1 && (
                  <div className="flex justify-center mt-2 space-x-1">
                    {dayClients.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ease-in-out border ${
                          index === currentClientIndex 
                            ? 'bg-gray-800 border-gray-800' 
                            : 'bg-white border-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500">
              <p className="text-sm" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                Nessun appuntamento oggi
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Gestione Slot */}
      {showSlotManager && selectedDayForSlots && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="slot-manager-modal bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'DM Serif Text', serif" }}>
                Gestisci Slot
              </h3>
              <p className="text-gray-600">
                {selectedDayForSlots} {currentDate.toLocaleDateString('it-IT', { month: 'long' })}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {workingHours.map((hour) => {
                const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForSlots).padStart(2, '0')}`;
                const isBlocked = customUnavailable[dateString]?.includes(hour) || false;
                
                return (
                  <button
                    key={hour}
                    onClick={() => {
                      const newUnavailable = { ...customUnavailable };
                      if (!newUnavailable[dateString]) {
                        newUnavailable[dateString] = [];
                      }
                      
                      if (isBlocked) {
                        // Rimuovi il blocco
                        newUnavailable[dateString] = newUnavailable[dateString].filter(h => h !== hour);
                        if (newUnavailable[dateString].length === 0) {
                          delete newUnavailable[dateString];
                        }
                      } else {
                        // Aggiungi il blocco
                        newUnavailable[dateString].push(hour);
                      }
                      
                      setCustomUnavailable(newUnavailable);
                    }}
                    className={`w-full p-3 rounded-lg font-medium transition-colors ${
                      isBlocked 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-100 text-gray-700 hover:bg-green-200'
                    }`}
                  >
                    {hour} {isBlocked ? '(Bloccato)' : '(Disponibile)'}
                  </button>
                );
              })}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Blocca tutto il giorno
                  const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForSlots).padStart(2, '0')}`;
                  const newUnavailable = { ...customUnavailable };
                  newUnavailable[dateString] = [...workingHours];
                  setCustomUnavailable(newUnavailable);
                }}
                className="flex-1 bg-red-500 text-white p-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Blocca Tutto
              </button>
              
              <button
                onClick={() => {
                  // Sblocca tutto il giorno
                  const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForSlots).padStart(2, '0')}`;
                  const newUnavailable = { ...customUnavailable };
                  delete newUnavailable[dateString];
                  setCustomUnavailable(newUnavailable);
                }}
                className="flex-1 bg-green-500 text-white p-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Sblocca Tutto
              </button>
            </div>

            <button
              onClick={() => setShowSlotManager(false)}
              className="w-full mt-4 bg-gray-200 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Modal Prenotazione Rapida */}
      {showQuickBooking && selectedDayForBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="quick-booking-modal bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'DM Serif Text', serif" }}>
                Prenotazione Rapida
              </h3>
              <p className="text-gray-600">
                {selectedDayForBooking} {currentDate.toLocaleDateString('it-IT', { month: 'long' })}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const booking = {
                name: formData.get('name') as string,
                phone: formData.get('phone') as string,
                time: formData.get('time') as string,
                service: 'Appuntamento'
              };
              
              const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForBooking).padStart(2, '0')}`;
              const newBookings = { ...quickBookings };
              if (!newBookings[dateString]) {
                newBookings[dateString] = [];
              }
              newBookings[dateString].push(booking);
              setQuickBookings(newBookings);
              // Salva nel localStorage
              localStorage.setItem('frannie_rapid_bookings', JSON.stringify(newBookings));
              setShowQuickBooking(false);
              
              // Mostra conferma
              alert(`✅ Prenotato: ${booking.name} alle ${booking.time}`);
            }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Cliente</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="es. Maria Rossi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="es. 339 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
                  <select
                    name="time"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Seleziona orario</option>
                    {workingHours.map(hour => {
                      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayForBooking).padStart(2, '0')}`;
                      const isBlocked = customUnavailable[dateString]?.includes(hour);
                      const isBooked = quickBookings[dateString]?.some(b => b.time === hour);
                      
                      return (
                        <option 
                          key={hour} 
                          value={hour}
                          disabled={isBlocked || isBooked}
                        >
                          {hour} {isBlocked ? '(Bloccato)' : isBooked ? '(Occupato)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-pink-500 text-white p-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
                >
                  💅 Prenota
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowQuickBooking(false)}
                  className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}