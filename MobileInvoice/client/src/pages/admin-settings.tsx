import { useState } from 'react';
import { useLocation } from 'wouter';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  User,
  Clock,
  Euro,
  Save
} from 'lucide-react';

export default function AdminSettings() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState({
    salonName: 'Frannie Nails',
    phoneNumber: '+39 123 456 7890',
    address: 'Via Roma 123, Milano',
    openTime: '09:00',
    closeTime: '18:00',
    prices: {
      gel: 25,
      semipermanente: 15,
      ricostruzione: 45,
      piedi: 20,
      epilazione: 15,
      ceretta: 30,
      ciglia: 35,
      trucco: 25
    }
  });

  const handleSave = () => {
    alert('Impostazioni salvate!');
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)" }}
    >
      {/* Decorative pattern overlay for depth */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 rounded-full bg-white/15 blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-white/25 blur-lg"></div>
      </div>
      
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="pl-6 pr-6 py-6 relative z-10">
        {/* Header */}
        <div className="mb-8 mt-8">
          <h1 className="text-3xl font-bold text-white mb-2">Impostazioni</h1>
          <p className="text-white/80">Modifica le informazioni base del salone.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Salon Info */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" style={{ color: '#d38a77' }} />
                Informazioni Salone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salonName" className="text-sm font-medium">Nome Salone</Label>
                  <Input
                    id="salonName"
                    value={settings.salonName}
                    onChange={(e) => setSettings(prev => ({ ...prev, salonName: e.target.value }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">Telefono</Label>
                  <Input
                    id="phoneNumber"
                    value={settings.phoneNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-sm font-medium">Indirizzo</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="rounded-lg mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" style={{ color: '#d38a77' }} />
                Orari di Lavoro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openTime" className="text-sm font-medium">Apertura</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={settings.openTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, openTime: e.target.value }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="closeTime" className="text-sm font-medium">Chiusura</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={settings.closeTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, closeTime: e.target.value }))}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="w-5 h-5" style={{ color: '#d38a77' }} />
                Prezzi Servizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Gel</Label>
                  <Input
                    type="number"
                    value={settings.prices.gel}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, gel: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Semipermanente</Label>
                  <Input
                    type="number"
                    value={settings.prices.semipermanente}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, semipermanente: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Ricostruzione</Label>
                  <Input
                    type="number"
                    value={settings.prices.ricostruzione}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, ricostruzione: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Piedi</Label>
                  <Input
                    type="number"
                    value={settings.prices.piedi}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, piedi: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Epilazione</Label>
                  <Input
                    type="number"
                    value={settings.prices.epilazione}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, epilazione: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Ceretta</Label>
                  <Input
                    type="number"
                    value={settings.prices.ceretta}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, ceretta: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Ciglia</Label>
                  <Input
                    type="number"
                    value={settings.prices.ciglia}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, ciglia: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Trucco</Label>
                  <Input
                    type="number"
                    value={settings.prices.trucco}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      prices: { ...prev.prices, trucco: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-lg mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSave}
              className="px-8 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#d38a77' }}
            >
              <Save className="w-4 h-4 mr-2" />
              Salva Impostazioni
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}