import { useState } from "react";
import { useLocation } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, DollarSign, Save } from "lucide-react";

export default function DailyEarningsInput() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) < 0) {
      toast({
        title: "Errore",
        description: "Inserisci un importo valido",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/admin/daily-earnings", {
        date: todayDate,
        amount: parseFloat(amount),
        notes: notes.trim() || null
      });

      toast({
        title: "Salvato!",
        description: `Guadagni di €${amount} salvati per oggi`,
        style: { backgroundColor: '#d38a77', color: 'white' }
      });

      // Reset form
      setAmount("");
      setNotes("");
      
      // Go back to admin dashboard
      setLocation('/admin');
    } catch (error) {
      console.error("Error saving daily earnings:", error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio guadagni",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
      >
        <div className="pl-6 pr-6 py-4">
          {/* Back Button */}
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setLocation('/admin')}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-lg border border-gray-200 transition-all"
              style={{ backgroundColor: '#d38a77' }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 mt-16">
            <h1 className="text-2xl font-bold text-gray-900">💰 Guadagni Giornalieri</h1>
            <p className="text-gray-600 mt-1">
              Inserisci il guadagno totale per oggi ({new Date().toLocaleDateString('it-IT')})
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" style={{ color: '#d38a77' }} />
                  Inserimento Guadagni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Importo Totale (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Es: 250.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <p className="text-sm text-gray-500">
                    Inserisci il guadagno totale della giornata (inclusi contanti e pagamenti digitali)
                  </p>
                </div>

                {/* Notes Input */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Note Aggiuntive (opzionale)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Es: 8 clienti, 3 ricostruzioni, 2 gel..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    Puoi aggiungere dettagli sui servizi o note particolari della giornata
                  </p>
                </div>

                {/* Date Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-semibold">{new Date().toLocaleDateString('it-IT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !amount}
                  className="w-full"
                  style={{ backgroundColor: '#d38a77' }}
                >
                  {isSaving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salva Guadagni
                    </>
                  )}
                </Button>

                {/* Quick Tips */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">💡 Suggerimenti</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Inserisci l'importo totale incassato nella giornata</li>
                    <li>• Include sia i pagamenti in contanti che quelli digitali</li>
                    <li>• Puoi modificare l'importo in qualsiasi momento</li>
                    <li>• I dati vengono usati per il calcolo dei guadagni mensili</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}