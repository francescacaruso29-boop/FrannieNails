import cron from 'node-cron';
import { db } from './db';
import { appointments, clients, adminNotifications } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { WhatsAppAutomation, type WhatsAppMessage } from './whatsapp-automation';

// Telegram Bot configuration (free alternative)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Admin chat ID to receive notifications

// WhatsApp automation instance
const whatsappBot = new WhatsAppAutomation();

interface AppointmentReminder {
  id: number;
  clientName: string;
  phoneNumber: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Store notification data for mobile app to retrieve
const pendingNotifications: AppointmentReminder[] = [];

// Store scheduled notifications for push system
const scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

// Send automatic notification to client for admin actions
async function sendClientNotification(clientPhone: string, clientName: string, action: string, details: string): Promise<boolean> {
  try {
    let message = `🔔 Ciao ${clientName}!\n\n`;
    
    switch (action) {
      case 'appointment_created':
        message += `Il tuo appuntamento è stato confermato:\n${details}\n\nTi aspetto da Frannie NAILS! ✨`;
        break;
      case 'appointment_modified':
        message += `Il tuo appuntamento è stato modificato:\n${details}\n\nPer qualsiasi dubbio contattami!`;
        break;
      case 'appointment_cancelled':
        message += `Il tuo appuntamento è stato cancellato:\n${details}\n\nRiprogrammiamo quando vuoi!`;
        break;
      case 'photo_approved':
        message += `La tua foto è stata approvata! 📸\n${details}\n\nGrazie per aver condiviso il tuo look!`;
        break;
      case 'photo_rejected':
        message += `La tua foto necessita di modifiche:\n${details}\n\nPuoi caricare una nuova foto quando vuoi!`;
        break;
      case 'balance_updated':
        message += `Il tuo saldo è stato aggiornato:\n${details}\n\nPuoi controllare i dettagli nella tua app.`;
        break;
      case 'service_reminder':
        message += `Ti ricordo il tuo appuntamento:\n${details}\n\nNon vedo l'ora di vederti!`;
        break;
      case 'service_reminder_with_amount':
        message += `Ti ricordo il tuo appuntamento di domani:\n${details}\n\nNon vedo l'ora di vederti! 💅✨`;
        break;
      default:
        message += `Aggiornamento dal salone:\n${details}`;
    }
    
    message += `\n\nFrannie NAILS 💅`;

    // Generate WhatsApp link for automatic sending
    const whatsappLink = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    console.log(`📱 Notifica automatica inviata a ${clientName}: ${action}`);
    console.log(`🔗 WhatsApp link: ${whatsappLink}`);
    
    // Store for admin dashboard tracking
    addPendingNotification({
      id: Date.now(),
      clientName,
      phoneNumber: clientPhone,
      appointmentDate: new Date().toLocaleDateString('it-IT'),
      appointmentTime: `${action}: ${details}`
    });
    
    return true;
  } catch (error) {
    console.error('Error sending client notification:', error);
    return false;
  }
}

// Send WhatsApp notification to client (MODALITÀ AUTOMATICA)
async function sendWhatsAppReminder(reminder: AppointmentReminder): Promise<boolean> {
  try {
    const message = `🔔 Ciao ${reminder.clientName}! 

Questo è un promemoria per il tuo appuntamento da Frannie NAILS:

📅 Data: ${reminder.appointmentDate}
⏰ Orario: ${reminder.appointmentTime}

Ti aspetto! Se hai bisogno di modificare l'appuntamento, contattami il prima possibile.

Grazie! ✨
Frannie`;

    console.log(`🤖 MODALITÀ AUTOMATICA: Invio messaggio WhatsApp a ${reminder.clientName}...`);
    
    // Use WhatsApp automation bot for automatic sending
    const whatsappBot = await import('./whatsapp-automation');
    const success = await whatsappBot.sendSingleMessage(reminder.phoneNumber, message);
    
    if (success) {
      console.log(`✅ Messaggio automatico inviato con successo a ${reminder.clientName}`);
      
      // Store successful notification for admin tracking
      addPendingNotification({
        ...reminder,
        appointmentTime: `✅ INVIATO AUTOMATICAMENTE - ${reminder.appointmentTime}`
      });
      
      return true;
    } else {
      console.log(`⚠️ Invio automatico fallito per ${reminder.clientName}, genero link manuale`);
      
      // Fallback: Generate WhatsApp link for manual sending
      const whatsappLink = `https://wa.me/${reminder.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      console.log(`🔗 Link manuale di backup: ${whatsappLink}`);
      
      // Store notification with manual link for admin to review
      addPendingNotification({
        ...reminder,
        appointmentTime: `❌ AUTO FAILED - LINK: ${whatsappLink} - ${reminder.appointmentTime}`
      });
      
      return false;
    }
    
  } catch (error) {
    console.error('Errore nel sistema di invio automatico WhatsApp:', error);
    
    // Fallback: Generate WhatsApp link for manual sending
    const fallbackMessage = `🔔 Ciao ${reminder.clientName}! 

Questo è un promemoria per il tuo appuntamento da Frannie NAILS:

📅 Data: ${reminder.appointmentDate}
⏰ Orario: ${reminder.appointmentTime}

Ti aspetto! Se hai bisogno di modificare l'appuntamento, contattami il prima possibile.

Grazie! ✨
Frannie`;

    const whatsappLink = `https://wa.me/${reminder.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(fallbackMessage)}`;
    console.log(`🔗 Link manuale di emergenza: ${whatsappLink}`);
    
    addPendingNotification({
      ...reminder,
      appointmentTime: `🔧 ERROR FALLBACK - LINK: ${whatsappLink} - ${reminder.appointmentTime}`
    });
    
    return false;
  }
}

// Send Telegram notification to admin (free alternative)
async function sendTelegramNotification(reminder: AppointmentReminder): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram bot not configured, storing notification locally');
    addPendingNotification(reminder);
    return false;
  }

