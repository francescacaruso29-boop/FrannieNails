import { useState, useEffect } from "react";
import { ArrowLeft, Save, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalData, setOriginalData] = useState({ fullName: "", phoneNumber: "" });

  useEffect(() => {
    // Load current client data from localStorage
    const clientData = localStorage.getItem('frannie-client-data');
    if (clientData) {
      const client = JSON.parse(clientData);
      setFullName(client.fullName || "");
      setPhoneNumber(client.phoneNumber || "");
      setClientId(client.id || null);
      setOriginalData({
        fullName: client.fullName || "",
        phoneNumber: client.phoneNumber || ""
      });
    }
  }, []);

  const handleSave = async () => {
    if (!clientId) {
      toast({
        title: "Errore",
        description: "Dati cliente non trovati",
        variant: "destructive"
      });
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim()) {
      toast({
        title: "Errore",
        description: "Nome e numero di telefono sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Check if anything changed
    if (fullName === originalData.fullName && phoneNumber === originalData.phoneNumber) {
      toast({
        title: "Nessuna modifica",
        description: "Non hai apportato modifiche ai tuoi dati",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, phoneNumber })
      });
      
      const result = await response.json();

      if (result.success) {
        // Update localStorage with new data
        const updatedClientData = {
          ...JSON.parse(localStorage.getItem('frannie-client-data') || '{}'),
          fullName,
          phoneNumber
        };
        localStorage.setItem('frannie-client-data', JSON.stringify(updatedClientData));
        
        setOriginalData({ fullName, phoneNumber });
        
        toast({
          title: "Dati aggiornati! ✅",
          description: "Le tue informazioni sono state salvate con successo",
        });
      } else {
        throw new Error(result.message || "Errore nell'aggiornamento");
      }
    } catch (error) {
      console.error("Error updating client data:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i dati. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const hasChanges = fullName !== originalData.fullName || phoneNumber !== originalData.phoneNumber;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)' }}>
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={goBack}
            variant="ghost"
            size="sm"
            className="mr-3 p-2 hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#d38a77' }} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ color: '#d38a77' }}>
            Impostazioni Profilo
          </h1>
        </div>

        {/* Settings Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/40">
          <div className="space-y-6">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2" style={{ color: '#d38a77' }} />
                Nome Completo
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Inserisci il tuo nome completo"
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2" style={{ color: '#d38a77' }} />
                Numero di Telefono
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Inserisci il tuo numero di telefono"
                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 text-sm mb-2">
                📱 Aggiornamento Numero di Telefono
              </h3>
              <p className="text-blue-700 text-sm">
                Se cambi il numero di telefono, assicurati che sia corretto per ricevere promemoria e conferme WhatsApp.
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="w-full text-white py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: hasChanges ? '#d38a77' : '#cbd5e1' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  {hasChanges ? "Salva Modifiche" : "Nessuna Modifica"}
                </div>
              )}
            </Button>

            {/* Warning for Phone Changes */}
            {phoneNumber !== originalData.phoneNumber && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 text-sm mb-2">
                  ⚠️ Attenzione
                </h3>
                <p className="text-amber-700 text-sm">
                  Stai cambiando il numero di telefono. Tutti i promemoria futuri verranno inviati al nuovo numero.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}