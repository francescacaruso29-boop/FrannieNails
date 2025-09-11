// Sistema Notifiche Avanzato - Frannie NAILS
// Alert real-time, toast intelligenti, push notifications

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  sound?: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'system' | 'appointment' | 'client' | 'upload' | 'backup';
  timestamp: number;
  userId?: string;
  metadata?: any;
}

interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

interface NotificationQueue {
  high: NotificationData[];
  normal: NotificationData[];
  low: NotificationData[];
}

interface NotificationPreferences {
  enableSound: boolean;
  enablePush: boolean;
  enableToast: boolean;
  priorities: ('low' | 'normal' | 'high' | 'urgent')[];
  categories: string[];
  quietHours: { start: string; end: string } | null;
}

// 🔔 SISTEMA NOTIFICHE CENTRALE
class NotificationSystem {
  private queue: NotificationQueue = { high: [], normal: [], low: [] };
  private activeNotifications = new Map<string, NotificationData>();
  private preferences: NotificationPreferences;
  private toastInstance: any = null;
  private isProcessing = false;
  private soundEnabled = true;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.preferences = this.loadPreferences();
    this.initToast();
    this.initServiceWorker();
    this.setupEventListeners();
    this.startQueueProcessor();
  }

  // 🔧 INIZIALIZZAZIONE
  private async initToast() {
    try {
      const { toast } = await import('@/hooks/use-toast');
      this.toastInstance = toast;
    } catch (error) {
      console.warn('⚠️ Toast system non disponibile');
    }
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('🔔 Service Worker per notifiche pronto');
      } catch (error) {
        console.warn('⚠️ Service Worker non disponibile:', error);
      }
    }
  }

  private setupEventListeners() {
    // Listener per visibilità pagina
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.clearStaleNotifications();
      }
    });

    // Listener per connessione
    window.addEventListener('online', () => {
      this.notify({
        type: 'success',
        title: 'Connessione Ripristinata',
        message: 'Sei di nuovo online',
        category: 'system',
        priority: 'normal'
      });
    });

    window.addEventListener('offline', () => {
      this.notify({
        type: 'warning',
        title: 'Connessione Persa',
        message: 'Modalità offline attiva',
        category: 'system',
        priority: 'high',
        persistent: true
      });
    });
  }

  // 🎯 NOTIFICA PRINCIPALE
  notify(options: Partial<NotificationData> & { title: string; message: string }): string {
    const notification: NotificationData = {
      id: this.generateId(),
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration || this.getDefaultDuration(options.type || 'info'),
      persistent: options.persistent || false,
      actions: options.actions || [],
      icon: options.icon || this.getDefaultIcon(options.type || 'info'),
      sound: options.sound !== undefined ? options.sound : true,
      priority: options.priority || 'normal',
      category: options.category || 'system',
      timestamp: Date.now(),
      userId: options.userId,
      metadata: options.metadata
    };

    // Verifica preferenze utente
    if (!this.shouldShowNotification(notification)) {
      return notification.id;
    }

    // Aggiungi alla coda appropriata
    this.addToQueue(notification);
    
    // Log per debug
    console.log(`🔔 Notifica: [${notification.priority}] ${notification.title}`);
    
    return notification.id;
  }

  // 📥 GESTIONE CODA
  private addToQueue(notification: NotificationData) {
    switch (notification.priority) {
      case 'urgent':
      case 'high':
        this.queue.high.unshift(notification);
        break;
      case 'normal':
        this.queue.normal.push(notification);
        break;
      case 'low':
        this.queue.low.push(notification);
        break;
    }

    // Processa immediatamente se urgente
    if (notification.priority === 'urgent') {
      this.processNext();
    }
  }

  // ⚡ PROCESSORE CODA
  private startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processNext();
      }
    }, 500); // Processa ogni 500ms
  }

  private async processNext() {
    if (this.isProcessing) return;

    // Priorità: urgent/high > normal > low
    let notification: NotificationData | undefined;
    
    if (this.queue.high.length > 0) {
      notification = this.queue.high.shift();
    } else if (this.queue.normal.length > 0) {
      notification = this.queue.normal.shift();
    } else if (this.queue.low.length > 0) {
      notification = this.queue.low.shift();
    }

    if (!notification) return;

    this.isProcessing = true;
    await this.displayNotification(notification);
    this.isProcessing = false;
  }

  // 🎨 DISPLAY NOTIFICHE
  private async displayNotification(notification: NotificationData) {
    this.activeNotifications.set(notification.id, notification);

    // Toast notification
    if (this.preferences.enableToast && this.toastInstance) {
      this.showToast(notification);
    }

    // Push notification (se la pagina non è visibile)
    if (this.preferences.enablePush && document.hidden) {
      await this.showPushNotification(notification);
    }

    // Suono
    if (notification.sound && this.preferences.enableSound && this.soundEnabled) {
      this.playNotificationSound(notification.type);
    }

    // Auto-remove se non persistente
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  // 🍞 TOAST INTELLIGENTI
  private showToast(notification: NotificationData) {
    if (!this.toastInstance) return;

    const variant = this.getToastVariant(notification.type);
    
    this.toastInstance({
      title: notification.title,
      description: notification.message,
      variant,
      duration: notification.persistent ? Infinity : notification.duration,
      action: notification.actions?.length ? {
        altText: notification.actions[0].label,
        onClick: notification.actions[0].action
      } : undefined
    });
  }

  // 📱 PUSH NOTIFICATIONS
  private async showPushNotification(notification: NotificationData) {
    if (!this.swRegistration || !('Notification' in window)) return;

    // Richiedi permesso se necessario
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      await this.swRegistration.showNotification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/icon-192x192.png',
        badge: '/icon-badge.png',
        tag: notification.category,
        data: notification.metadata,
        requireInteraction: notification.persistent,
        actions: notification.actions?.slice(0, 2).map(action => ({
          action: action.label.toLowerCase(),
          title: action.label
        })) || []
      });
    }
  }

  // 🔊 SUONI NOTIFICA
  private playNotificationSound(type: NotificationData['type']) {
    if (!this.soundEnabled) return;

    try {
      const audio = new Audio();
      
      switch (type) {
        case 'success':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DvvGsgCDyO1u7dSBkJa8X+qTUGLYzY9N2jQwgLS5jO9s2jRgoTUaLay3YsSj4';
          break;
        case 'error':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DvvGsgCDyO1u7dSBkJa8X+qTUGLYzY9N2jQwgLS5jO9s2jRgoTUaLay3YsCj4';
          break;
        case 'warning':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DvvGsgCDyO1u7dSBkJa8X+qTUGLYzY9N2jQwgLS5jO9s2jRgoTUaLay3YsCj4';
          break;
        default:
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DvvGsgCDyO1u7dSBkJa8X+qTUGLYzY9N2jQwgLS5jO9s2jRgoTUaLay3YsCj4';
      }
      
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignora errori audio
    } catch (error) {
      // Ignora errori audio
    }
  }

  // 🎛️ UTILITY METHODS
  private shouldShowNotification(notification: NotificationData): boolean {
    // Controlla preferenze categoria
    if (!this.preferences.categories.includes(notification.category)) {
      return false;
    }

    // Controlla preferenze priorità
    if (!this.preferences.priorities.includes(notification.priority)) {
      return false;
    }

    // Controlla ore silenziose
    if (this.preferences.quietHours && this.isQuietHour()) {
      return notification.priority === 'urgent';
    }

    return true;
  }

  private isQuietHour(): boolean {
    if (!this.preferences.quietHours) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const start = this.parseTime(this.preferences.quietHours.start);
    const end = this.parseTime(this.preferences.quietHours.end);
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDefaultDuration(type: NotificationData['type']): number {
    switch (type) {
      case 'error': return 8000;
      case 'warning': return 6000;
      case 'success': return 4000;
      case 'info': return 3000;
      default: return 4000;
    }
  }

  private getDefaultIcon(type: NotificationData['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  }

  private getToastVariant(type: NotificationData['type']): 'default' | 'destructive' {
    return type === 'error' ? 'destructive' : 'default';
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🗑️ GESTIONE RIMOZIONE
  removeNotification(id: string): void {
    this.activeNotifications.delete(id);
  }

  clearStaleNotifications(): void {
    const now = Date.now();
    const staleTime = 30 * 60 * 1000; // 30 minuti
    
    for (const [id, notification] of this.activeNotifications) {
      if (now - notification.timestamp > staleTime) {
        this.removeNotification(id);
      }
    }
  }

  // ⚙️ PREFERENZE
  private loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('⚠️ Errore caricamento preferenze notifiche');
    }
    
    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enableSound: true,
      enablePush: true,
      enableToast: true,
      priorities: ['normal', 'high', 'urgent'],
      categories: ['system', 'appointment', 'client', 'upload', 'backup'],
      quietHours: null
    };
  }

  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
    console.log('⚙️ Preferenze notifiche aggiornate');
  }

  // 🎵 CONTROLLI AUDIO
  enableSound(): void {
    this.soundEnabled = true;
  }

  disableSound(): void {
    this.soundEnabled = false;
  }

  // 📊 STATISTICHE
  getStats(): {
    activeCount: number;
    queueSize: number;
    totalProcessed: number;
  } {
    return {
      activeCount: this.activeNotifications.size,
      queueSize: this.queue.high.length + this.queue.normal.length + this.queue.low.length,
      totalProcessed: 0 // TODO: Implementare contatore
    };
  }
}

