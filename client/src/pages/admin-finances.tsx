import { useState, useEffect } from 'react';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Eye,
  Download
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

interface Transaction {
  id: number;
  clientName: string;
  type: 'payment' | 'credit' | 'advance' | 'refund';
  amount: number;
  service: string;
  date: Date;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
}



interface FinancialStats {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalCredits: number;
  totalAdvances: number;
  pendingPayments: number;
}

export default function AdminFinances() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stats, setStats] = useState<FinancialStats>({
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalCredits: 0,
    totalAdvances: 0,
    pendingPayments: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);


  useEffect(() => {
    // Simulate loading financial data
    setTimeout(() => {
      setStats({
        dailyRevenue: 285,
        weeklyRevenue: 1420,
        monthlyRevenue: 5680,
        totalCredits: 450,
        totalAdvances: 230,
        pendingPayments: 180
      });

      setTransactions([
        {
          id: 1,
          clientName: 'Maria Rossi',
          type: 'payment',
          amount: 25,
          service: 'Gel',
          date: new Date(),
          status: 'completed'
        },
        {
          id: 2,
          clientName: 'Giulia Bianchi',
          type: 'credit',
          amount: 50,
          service: 'Credito aggiunto',
          date: subDays(new Date(), 1),
          status: 'completed'
        },
        {
          id: 3,
          clientName: 'Anna Verde',
          type: 'advance',
          amount: 30,
          service: 'Anticipo Ricostruzione',
          date: subDays(new Date(), 2),
          status: 'pending'
        },
        {
          id: 4,
          clientName: 'Laura Blu',
          type: 'payment',
          amount: 35,
          service: 'Laminazione Ciglia',
          date: subDays(new Date(), 3),
          status: 'completed'
        },
        {
          id: 5,
          clientName: 'Sara Neri',
          type: 'payment',
          amount: 15,
          service: 'Semipermanente',
          date: subDays(new Date(), 4),
          status: 'overdue'
        }
      ]);


    }, 1000);
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'credit':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'advance':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'refund':
        return <Minus className="w-4 h-4 text-red-500" />;
      default:
        return <Euro className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-green-600';
      case 'credit':
        return 'text-blue-600';
      case 'advance':
        return 'text-yellow-600';
      case 'refund':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'payment':
        return 'Pagamento';
      case 'credit':
        return 'Credito';
      case 'advance':
        return 'Anticipo';
      case 'refund':
        return 'Rimborso';
      default:
        return 'Transazione';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completato';
      case 'pending':
        return 'In Attesa';
      case 'overdue':
        return 'Scaduto';
      default:
        return 'Sconosciuto';
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/attached_assets/c87437e112fda59c5e94f3946e727529_1754849552662.jpg)` }}
      >
        <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
        
        <div className="pl-6 pr-6 py-4">
          {/* Header */}
          <div className="mb-6 mt-16">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Finanziaria</h1>
            <p className="text-gray-600 mt-1">Monitora guadagni, crediti e anticipi clienti</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-green-500">
                    <Euro className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Oggi</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.dailyRevenue}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-blue-500">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Settimana</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.weeklyRevenue}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-purple-500">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Mese</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.monthlyRevenue}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-yellow-500">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Crediti</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.totalCredits}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-cyan-50 to-teal-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-cyan-500">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Anticipi</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.totalAdvances}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-red-500">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">In Attesa</p>
                  <p className="text-xl font-bold text-gray-900">€{stats.pendingPayments}</p>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'overview'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ backgroundColor: selectedTab === 'overview' ? '#d38a77' : 'transparent' }}
            >
              Panoramica
            </button>
            <button
              onClick={() => setSelectedTab('transactions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === 'transactions'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ backgroundColor: selectedTab === 'transactions' ? '#d38a77' : 'transparent' }}
            >
              Transazioni
            </button>

          </div>

          {/* Content based on selected tab */}
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: '#d38a77' }} />
                    Andamento Ricavi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">Ricavi Completati</p>
                        <p className="text-2xl font-bold text-green-900">€{stats.monthlyRevenue}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Pagamenti in Attesa</p>
                        <p className="text-2xl font-bold text-yellow-900">€{stats.pendingPayments}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Crediti Attivi</p>
                        <p className="text-2xl font-bold text-blue-900">€{stats.totalCredits}</p>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" style={{ color: '#d38a77' }} />
                    Situazione Finanziaria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-2">Riepilogo Totale</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ricavi Mese:</span>
                          <span className="font-bold text-green-600">+€{stats.monthlyRevenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Crediti da Restituire:</span>
                          <span className="font-bold text-blue-600">-€{stats.totalCredits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Anticipi Ricevuti:</span>
                          <span className="font-bold text-cyan-600">+€{stats.totalAdvances}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium text-gray-800">Netto Disponibile:</span>
                          <span className="font-bold text-lg" style={{ color: '#d38a77' }}>
                            €{stats.monthlyRevenue - stats.totalCredits + stats.totalAdvances}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full" style={{ backgroundColor: '#d38a77' }}>
                      <Download className="w-4 h-4 mr-2" />
                      Esporta Report Mensile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === 'transactions' && (
            <Card className="rounded-xl shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" style={{ color: '#d38a77' }} />
                  Transazioni Recenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.clientName}</span>
                            <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                              {getStatusLabel(transaction.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{transaction.service}</p>
                          <p className="text-xs text-gray-500">
                            {format(transaction.date, 'dd MMM yyyy HH:mm', { locale: it })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'refund' ? '-' : '+'}€{transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getTransactionTypeLabel(transaction.type)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </ProtectedRoute>
  );
}