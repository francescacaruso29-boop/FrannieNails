import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Package, 
  Users, 
  Truck, 
  TrendingUp, 
  Wrench, 
  Fingerprint, 
  Database, 
  FlaskConical, 
  Atom,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

export default function AdminAdvanced() {
  const [activeTab, setActiveTab] = useState("inventory");

  // Mock data per dimostrare le funzionalità
  const inventoryData = {
    products: [
      { name: "Gel Base OPI", stock: 12, minStock: 20, status: "low", autoReorder: true },
      { name: "Smalto Rosa Chanel", stock: 8, minStock: 15, status: "critical", autoReorder: true },
      { name: "Top Coat Essie", stock: 25, minStock: 10, status: "good", autoReorder: false },
      { name: "Lime per unghie", stock: 45, minStock: 30, status: "good", autoReorder: false },
      { name: "Olio cuticole", stock: 5, minStock: 12, status: "critical", autoReorder: true }
    ],
    reorderSuggestions: [
      { product: "Smalto Rosa Chanel", quantity: 20, supplier: "Beauty Dist", cost: "€245", urgency: "high" },
      { product: "Gel Base OPI", quantity: 15, supplier: "Nail Supply Co", cost: "€180", urgency: "medium" }
    ]
  };

  const staffData = {
    schedule: [
      { name: "Frannie", monday: "9-18", tuesday: "9-18", wednesday: "Off", thursday: "9-18", friday: "9-20", efficiency: 95 },
      { name: "Sara", monday: "14-20", tuesday: "Off", wednesday: "9-18", thursday: "14-20", friday: "9-18", efficiency: 88 },
      { name: "Giulia", monday: "Off", tuesday: "9-18", wednesday: "14-20", thursday: "Off", friday: "14-20", efficiency: 92 }
    ],
    optimizationSuggestions: [
      "Giovedì: aggiungere 2 ore a Sara per coprire picco pomeridiano",
      "Venerdì sera: considerare straordinari per Giulia (alta richiesta)",
      "Mercoledì: redistribuire appuntamenti complessi a Frannie"
    ]
  };

  const revenueData = {
    currentMonth: 4250,
    forecast: {
      nextMonth: 4680,
      confidence: 87,
      trend: "up"
    },
    factors: [
      { factor: "Stagionalità autunnale", impact: "+12%" },
      { factor: "Nuovi clienti social", impact: "+8%" },
      { factor: "Aumento prezzi gel", impact: "+5%" }
    ]
  };

  const equipmentData = [
    { name: "Lampada LED 1", status: "good", nextMaintenance: "15 Nov 2025", usage: 78 },
    { name: "Sterilizzatore UV", status: "warning", nextMaintenance: "28 Oct 2025", usage: 92 },
    { name: "Aspiratore vapori", status: "good", nextMaintenance: "10 Dec 2025", usage: 65 },
    { name: "Lampada LED 2", status: "critical", nextMaintenance: "Scaduta", usage: 98 }
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6"
      style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Avanzato</h1>
          <p className="text-gray-600">Sistema di gestione intelligente per Frannie Nails</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-9 w-full">
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Inventory AI</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-1">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Fornitori</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Ricavi</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="biometric" className="flex items-center gap-1">
            <Fingerprint className="w-4 h-4" />
            <span className="hidden sm:inline">Biometric</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-1">
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Research</span>
          </TabsTrigger>
          <TabsTrigger value="chemistry" className="flex items-center gap-1">
            <Atom className="w-4 h-4" />
            <span className="hidden sm:inline">Chemistry</span>
          </TabsTrigger>
        </TabsList>

        {/* Inventory Management AI */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: '#d38a77' }} />
                  Gestione Intelligente Scorte
                </CardTitle>
                <CardDescription>
                  AI predittiva per ottimizzare inventario e riordini automatici
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventoryData.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Stock: {product.stock} / Min: {product.minStock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        product.status === 'critical' ? 'destructive' :
                        product.status === 'low' ? 'secondary' : 'default'
                      }>
                        {product.status === 'critical' ? 'Critico' :
                         product.status === 'low' ? 'Basso' : 'OK'}
                      </Badge>
                      {product.autoReorder && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Auto-riordino
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggerimenti AI Riordini</CardTitle>
                <CardDescription>Raccomandazioni automatiche basate su trend e stagionalità</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventoryData.reorderSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{suggestion.product}</p>
                      <Badge variant={suggestion.urgency === 'high' ? 'destructive' : 'secondary'}>
                        {suggestion.urgency === 'high' ? 'Urgente' : 'Normale'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Qtà: {suggestion.quantity} • Fornitore: {suggestion.supplier} • Costo: {suggestion.cost}
                    </p>
                    <Button size="sm" className="mt-2" style={{ backgroundColor: '#d38a77' }}>
                      Ordina Automaticamente
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Scheduling Optimizer */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: '#d38a77' }} />
                Ottimizzazione Turni Personale
              </CardTitle>
              <CardDescription>
                Algoritmi AI per massimizzare efficienza e soddisfazione staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Staff</th>
                      <th className="text-left p-3">Lunedì</th>
                      <th className="text-left p-3">Martedì</th>
                      <th className="text-left p-3">Mercoledì</th>
                      <th className="text-left p-3">Giovedì</th>
                      <th className="text-left p-3">Venerdì</th>
                      <th className="text-left p-3">Efficienza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.schedule.map((staff, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-medium">{staff.name}</td>
                        <td className="p-3">{staff.monday}</td>
                        <td className="p-3">{staff.tuesday}</td>
                        <td className="p-3">{staff.wednesday}</td>
                        <td className="p-3">{staff.thursday}</td>
                        <td className="p-3">{staff.friday}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Progress value={staff.efficiency} className="w-16" />
                            <span className="text-sm">{staff.efficiency}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Suggerimenti Ottimizzazione AI:</h3>
                <div className="space-y-2">
                  {staffData.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecasting */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: '#d38a77' }} />
                  Previsioni Ricavi AI
                </CardTitle>
                <CardDescription>Machine Learning per predizioni accurate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Ricavi Mese Corrente</p>
                  <p className="text-3xl font-bold" style={{ color: '#d38a77' }}>€{revenueData.currentMonth}</p>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Previsione Prossimo Mese</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Trend {revenueData.forecast.trend === 'up' ? '↗' : '↙'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-semibold text-green-600">€{revenueData.forecast.nextMonth}</p>
                  <p className="text-sm text-gray-500">Confidenza: {revenueData.forecast.confidence}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fattori Impatto AI</CardTitle>
                <CardDescription>Analisi predittiva fattori di crescita</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {revenueData.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <p className="text-sm font-medium">{factor.factor}</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {factor.impact}
                    </Badge>
                  </div>
                ))}
                
                <Button className="w-full mt-4" style={{ backgroundColor: '#d38a77' }}>
                  Genera Report Dettagliato
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipment Maintenance */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" style={{ color: '#d38a77' }} />
                Gestione Manutenzione Attrezzature
              </CardTitle>
              <CardDescription>
                Monitoraggio predittivo e programmazione automatica manutenzioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipmentData.map((equipment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{equipment.name}</p>
                    <p className="text-sm text-gray-600">Prossima manutenzione: {equipment.nextMaintenance}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500">Utilizzo:</p>
                      <Progress value={equipment.usage} className="w-24" />
                      <span className="text-xs">{equipment.usage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {equipment.status === 'good' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {equipment.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {equipment.status === 'critical' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    <Badge variant={
                      equipment.status === 'critical' ? 'destructive' :
                      equipment.status === 'warning' ? 'secondary' : 'default'
                    }>
                      {equipment.status === 'critical' ? 'Critico' :
                       equipment.status === 'warning' ? 'Attenzione' : 'OK'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder per altre tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Fornitori</CardTitle>
              <CardDescription>Sistema integrato gestione ordini e fornitori</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Funzionalità in sviluppo...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric">
          <Card>
            <CardHeader>
              <CardTitle>Autenticazione Biometrica</CardTitle>
              <CardDescription>Sistema sicurezza avanzato con riconoscimento biometrico</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Funzionalità in sviluppo...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Smart Storage System</CardTitle>
              <CardDescription>Sistema stoccaggio intelligente prodotti</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Funzionalità in sviluppo...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>Material Science Research</CardTitle>
              <CardDescription>Ricerca e sviluppo nuovi materiali nail</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Funzionalità in sviluppo...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chemistry">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Chemistry</CardTitle>
              <CardDescription>Formulazioni chimiche personalizzate per ogni cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Funzionalità in sviluppo...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}