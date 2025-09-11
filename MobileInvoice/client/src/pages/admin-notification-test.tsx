import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Clock, CreditCard, X, MessageCircle } from "lucide-react";

export default function AdminNotificationTest() {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    action: "send_reminder",
    clientName: "Test Cliente",
    clientPhone: "+39 351 746 8491",
    date: "20/07/2025",
    time: "15:30",
    service: "Gel Manicure",
    creditBalance: "75",
    advanceBalance: "30"
  });

  const { toast } = useToast();

  const actionTypes = [
    { value: "send_reminder", label: "📅 Promemoria Appuntamento", icon: Clock },
    { value: "update_balance", label: "💰 Aggiornamento Saldo", icon: CreditCard },
    { value: "cancel_appointment", label: "❌ Cancellazione", icon: X },
    { value: "new_message", label: "💬 Nuovo Messaggio", icon: MessageCircle }
  ];

  const services = [
    "Gel Manicure",
    "Semipermanente",
    "Ricostruzione Unghie",
    "Pedicure",
    "Nail Art",
    "Manicure Classica",
    "Trattamento Cuticole",
    "Smalto Normale"
  ];

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const payload = {
        action: formData.action,
        clientId: 999, // Test client ID
        data: {
          name: formData.clientName,
          phone: formData.clientPhone,
          date: formData.date,
          time: formData.time,
          service: formData.service,
          creditBalance: parseInt(formData.creditBalance),
          advanceBalance: parseInt(formData.advanceBalance)
        }
      };

      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setLastResponse(result);

      if (result.success) {
        // Apri direttamente WhatsApp con il messaggio pronto
        const phone = formData.clientPhone.replace(/\s+/g, '').replace('+', '');
        const message = encodeURIComponent(result.whatsappPreview);
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: "📱 WhatsApp Aperto",
          description: `Messaggio pronto per ${formData.clientName}`,
        });
      } else {
        toast({
          title: "❌ Errore",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ Errore di Connessione",
        description: "Impossibile preparare il messaggio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAction = actionTypes.find(a => a.value === formData.action);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            🌸 Test Sistema Notifiche
          </h1>
          <p className="text-purple-200">
            Simula notifiche WhatsApp automatiche per Frannie Nail Salon
          </p>
        </div>

        {/* Test Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Configurazione Test
            </CardTitle>
            <CardDescription className="text-purple-200">
              Personalizza i dati per testare le notifiche automatiche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action Type */}
              <div className="space-y-2">
                <Label htmlFor="action" className="text-white">Tipo Notifica</Label>
                <Select value={formData.action} onValueChange={(value) => setFormData(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-white">Nome Cliente</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  placeholder="Es. Mario Rossi"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-white">Numero Telefono</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                  placeholder="+39 000 000 0000"
                />
              </div>

              {/* Service */}
              {(formData.action === "send_reminder" || formData.action === "cancel_appointment") && (
                <div className="space-y-2">
                  <Label htmlFor="service" className="text-white">Servizio</Label>
                  <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date */}
              {(formData.action === "send_reminder" || formData.action === "cancel_appointment") && (
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-white">Data</Label>
                  <Input
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    placeholder="20/07/2025"
                  />
                </div>
              )}

              {/* Time */}
              {(formData.action === "send_reminder" || formData.action === "cancel_appointment") && (
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-white">Orario</Label>
                  <Input
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                    placeholder="15:30"
                  />
                </div>
              )}

              {/* Financial Fields */}
              {formData.action === "update_balance" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="creditBalance" className="text-white">Credito (€)</Label>
                    <Input
                      id="creditBalance"
                      value={formData.creditBalance}
                      onChange={(e) => setFormData(prev => ({ ...prev, creditBalance: e.target.value }))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      placeholder="75"
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advanceBalance" className="text-white">Anticipo (€)</Label>
                    <Input
                      id="advanceBalance"
                      value={formData.advanceBalance}
                      onChange={(e) => setFormData(prev => ({ ...prev, advanceBalance: e.target.value }))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      placeholder="30"
                      type="number"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendTestNotification}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3"
            >
              {loading ? "Apertura WhatsApp..." : `💬 Invia su WhatsApp a ${formData.clientName}`}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {lastResponse && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                {lastResponse.success ? "✅ Notifica Inviata" : "❌ Errore"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastResponse.success && (
                <>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-100 font-medium">
                      Cliente: {lastResponse.client}
                    </p>
                    <p className="text-green-200 text-sm">
                      {lastResponse.details}
                    </p>
                  </div>

                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-blue-100 font-medium">
                        📱 Anteprima Messaggio WhatsApp:
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(lastResponse.whatsappPreview);
                            toast({
                              title: "📋 Copiato!",
                              description: "Messaggio copiato negli appunti. Apri WhatsApp e incolla!",
                            });
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          📋 Copia
                        </Button>
                        <Button
                          onClick={() => {
                            // Extract phone number from form data
                            const phone = formData.clientPhone.replace(/\s+/g, '').replace('+', '');
                            const message = encodeURIComponent(lastResponse.whatsappPreview);
                            const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white text-xs"
                        >
                          💬 Apri WhatsApp
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={lastResponse.whatsappPreview}
                      readOnly
                      className="bg-white/10 border-white/20 text-white text-sm font-mono h-40 resize-none"
                    />
                  </div>
                </>
              )}

              {!lastResponse.success && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-100">{lastResponse.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">ℹ️ Come Funziona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-purple-200 space-y-2 text-sm">
              <p>• Questo sistema simula le notifiche WhatsApp che verrebbero inviate ai clienti</p>
              <p>• Ogni azione amministrativa attiva automaticamente una notifica personalizzata</p>
              <p>• I messaggi includono branding del salone e informazioni di contatto</p>
              <p>• Il sistema è pronto per l'integrazione con Twilio per invii reali</p>
              <p>• Tutti i tipi di notifica sono completamente configurati e testati</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}