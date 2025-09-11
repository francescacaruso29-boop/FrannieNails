// API Routes per Backup System - Frannie NAILS
import type { Express } from 'express';
import fs from 'fs/promises';
import path from 'path';

interface BackupData {
  clients: any[];
  timestamp: string;
  version: string;
  source: 'database' | 'localStorage';
}

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE_PREFIX = 'clients-backup-';

// Assicura che la directory backup esista
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

export function registerBackupRoutes(app: Express): void {
  
  // 💾 SALVA BACKUP SU SERVER
  app.post('/api/backup/save', async (req, res) => {
    try {
      const backupData: BackupData = req.body;
      
      if (!backupData || !backupData.clients || !backupData.timestamp) {
        return res.status(400).json({
          success: false,
          message: 'Dati backup non validi'
        });
      }
      
      await ensureBackupDir();
      
      // Nome file con timestamp
      const timestamp = new Date(backupData.timestamp);
      const fileName = `${BACKUP_FILE_PREFIX}${timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
      const filePath = path.join(BACKUP_DIR, fileName);
      
      // Salva file
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');
      
      console.log(`💾 Backup salvato: ${fileName}`);
      
      // Pulizia backup vecchi (mantieni ultimi 48)
      await cleanOldBackups();
      
      res.json({
        success: true,
        message: 'Backup salvato con successo',
        fileName,
        clientsCount: backupData.clients.length
      });
      
    } catch (error) {
      console.error('❌ Errore salvataggio backup:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno durante salvataggio backup'
      });
    }
  });

  // 📥 OTTIENI ULTIMO BACKUP
  app.get('/api/backup/latest', async (req, res) => {
    try {
      await ensureBackupDir();
      
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files
        .filter(file => file.startsWith(BACKUP_FILE_PREFIX) && file.endsWith('.json'))
        .sort()
        .reverse(); // Più recente per primo
      
      if (backupFiles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nessun backup trovato'
        });
      }
      
      // Leggi il backup più recente
      const latestFile = backupFiles[0];
      const filePath = path.join(BACKUP_DIR, latestFile);
      const backupContent = await fs.readFile(filePath, 'utf8');
      const backupData: BackupData = JSON.parse(backupContent);
      
      res.json(backupData);
      
    } catch (error) {
      console.error('❌ Errore lettura backup:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno durante lettura backup'
      });
    }
  });

  // 📋 LISTA TUTTI I BACKUP
  app.get('/api/backup/list', async (req, res) => {
    try {
      await ensureBackupDir();
      
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files
        .filter(file => file.startsWith(BACKUP_FILE_PREFIX) && file.endsWith('.json'))
        .sort()
        .reverse();
      
      const backupList = await Promise.all(
        backupFiles.map(async (fileName) => {
          try {
            const filePath = path.join(BACKUP_DIR, fileName);
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const data: BackupData = JSON.parse(content);
            
            return {
              fileName,
              timestamp: data.timestamp,
              clientsCount: data.clients.length,
              fileSize: stats.size,
              source: data.source
            };
          } catch (error) {
            console.warn(`⚠️ Errore lettura backup ${fileName}:`, error);
            return null;
          }
        })
      );
      
      res.json({
        success: true,
        backups: backupList.filter(backup => backup !== null)
      });
      
    } catch (error) {
      console.error('❌ Errore lista backup:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno durante lista backup'
      });
    }
  });

  // 🔄 RESTORE DA BACKUP SPECIFICO
  app.post('/api/backup/restore/:fileName', async (req, res) => {
    try {
      const { fileName } = req.params;
      
      if (!fileName.startsWith(BACKUP_FILE_PREFIX) || !fileName.endsWith('.json')) {
        return res.status(400).json({
          success: false,
          message: 'Nome file backup non valido'
        });
      }
      
      const filePath = path.join(BACKUP_DIR, fileName);
      const backupContent = await fs.readFile(filePath, 'utf8');
      const backupData: BackupData = JSON.parse(backupContent);
      
      // TODO: Implementare restore nel database
      // Per ora restituiamo solo i dati
      
      res.json({
        success: true,
        message: 'Dati backup recuperati',
        data: backupData,
        clientsCount: backupData.clients.length
      });
      
    } catch (error) {
      console.error('❌ Errore restore backup:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno durante restore backup'
      });
    }
  });

  // 🏥 CONTROLLO SALUTE DATABASE
  app.get('/api/health/database', async (req, res) => {
    try {
      // TODO: Implementare controllo reale del database
      // Per ora simula controllo
      res.json({
        success: true,
        healthy: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 📊 STATISTICHE BACKUP
  app.get('/api/backup/stats', async (req, res) => {
    try {
      await ensureBackupDir();
      
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files.filter(file => 
        file.startsWith(BACKUP_FILE_PREFIX) && file.endsWith('.json')
      );
      
      if (backupFiles.length === 0) {
        return res.json({
          success: true,
          stats: {
            totalBackups: 0,
            latestBackup: null,
            oldestBackup: null,
            totalSize: 0
          }
        });
      }
      
      // Calcola statistiche
      const stats = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = path.join(BACKUP_DIR, fileName);
          const fileStats = await fs.stat(filePath);
          return {
            fileName,
            size: fileStats.size,
            mtime: fileStats.mtime
          };
        })
      );
      
      stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      const totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);
      
      res.json({
        success: true,
        stats: {
          totalBackups: backupFiles.length,
          latestBackup: stats[0]?.mtime.toISOString() || null,
          oldestBackup: stats[stats.length - 1]?.mtime.toISOString() || null,
          totalSize,
          totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        }
      });
      
    } catch (error) {
      console.error('❌ Errore statistiche backup:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno durante calcolo statistiche'
      });
    }
  });
}

// 🧹 PULIZIA BACKUP VECCHI
async function cleanOldBackups(): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith(BACKUP_FILE_PREFIX) && file.endsWith('.json'))
      .map(fileName => ({
        fileName,
        filePath: path.join(BACKUP_DIR, fileName)
      }));
    
    if (backupFiles.length <= 48) {
      return; // Non serve pulizia
    }
    
    // Ordina per data e rimuovi i più vecchi
    const filesWithStats = await Promise.all(
      backupFiles.map(async (file) => {
        const stats = await fs.stat(file.filePath);
        return {
          ...file,
          mtime: stats.mtime
        };
      })
    );
    
    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    // Rimuovi file dopo i primi 48
    const filesToDelete = filesWithStats.slice(48);
    
    for (const file of filesToDelete) {
      await fs.unlink(file.filePath);
      console.log(`🗑️ Backup vecchio rimosso: ${file.fileName}`);
    }
    
  } catch (error) {
    console.error('❌ Errore pulizia backup vecchi:', error);
  }
}