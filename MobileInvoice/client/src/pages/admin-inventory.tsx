import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Edit, 
  Trash2,
  Search,
  Loader2,
  Palette,
  Wrench,
  FlaskConical,
  Sparkles,
  Home,
  MoreHorizontal
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import backgroundImage from "@assets/8ea4414806c43a94b63a32b38236624f_1757369729149.jpg";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string | null;
  brand: string | null;
  color: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInventory() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    quantity: 0,
    minQuantity: 5,
    price: 0,
    supplier: '',
    brand: '',
    color: '',
    location: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch inventory data from API
  const { data: inventoryResponse, isLoading, error } = useQuery({
    queryKey: ['/api/admin/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inventory');
      return response.json();
    }
  });
  
  const inventoryData = inventoryResponse?.inventory || [];
  
  // Stock update mutation
  const stockUpdateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`/api/admin/inventory/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      toast({ description: 'Scorte aggiornate con successo!' });
    },
    onError: () => {
      toast({ 
        variant: 'destructive',
        description: 'Errore nell\'aggiornamento delle scorte'
      });
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/inventory/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      toast({ description: 'Prodotto eliminato con successo!' });
    },
    onError: () => {
      toast({ 
        variant: 'destructive',
        description: 'Errore nell\'eliminazione del prodotto'
      });
    }
  });
  
  const handleStockChange = (item: InventoryItem, change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    stockUpdateMutation.mutate({ id: item.id, quantity: newQuantity });
  };
  
  const handleDelete = (id: number) => {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      deleteMutation.mutate(id);
    }
  };
  
  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      toast({ description: 'Prodotto creato con successo!' });
      setIsAddDialogOpen(false);
      setNewProduct({
        name: '', category: '', quantity: 0, minQuantity: 5,
        price: 0, supplier: '', brand: '', color: '', location: ''
      });
    },
    onError: () => {
      toast({ 
        variant: 'destructive',
        description: 'Errore nella creazione del prodotto'
      });
    }
  });
  
  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      toast({ 
        variant: 'destructive',
        description: 'Nome e categoria sono obbligatori'
      });
      return;
    }
    
    const productData = {
      ...newProduct,
      price: Math.round(newProduct.price * 100), // Convert to cents
      supplier: newProduct.supplier || undefined,
      brand: newProduct.brand || undefined,
      color: newProduct.color || undefined,
      location: newProduct.location || undefined
    };
    
    createMutation.mutate(productData);
  };
  
  // Edit product mutation
  const editMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await fetch(`/api/admin/inventory/${editingProduct?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      toast({ description: 'Prodotto modificato con successo!' });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    },
    onError: () => {
      toast({ 
        variant: 'destructive',
        description: 'Errore nella modifica del prodotto'
      });
    }
  });
  
  const handleEditProduct = (product: InventoryItem) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateProduct = () => {
    if (!editingProduct?.name || !editingProduct?.category) {
      toast({ 
        variant: 'destructive',
        description: 'Nome e categoria sono obbligatori'
      });
      return;
    }
    
    const productData = {
      name: editingProduct.name,
      category: editingProduct.category,
      quantity: editingProduct.quantity,
      minQuantity: editingProduct.minQuantity,
      price: Math.round((editingProduct.price / 100) * 100), // Keep current price format
      supplier: editingProduct.supplier || undefined,
      brand: editingProduct.brand || undefined,
      color: editingProduct.color || undefined,
      location: editingProduct.location || undefined
    };
    
    editMutation.mutate(productData);
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'smalti': return Palette;
      case 'strumenti': return Wrench;
      case 'prodotti chimici': return FlaskConical;
      case 'decorazioni': return Sparkles;
      default: return Package;
    }
  };
  
  const getCategoryCount = (category: string) => {
    return inventoryData.filter((item: InventoryItem) => item.category === category).length;
  };
  
  const categories: string[] = Array.from(new Set(inventoryData.map((item: InventoryItem) => item.category)));

  // Keep demo data for fallback (commented out)
  /*const inventoryData: InventoryItem[] = [
    {
      id: 1,
      name: 'Smalto Gel Base',
      category: 'Smalti',
      currentStock: 12,
      minStock: 5,
      unitPrice: 15.50,
      supplier: 'Beauty Supply Co.',
      lastRestocked: '2025-08-10'
    },
    {
      id: 2,
      name: 'Top Coat',
      category: 'Smalti',
      currentStock: 3,
      minStock: 8,
      unitPrice: 18.00,
      supplier: 'Nail Pro Ltd.',
      lastRestocked: '2025-08-05'
    },
    {
      id: 3,
      name: 'Lima Professionale',
      category: 'Strumenti',
      currentStock: 25,
      minStock: 10,
      unitPrice: 3.50,
      supplier: 'Tools Italia',
      lastRestocked: '2025-08-12'
    },
    {
      id: 4,
      name: 'Acetone',
      category: 'Prodotti Chimici',
      currentStock: 2,
      minStock: 4,
      unitPrice: 8.90,
      supplier: 'Chemical Supply',
      lastRestocked: '2025-07-28'
    },
    {
      id: 5,
      name: 'Decorazioni Natalizie',
      category: 'Decorazioni',
      currentStock: 45,
      minStock: 20,
      unitPrice: 2.30,
      supplier: 'Deco Magic',
      lastRestocked: '2025-08-15'
    }*/
  // ];*/
  
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Caricamento inventario...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Errore nel caricamento dell'inventario</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] })}
            className="mt-4"
          >
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  let filteredItems = inventoryData.filter((item: InventoryItem) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter for low stock if enabled
  if (showLowStockOnly) {
    filteredItems = filteredItems.filter((item: InventoryItem) => item.quantity <= 3);
  }

  const lowStockItems = inventoryData.filter((item: InventoryItem) => item.quantity <= 3);
  const totalValue = inventoryData.reduce((sum: number, item: InventoryItem) => sum + (item.quantity * (item.price / 100)), 0);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 3) return 'low';
    if (item.quantity <= 6) return 'medium';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Inventario</h1>
          <p className="text-sm text-gray-600">Il Mio Salone</p>
        </div>

        {/* Search Bar - Prominente in alto */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <input
              type="text"
              placeholder="🔍 Cerca prodotti, categorie, marche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-gray-600 mt-2 pl-2">
              {filteredItems.length} risultati per "{searchTerm}"
            </p>
          )}
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg col-span-2">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">€ {totalValue.toLocaleString('it-IT', { minimumFractionDigits: 0 })}</p>
                  <p className="text-xs text-gray-600">Valore Totale</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{inventoryData.length}</p>
                  <p className="text-xs text-gray-600">Articoli</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${
              showLowStockOnly 
                ? 'bg-red-100 border-red-200 shadow-lg' 
                : lowStockItems.length > 0 
                  ? 'bg-red-50 hover:bg-red-100 border-red-200 shadow-lg' 
                  : 'bg-green-50 border-green-200 shadow-lg'
            }`}
            onClick={() => {
              setShowLowStockOnly(!showLowStockOnly);
              setSelectedCategory(null); // Return to categories view
            }}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <p className={`text-lg font-bold ${
                  lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'
                }`}>{lowStockItems.length}</p>
                <p className="text-xs text-gray-600">Scorte Basse</p>
                {showLowStockOnly && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Filtro attivo
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-6">
          <div className="p-4">
            {selectedCategory ? (
              // Product List for Selected Category
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="h-8 px-2"
                  >
                    ← Indietro
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      {(() => {
                        const IconComponent = getCategoryIcon(selectedCategory);
                        return <IconComponent className="h-5 w-5 text-gray-700" />;
                      })()}
                    </div>
                    <h2 className="font-semibold text-gray-900">{selectedCategory}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryCount(selectedCategory)} prodotti
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {inventoryData
                    .filter((item: InventoryItem) => item.category === selectedCategory)
                    .filter((item: InventoryItem) => showLowStockOnly ? item.quantity <= 3 : true)
                    .filter((item: InventoryItem) =>
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.location?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item: InventoryItem) => {
                      const status = getStockStatus(item);
                      return (
                        <div key={item.id} className="p-4 bg-white/60 backdrop-blur-sm rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <Badge className={`${getStatusColor(status)} text-xs`}>
                              {status === 'low' && 'Basso'}
                              {status === 'medium' && 'Med'}
                              {status === 'good' && 'OK'}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600 mb-3">
                            <span>{item.brand || 'Senza marca'}</span>
                            <span>€{(item.price / 100).toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0"
                                onClick={() => handleStockChange(item, -1)}
                                disabled={stockUpdateMutation.isPending}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0"
                                onClick={() => handleStockChange(item, 1)}
                                disabled={stockUpdateMutation.isPending}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditProduct(item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {inventoryData.filter((item: InventoryItem) => item.category === selectedCategory).length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nessun prodotto in questa categoria</p>
                  </div>
                )}
              </div>
            ) : (
              // Categories Grid
              <div className="space-y-3">
                {categories.map((category: string) => {
                  const IconComponent = getCategoryIcon(category);
                  const count = getCategoryCount(category);
                  const categoryLowStock = inventoryData.filter((item: InventoryItem) => 
                    item.category === category && item.quantity <= 3
                  ).length;
                  
                  return (
                    <div 
                      key={category} 
                      className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{category}</h3>
                          <p className="text-sm text-gray-600">{count} articoli</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryLowStock > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {categoryLowStock} bassi
                          </Badge>
                        )}
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Add Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg z-50"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md max-h-[75vh] overflow-y-auto bg-white p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-medium text-gray-800">Nuovo Prodotto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <div>
              <Label htmlFor="name" className="text-xs text-gray-600">Nome *</Label>
              <Input 
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Smalto Gel Base"
                className="h-8 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="category" className="text-xs text-gray-600">Categoria *</Label>
                <Select onValueChange={(value) => {
                  if (value === 'custom') return;
                  setNewProduct({...newProduct, category: value});
                }}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Smalti">Smalti</SelectItem>
                    <SelectItem value="Strumenti">Strumenti</SelectItem>
                    <SelectItem value="Prodotti Chimici">Prodotti Chimici</SelectItem>
                    <SelectItem value="Decorazioni">Decorazioni</SelectItem>
                    <SelectItem value="custom">+ Nuova</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  placeholder="Nuova categoria"
                  className="h-7 text-xs border-dashed mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="brand" className="text-xs text-gray-600">Brand</Label>
                <Input 
                  id="brand"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  placeholder="OPI"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <Label htmlFor="quantity" className="text-xs text-gray-600">Qta</Label>
                <Input 
                  id="quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-xs text-gray-600">Prezzo €</Label>
                <Input 
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-xs text-gray-600">Posto</Label>
                <Input 
                  id="location"
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                  placeholder="A1"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="supplier" className="text-xs text-gray-600">Fornitore</Label>
                <Input 
                  id="supplier"
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                  placeholder="Beauty Supply"
                  className="h-8 text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="color" className="text-xs text-gray-600">Colore</Label>
                <Input 
                  id="color"
                  value={newProduct.color}
                  onChange={(e) => setNewProduct({...newProduct, color: e.target.value})}
                  placeholder="Rosa"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 h-8 text-xs"
                size="sm"
              >
                Annulla
              </Button>
              <Button 
                onClick={handleCreateProduct}
                disabled={createMutation.isPending}
                className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                size="sm"
              >
                {createMutation.isPending ? 'Creazione...' : 'Crea'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[75vh] overflow-y-auto bg-white p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-medium text-gray-800">Modifica Prodotto</DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nome Prodotto *</Label>
                <Input 
                  id="editName"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Categoria *</Label>
                  <div className="space-y-2">
                    <Select 
                      value={categories.includes(editingProduct.category) ? editingProduct.category : 'custom'} 
                      onValueChange={(value) => {
                        if (value !== 'custom') {
                          setEditingProduct({...editingProduct, category: value});
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Smalti">Smalti</SelectItem>
                        <SelectItem value="Strumenti">Strumenti</SelectItem>
                        <SelectItem value="Prodotti Chimici">Prodotti Chimici</SelectItem>
                        <SelectItem value="Decorazioni">Decorazioni</SelectItem>
                        <SelectItem value="custom">➕ Categoria personalizzata</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      placeholder="Nome categoria personalizzata..."
                      className="border-dashed border-2 border-blue-200 focus:border-blue-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editBrand">Brand</Label>
                  <Input 
                    id="editBrand"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="editQuantity">Quantità</Label>
                  <Input 
                    id="editQuantity"
                    type="number"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Prezzo (€)</Label>
                  <Input 
                    id="editPrice"
                    type="number"
                    step="0.01"
                    value={(editingProduct.price / 100).toFixed(2)}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Math.round((parseFloat(e.target.value) || 0) * 100)})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editSupplier">Fornitore</Label>
                <Input 
                  id="editSupplier"
                  value={editingProduct.supplier || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, supplier: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="editColor">Colore</Label>
                  <Input 
                    id="editColor"
                    value={editingProduct.color || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, color: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Posizione</Label>
                  <Input 
                    id="editLocation"
                    value={editingProduct.location || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, location: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={handleUpdateProduct}
                  disabled={editMutation.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {editMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}