  try {
    const message = `🔔 PROMEMORIA APPUNTAMENTO\n\n👤 Cliente: ${reminder.clientName}\n📞 Telefono: ${reminder.phoneNumber}\n📅 Data: ${reminder.appointmentDate}\n⏰ Orario: ${reminder.appointmentTime}\n\n💅 Frannie NAILS`;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (response.ok) {
      console.log(`Telegram notification sent for ${reminder.clientName}`);
      return true;
    } else {
      console.error('Failed to send Telegram notification:', await response.text());
      addPendingNotification(reminder);
      return false;
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    addPendingNotification(reminder);
    return false;
  }
}

// Add notification to pending list (fallback when Telegram fails)
function addPendingNotification(reminder: AppointmentReminder): void {
  // Remove existing notification for same appointment if any
  const existingIndex = pendingNotifications.findIndex(n => n.id === reminder.id);
  if (existingIndex !== -1) {
    pendingNotifications.splice(existingIndex, 1);
  }
  
  pendingNotifications.push(reminder);
  console.log(`Notification scheduled locally for ${reminder.clientName} - ${reminder.appointmentDate} at ${reminder.appointmentTime}`);
}

// Get appointments for tomorrow
async function getTomorrowAppointments(): Promise<AppointmentReminder[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  try {
    const appointmentsWithClients = await db
      .select({
        id: appointments.id,
        clientName: clients.fullName,
        phoneNumber: clients.phoneNumber,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id));

    // Filter appointments for tomorrow and format the results
    const filteredAppointments = appointmentsWithClients
      .filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === tomorrow.getTime();
      })
      .map(apt => ({
        id: apt.id,
        clientName: apt.clientName,
        phoneNumber: apt.phoneNumber,
        appointmentDate: new Date(apt.appointmentDate).toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: apt.appointmentTime
      }));

    return filteredAppointments;
  } catch (error) {
    console.error('Failed to get tomorrow appointments:', error);
    return [];
  }
}

