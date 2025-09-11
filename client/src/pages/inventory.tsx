import { useState, useEffect } from "react";
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Filter, Barcode, Calendar, MapPin, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Inventory {
  id: number;
  name: string;
  category: string;
  brand?: string;
  color?: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier?: string;
  barcode?: string;
  expiryDate?: string;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  "Smalti",
  "Gel",
  "Strumenti",
  "Lima e Buffer",
  "Decorazioni",
  "Cura Unghie",
  "Pulizia",
  "Materiali",
  "Altro"
];

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    color: "",
    quantity: 0,
    minQuantity: 5,
    price: 0,
    supplier: "",
    barcode: "",
    expiryDate: "",
    location: "",
    notes: ""
  });

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/inventory');
        const result = await response.json();
        return result.success ? result.items : [];
      } catch (error) {
        console.error('Errore nel caricamento inventario:', error);
        // Return sample data for development
        return [
          {
            id: 1,
            name: "Smalto Rosso Classico",
            category: "Smalti",
            brand: "OPI",
            color: "Rosso",
            quantity: 15,
            minQuantity: 5,
            price: 1200, // €12.00 in cents
            supplier: "Beauty Supply Co.",
            barcode: "123456789",
            expiryDate: "2025-12-31",
            location: "Scaffale A",
            notes: "Colore molto richiesto",
            isActive: true,
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01"
          },
          {
            id: 2,
            name: "Gel Costruttore Trasparente",
            category: "Gel",
            brand: "Alessandro",
            quantity: 3,
            minQuantity: 5,
            price: 2500,
            supplier: "Professional Nails",
            location: "Scaffale B",
            notes: "Scorte basse - riordinare",
            isActive: true,
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01"
          },
          {
            id: 3,
            name: "Lima Unghie Professionale",
            category: "Strumenti",
            brand: "Kiepe",
            quantity: 25,
            minQuantity: 10,
            price: 350,
            supplier: "Tools Pro",
            location: "Cassetto 1",
            isActive: true,
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01"
          }
        ];
      }
    }
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/inventory", {
        ...data,
        price: Math.round(data.price * 100), // Convert to cents
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Prodotto aggiunto! ✅",
        description: "Il nuovo prodotto è stato aggiunto all'inventario",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il prodotto",
        variant: "destructive"
      });
    }
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/inventory/${data.id}`, {
        ...data.updates,
        price: data.updates.price ? Math.round(data.updates.price * 100) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setEditingItem(null);
      resetForm();
      toast({
        title: "Prodotto aggiornato! ✅",
        description: "Le modifiche sono state salvate",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il prodotto",
        variant: "destructive"
      });
    }
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/inventory/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Prodotto eliminato",
        description: "Il prodotto è stato rimosso dall'inventario",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il prodotto",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      brand: "",
      color: "",
      quantity: 0,
      minQuantity: 5,
      price: 0,
      supplier: "",
      barcode: "",
      expiryDate: "",
      location: "",
      notes: ""
    });
  };

  const handleEdit = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand || "",
      color: item.color || "",
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      price: item.price / 100, // Convert from cents
      supplier: item.supplier || "",
      barcode: item.barcode || "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "",
      location: item.location || "",
      notes: item.notes || ""
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Errore",
        description: "Nome e categoria sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, updates: formData });
    } else {
      addItemMutation.mutate(formData);
    }
  };

  // Filter items based on search and category
  const filteredItems = inventoryItems.filter((item: Inventory) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const lowStockItems = inventoryItems.filter((item: Inventory) => item.quantity <= item.minQuantity);
  const totalValue = inventoryItems.reduce((sum: number, item: Inventory) => sum + (item.quantity * item.price), 0);
  const categoryStats = inventoryItems.reduce((acc: Record<string, number>, item: Inventory) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen relative overflow-hidden"
         style={{
           background: "linear-gradient(135deg, #f8f0ef 0%, #edd5d2 30%, #e4c0bb 60%, #d38a77 100%)"
         }}>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-16 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-32 left-1/4 w-2 h-2 bg-white/25 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-white/20 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-40 left-12 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-300"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between py-6 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/admin-dashboard-modern")}
            className="p-2 hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Inventario</h1>
            <p className="text-white/90 text-lg">Gestione Prodotti del Salone ✨</p>
          </div>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        {/* Add Product Button */}
        <div className="flex justify-center mb-6">
          <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingItem(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-white/95 hover:bg-white text-gray-800 font-semibold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/50"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-5 h-5 mr-3" />
                Aggiungi Nuovo Prodotto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Modifica Prodotto' : 'Aggiungi Nuovo Prodotto'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Prodotto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome del prodotto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Marca del prodotto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Colore</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="Colore (per smalti)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantità</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Quantità Minima</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({...formData, minQuantity: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornitore</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Nome fornitore"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="barcode">Codice a Barre</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Codice a barre"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Data Scadenza</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Posizione</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Dove si trova nel salone"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Note aggiuntive..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setEditingItem(null);
                  resetForm();
                }}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="text-white"
                  style={{ backgroundColor: '#d38a77' }}
                  disabled={addItemMutation.isPending || updateItemMutation.isPending}
                >
                  {editingItem ? 'Aggiorna' : 'Aggiungi'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>


        {/* Statistics Cards */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Products */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-xl border border-white/50">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: '#6366f1' }}>
                {inventoryItems.length}
              </p>
              <p className="text-gray-600 text-sm font-medium">Prodotti Totali</p>
            </div>

            {/* Low Stock */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-xl border border-white/50">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}>
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: '#ef4444' }}>
                {lowStockItems.length}
              </p>
              <p className="text-gray-600 text-sm font-medium">Scorte Basse</p>
            </div>

            {/* Categories */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-xl border border-white/50">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: '#10b981' }}>
                {Object.keys(categoryStats).length}
              </p>
              <p className="text-gray-600 text-sm font-medium">Categorie</p>
            </div>

            {/* Total Value */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 text-center shadow-xl border border-white/50">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #d38a77 0%, #b8735f 100%)" }}>
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: '#d38a77' }}>
                €{(totalValue / 100).toFixed(0)}
              </p>
              <p className="text-gray-600 text-sm font-medium">Valore Totale</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-4 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Cerca prodotti, marche, colori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 rounded-2xl bg-white/80 focus:border-pink-300 transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-500" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 h-12 border-2 border-gray-200 rounded-2xl bg-white/80">
                    <SelectValue placeholder="Filtra per categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="px-4 mb-8">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-800">Allerta Scorte Basse</h3>
                  <p className="text-red-600">Prodotti che necessitano riordino</p>
                </div>
              </div>
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item: Inventory) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-red-100">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category} • {item.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-bold">
                        {item.quantity} / {item.minQuantity} min
                      </p>
                      <p className="text-xs text-gray-500">Riordina ora</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div className="text-center p-3 bg-red-100/50 rounded-2xl">
                    <p className="text-sm text-red-700 font-medium">
                      +{lowStockItems.length - 5} altri prodotti necessitano riordino
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Items */}
        <div className="px-4 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ background: "linear-gradient(135deg, #d38a77 0%, #b8735f 100%)" }}>
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Prodotti del Salone</h3>
                    <p className="text-gray-600">Totale: {filteredItems.length} prodotti</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse"
                       style={{ background: "linear-gradient(135deg, #d38a77 0%, #b8735f 100%)" }}>
                  </div>
                  <p className="text-gray-600 font-medium">Caricamento inventario...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-gray-100">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun prodotto trovato</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || selectedCategory !== "all" 
                      ? "Prova a modificare i filtri di ricerca"
                      : "Inizia aggiungendo il primo prodotto al tuo inventario"
                    }
                  </p>
                  {!searchQuery && selectedCategory === "all" && (
                    <Button 
                      className="bg-gradient-to-r text-white font-semibold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ background: "linear-gradient(135deg, #d38a77 0%, #b8735f 100%)" }}
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Aggiungi il primo prodotto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item: Inventory) => (
                    <div key={item.id} 
                         className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 border-2 border-gray-100 hover:border-pink-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      
                      {/* Product Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-2">{item.name}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                                  style={{ background: "linear-gradient(135deg, #d38a77 0%, #b8735f 100%)" }}>
                              {item.category}
                            </span>
                            {item.quantity <= item.minQuantity && (
                              <span className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full animate-pulse">
                                Scorte basse
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="p-2 h-9 w-9 rounded-full hover:bg-blue-100 text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            className="p-2 h-9 w-9 rounded-full hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="space-y-3">
                        {item.brand && (
                          <div className="flex items-center gap-3">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">{item.brand}</span>
                            {item.color && (
                              <span className="text-gray-500">• {item.color}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1">Quantità</p>
                            <p className={`text-xl font-bold ${
                              item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-800'
                            }`}>
                              {item.quantity}
                            </p>
                          </div>
                          
                          <div className="text-center p-3 bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1">Prezzo</p>
                            <p className="text-xl font-bold text-gray-800">
                              €{(item.price / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {item.location && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-800 font-medium">{item.location}</span>
                          </div>
                        )}
                        
                        {item.expiryDate && (
                          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-2xl">
                            <Calendar className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-800 font-medium">
                              Scade: {new Date(item.expiryDate).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        )}
                        
                        {item.barcode && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <Barcode className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700 font-mono text-sm">{item.barcode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}