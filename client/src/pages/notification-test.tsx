import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FrannieNotifications } from '@/lib/notifications';
import { Bell, CheckCircle, XCircle, AlertCircle, Settings, Smartphone, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationTestPage() {
  const [notificationSupport, setNotificationSupport] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'denied' | 'granted'>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [mockNotifications, setMockNotifications] = useState<Array<{
    id: number;
    title: string;
    body: string;
    type: string;
    timestamp: Date;
  }>>([]);

  const notifications = FrannieNotifications.getInstance();

  useEffect(() => {
    checkNotificationSupport();
    initializeNotifications();
  }, []);

  const checkNotificationSupport = () => {
    const hasNotifications = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    setNotificationSupport(hasNotifications && hasServiceWorker && hasPushManager);
    
    if (hasNotifications) {
      setPermissionStatus(Notification.permission);
    }
  };

  const initializeNotifications = async () => {
    try {
      const initialized = await notifications.initialize();
      setServiceWorkerReady(initialized);
      
      if (initialized) {
        addTestResult('✅ Service Worker registrato con successo');
      } else {
        addTestResult('❌ Errore nella registrazione del Service Worker');
      }
    } catch (error) {
      addTestResult(`❌ Errore inizializzazione: ${error}`);
    }
  };

  const requestPermission = async () => {
    try {
      addTestResult('🔄 Tentativo richiesta permessi...');
      
      if (Notification.permission === 'denied') {
        addTestResult('❌ PERMESSI BLOCCATI - Devi sbloccarli manualmente dalle impostazioni browser');
        addTestResult('📱 Opera: Menu > Impostazioni > Impostazioni siti > Notifiche');
        return;
      }
      
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        addTestResult('✅ Permessi notifiche concessi dall\'utente');
      } else if (permission === 'denied') {
        addTestResult('❌ PERMESSI NEGATI - Vai alle impostazioni browser per sbloccarli');
      } else {
        addTestResult('⚠️ Richiesta permessi ignorata dall\'utente');
      }
    } catch (error) {
      addTestResult(`❌ Errore richiesta permessi: ${error}`);
      addTestResult('💡 Suggerimento: Controlla le impostazioni del browser manualmente');
    }
  };

  // Test notifica diretta browser (richiede permessi automaticamente)
  const sendDirectBrowserNotification = async () => {
    try {
      addTestResult('🔄 Tentativo invio notifica diretta...');
      
      // Se non abbiamo permessi, li richiediamo automaticamente
      if (Notification.permission === 'default') {
        addTestResult('🔔 Richiesto permessi automaticamente...');
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== 'granted') {
          addTestResult('❌ Permessi negati - impossibile inviare notifica');
          return;
        }
      }
      
      if (Notification.permission !== 'granted') {
        addTestResult('❌ Permessi non disponibili - controlla le impostazioni del browser');
        return;
      }
      
      const notification = new Notification('🧪 Test Notifica Diretta', {
        body: 'SUCCESSO! Questa notifica bypassa il Service Worker e funziona direttamente dal browser!',
        icon: '/favicon.ico',
        tag: 'direct-test',
        requireInteraction: false
      });
      
      // Auto chiudi dopo 5 secondi
      setTimeout(() => notification.close(), 5000);
      
      addTestResult('✅ NOTIFICA INVIATA CON SUCCESSO! Dovresti vederla ora!');
    } catch (error) {
      addTestResult(`❌ Errore notifica diretta: ${error}`);
    }
  };

  const subscribeToNotifications = async () => {
    try {
      // Get client ID from localStorage (simulated for test)
      const clientData = localStorage.getItem('clientData');
      const clientId = clientData ? JSON.parse(clientData).id : '123';
      
      const subscribed = await notifications.subscribeUser(clientId);
      setSubscriptionStatus(subscribed);
      
      if (subscribed) {
        addTestResult(`✅ Cliente ${clientId} sottoscritto alle notifiche push`);
      } else {
        addTestResult('❌ Errore nella sottoscrizione alle notifiche');
      }
    } catch (error) {
      addTestResult(`❌ Errore sottoscrizione: ${error}`);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notifications.showLocalNotification(
        '🧪 Test Notifica Locale',
        'Questa è una notifica di test generata dal sistema Frannie Nail Salon',
        { testData: true }
      );
      addTestResult('✅ Notifica locale inviata');
    } catch (error) {
      addTestResult(`❌ Errore invio notifica locale: ${error}`);
    }
  };

  const sendServerTestNotification = async () => {
    try {
      const clientData = localStorage.getItem('clientData');
      const clientId = clientData ? JSON.parse(clientData).id : '123';
      
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          action: 'send_reminder',
          data: {
            date: '2025-07-24',
            time: '15:00',
            service: 'Manicure Gel'
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        addTestResult('✅ Notifica server inviata con successo');
        addTestResult(`📱 Cliente: ${result.client}`);
      } else {
        addTestResult(`❌ Errore server: ${result.message}`);
      }
    } catch (error) {
      addTestResult(`❌ Errore richiesta server: ${error}`);
    }
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Simula notifiche visive senza permessi browser
  const showMockNotification = (title: string, body: string, type: string = 'info') => {
    const notification = {
      id: Date.now(),
      title,
      body,
      type,
      timestamp: new Date()
    };
    
    setMockNotifications(prev => [notification, ...prev.slice(0, 4)]); // Max 5 notifiche
    addTestResult(`✅ NOTIFICA SIMULATA: "${title}"`);
    
    // Auto rimuovi dopo 5 secondi
    setTimeout(() => {
      setMockNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const testNotificationTypes = [
    {
      title: '🔔 Promemoria Appuntamento',
      body: 'Il tuo appuntamento è previsto per domani alle 15:30',
      type: 'reminder',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: '📸 Nuova Foto Condivisa',
      body: 'Frannie ha condiviso una nuova nail art per te! ✨',
      type: 'photo',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: '💬 Nuovo Messaggio',
      body: 'Hai ricevuto un nuovo messaggio da Frannie NAILS',
      type: 'message',
      color: 'from-green-500 to-green-600'
    },
    {
      title: '✅ Prenotazione Confermata',
      body: 'Il tuo appuntamento è stato confermato per il 09/09 alle 14:00',
      type: 'booking',
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  const sendAllMockNotifications = async () => {
    addTestResult('🚀 Inviando tutte le tipologie di notifica...');
    
    for (let i = 0; i < testNotificationTypes.length; i++) {
      const notif = testNotificationTypes[i];
      setTimeout(() => {
        showMockNotification(notif.title, notif.body, notif.type);
      }, i * 1000); // 1 secondo di delay tra notifiche
    }
  };

  const clearMockNotifications = () => {
    setMockNotifications([]);
    addTestResult('🗑️ Notifiche simulate pulite');
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Consentito</Badge>;
      case 'denied':
        return <Badge variant="destructive">Negato</Badge>;
      default:
        return <Badge variant="secondary">Da richiedere</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bell className="h-8 w-8 text-[#d38a77]" />
            <h1 className="text-3xl font-bold text-gray-900">Test Notifiche Push</h1>
          </div>
          <p className="text-gray-600">Sistema di test per le notifiche popup di Frannie Nail Salon</p>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Stato Sistema
            </CardTitle>
            <CardDescription>
              Verifica della compatibilità e stato dei permessi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Supporto Notifiche</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(notificationSupport)}
                  <span className="text-sm text-gray-600">
                    {notificationSupport ? 'Supportato' : 'Non supportato'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Service Worker</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(serviceWorkerReady)}
                  <span className="text-sm text-gray-600">
                    {serviceWorkerReady ? 'Attivo' : 'Non attivo'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Permessi</span>
                {getPermissionBadge()}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Sottoscrizione</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(subscriptionStatus)}
                  <span className="text-sm text-gray-600">
                    {subscriptionStatus ? 'Attiva' : 'Non attiva'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Azioni Test
            </CardTitle>
            <CardDescription>
              Prova le diverse funzionalità delle notifiche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={requestPermission}
                disabled={false}
                className="h-12"
                variant={permissionStatus === 'granted' ? 'secondary' : 'default'}
              >
                <Bell className="h-4 w-4 mr-2" />
                {permissionStatus === 'granted' ? 'Permessi Attivi ✅' : 'Richiedi Permessi'}
              </Button>
              
              <Button 
                onClick={subscribeToNotifications}
                disabled={!serviceWorkerReady || permissionStatus !== 'granted'}
                className="h-12"
                variant={subscriptionStatus ? 'secondary' : 'default'}
              >
                <Settings className="h-4 w-4 mr-2" />
                {subscriptionStatus ? 'Sottoscritto' : 'Sottoscrivi Notifiche'}
              </Button>
              
              <Button 
                onClick={sendTestNotification}
                disabled={permissionStatus !== 'granted'}
                className="h-12 bg-[#d38a77] hover:bg-[#c17a67]"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Test Notifica Locale
              </Button>
              
              <Button 
                onClick={sendDirectBrowserNotification}
                disabled={false}
                className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              >
                <Bell className="h-4 w-4 mr-2" />
                {permissionStatus === 'granted' ? 'Test Notifica Diretta' : 'Test Forzato (richiederà permessi)'}
              </Button>
              
              <Button 
                onClick={sendServerTestNotification}
                disabled={!subscriptionStatus}
                className="h-12 bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Test Notifica Server
              </Button>
              
              <Button 
                onClick={sendAllMockNotifications}
                disabled={false}
                className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                🎭 Demo Notifiche Simulate
              </Button>
              
              <Button 
                onClick={clearMockNotifications}
                disabled={mockNotifications.length === 0}
                variant="outline"
                className="h-12"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Pulisci Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mock Notifications Display */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-purple-700">📱 Anteprima Notifiche Push</CardTitle>
            <CardDescription>
              Simulazione visiva di come appaiono le notifiche sul telefono delle clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px]">
              <AnimatePresence>
                {mockNotifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    🎭 Clicca "Demo Notifiche Simulate" per vedere come funzionano!
                  </div>
                ) : (
                  mockNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 300, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg shadow-lg text-white bg-gradient-to-r ${
                        testNotificationTypes.find(t => t.type === notification.type)?.color || 'from-gray-500 to-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">
                            {notification.title}
                          </div>
                          <div className="text-xs opacity-90">
                            {notification.body}
                          </div>
                        </div>
                        <div className="text-xs opacity-75 ml-2">
                          {notification.timestamp.toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Log Test</CardTitle>
              <CardDescription>
                Risultati e messaggi di debug delle notifiche
              </CardDescription>
            </div>
            <Button onClick={clearResults} variant="outline" size="sm">
              Pulisci Log
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
              {testResults.length === 0 ? (
                <div className="text-gray-500">Nessun test eseguito ancora...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-[#d38a77] bg-gradient-to-r from-pink-50 to-rose-50">
          <CardHeader>
            <CardTitle className="text-[#d38a77]">📱 Istruzioni Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-[#d38a77] mb-2">🔔 Test Reali (Richiedono Permessi):</h4>
                <p><strong>1.</strong> Clicca "Richiedi Permessi" e accetta le notifiche nel browser</p>
                <p><strong>2.</strong> Clicca "Sottoscrivi Notifiche" per registrare il dispositivo</p>
                <p><strong>3.</strong> Usa "Test Notifica Locale" per una notifica immediata</p>
                <p><strong>4.</strong> Usa "Test Notifica Server" per simulare notifiche automatiche</p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">🎭 Demo Visiva (Sempre Funziona):</h4>
                <p><strong>1.</strong> Clicca "Demo Notifiche Simulate" per vedere l'anteprima</p>
                <p><strong>2.</strong> Osserva come appaiono 4 tipi diversi di notifiche</p>
                <p><strong>3.</strong> Le notifiche si animano e scompaiono automaticamente</p>
                <p><strong>4.</strong> Perfetto per mostrare ai clienti come funziona!</p>
              </div>
            </div>
            <p className="text-center text-[#d38a77] font-medium pt-2 border-t">
              💡 La demo simula esattamente come appaiono le notifiche sui telefoni delle clienti!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}