// Process daily reminders
async function processDailyReminders(): Promise<void> {
  console.log('Processing daily appointment reminders...');
  
  const reminders = await getTomorrowAppointments();
  
  if (reminders.length === 0) {
    console.log('No appointments for tomorrow');
    return;
  }

  console.log(`Found ${reminders.length} appointments for tomorrow`);

  for (const reminder of reminders) {
    // Send WhatsApp reminder to client (primary method)
    await sendWhatsAppReminder(reminder);
    
    // Also send Telegram notification to admin
    await sendTelegramNotification(reminder);
    
    // Add a delay between messages to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('Finished processing daily reminders');
}

// Send only pre-check requests (separate from reminders)
async function sendDailyPreChecks(): Promise<void> {
  try {
    console.log('📋 Processing daily pre-check requests...');
    
    const appointments = await getTomorrowAppointments();
    console.log(`📅 Found ${appointments.length} appointments for pre-check requests`);
    
    if (appointments.length === 0) {
      console.log('No appointments for tomorrow');
      return;
    }

    // Send pre-check requests for each appointment
    for (const appointment of appointments) {
      console.log(`📋 Sending pre-check request to ${appointment.clientName}...`);
      await sendPreCheckRequest(appointment);
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('✅ Daily pre-check requests completed');
    
  } catch (error) {
    console.error('Error processing daily pre-check requests:', error);
  }
}

// Start the reminder service
export function startReminderService(): void {
  console.log('Starting appointment reminder service...');
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram bot not configured. Reminders will be stored locally.');
    console.log('To enable Telegram notifications, set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.');
  } else {
    console.log('Telegram bot configured - notifications will be sent to Telegram');
  }
  
  // Schedule pre-check requests at 12 PM (12:00) - day before appointment
  cron.schedule('0 12 * * *', async () => {
    await sendDailyPreChecks();
  }, {
    timezone: 'Europe/Rome'
  });

  // Schedule final reminders at 6 PM (18:00) - day before appointment
  cron.schedule('0 18 * * *', async () => {
    await processDailyReminders();
  }, {
    timezone: 'Europe/Rome'
  });

  // Schedule daily earnings reminder at 8 PM (20:00) every day
  cron.schedule('0 20 * * *', async () => {
    await sendDailyEarningsReminder();
  }, {
    timezone: 'Europe/Rome'
  });

  console.log('📋 Pre-check requests scheduled for 12:00 daily (Rome timezone)');
  console.log('🔔 Final reminders scheduled for 18:00 daily (Rome timezone)');
  console.log('💰 Daily earnings reminders scheduled for 20:00 daily (Rome timezone)');
}

// Send daily earnings reminder to admin
async function sendDailyEarningsReminder(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`💰 Invio promemoria guadagni giornalieri per ${today}`);
    
    // Create admin notification for daily earnings input
    await db.insert(adminNotifications).values({
      type: 'daily_earnings',
      title: '💰 Inserisci Guadagni Giornalieri',
      message: `È ora di inserire i guadagni per oggi (${new Date().toLocaleDateString('it-IT')}). Clicca qui per aprire il modulo.`,
      read: false,
      relatedId: null
    });
    
    console.log(`✅ Notifica guadagni giornalieri creata per ${today}`);
    
  } catch (error) {
    console.error('Error sending daily earnings reminder:', error);
  }
}

// Export automatic client notification function
export { sendClientNotification };

// Get pending notifications
export function getPendingNotifications(): AppointmentReminder[] {
  return [...pendingNotifications];
}

// Clear pending notifications
export function clearPendingNotifications(): void {
  pendingNotifications.length = 0;
}

// Schedule push notifications for an appointment
export function scheduleAppointmentNotifications(reminder: AppointmentReminder): void {
  const appointmentDateTime = new Date(`${reminder.appointmentDate} ${reminder.appointmentTime}`);
  const now = new Date();
  
  console.log(`📅 Scheduling notifications for ${reminder.clientName}`);
  console.log(`   Appointment: ${appointmentDateTime.toLocaleString('it-IT')}`);
  console.log(`   Current time: ${now.toLocaleString('it-IT')}`);
  
  // Schedule day before notification (24 hours before)
  const dayBeforeTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
  if (dayBeforeTime > now) {
    const dayBeforeTimeout = setTimeout(() => {
      sendMobileNotification(reminder, 'day-before');
    }, dayBeforeTime.getTime() - now.getTime());
    
    scheduledNotifications.set(`day-before-${reminder.id}`, dayBeforeTimeout);
    console.log(`   ✓ Day-before reminder scheduled for: ${dayBeforeTime.toLocaleString('it-IT')}`);
  } else {
    console.log(`   ⚠️ Day-before reminder time has passed`);
  }
  
  // Schedule hour before notification (1 hour before)
  const hourBeforeTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
  if (hourBeforeTime > now) {
    const hourBeforeTimeout = setTimeout(() => {
      sendMobileNotification(reminder, 'hour-before');
    }, hourBeforeTime.getTime() - now.getTime());
    
    scheduledNotifications.set(`hour-before-${reminder.id}`, hourBeforeTimeout);
    console.log(`   ✓ Hour-before reminder scheduled for: ${hourBeforeTime.toLocaleString('it-IT')}`);
  } else {
    console.log(`   ⚠️ Hour-before reminder time has passed`);
  }
  
  console.log(`   📱 Total scheduled notifications: ${scheduledNotifications.size}`);
}

// Enhanced notification types
export type NotificationType = 
  | 'day-before' 
  | 'hour-before' 
  | 'swap-request' 
  | 'swap-accepted' 
  | 'swap-rejected' 
  | 'photo-approved' 
  | 'photo-rejected' 
  | 'appointment-confirmed'
  | 'new-message';

export interface NotificationData {
  clientName: string;
  phoneNumber?: string;
  title: string;
  body: string;
  data?: any;
}

