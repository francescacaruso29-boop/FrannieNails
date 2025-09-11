import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { 
  ArrowLeft, Euro, TrendingUp, Calendar, BarChart3, 
  Target, Crown, Star, Activity, ChevronRight
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface MonthlyEarning {
  month: string;
  totalEarnings: number;
  appointmentCount: number;
  averagePrice: number;
}

interface ServiceStats {
  service: string;
  count: number;
  totalEarnings: number;
  averagePrice: number;
}

interface EarningsData {
  monthlyData: MonthlyEarning[];
  serviceStats: ServiceStats[];
  totalEarnings: number;
  totalAppointments: number;
  averageMonthlyEarnings: number;
  topService: string;
}

export default function MonthlyEarnings() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Generate years for filter (current year and 2 previous years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => (currentYear - i).toString());

  // Generate months for filter
  const months = [
    { value: 'all', label: 'Tutti i mesi' },
    { value: '01', label: 'Gennaio' },
    { value: '02', label: 'Febbraio' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Aprile' },
    { value: '05', label: 'Maggio' },
    { value: '06', label: 'Giugno' },
    { value: '07', label: 'Luglio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' }
  ];

  // Fetch earnings data
  const { data: earningsData, isLoading } = useQuery<EarningsData>({
    queryKey: [`/api/admin/earnings?year=${selectedYear}${selectedMonth !== 'all' ? `&month=${selectedMonth}` : ''}`]
  });

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMMM yyyy', { locale: it });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.pink.300)_1px,_transparent_0)] bg-[size:24px_24px]"></div>
      </div>

      {/* Hamburger Menu */}
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-lg shadow-purple-100/20">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                💰 Guadagni Mensili
              </h1>
              <p className="text-sm text-purple-600/70 font-medium">Statistiche e analisi finanziarie</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Filters */}
          <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-purple-100/20 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 to-indigo-500/3"></div>
            <CardHeader className="relative pb-4">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-base font-bold text-gray-800">Filtri Periodo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Anno</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Mese</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-green-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
              <CardContent className="relative p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Guadagni Totali</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(earningsData?.totalEarnings || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-blue-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
              <CardContent className="relative p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Appuntamenti</p>
                <p className="text-2xl font-bold text-blue-700">
                  {earningsData?.totalAppointments || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-purple-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
              <CardContent className="relative p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Media Mensile</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(earningsData?.averageMonthlyEarnings || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-orange-100/20 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5"></div>
              <CardContent className="relative p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Servizio Top</p>
                <p className="text-lg font-bold text-orange-700 truncate">
                  {earningsData?.topService || 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-blue-100/20 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3"></div>
            <CardHeader className="relative pb-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-blue-100/30">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Andamento Mensile</h3>
                  <p className="text-sm text-purple-600/70 font-medium">{selectedYear}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-4">
              {earningsData?.monthlyData && earningsData.monthlyData.length > 0 ? (
                <div className="space-y-3">
                  {earningsData.monthlyData.map((monthData) => (
                    <div key={monthData.month} className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-100 hover:bg-white/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{formatMonth(monthData.month)}</p>
                          <p className="text-sm text-gray-600">{monthData.appointmentCount} appuntamenti</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">{formatCurrency(monthData.totalEarnings)}</p>
                        <p className="text-sm text-gray-600">Media: {formatCurrency(monthData.averagePrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nessun dato disponibile per il periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Statistics */}
          <Card className="border-0 bg-white/50 backdrop-blur-xl shadow-xl shadow-pink-100/20 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 to-purple-500/3"></div>
            <CardHeader className="relative pb-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-b border-pink-100/30">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Statistiche Servizi</h3>
                  <p className="text-sm text-purple-600/70 font-medium">Performance per tipo di servizio</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative p-4">
              {earningsData?.serviceStats && earningsData.serviceStats.length > 0 ? (
                <div className="space-y-3">
                  {earningsData.serviceStats.map((service, index) => (
                    <div key={service.service} className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-yellow-700' : 
                            'bg-gradient-to-br from-blue-400 to-purple-500'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{service.service}</p>
                          <p className="text-sm text-gray-600">{service.count} servizi</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">{formatCurrency(service.totalEarnings)}</p>
                        <p className="text-sm text-gray-600">Media: {formatCurrency(service.averagePrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nessuna statistica servizi disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}