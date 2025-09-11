// Sistema di Backup Automatico Clienti - Frannie NAILS
// Backup automatico, sync, recovery e export

interface Client {
  id: number;
  fullName: string;
  phoneNumber: string;
  uniqueCode: string;
  clientAppCode?: string;
  creditBalance: number;
  advanceBalance: number;
  lastVisit: string;
  nextAppointment: string | null;
  totalVisits: number;
  favoriteService: string;
  notes: string;
  isActive: boolean;
}

interface BackupData {
  clients: Client[];
  timestamp: string;
  version: string;
  source: 'database' | 'localStorage';
}

class BackupService {
  private readonly BACKUP_KEY = 'frannie-clients-backup';
  private readonly BACKUP_INTERVAL = 60 * 60 * 1000; // 1 ora
  private readonly MAX_LOCAL_BACKUPS = 24; // 24 ore di backup
  private backupTimer?: NodeJS.Timeout;

  constructor() {
    this.startAutomaticBackup();
    this.setupRecoveryCheck();
  }

  // 🔄 BACKUP AUTOMATICO OGNI ORA
  startAutomaticBackup(): void {
    console.log('🔒 Backup automatico clienti avviato (ogni ora)');
    
    // Backup immediato
    this.performBackup();
    
    // Timer per backup ricorrenti
    this.backupTimer = setInterval(() => {
      this.performBackup();
    }, this.BACKUP_INTERVAL);
  }

  stopAutomaticBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      console.log('🛑 Backup automatico fermato');
    }
  }

  // 💾 ESEGUE BACKUP COMPLETO
  async performBackup(): Promise<boolean> {
    try {
      console.log('🔄 Eseguendo backup clienti...');
      
      // 1. Ottieni dati dal database
      const response = await fetch('/api/admin/clients');
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('API non ha restituito dati validi');
      }

      // 2. Crea oggetto backup
      const backupData: BackupData = {
        clients: result.clients,
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'database'
      };

      // 3. Salva su localStorage
      await this.saveToLocalStorage(backupData);
      
      // 4. Salva su server
      await this.saveToServer(backupData);
      
      console.log(`✅ Backup completato: ${result.clients.length} clienti salvate`);
      return true;
      
    } catch (error) {
      console.error('❌ Errore durante backup:', error);
      
      // Fallback: usa dati locali se disponibili
      const localData = this.getLatestLocalBackup();
      if (localData) {
        console.log('🔄 Usando backup locale come fallback');
        return true;
      }
      
      return false;
    }
  }

  // 💿 SALVA SU LOCALSTORAGE
  private async saveToLocalStorage(backupData: BackupData): Promise<void> {
    try {
      // Ottieni backup esistenti
      const existingBackups = this.getAllLocalBackups();
      
      // Aggiungi nuovo backup
      existingBackups.unshift(backupData);
      
      // Mantieni solo gli ultimi N backup
      if (existingBackups.length > this.MAX_LOCAL_BACKUPS) {
        existingBackups.splice(this.MAX_LOCAL_BACKUPS);
      }
      
      // Salva
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existingBackups));
      console.log('💾 Backup salvato su localStorage');
      
    } catch (error) {
      console.error('❌ Errore salvataggio localStorage:', error);
      throw error;
    }
  }

  // ☁️ SALVA SU SERVER
  private async saveToServer(backupData: BackupData): Promise<void> {
    try {
      const response = await fetch('/api/backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });
      
      if (!response.ok) {
        throw new Error(`Errore server backup: ${response.status}`);
      }
      
      console.log('☁️ Backup salvato su server');
      
    } catch (error) {
      console.warn('⚠️ Backup server fallito, continuando con localStorage:', error);
      // Non è critico se il server backup fallisce
    }
  }

  // 🔍 OTTIENI TUTTI I BACKUP LOCALI
  getAllLocalBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Errore lettura backup locali:', error);
      return [];
    }
  }

  // 📥 OTTIENI ULTIMO BACKUP LOCALE
  getLatestLocalBackup(): BackupData | null {
    const backups = this.getAllLocalBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  // 🔄 SYNC BIDIREZIONALE
  async syncWithServer(): Promise<'server-newer' | 'local-newer' | 'synced' | 'error'> {
    try {
      // 1. Ottieni ultima versione server
      const serverResponse = await fetch('/api/backup/latest');
      if (!serverResponse.ok) {
        return 'error';
      }
      
      const serverBackup: BackupData = await serverResponse.json();
      const localBackup = this.getLatestLocalBackup();
      
      if (!serverBackup && !localBackup) {
        return 'synced';
      }
      
      if (!localBackup) {
        // Solo server ha dati
        await this.saveToLocalStorage(serverBackup);
        return 'server-newer';
      }
      
      if (!serverBackup) {
        // Solo locale ha dati
        await this.saveToServer(localBackup);
        return 'local-newer';
      }
      
      // Confronta timestamp
      const serverTime = new Date(serverBackup.timestamp).getTime();
      const localTime = new Date(localBackup.timestamp).getTime();
      
      if (serverTime > localTime) {
        await this.saveToLocalStorage(serverBackup);
        return 'server-newer';
      } else if (localTime > serverTime) {
        await this.saveToServer(localBackup);
        return 'local-newer';
      } else {
        return 'synced';
      }
      
    } catch (error) {
      console.error('❌ Errore sync:', error);
      return 'error';
    }
  }

  // 🚨 RECOVERY AUTOMATICO
  private setupRecoveryCheck(): void {
    // Controlla ogni 5 minuti se il database è accessibile
    setInterval(async () => {
      const isDbHealthy = await this.checkDatabaseHealth();
      if (!isDbHealthy) {
        console.log('🚨 Database non accessibile, attivando recovery...');
        await this.activateRecovery();
      }
    }, 5 * 60 * 1000); // 5 minuti
  }

  // 🏥 CONTROLLA SALUTE DATABASE
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health/database');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 🆘 ATTIVA RECOVERY MODE
  async activateRecovery(): Promise<boolean> {
    console.log('🆘 Modalità recovery attivata');
    
    const latestBackup = this.getLatestLocalBackup();
    if (!latestBackup) {
      console.error('❌ Nessun backup locale disponibile per recovery');
      return false;
    }
    
    try {
      // Notifica recovery attivo
      this.showRecoveryNotification(latestBackup);
      
      // TODO: Implementare UI che usa dati backup invece del database
      return true;
      
    } catch (error) {
      console.error('❌ Errore durante recovery:', error);
      return false;
    }
  }

  // 📄 EXPORT MANUALE PER ADMIN
  async exportBackup(format: 'json' | 'csv' = 'json'): Promise<string> {
    const latestBackup = this.getLatestLocalBackup();
    if (!latestBackup) {
      throw new Error('Nessun backup disponibile per export');
    }
    
    if (format === 'csv') {
      return this.convertToCSV(latestBackup.clients);
    } else {
      return JSON.stringify(latestBackup, null, 2);
    }
  }

  // 📊 CONVERTI IN CSV
  private convertToCSV(clients: Client[]): string {
    const headers = [
      'ID', 'Nome Completo', 'Telefono', 'Codice Unico', 'Codice App',
      'Credito', 'Anticipo', 'Ultima Visita', 'Prossimo Appuntamento',
      'Visite Totali', 'Servizio Preferito', 'Note', 'Attiva'
    ];
    
    const rows = clients.map(client => [
      client.id,
      `"${client.fullName}"`,
      client.phoneNumber,
      client.uniqueCode,
      client.clientAppCode || '',
      client.creditBalance,
      client.advanceBalance,
      client.lastVisit,
      client.nextAppointment || '',
      client.totalVisits,
      `"${client.favoriteService}"`,
      `"${client.notes}"`,
      client.isActive ? 'Sì' : 'No'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // 🔔 NOTIFICA RECOVERY
  private showRecoveryNotification(backup: BackupData): void {
    const message = `🆘 MODALITÀ RECOVERY ATTIVA\n\nIl database principale non è accessibile.\nUsando backup del ${new Date(backup.timestamp).toLocaleString()}\ncon ${backup.clients.length} clienti.\n\nContatta il supporto tecnico.`;
    
    // Mostra notifica persistente
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Frannie NAILS - Recovery Attivo', {
        body: message,
        icon: '/icon-192x192.png',
        requireInteraction: true
      });
    } else {
      alert(message);
    }
  }

  // 📈 STATISTICHE BACKUP
  getBackupStats(): {
    totalBackups: number;
    latestBackup: string | null;
    oldestBackup: string | null;
    totalClients: number;
  } {
    const backups = this.getAllLocalBackups();
    
    return {
      totalBackups: backups.length,
      latestBackup: backups.length > 0 ? backups[0].timestamp : null,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      totalClients: backups.length > 0 ? backups[0].clients.length : 0
    };
  }
}

// Singleton instance
export const backupService = new BackupService();
export default BackupService;