// Send mobile push notification with enhanced types
export async function sendMobileNotification(
  notification: NotificationData | AppointmentReminder, 
  type: NotificationType
): Promise<void> {
  let title = "";
  let body = "";
  let clientName = "";
  
  // Handle different notification data structures
  if ('clientName' in notification) {
    clientName = notification.clientName;
    if ('title' in notification) {
      // Direct notification data
      title = notification.title;
      body = notification.body;
    } else {
      // AppointmentReminder structure
      const reminder = notification as AppointmentReminder;
      switch (type) {
        case 'day-before':
          title = "Promemoria Appuntamento 📅";
          body = `Ciao ${clientName}! Ricordati del tuo appuntamento domani alle ${reminder.appointmentTime}`;
          break;
        case 'hour-before':
          title = "Appuntamento tra 1 ora! ⏰";
          body = `Ciao ${clientName}! Il tuo appuntamento è tra un'ora alle ${reminder.appointmentTime}`;
          break;
        case 'appointment-confirmed':
          title = "Appuntamento Confermato! ✅";
          body = `Il tuo appuntamento del ${reminder.appointmentDate} alle ${reminder.appointmentTime} è confermato`;
          break;
      }
    }
  }

  // Handle specific notification types
  switch (type) {
    case 'swap-request':
      title = "Richiesta Scambio Appuntamento 💅";
      body = `Una cliente vuole scambiare il suo appuntamento con te. Controlla l'app!`;
      break;
    case 'swap-accepted':
      title = "Scambio Accettato! 🎉";
      body = `La tua richiesta di scambio appuntamento è stata accettata!`;
      break;
    case 'swap-rejected':
      title = "Scambio Rifiutato 😔";
      body = `La tua richiesta di scambio appuntamento è stata rifiutata.`;
      break;
    case 'photo-approved':
      title = "Foto Approvata! 📸";
      body = `La tua foto è stata approvata e pubblicata nella galleria!`;
      break;
    case 'photo-rejected':
      title = "Foto Non Approvata 📸";
      body = `La tua foto non è stata approvata per la pubblicazione.`;
      break;
    case 'new-message':
      title = "Nuovo Messaggio 💬";
      body = `Hai ricevuto un nuovo messaggio da Frannie Nail Salon`;
      break;
  }
  
  try {
    // Send push notification via API
    const response = await fetch('http://localhost:5000/api/send-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        clientName,
        type,
        timestamp: new Date().toISOString()
      }),
    });
    
    if (response.ok) {
      console.log(`✓ Push notification sent: ${type} for ${clientName}`);
    } else {
      console.log(`✗ Failed to send push notification: ${type} for ${clientName}`);
    }
  } catch (error) {
    console.error(`Error sending push notification:`, error);
  }
  
  // Log notification for tracking
  console.log(`📱 Mobile notification: ${title} - ${body}`);
}

// Admin notification system
export async function sendAdminNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    console.log(`👩‍💼 ADMIN NOTIFICATION:
      Title: ${title}
      Body: ${body}
      Data: ${JSON.stringify(data, null, 2)}
      Time: ${new Date().toISOString()}
    `);
    
    // In a real implementation, this would send to admin dashboard,
    // email, or admin mobile app
    
    // Log notification for tracking
    console.log(`📋 Admin notified: ${title} - ${body}`);
  } catch (error) {
    console.error(`Error sending admin notification:`, error);
  }
}

