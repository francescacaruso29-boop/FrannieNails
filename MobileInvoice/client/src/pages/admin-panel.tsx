import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FrannieLogo } from "@/components/logo";
import { ArrowLeft, MessageCircle, Users, Settings, Trash2, RefreshCw, Calendar, Plus, Clock } from "lucide-react";
import { Link } from "wouter";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [testingNotifications, setTestingNotifications] = useState(false);
  const [settingUpWhatsApp, setSettingUpWhatsApp] = useState(false);
  const [loggingInWhatsApp, setLoggingInWhatsApp] = useState(false);
  const [testContact, setTestContact] = useState("");
  const [testMessage, setTestMessage] = useState("Test messaggio da Frannie NAILS! 💅");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // Quick Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    clientPhone: '',
    clientName: '',
    service: 'Gel',
    time: '09:00'
  });

  const handleTestNotifications = async () => {
    setTestingNotifications(true);
    try {
      const response = await apiRequest('POST', '/api/test-notifications', {});
      const result = await response.json();
      
      toast({
        title: "Test Completato",
        description: result.message || "Notifiche di test inviate con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nell'invio delle notifiche di test",
        variant: "destructive"
      });
    } finally {
      setTestingNotifications(false);
    }
  };

  const generateAccessCode = async () => {
    if (!newClientName || !newClientPhone) {
      toast({
        title: "Errore",
        description: "Nome e telefono sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (useCustomCode && !customCode) {
      toast({
        title: "Errore",
        description: "Inserisci il codice personalizzato",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/admin/generate-code', {
        fullName: newClientName,
        phoneNumber: newClientPhone,
        customCode: useCustomCode ? customCode : undefined
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedCode(result.uniqueCode);
        toast({
          title: "Codice Generato",
          description: `Codice ${result.uniqueCode} creato per ${newClientName}`,
        });
        // Reset form
        setNewClientName("");
        setNewClientPhone("");
        setCustomCode("");
        setUseCustomCode(false);
        // Refresh codes list
        loadAccessCodes();
      } else {
        toast({
          title: "Errore",
          description: result.message || "Errore nella generazione del codice",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nella generazione del codice",
        variant: "destructive"
      });
    }
  };

  const loadAccessCodes = async () => {
    setLoadingCodes(true);
    try {
      const response = await fetch('/api/admin/access-codes');
      const result = await response.json();
      
      if (result.success) {
        setAccessCodes(result.accessCodes);
      }
    } catch (error) {
      console.error("Error loading access codes:", error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const deleteAccessCode = async (codeId: number) => {
    try {
      const response = await fetch(`/api/admin/access-codes/${codeId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Codice Eliminato",
          description: "Il codice è stato eliminato con successo",
        });
        loadAccessCodes(); // Refresh list
      } else {
        toast({
          title: "Errore",
          description: result.message || "Errore nell'eliminazione del codice",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del codice",
        variant: "destructive"
      });
    }
  };

  // Quick Calendar functions
  const loadAppointmentsForDate = async (date: Date) => {
    setLoadingAppointments(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/appointments/date/${dateStr}`);
      const result = await response.json();
      
      if (result.success) {
        setAppointments(result.appointments);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const createQuickAppointment = async () => {
    try {
      const appointmentData = {
        clientPhone: newAppointment.clientPhone,
        clientName: newAppointment.clientName,
        service: newAppointment.service,
        date: selectedDate.toISOString().split('T')[0],
        time: newAppointment.time
      };

      const response = await apiRequest('POST', '/api/admin/quick-appointment', appointmentData);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Appuntamento Creato",
          description: `Appuntamento per ${newAppointment.clientName} creato con successo`,
        });
        setShowCreateForm(false);
        setNewAppointment({
          clientPhone: '',
          clientName: '',
          service: 'Gel',
          time: '09:00'
        });
        loadAppointmentsForDate(selectedDate);
      } else {
        toast({
          title: "Errore",
          description: result.message || "Errore nella creazione dell'appuntamento",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'appuntamento",
        variant: "destructive"
      });
    }
  };

  // Load access codes when clients tab is active
  useEffect(() => {
    if (activeTab === 'clients') {
      loadAccessCodes();
    } else if (activeTab === 'quick-calendar') {
      loadAppointmentsForDate(selectedDate);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'quick-calendar') {
      loadAppointmentsForDate(selectedDate);
    }
  }, [selectedDate]);

  const handleWhatsAppSetup = async () => {
    setSettingUpWhatsApp(true);
    try {
      const response = await apiRequest('POST', '/api/whatsapp/setup', {});
      const result = await response.json();
      
      toast({
        title: "Setup Completato",
        description: result.message || "WhatsApp bot configurato",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nella configurazione WhatsApp",
        variant: "destructive"
      });
    } finally {
      setSettingUpWhatsApp(false);
    }
  };

  const handleWhatsAppLogin = async () => {
    setLoggingInWhatsApp(true);
    try {
      const response = await apiRequest('POST', '/api/whatsapp/login', {});
      const result = await response.json();
      
      toast({
        title: result.success ? "Login Riuscito" : "Errore Login",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore durante il login WhatsApp",
        variant: "destructive"
      });
    } finally {
      setLoggingInWhatsApp(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testContact || !testMessage) {
      toast({
        title: "Errore",
        description: "Inserisci contatto e messaggio",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/whatsapp/test', {
        contact: testContact,
        message: testMessage
      });
      const result = await response.json();
      
      toast({
        title: result.success ? "Messaggio Inviato" : "Errore Invio",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore durante l'invio del messaggio test",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex"
      style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
    >
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#d38a77' }}></div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">Frannie Nails</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'notifications' 
                ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Sistema Notifiche</span>
            </button>
            

            
            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'clients' 
                ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Gestione Clienti</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === 'settings' 
                ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Impostazioni</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Azioni Rapide</h3>
            <div className="space-y-2">
              <Button 
                onClick={handleTestNotifications}
                disabled={testingNotifications}
                size="sm"
                className="w-full justify-start text-sm"
                style={{ backgroundColor: '#d38a77' }}
              >
                {testingNotifications ? "Testing..." : "Testa Notifiche"}
              </Button>
              
              <Button 
                onClick={handleWhatsAppSetup}
                disabled={settingUpWhatsApp}
                variant="outline" 
                size="sm"
                className="w-full justify-start text-sm"
              >
                {settingUpWhatsApp ? "Setup..." : "Setup WhatsApp"}
              </Button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="space-y-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                📊 Dashboard Principale
              </Button>
            </Link>

            <Link href="/admin-advanced">
              <Button variant="outline" size="sm" className="w-full justify-start text-sm">
                🚀 Dashboard Avanzato AI
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'notifications' && 'Sistema Notifiche'}

            {activeTab === 'clients' && 'Gestione Clienti'}
            {activeTab === 'settings' && 'Impostazioni Sistema'}
          </h2>
          <p className="text-gray-600">
            {activeTab === 'notifications' && 'Gestisci notifiche WhatsApp automatiche per promemoria appuntamenti'}

            {activeTab === 'clients' && 'Crea e gestisci i codici di accesso per nuovi clienti'}
            {activeTab === 'settings' && 'Configurazioni generali e link utili'}
          </p>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistema Notifiche Automatiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2">Funzionalità Attive:</h4>
                  <ul className="text-xs space-y-1">
                    <li>✅ Notifiche automatiche alle 18:00</li>
                    <li>✅ Promemoria il giorno prima</li>
                    <li>✅ Messaggi personalizzati in italiano</li>
                    <li>✅ Backup con Telegram per admin</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">WhatsApp Gratuito</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-green-50 rounded text-xs">
                        <p className="font-medium text-green-700">✅ Sistema Configurato</p>
                        <p className="text-green-600">Link automatici nei log del server</p>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p><strong>Come funziona:</strong></p>
                        <ul className="mt-1 space-y-1 ml-2">
                          <li>• I link WhatsApp appaiono automaticamente nei log</li>
                          <li>• Clicca il link per aprire WhatsApp</li>
                          <li>• Il messaggio è già pronto da inviare</li>
                          <li>• Completamente gratuito, nessun costo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Test Messaggio</h4>
                    <div className="space-y-2">
                      <Input
                        value={testContact}
                        onChange={(e) => setTestContact(e.target.value)}
                        placeholder="Nome contatto"
                        className="text-xs h-8"
                      />
                      <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Messaggio di test"
                        className="text-xs h-8"
                      />
                      <Button 
                        onClick={handleTestWhatsApp}
                        size="sm"
                        className="w-full text-xs"
                        style={{ backgroundColor: '#d38a77' }}
                      >
                        Invia Test
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Clienti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Crea Nuovo Cliente</h4>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Nome completo" 
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                    <Input 
                      placeholder="Numero telefono" 
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="useCustomCode"
                        checked={useCustomCode}
                        onChange={(e) => setUseCustomCode(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="useCustomCode" className="text-sm">
                        Usa codice personalizzato
                      </Label>
                    </div>
                    
                    {useCustomCode && (
                      <Input 
                        placeholder="Codice personalizzato (es: MARIA2025)" 
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      />
                    )}
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    style={{ backgroundColor: '#d38a77' }}
                    onClick={generateAccessCode}
                    disabled={!newClientName || !newClientPhone || (useCustomCode && !customCode)}
                  >
                    {useCustomCode ? "Crea con Codice Personalizzato" : "Genera Codice Automatico"}
                  </Button>
                  {generatedCode && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm text-gray-600">Codice creato:</p>
                      <p className="font-mono text-lg font-bold text-green-600">{generatedCode}</p>
                      <p className="text-xs text-gray-500 mt-1">Condividi questo codice con il cliente</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Codici Salvati</h4>
                    <Button 
                      onClick={loadAccessCodes}
                      disabled={loadingCodes}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingCodes ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  {loadingCodes ? (
                    <p className="text-sm text-gray-500">Caricamento codici...</p>
                  ) : accessCodes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessun codice salvato</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {accessCodes.map((code) => (
                        <div key={code.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex-1">
                            <p className="font-mono font-bold text-blue-600">{code.uniqueCode}</p>
                            <p className="text-gray-600">{code.clientName} • {code.clientPhone}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                code.isUsed 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {code.isUsed ? 'Utilizzato' : 'Disponibile'}
                              </span>
                              {code.isCustom && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">
                                  Personalizzato
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteAccessCode(code.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border">
                  <h4 className="font-medium mb-2">Info Codici di Accesso</h4>
                  <ul className="text-sm space-y-1">
                    <li>• I clienti usano il codice per registrarsi nell'app</li>
                    <li>• Ogni codice è univoco e monouso</li>
                    <li>• I codici scadono dopo 30 giorni se non utilizzati</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'quick-calendar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Seleziona Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                    />
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Data selezionata:</p>
                      <p>{selectedDate.toLocaleDateString('it-IT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Create */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Nuovo Appuntamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showCreateForm ? (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="w-full"
                      style={{ backgroundColor: '#d38a77' }}
                    >
                      Crea Appuntamento Rapido
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Telefono cliente"
                        value={newAppointment.clientPhone}
                        onChange={(e) => setNewAppointment(prev => ({...prev, clientPhone: e.target.value}))}
                      />
                      <Input
                        placeholder="Nome cliente"
                        value={newAppointment.clientName}
                        onChange={(e) => setNewAppointment(prev => ({...prev, clientName: e.target.value}))}
                      />
                      <select
                        value={newAppointment.service}
                        onChange={(e) => setNewAppointment(prev => ({...prev, service: e.target.value}))}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="Gel">Gel (25€)</option>
                        <option value="Ricostruzione">Ricostruzione (45€)</option>
                        <option value="Semipermanente">Semipermanente (15€)</option>
                        <option value="Semipermanente Piedi">Semipermanente Piedi (20€)</option>
                        <option value="Epilazione">Epilazione (30€)</option>
                        <option value="Ceretta Brasiliana">Ceretta Brasiliana (35€)</option>
                        <option value="Laminazione Ciglia">Laminazione Ciglia (25€)</option>
                        <option value="Trucco">Trucco (40€)</option>
                      </select>
                      <select
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment(prev => ({...prev, time: e.target.value}))}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="09:00">09:00</option>
                        <option value="10:30">10:30</option>
                        <option value="15:00">15:00</option>
                        <option value="16:30">16:30</option>
                      </select>
                      <div className="flex gap-2">
                        <Button 
                          onClick={createQuickAppointment}
                          className="flex-1"
                          style={{ backgroundColor: '#d38a77' }}
                        >
                          Crea
                        </Button>
                        <Button 
                          onClick={() => setShowCreateForm(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Appuntamenti del {selectedDate.toLocaleDateString('it-IT')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <p className="text-sm text-gray-500">Caricamento appuntamenti...</p>
                ) : appointments.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessun appuntamento per questa data</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{appointment.clientName || 'Cliente'}</p>
                          <p className="text-sm text-gray-600">{appointment.service}</p>
                          <p className="text-sm text-gray-500">Ore {appointment.appointmentTime}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Tel: {appointment.clientPhone || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Dashboard Links</h4>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => window.location.href = '/admin-dashboard'}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        📊 Dashboard Principale
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/admin-advanced'}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        🚀 Dashboard Avanzato AI
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Sistema Info</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Versione:</strong> 1.0.0</p>
                      <p><strong>Database:</strong> PostgreSQL</p>
                      <p><strong>Notifiche:</strong> WhatsApp + Telegram</p>
                      <p><strong>Fuso Orario:</strong> Europa/Roma</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}