// 🎯 SHORTCUT FUNCTIONS
let notificationSystem: NotificationSystem | null = null;

export function getNotificationSystem(): NotificationSystem {
  if (!notificationSystem) {
    notificationSystem = new NotificationSystem();
  }
  return notificationSystem;
}

// 🚨 QUICK NOTIFICATIONS
export function notifySuccess(title: string, message: string, options?: Partial<NotificationData>) {
  return getNotificationSystem().notify({
    type: 'success',
    title,
    message,
    ...options
  });
}

export function notifyError(title: string, message: string, options?: Partial<NotificationData>) {
  return getNotificationSystem().notify({
    type: 'error',
    title,
    message,
    priority: 'high',
    ...options
  });
}

export function notifyWarning(title: string, message: string, options?: Partial<NotificationData>) {
  return getNotificationSystem().notify({
    type: 'warning',
    title,
    message,
    priority: 'normal',
    ...options
  });
}

export function notifyInfo(title: string, message: string, options?: Partial<NotificationData>) {
  return getNotificationSystem().notify({
    type: 'info',
    title,
    message,
    ...options
  });
}

// 📱 NOTIFICHE SPECIFICHE FRANNIE
export function notifyAppointment(action: 'booked' | 'cancelled' | 'reminded', clientName: string, details?: string) {
  const titles = {
    booked: 'Appuntamento Prenotato',
    cancelled: 'Appuntamento Cancellato', 
    reminded: 'Promemoria Appuntamento'
  };
  
  const messages = {
    booked: `Nuovo appuntamento per ${clientName}`,
    cancelled: `Appuntamento di ${clientName} cancellato`,
    reminded: `Promemoria inviato a ${clientName}`
  };

  return getNotificationSystem().notify({
    type: action === 'cancelled' ? 'warning' : 'success',
    title: titles[action],
    message: details || messages[action],
    category: 'appointment',
    priority: 'normal',
    sound: true
  });
}

