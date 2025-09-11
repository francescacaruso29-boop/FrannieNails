import { useEffect } from 'react';

export function usePushNotifications() {
  const showBrowserNotification = async (title: string, body: string) => {
    try {
      if ('Notification' in window) {
        let permission = Notification.permission;
        
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        
        if (permission === 'granted') {
          const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            tag: 'frannie-notification',
            requireInteraction: true
          });
          
          setTimeout(() => notification.close(), 8000);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error showing browser notification:', error);
      return false;
    }
  };

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Connect to WebSocket for real-time notifications
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'push-notification') {
          const { title, body } = message.data;
          showBrowserNotification(title, body);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendPushNotification = async (title: string, body: string) => {
    try {
      // Request notification permission
      if ('Notification' in window) {
        let permission = Notification.permission;
        
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        
        if (permission === 'granted') {
          // Create notification directly for immediate display
          const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            tag: 'booking-confirmation',
            requireInteraction: true
          });
          
          // Auto close after 5 seconds
          setTimeout(() => {
            notification.close();
          }, 5000);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  };

  return { sendPushNotification };
}