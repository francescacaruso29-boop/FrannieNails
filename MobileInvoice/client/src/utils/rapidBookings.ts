// Sistema centralizzato per gestire le prenotazioni rapide
// Condiviso tra dashboard admin e sezione clienti

export interface RapidBooking {
  name: string;
  phone: string;
  time: string;
  service: string;
  date: string; // formato YYYY-MM-DD
}

const STORAGE_KEY = 'frannie_rapid_bookings';

// Carica prenotazioni rapide dal localStorage
export const loadRapidBookings = (): { [key: string]: RapidBooking[] } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Errore nel caricamento prenotazioni rapide:', error);
    return {};
  }
};

// Salva prenotazioni rapide nel localStorage
export const saveRapidBookings = (bookings: { [key: string]: RapidBooking[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Errore nel salvataggio prenotazioni rapide:', error);
  }
};

// Aggiungi una prenotazione rapida
export const addRapidBooking = (dateString: string, booking: Omit<RapidBooking, 'date'>) => {
  const bookings = loadRapidBookings();
  if (!bookings[dateString]) {
    bookings[dateString] = [];
  }
  
  const fullBooking: RapidBooking = {
    ...booking,
    date: dateString
  };
  
  bookings[dateString].push(fullBooking);
  saveRapidBookings(bookings);
  return bookings;
};

// Rimuovi una prenotazione rapida
export const removeRapidBooking = (dateString: string, name: string, time: string) => {
  const bookings = loadRapidBookings();
  if (bookings[dateString]) {
    bookings[dateString] = bookings[dateString].filter(
      booking => !(booking.name === name && booking.time === time)
    );
    
    if (bookings[dateString].length === 0) {
      delete bookings[dateString];
    }
    
    saveRapidBookings(bookings);
  }
  return bookings;
};

// Ottieni prenotazioni per una data specifica
export const getRapidBookingsForDate = (dateString: string): RapidBooking[] => {
  const bookings = loadRapidBookings();
  return bookings[dateString] || [];
};

// Controlla se un orario è occupato da prenotazioni rapide
export const isTimeSlotOccupied = (dateString: string, time: string): boolean => {
  const bookings = getRapidBookingsForDate(dateString);
  return bookings.some(booking => booking.time === time);
};

// Ottieni tutte le prenotazioni per un mese
export const getRapidBookingsForMonth = (year: number, month: number): { [key: string]: RapidBooking[] } => {
  const allBookings = loadRapidBookings();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const filteredBookings: { [key: string]: RapidBooking[] } = {};
  
  Object.keys(allBookings).forEach(dateString => {
    if (dateString.startsWith(monthKey)) {
      filteredBookings[dateString] = allBookings[dateString];
    }
  });
  
  return filteredBookings;
};