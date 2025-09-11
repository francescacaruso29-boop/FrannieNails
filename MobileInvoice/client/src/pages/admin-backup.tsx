import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Cloud,
  RotateCw,
  ArrowLeft
} from 'lucide-react';
import { AdminHamburgerMenu } from '@/components/admin-hamburger-menu';
import { backupService } from '@/lib/backup-service';

interface BackupInfo {
  totalBackups: number;
  latestBackup: string | null;
  oldestBackup: string | null;
  totalClients: number;
}

interface ServerBackup {
  fileName: string;
  timestamp: string;
  clientsCount: number;
  fileSize: number;
  source: string;
}

export default function AdminBackup() {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  // 📊 Carica statistiche backup
  useEffect(() => {
    loadBackupInfo();
    loadServerBackups();
  }, []);

  const loadBackupInfo = () => {
    try {
      const info = backupService.getBackupStats();
      setBackupInfo(info);
    } catch (error) {
      console.error('Errore caricamento info backup:', error);
    }
  };

  const loadServerBackups = async () => {
    try {
      const response = await fetch('/api/backup/list');
      if (response.ok) {
        const data = await response.json();
        setServerBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Errore caricamento backup server:', error);
    }
  };

  // 🔄 Backup manuale
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const success = await backupService.performBackup();
      if (success) {
        toast({
          title: "Backup Completato",
          description: "Backup delle clienti eseguito con successo",
        });
        loadBackupInfo();
        loadServerBackups();
      } else {
        throw new Error('Backup fallito');
      }
    } catch (error) {
      toast({
        title: "Errore Backup",
        description: "Errore durante il backup delle clienti",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 🔄 Sync manuale
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await backupService.syncWithServer();
      
      const messages = {
        'server-newer': 'Dati aggiornati dal server',
        'local-newer': 'Dati locali sincronizzati sul server', 
        'synced': 'Dati già sincronizzati',
        'error': 'Errore durante la sincronizzazione'
      };
      
      setLastSyncStatus(messages[result]);
      
      if (result !== 'error') {
        toast({
          title: "Sync Completata",
          description: messages[result],
        });
        loadBackupInfo();
        loadServerBackups();
      } else {
        throw new Error('Sync fallita');
      }
    } catch (error) {
      toast({
        title: "Errore Sync",
        description: "Errore durante la sincronizzazione",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 📥 Export backup
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const data = await backupService.exportBackup(format);
      
      // Crea e scarica file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frannie-backup-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Completato",
        description: `Backup esportato come ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Errore Export",
        description: "Errore durante l'export del backup",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 via-purple-100/20 to-indigo-100/20"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
      
      {/* Hamburger Menu */}
      <AdminHamburgerMenu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔒 Sistema Backup Avanzato
          </h1>
          <p className="text-lg text-purple-600/80 font-medium max-w-2xl mx-auto">
            Gestione intelligente, sincronizzazione cloud e recovery automatico dei dati clienti
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Sistema attivo</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl shadow-indigo-100/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-gray-700">Backup Locali</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gray-800 mb-1">{backupInfo?.totalBackups || 0}</div>
              <p className="text-sm text-indigo-600/70 font-medium">
                Ultimi 24 backup
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl shadow-purple-100/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-gray-700">Clienti Salvate</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gray-800 mb-1">{backupInfo?.totalClients || 0}</div>
              <p className="text-sm text-purple-600/70 font-medium">
                Nell'ultimo backup
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl shadow-pink-100/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-gray-700">Backup Server</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-gray-800 mb-1">{serverBackups.length}</div>
              <p className="text-sm text-pink-600/70 font-medium">
                Backup remoti
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl shadow-emerald-100/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-bold text-gray-700">Ultimo Backup</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {backupInfo?.latestBackup 
                  ? new Date(backupInfo.latestBackup).toLocaleString('it-IT', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : 'Nessuno'
                }
              </div>
              <p className="text-sm text-emerald-600/70 font-medium">
                {backupInfo?.latestBackup 
                  ? Math.round((Date.now() - new Date(backupInfo.latestBackup).getTime()) / (1000 * 60)) + ' minuti fa'
                  : 'Mai eseguito'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5" />
              Azioni Backup
            </CardTitle>
            <CardDescription>
              Gestisci backup, sincronizzazione e export dati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleManualBackup}
                disabled={isBackingUp}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {isBackingUp ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Backup Manuale
              </Button>

              <Button 
                onClick={handleManualSync}
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Sincronizza
              </Button>

              <Button 
                onClick={() => handleExport('json')}
                disabled={isExporting}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>

              <Button 
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {lastSyncStatus && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ultima sincronizzazione: {lastSyncStatus}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Status Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Backup Automatico</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                ✅ Attivo (ogni ora)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Recovery System</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                ✅ Attivo (check ogni 5min)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Backup Locali</span>
              <Badge variant="outline">
                {backupInfo?.totalBackups || 0}/24 slot
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista Backup Server */}
        {serverBackups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Backup Server ({serverBackups.length})
              </CardTitle>
              <CardDescription>
                Backup salvati sul server remoto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {serverBackups.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {new Date(backup.timestamp).toLocaleString('it-IT')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {backup.clientsCount} clienti • {Math.round(backup.fileSize / 1024)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {backup.source}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Sistema */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Sistema di Backup Automatico Attivo:</strong><br/>
            • Backup automatico ogni ora delle clienti dal database<br/>
            • Sincronizzazione bidirezionale localStorage ↔ server<br/>
            • Recovery automatico in caso di problemi database<br/>
            • Export manuale per sicurezza aggiuntiva
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}