export function notifyClientAction(action: 'created' | 'updated' | 'photo_uploaded', clientName: string) {
  const titles = {
    created: 'Nuova Cliente',
    updated: 'Cliente Aggiornata',
    photo_uploaded: 'Foto Caricata'
  };

  return getNotificationSystem().notify({
    type: 'success',
    title: titles[action],
    message: `${clientName} - ${titles[action]}`,
    category: 'client',
    priority: 'normal'
  });
}

export function notifySystemEvent(event: 'backup_completed' | 'backup_failed' | 'maintenance') {
  const configs = {
    backup_completed: {
      type: 'success' as const,
      title: 'Backup Completato',
      message: 'Backup automatico eseguito con successo'
    },
    backup_failed: {
      type: 'error' as const,
      title: 'Backup Fallito',
      message: 'Errore durante il backup automatico'
    },
    maintenance: {
      type: 'info' as const,
      title: 'Manutenzione Sistema',
      message: 'Manutenzione programmata in corso'
    }
  };

  const config = configs[event];
  return getNotificationSystem().notify({
    ...config,
    category: 'system',
    priority: config.type === 'error' ? 'high' : 'normal'
  });
}

// 🚀 INIT
export function initNotificationSystem(): NotificationSystem {
  const system = getNotificationSystem();
  console.log('🔔 Sistema notifiche avanzato inizializzato');
  return system;
}