// Send pre-check request to client (day before appointment)
export async function sendPreCheckRequest(reminder: AppointmentReminder): Promise<boolean> {
  try {
    const message = `🔔 Ciao ${reminder.clientName}!

Domani hai l'appuntamento da Frannie NAILS:
📅 ${reminder.appointmentDate}
⏰ ${reminder.appointmentTime}

❓ CONTROLLO PRELIMINARE:
Hai qualche unghia rotta che dobbiamo sistemare?

Rispondi con:
• "0" se sono tutte integre
• "1", "2", "3"... se hai unghie rotte

Questo mi aiuta a:
✅ Prepararmi meglio per il tuo servizio
✅ Calcolare il tempo necessario
✅ Comunicarti l'importo esatto da portare

Grazie! Non vedo l'ora di vederti! 💅✨

Frannie NAILS`;

    console.log(`📋 Invio richiesta pre-controllo a ${reminder.clientName}`);

    // Try WhatsApp automation first
    try {
      const whatsappBot = await import('./whatsapp-automation');
      const success = await whatsappBot.sendSingleMessage(reminder.phoneNumber, message);
      
      if (success) {
        console.log(`✅ Richiesta pre-controllo inviata con successo a ${reminder.clientName}`);
        
        // Store successful notification
        addPendingNotification({
          ...reminder,
          appointmentTime: `✅ PRE-CHECK REQUEST SENT - ${reminder.appointmentTime}`
        });
        
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Auto-send failed, generating manual link...`);
    }

    // Fallback: Generate WhatsApp link
    const whatsappLink = `https://wa.me/${reminder.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    console.log(`🔗 Link manuale per pre-controllo: ${whatsappLink}`);
    
    addPendingNotification({
      ...reminder,
      appointmentTime: `⚠️ PRE-CHECK MANUAL LINK - ${whatsappLink} - ${reminder.appointmentTime}`
    });
    
    return false;
    
  } catch (error) {
    console.error('Error sending pre-check request:', error);
    return false;
  }
}

// Manual trigger for testing
export async function sendTestReminders(): Promise<void> {
  console.log('Sending test reminders...');
  await processDailyReminders();
}

// Send intelligent reminder with final amount calculation
export async function sendIntelligentReminder(reminder: AppointmentReminder): Promise<boolean> {
  try {
    // Import storage to access data
    const { storage } = await import('./storage');
    
    // Get appointment details
    const appointment = await storage.getAppointment(reminder.id);
    if (!appointment) {
      console.log(`⚠️ Appointment not found for reminder: ${reminder.id}`);
      return false;
    }

    // Get client details
    const client = await storage.getClient(appointment.clientId);
    if (!client) {
      console.log(`⚠️ Client not found for appointment: ${appointment.id}`);
      return false;
    }

    // Get pre-appointment check if exists
    const preCheck = await storage.getPreAppointmentCheckByAppointment(appointment.id);

    // Service prices (same as in routes.ts)
    const servicePrices: { [key: string]: number } = {
      'Gel': 25,
      'Semipermanente': 20,
      'Ricostruzione': 45,
      'Manicure': 15,
      'Pedicure': 25,
      'Lime e Lucido': 10,
      'Laminazione Ciglia': 35
    };

    const basePrice = servicePrices[appointment.service] || 0;
    const brokenNailsCost = preCheck ? (preCheck.brokenNails * 2) : 0;
    const advanceBalance = (client.advanceBalance || 0) / 100; // Convert from cents to euros
    const finalAmount = Math.max(0, basePrice + brokenNailsCost - advanceBalance);

    // Build intelligent message with amount details
    let message = `🔔 Ciao ${client.fullName}!

Promemoria per il tuo appuntamento di DOMANI:
📅 ${reminder.appointmentDate}
⏰ ${reminder.appointmentTime}
💅 ${appointment.service}

💰 IMPORTO DA PORTARE: €${finalAmount}

`;

    // Add detailed breakdown if there are extras or advance payments
    if (brokenNailsCost > 0 || advanceBalance > 0) {
      message += `📊 DETTAGLIO COSTO:
• ${appointment.service}: €${basePrice}`;
      
      if (brokenNailsCost > 0) {
        message += `
• Unghie rotte (${preCheck!.brokenNails}): €${brokenNailsCost}`;
      }
      
      if (advanceBalance > 0) {
        message += `
• Anticipo già versato: -€${advanceBalance}`;
      }
      
      message += `
─────────────────
• TOTALE: €${finalAmount}

`;
    }

    message += `Non vedo l'ora di vederti! ✨

Frannie NAILS 💅`;

    console.log(`💡 Invio promemoria intelligente a ${client.fullName} - Importo: €${finalAmount}`);

    // Send via WhatsApp automation
    const whatsappBot = await import('./whatsapp-automation');
    const success = await whatsappBot.sendSingleMessage(client.phoneNumber, message);
    
    if (success) {
      console.log(`✅ Promemoria intelligente inviato con successo a ${client.fullName}`);
      
      // Store successful notification
      addPendingNotification({
        ...reminder,
        appointmentTime: `✅ SMART REMINDER €${finalAmount} - ${reminder.appointmentTime}`
      });
      
      return true;
    } else {
      // Fallback: Generate WhatsApp link
      const whatsappLink = `https://wa.me/${client.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      console.log(`⚠️ Auto-send failed, manual link: ${whatsappLink}`);
      
      addPendingNotification({
        ...reminder,
        appointmentTime: `⚠️ MANUAL LINK €${finalAmount} - ${whatsappLink} - ${reminder.appointmentTime}`
      });
      
      return false;
    }
    
  } catch (error) {
    console.error('Error sending intelligent reminder:', error);
    return false;
  }
}