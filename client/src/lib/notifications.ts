// Push Notifications Library for Frannie Nail Salon

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export class FrannieNotifications {
  private static instance: FrannieNotifications;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): FrannieNotifications {
    if (!FrannieNotifications.instance) {
      FrannieNotifications.instance = new FrannieNotifications();
    }
    return FrannieNotifications.instance;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeUser(clientId: string): Promise<boolean> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return false;
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqISHn5-0-sJmTnCVnZkjYvD8Tx-0p1VCR_Xl_NDPOsNu5zENiF_TI'
          )
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(clientId, this.subscription);
      
      console.log('User subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(clientId: string, subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          subscription
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (Notification.permission === 'granted' && this.registration) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          data,
          requireInteraction: true,
          tag: 'frannie-local-notification'
        });
      } catch (error) {
        console.error('Errore nella creazione notifica:', error);
      }
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    return {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default'
    };
  }
}