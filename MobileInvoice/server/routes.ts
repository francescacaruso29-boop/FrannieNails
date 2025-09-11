import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, lte, or, ilike, sql } from "drizzle-orm";
import { clients, appointments, photos, likes, comments, messages, appointmentSwapRequests, preAppointmentChecks, accessCodes, inventory } from "@shared/schema";
import express, { type Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { registerBackupRoutes } from './backup-routes';

// Tracciamento temporaneo delle notifiche lette (in produzione usare database)
let readNotifications = new Set<string>();

export function registerRoutes(app: Express) {

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo file immagine sono permessi'));
    }
  }
});

// Upload photo endpoint with database integration
app.post('/api/upload/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const { description, clientName } = req.body;
    
    // Save photo info to database
    try {
      const photoData = {
        clientId: 0, // Default for admin uploads
        imageUrl,
        description: description || null,
        nailStyle: clientName || null, // Using nailStyle field for client name temporarily
        status: 'pending' as const
      };
      
      const savedPhoto = await storage.createPhoto(photoData);
      
      console.log('📸 PHOTO UPLOADED:', {
        id: savedPhoto.id,
        filename: req.file.filename,
        clientName,
        description
      });
      
      res.json({
        success: true,
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        photoId: savedPhoto.id
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Photo file uploaded but DB save failed - continue with success but log error
      res.json({
        success: true,
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        warning: 'Photo uploaded but not saved to database'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Errore durante il caricamento' });
  }
});

// Delete photo endpoint with database cleanup
app.delete('/api/upload/photo/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const imageUrl = `/uploads/${filename}`;
    
    // Remove from database first
    try {
      // Find photo by imageUrl and delete
      const photoRows = await db.select().from(photos).where(eq(photos.imageUrl, imageUrl));
      if (photoRows.length > 0) {
        await db.delete(photos).where(eq(photos.id, photoRows[0].id));
        console.log('🗑️ PHOTO DELETED FROM DB:', photoRows[0].id);
      }
    } catch (dbError) {
      console.error('Database delete error:', dbError);
    }
    
    // Remove physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ FILE DELETED:', filename);
      res.json({ success: true, message: 'Foto eliminata completamente' });
    } else {
      res.status(404).json({ error: 'File non trovato' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
});

// Get all clients for admin
app.get('/api/admin/clients', async (req, res) => {
  try {
    const clients = await storage.getAllClients();
    res.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento clienti' });
  }
});

// Get single client details
app.get('/api/admin/clients/:id', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente non trovato' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero cliente' });
  }
});

// Get client appointments
app.get('/api/admin/clients/:id/appointments', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const appointments = await storage.getClientAppointments(clientId);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching client appointments:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero appuntamenti' });
  }
});

// Get client photos
app.get('/api/admin/clients/:id/photos', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const photos = await storage.getClientPhotos(clientId);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching client photos:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero foto' });
  }
});

// Update client
app.put('/api/admin/clients/:id', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { fullName, phoneNumber } = req.body;
    
    if (!fullName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Nome e telefono sono obbligatori' });
    }

    await storage.updateClient(clientId, { fullName, phoneNumber });
    res.json({ success: true, message: 'Cliente aggiornato con successo' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento cliente' });
  }
});

// Get earnings data for dashboard
app.get('/api/admin/earnings', async (req, res) => {
  try {
    const year = req.query.year as string || new Date().getFullYear().toString();
    const month = req.query.month as string;
    
    const earningsData = await storage.getEarningsData(year, month);
    res.json(earningsData);
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero guadagni' });
  }
});


// Daily earnings routes
app.post('/api/admin/daily-earnings', async (req, res) => {
  try {
    const { date, amount, notes } = req.body;
    
    if (!date || typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ success: false, message: 'Data e importo sono obbligatori' });
    }

    const earnings = await storage.updateDailyEarnings(date, amount * 100, notes); // Convert to cents
    res.json({ success: true, earnings });
  } catch (error) {
    console.error('Error saving daily earnings:', error);
    res.status(500).json({ success: false, message: 'Errore nel salvataggio guadagni' });
  }
});

app.get('/api/admin/daily-earnings/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const earnings = await storage.getDailyEarnings(date);
    res.json({ success: true, earnings });
  } catch (error) {
    console.error('Error fetching daily earnings:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero guadagni' });
  }
});

app.get('/api/admin/daily-earnings', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let earnings;
    if (year && month) {
      earnings = await storage.getDailyEarningsForMonth(year as string, month as string);
    } else {
      earnings = await storage.getAllDailyEarnings();
    }
    
    res.json({ success: true, earnings });
  } catch (error) {
    console.error('Error fetching daily earnings:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero guadagni' });
  }
});

// Toggle client status (active/inactive)
app.patch('/api/admin/clients/:id/toggle-status', async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: 'ID cliente non valido' });
    }
    
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente non trovata' });
    }
    
    const updatedClient = await storage.updateClient(clientId, {
      isActive: !client.isActive
    });
    
    res.json({ 
      success: true, 
      client: updatedClient,
      message: updatedClient.isActive ? 'Cliente attivata' : 'Cliente disattivata'
    });
  } catch (error) {
    console.error('Error toggling client status:', error);
    res.status(500).json({ success: false, message: 'Errore nel cambio stato cliente' });
  }
});

// Get all appointments for admin
app.get('/api/admin/appointments', async (req, res) => {
  try {
    const appointments = await storage.getAllAppointments();
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento appuntamenti' });
  }
});

// Get all swap requests
app.get('/api/swap-requests', async (req, res) => {
  try {
    const swapRequests = await storage.getAllSwapRequests();
    res.json({ success: true, data: swapRequests });
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento richieste scambio' });
  }
});

// Create new swap request
app.post('/api/swap-requests', async (req, res) => {
  try {
    const { requesterClientId, requesterAppointmentId, targetClientId, targetAppointmentId, requestMessage, requestType, newSlotInfo } = req.body;
    
    // Validazione base: requester fields sono sempre obbligatori
    if (!requesterClientId || !requesterAppointmentId) {
      return res.status(400).json({ success: false, message: 'Cliente e appuntamento sono obbligatori' });
    }
    
    // Per richieste client-to-client, anche i target fields sono obbligatori
    if (requestType !== 'admin_move' && (!targetClientId || !targetAppointmentId)) {
      return res.status(400).json({ success: false, message: 'Per scambi tra clienti tutti i campi sono obbligatori' });
    }
    
    const newSwapRequest = await storage.createSwapRequest({
      requesterClientId,
      requesterAppointmentId,
      targetClientId: targetClientId || null,
      targetAppointmentId: targetAppointmentId || null,
      requestMessage: requestMessage || null,
      requestType: requestType || 'client_swap',
      newSlotInfo: newSlotInfo || null,
      status: 'pending'
    });
    
    res.json({ success: true, data: newSwapRequest });
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({ success: false, message: 'Errore durante la creazione della richiesta' });
  }
});

// CLIENT - Rispondere a richieste di scambio client_swap
app.post('/api/client/swap-requests/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const { clientId } = req.body; // ID del cliente che risponde
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Azione non valida' });
    }
    
    // Verifica che la richiesta sia di tipo client_swap
    const swapRequest = await storage.getSwapRequestById(parseInt(id));
    if (!swapRequest || swapRequest.requestType !== 'client_swap') {
      return res.status(400).json({ success: false, message: 'Tipo di richiesta non valido' });
    }
    
    // Verifica che il cliente sia autorizzato a rispondere
    if (swapRequest.targetClientId !== clientId) {
      return res.status(403).json({ success: false, message: 'Non autorizzato' });
    }
    
    const response = action === 'accept' ? 'accepted' : 'rejected';
    const updatedSwap = await storage.respondToSwapRequest(parseInt(id), response);
    
    res.json({ success: true, data: updatedSwap });
  } catch (error) {
    console.error('Error client responding to swap request:', error);
    res.status(500).json({ success: false, message: 'Errore durante la risposta' });
  }
});

// ADMIN - Rispondere solo a richieste admin_move  
app.post('/api/admin/swap-requests/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Azione non valida' });
    }
    
    // Verifica che la richiesta sia di tipo admin_move
    const swapRequest = await storage.getSwapRequestById(parseInt(id));
    if (!swapRequest || swapRequest.requestType !== 'admin_move') {
      return res.status(400).json({ success: false, message: 'Solo richieste admin_move possono essere gestite qui' });
    }
    
    const response = action === 'approve' ? 'accepted' : 'rejected';
    const updatedSwap = await storage.respondToSwapRequest(parseInt(id), response);
    
    res.json({ success: true, data: updatedSwap });
  } catch (error) {
    console.error('Error admin updating swap request:', error);
    res.status(500).json({ success: false, message: 'Errore durante l\'aggiornamento della richiesta' });
  }
});

// CLIENT - Ottenere le richieste pendenti per una cliente
app.get('/api/client/:clientId/swap-requests', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, message: 'ID cliente non valido' });
    }
    
    // Ottieni richieste dove la cliente è il target (deve rispondere)
    const targetRequests = await storage.getSwapRequestsForClient(clientId);
    
    // Ottieni richieste fatte dalla cliente (per vedere lo stato)
    const allRequests = await storage.getAllSwapRequests();
    const requesterRequests = allRequests.filter(req => req.requesterClientId === clientId);
    
    res.json({ 
      success: true, 
      data: {
        pendingForResponse: targetRequests.filter(req => req.status === 'pending'),
        myRequests: requesterRequests
      }
    });
  } catch (error) {
    console.error('Error fetching client swap requests:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento richieste' });
  }
});

// Get all photos for admin gallery
app.get('/api/admin/photos', async (req, res) => {
  try {
    try {
      const allPhotos = await db
      .select({
        id: photos.id,
        clientId: photos.clientId,
        imageUrl: photos.imageUrl,
        description: photos.description,
        nailStyle: photos.nailStyle,
        status: photos.status,
        uploadedAt: photos.uploadedAt,
        approvedAt: photos.approvedAt
      })
      .from(photos)
      .orderBy(desc(photos.uploadedAt));

    // Transform to match frontend interface
    const transformedPhotos = allPhotos.map(photo => ({
      id: photo.id,
      clientId: photo.clientId,
      clientName: photo.nailStyle || 'Cliente Sconosciuto', // Using nailStyle as clientName
      filename: photo.imageUrl,
      description: photo.description,
      uploadedAt: photo.uploadedAt.toISOString(),
      status: photo.status as 'pending' | 'approved' | 'rejected'
    }));

      console.log(`📸 LOADED ${transformedPhotos.length} PHOTOS FROM DATABASE`);
      res.json({ success: true, photos: transformedPhotos });
    } catch (dbError) {
      console.log('📸 DATABASE NOT AVAILABLE, USING IN-MEMORY STORAGE');
      
      // Use MemStorage to get all photos with current status
      const memPhotos = Array.from((storage as any).photos.values());
      const transformedPhotos = memPhotos.map((photo: any) => ({
        id: photo.id,
        clientId: photo.clientId,
        clientName: photo.nailStyle || 'Cliente Sconosciuto',
        filename: photo.imageUrl || '/uploads/demo-nail.jpg',
        description: photo.description,
        uploadedAt: photo.uploadedAt.toISOString(),
        status: photo.status as 'pending' | 'approved' | 'rejected'
      }));
      
      res.json({ success: true, photos: transformedPhotos });
    }
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento foto' });
  }
});

// Update photo status (approve/reject)
app.patch('/api/admin/photos/:photoId/status', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status non valido' });
    }

    try {
      const updateData: any = { status };
      if (status === 'approved') {
        updateData.approvedAt = new Date();
      }

      const [updatedPhoto] = await db
        .update(photos)
        .set(updateData)
        .where(eq(photos.id, parseInt(photoId)))
        .returning();

      if (!updatedPhoto) {
        return res.status(404).json({ error: 'Foto non trovata' });
      }

      console.log(`📸 PHOTO ${status.toUpperCase()}:`, { id: updatedPhoto.id, status });
      res.json({ success: true, photo: updatedPhoto });
    } catch (dbError) {
      console.log('📸 DATABASE NOT AVAILABLE, STATUS UPDATE IN MEMORY');
      
      // Use MemStorage to update photo status
      try {
        let updatedPhoto;
        if (status === 'approved') {
          updatedPhoto = await storage.approvePhoto(parseInt(photoId));
        } else if (status === 'rejected') {
          updatedPhoto = await storage.rejectPhoto(parseInt(photoId));
        } else {
          // For pending status, manually update
          const photo = (storage as any).photos.get(parseInt(photoId));
          if (photo) {
            const updated = { ...photo, status };
            (storage as any).photos.set(parseInt(photoId), updated);
            updatedPhoto = updated;
          }
        }
        
        if (updatedPhoto) {
          res.json({ 
            success: true, 
            photo: { 
              id: updatedPhoto.id, 
              status: updatedPhoto.status,
              message: 'Status aggiornato (demo mode)' 
            } 
          });
        } else {
          res.status(404).json({ error: 'Foto non trovata in memoria' });
        }
      } catch (memError) {
        console.error('Error updating photo in memory:', memError);
        res.status(500).json({ error: 'Errore nell\'aggiornamento in memoria' });
      }
    }
  } catch (error) {
    console.error('Error updating photo status:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello status' });
  }
});

// Comprehensive Admin Notification System
app.get('/api/admin/notifications', async (req, res) => {
  try {
    console.log('Fetching all admin notifications...');
    
    // Demo notifications for testing bell animation and scroll
    const baseNotifications = [
      {
        id: 1,
        type: 'swap_accepted',
        message: '✅ Giulia Bianchi ha ACCETTATO la richiesta di scambio con Maria Rossi! Gli appuntamenti sono stati scambiati automaticamente.',
        timestamp: new Date(),
        clientId: 2,
        status: 'unread'
      },
      {
        id: 2,
        type: 'message',
        message: 'Maria Rossi ha inviato un nuovo messaggio',
        timestamp: new Date(),
        clientId: 1,
        status: 'unread'
      },
      {
        id: 3,
        type: 'appointment',
        message: 'Anna Bianchi ha prenotato per domani',
        timestamp: new Date(Date.now() - 3600000),
        clientId: 2,
        status: 'pending'
      },
      {
        id: 4,
        type: 'photo_upload',
        message: 'Sofia Verde ha caricato una nuova foto',
        timestamp: new Date(Date.now() - 7200000),
        clientId: 3,
        status: 'pending'
      },
      {
        id: 5,
        type: 'swap_request',
        message: 'Richiesta scambio appuntamento da Laura Neri',
        timestamp: new Date(Date.now() - 10800000),
        clientId: 4,
        status: 'pending'
      },
      {
        id: 6,
        type: 'message',
        message: 'Giulia Bianchi chiede informazioni sui prezzi',
        timestamp: new Date(Date.now() - 14400000),
        clientId: 5,
        status: 'unread'
      },
      {
        id: 6,
        type: 'appointment',
        message: 'Francesca Romano ha confermato appuntamento',
        timestamp: new Date(Date.now() - 18000000),
        clientId: 6,
        status: 'read'
      },
      {
        id: 7,
        type: 'photo_upload',
        message: 'Elena Conti ha caricato 3 nuove foto',
        timestamp: new Date(Date.now() - 21600000),
        clientId: 7,
        status: 'pending'
      },
      {
        id: 8,
        type: 'payment',
        message: 'Pagamento ricevuto da Sara Pellegrini',
        timestamp: new Date(Date.now() - 25200000),
        clientId: 8,
        status: 'read'
      },
      {
        id: 9,
        type: 'review',
        message: 'Nuova recensione 5 stelle da Martina Galli',
        timestamp: new Date(Date.now() - 28800000),
        clientId: 9,
        status: 'unread'
      },
      {
        id: 10,
        type: 'cancellation',
        message: 'Valentina Ricci ha annullato appuntamento',
        timestamp: new Date(Date.now() - 32400000),
        clientId: 10,
        status: 'pending'
      },
      {
        id: 11,
        type: 'message',
        message: 'Chiara Moretti richiede disponibilità weekend',
        timestamp: new Date(Date.now() - 36000000),
        clientId: 11,
        status: 'unread'
      },
      {
        id: 12,
        type: 'appointment',
        message: 'Alice Ferrari ha prenotato manicure completa',
        timestamp: new Date(Date.now() - 39600000),
        clientId: 12,
        status: 'read'
      }
    ];

    // Applica lo stato "read" alle notifiche già lette
    const demoNotifications = baseNotifications.map(notif => ({
      ...notif,
      status: readNotifications.has(notif.id.toString()) ? 'read' : notif.status
    }));

    console.log(`Found ${demoNotifications.length} notifications for admin`);
    res.json({ success: true, notifications: demoNotifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero delle notifiche' });
  }
});

// Endpoint per marcare notifiche come lette
app.post('/api/admin/notifications/mark-read', async (req, res) => {
  try {
    console.log('Marking all notifications as read...');
    
    // Marca tutte le notifiche non lette come lette
    const notificationIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    notificationIds.forEach(id => readNotifications.add(id));
    
    console.log('All notifications marked as read');
    res.json({ success: true, message: 'Notifiche marcate come lette' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Errore nel marcare le notifiche come lette' });
  }
});

// Endpoint per resettare notifiche (per test)
app.post('/api/admin/notifications/reset', async (req, res) => {
  try {
    console.log('Resetting notifications...');
    readNotifications.clear();
    console.log('Notifications reset');
    res.json({ success: true, message: 'Notifiche resettate' });
  } catch (error) {
    console.error('Error resetting notifications:', error);
    res.status(500).json({ success: false, message: 'Errore nel reset delle notifiche' });
  }
});

// Real-time activity tracking
app.post('/api/admin/track-activity', async (req, res) => {
  try {
    const { clientId, action, details } = req.body;
    
    console.log(`📊 ATTIVITÀ CLIENTE: ID ${clientId} - ${action}`);
    console.log(`📋 Dettagli: ${JSON.stringify(details)}`);
    
    // Here you could store activity logs in database if needed
    // For now, we log everything for admin monitoring
    
    res.json({ success: true, message: 'Attività tracciata' });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({ success: false, message: 'Errore nel tracciamento' });
  }
});

// Daily summary for admin
app.get('/api/admin/daily-summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Count today's activities
    const todayAppointments = await db.select({ count: sql<number>`COUNT(*)` })
      .from(appointments)
      .where(eq(appointments.appointmentDate, new Date(today)));
    
    const todaySwapRequests = await db.select({ count: sql<number>`COUNT(*)` })
      .from(appointmentSwapRequests)
      .where(sql`DATE(created_at) = CURRENT_DATE`);
    
    const todayPhotos = await db.select({ count: sql<number>`COUNT(*)` })
      .from(photos)
      .where(sql`DATE(uploaded_at) = CURRENT_DATE`);
    
    const todayMessages = await db.select({ count: sql<number>`COUNT(*)` })
      .from(messages)
      .where(and(
        eq(messages.sender, 'client'),
        sql`DATE(timestamp) = CURRENT_DATE`
      ));

    const summary = {
      date: today,
      appointments: todayAppointments[0]?.count || 0,
      swapRequests: todaySwapRequests[0]?.count || 0,
      photosUploaded: todayPhotos[0]?.count || 0,
      messagesReceived: todayMessages[0]?.count || 0
    };

    console.log(`📊 RIEPILOGO GIORNALIERO:`, summary);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({ success: false, message: 'Errore nel riepilogo giornaliero' });
  }
});

// Client Authentication Routes
app.post('/api/authenticate', async (req, res) => {
  try {
    const { code } = req.body;
    const client = await storage.getClientByUniqueCode(code);
    
    if (client) {
      console.log(`📱 CLIENT LOGIN: ${client.fullName} (ID: ${client.id})`);
      res.json({ success: true, client });
    } else {
      res.json({ success: false, message: 'Codice non valido' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Errore di autenticazione' });
  }
});



// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminCode, password } = req.body;
    console.log(`🔐 ADMIN LOGIN ATTEMPT: Code=${adminCode}, Password=${password}`);
    
    // Admin credentials (in production these should be in environment variables)
    const validAdminCode = 'admin';
    const validPassword = 'frannie2024';
    
    if (adminCode === validAdminCode && password === validPassword) {
      // Imposta flag di autenticazione (usando localStorage lato client per semplicità)
      console.log('✅ ADMIN LOGIN SUCCESS');
      res.json({ success: true, message: 'Login amministratore riuscito', authenticated: true });
    } else {
      console.log('❌ ADMIN LOGIN FAILED: Invalid credentials');
      res.json({ success: false, message: 'Credenziali amministratore non valide' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Errore di login amministratore' });
  }
});

// Check admin auth status
app.get('/api/admin/auth-check', (req, res) => {
  // Per semplicità, consideriamo che l'admin sia sempre autenticato se il localStorage contiene il token
  // In un'app reale useresti sessioni server o JWT
  res.json({ authenticated: false, message: 'Verifica autenticazione lato client' });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    // Se stai usando express-session, distruggi la sessione
    if ((req as any).session) {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
    }
    
    // Pulisci il cookie della sessione
    res.clearCookie('connect.sid');
    
    console.log('✅ LOGOUT SUCCESS');
    res.json({ success: true, message: 'Logout completato' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Errore durante logout' });
  }
});

// Get appointments for calendar
app.get('/api/appointments/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const appointments = await storage.getClientAppointments(clientId);
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero appuntamenti' });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await storage.createAppointment(req.body);
    console.log(`📅 NUOVO APPUNTAMENTO: Cliente ${req.body.clientId} - ${req.body.service} per ${req.body.appointmentDate}`);
    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, message: 'Errore nella prenotazione' });
  }
});

// Admin routes
app.get('/api/admin/today-appointments', async (req, res) => {
  try {
    const appointments = await storage.getAllAppointments();
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero appuntamenti' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = { totalClients: 0, totalAppointments: 0, totalPhotos: 0 };
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero statistiche' });
  }
});

app.get('/api/swap-requests/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const swapRequests = await storage.getAllSwapRequests();
    res.json({ success: true, swapRequests });
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero richieste scambio' });
  }
});

// Admin Notifications Routes
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const notifications = await storage.getAllAdminNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento delle notifiche' });
  }
});

app.get('/api/admin/notifications/unread', async (req, res) => {
  try {
    const notifications = await storage.getUnreadAdminNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento delle notifiche non lette' });
  }
});

app.patch('/api/admin/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await storage.markAdminNotificationAsRead(parseInt(id));
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Errore nel segnare la notifica come letta' });
  }
});

// Simula una risposta cliente (normalmente gestita dall'app cliente)
app.post('/api/client/swap-requests/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'accepted' or 'rejected'
    
    const swapRequest = await storage.respondToSwapRequest(parseInt(id), response);
    
    // Crea notifica per l'admin per entrambi i tipi di richiesta
    if (swapRequest.requestType === 'admin_move') {
      const client = await storage.getClient(swapRequest.requesterClientId);
      const statusText = response === 'accepted' ? 'accettato' : 'rifiutato';
      
      await storage.createAdminNotification({
        type: 'swap_response',
        title: `Richiesta ${statusText}`,
        message: `${client?.fullName} ha ${statusText} lo spostamento del suo appuntamento`,
        relatedId: parseInt(id),
        read: false
      });
    } else if (swapRequest.requestType === 'client_swap') {
      const requesterClient = await storage.getClient(swapRequest.requesterClientId);
      const targetClient = await storage.getClient(swapRequest.targetClientId!);
      const statusText = response === 'accepted' ? 'ACCETTATO' : 'RIFIUTATO';
      const statusEmoji = response === 'accepted' ? '✅' : '❌';
      
      await storage.createAdminNotification({
        type: 'swap_accepted',
        title: `Scambio ${statusText} ${statusEmoji}`,
        message: `${targetClient?.fullName} ha ${statusText} la richiesta di scambio con ${requesterClient?.fullName}. ${response === 'accepted' ? 'Gli appuntamenti sono stati scambiati automaticamente.' : ''}`,
        relatedId: parseInt(id),
        read: false
      });
    }
    
    res.json({ success: true, swapRequest });
  } catch (error) {
    console.error('Error responding to swap request:', error);
    res.status(500).json({ success: false, message: 'Errore nella risposta alla richiesta' });
  }
});

// Client Access Endpoint - CRITICAL for login
app.post('/api/access', async (req, res) => {
  try {
    const { uniqueCode, fullName, phoneNumber } = req.body;
    
    if (!uniqueCode || !fullName || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tutti i campi sono obbligatori' 
      });
    }

    // Check for admin login
    if (uniqueCode === 'admin') {
      return res.json({
        success: true,
        isAdmin: true,
        message: 'Accesso admin rilevato'
      });
    }

    // Try to find existing client by unique code
    let client = await storage.getClientByUniqueCode(uniqueCode);
    
    if (client) {
      // Check if client is active
      if (!client.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Il tuo accesso è stato disattivato. Contatta il salone per maggiori informazioni.'
        });
      }
      
      // Update client info if found
      const updatedClient = await storage.updateClient(client.id, {
        fullName,
        phoneNumber
      });
      
      return res.json({
        success: true,
        client: updatedClient,
        message: 'Accesso effettuato con successo'
      });
    } else {
      // Create new client if not found
      const newClient = await storage.createClient({
        uniqueCode,
        fullName, 
        phoneNumber,
        personalCode: null
      });
      
      return res.json({
        success: true,
        client: newClient,
        message: 'Nuovo cliente registrato con successo'
      });
    }
  } catch (error) {
    console.error('Error in /api/access:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
});

// Admin Login Endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminCode, password } = req.body;
    
    if (adminCode === 'admin' && password === 'frannie2024') {
      return res.json({
        success: true,
        message: 'Accesso admin autorizzato'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
});

// Inventory Management Endpoints

// Get all inventory items
app.get('/api/admin/inventory', async (req, res) => {
  try {
    const inventoryItems = await storage.getAllInventory();
    res.json({ success: true, inventory: inventoryItems });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento inventario' });
  }
});

// Create new inventory item
app.post('/api/admin/inventory', async (req, res) => {
  try {
    const inventoryData = req.body;
    const newItem = await storage.createInventoryItem(inventoryData);
    console.log('📦 NEW INVENTORY ITEM CREATED:', newItem);
    res.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ success: false, message: 'Errore nella creazione del prodotto' });
  }
});

// Update inventory item
app.patch('/api/admin/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedItem = await storage.updateInventoryItem(parseInt(id), updates);
    console.log('📦 INVENTORY ITEM UPDATED:', updatedItem);
    res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del prodotto' });
  }
});

// Delete inventory item
app.delete('/api/admin/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteInventoryItem(parseInt(id));
    console.log('📦 INVENTORY ITEM DELETED:', id);
    res.json({ success: true, message: 'Prodotto eliminato con successo' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del prodotto' });
  }
});

// Update stock quantity (quick action)
app.patch('/api/admin/inventory/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({ success: false, message: 'La quantità non può essere negativa' });
    }
    
    const updatedItem = await storage.updateInventoryItem(parseInt(id), { quantity });
    console.log('📦 STOCK UPDATED:', { id, newQuantity: quantity });
    res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento delle scorte' });
  }
});

// Get inventory by category
app.get('/api/admin/inventory/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const inventoryItems = await storage.getInventoryByCategory(category);
    res.json({ success: true, inventory: inventoryItems });
  } catch (error) {
    console.error('Error fetching inventory by category:', error);
    res.status(500).json({ success: false, message: 'Errore nel caricamento inventario per categoria' });
  }
});

// Test WhatsApp automation
app.post('/api/test-whatsapp', async (req, res) => {
  console.log('🧪 WhatsApp automation test requested');
  
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber and message are required'
      });
    }
    
    console.log(`📞 Test invio a: ${phoneNumber}`);
    console.log(`💬 Messaggio test: ${message}`);
    
    // Import and test WhatsApp automation
    const whatsappModule = await import('./whatsapp-automation');
    const success = await whatsappModule.sendSingleMessage(phoneNumber, message);
    
    console.log(`${success ? '✅' : '❌'} Test WhatsApp result: ${success}`);
    
    res.json({
      success: true,
      whatsapp_sent: success,
      message: success ? 'Messaggio inviato con successo!' : 'Invio fallito, controlla logs'
    });
    
  } catch (error) {
    console.error('❌ Errore test WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Test WhatsApp failed',
      details: error.message
    });
  }
});

// Test Push Notifications
app.post('/api/admin/test-notification', async (req, res) => {
  console.log('🔔 Push notification test requested');
  
  try {
    const { clientId, action, data } = req.body;
    
    console.log(`📱 Test notifica per cliente: ${clientId}`);
    console.log(`⚡ Azione: ${action}`);
    console.log(`📊 Dati: ${JSON.stringify(data)}`);
    
    // Simulate different notification types
    let title = '';
    let body = '';
    
    switch (action) {
      case 'send_reminder':
        title = '🔔 Promemoria Appuntamento';
        body = `Il tuo appuntamento è previsto per ${data.date} alle ${data.time} per ${data.service}`;
        break;
      case 'photo_shared':
        title = '📸 Nuova Foto Condivisa';
        body = 'Frannie ha condiviso una nuova nail art per te! ✨';
        break;
      case 'message_received':
        title = '💬 Nuovo Messaggio';
        body = 'Hai ricevuto un nuovo messaggio da Frannie NAILS';
        break;
      case 'booking_confirmed':
        title = '✅ Prenotazione Confermata';
        body = `Il tuo appuntamento è stato confermato per ${data.date || 'domani'} alle ${data.time || '15:30'}`;
        break;
      default:
        title = '🔔 Test Notifica';
        body = 'Questa è una notifica di test dal sistema Frannie NAILS';
    }
    
    // Import notification system
    const { sendClientNotification } = await import('./notifications');
    
    // Send the test notification
    const success = await sendClientNotification(
      clientId,
      'Test Cliente',
      '+393334567890',
      action,
      JSON.stringify(data)
    );
    
    console.log(`${success ? '✅' : '❌'} Test notification result: ${success}`);
    
    res.json({
      success: true,
      notification_sent: success,
      client: `Cliente ${clientId}`,
      title,
      body,
      message: success ? 'Notifica inviata con successo!' : 'Invio notifica fallito'
    });
    
  } catch (error) {
    console.error('❌ Errore test notifiche:', error);
    res.status(500).json({
      success: false,
      error: 'Test notification failed',
      details: error.message
    });
  }
});

// 🔒 SISTEMA BACKUP AUTOMATICO
registerBackupRoutes(app);

  // ============== CONTROLLI PRE-APPUNTAMENTO ==============
  
  // Get appuntamenti di domani che necessitano controllo pre-appuntamento
  app.get('/api/admin/tomorrow-appointments', async (req, res) => {
    try {
      const appointments = await storage.getTomorrowAppointmentsForPreCheck();
      res.json({ success: true, appointments });
    } catch (error) {
      console.error('Error getting tomorrow appointments:', error);
      res.status(500).json({ success: false, message: 'Errore nel recupero appuntamenti' });
    }
  });

  // Get controllo pre-appuntamento esistente
  app.get('/api/admin/pre-check/:appointmentId', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const preCheck = await storage.getPreAppointmentCheckByAppointment(appointmentId);
      res.json({ success: true, preCheck });
    } catch (error) {
      console.error('Error getting pre-appointment check:', error);
      res.status(500).json({ success: false, message: 'Errore nel recupero controllo' });
    }
  });

  // Crea/aggiorna controllo pre-appuntamento
  app.post('/api/admin/pre-check', async (req, res) => {
    try {
      const { appointmentId, clientId, brokenNails, notes } = req.body;

      // Validazione input
      if (!appointmentId || !clientId || brokenNails === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dati mancanti: appointmentId, clientId e brokenNails sono obbligatori' 
        });
      }

      const preCheckData = {
        appointmentId: parseInt(appointmentId),
        clientId: parseInt(clientId),
        brokenNails: parseInt(brokenNails),
        notes: notes || null
      };

      const preCheck = await storage.createPreAppointmentCheck(preCheckData);
      res.json({ success: true, preCheck });
    } catch (error) {
      console.error('Error creating pre-appointment check:', error);
      res.status(500).json({ success: false, message: 'Errore nella creazione controllo' });
    }
  });

  // Completa controllo e calcola importo finale
  app.put('/api/admin/pre-check/:id/complete', async (req, res) => {
    try {
      const checkId = parseInt(req.params.id);
      const { brokenNails, notes } = req.body;

      const completedCheck = await storage.completePreAppointmentCheck(checkId, {
        brokenNails: parseInt(brokenNails),
        notes
      });

      res.json({ success: true, preCheck: completedCheck });
    } catch (error) {
      console.error('Error completing pre-appointment check:', error);
      res.status(500).json({ success: false, message: 'Errore nel completamento controllo' });
    }
  });

  // Calcola importo finale per appuntamento (servizio + unghie rotte - anticipi)
  app.get('/api/admin/final-amount/:appointmentId', async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      
      // Get appointment details
      const appointment = await storage.getAppointmentById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appuntamento non trovato' });
      }

      // Get client to check advance balance
      const client = await storage.getClientById(appointment.clientId);
      if (!client) {
        return res.status(404).json({ success: false, message: 'Cliente non trovato' });
      }

      // Get pre-appointment check if exists
      const preCheck = await storage.getPreAppointmentCheckByAppointment(appointmentId);

      // Service prices (in euros, converted to cents for calculation)
      const servicePrices: { [key: string]: number } = {
        'Gel': 25,
        'Semipermanente': 20,
        'Ricostruzione': 45,
        'Manicure': 15,
        'Pedicure': 25,
        'Lime e Lucido': 10,
        'Laminazione Ciglia': 35
      };

      const basePrice = servicePrices[appointment.service] || 0; // Base price in euros
      const brokenNailsCost = preCheck ? (preCheck.brokenNails * 2) : 0; // 2€ per unghia rotta
      const advanceBalance = (client.advanceBalance || 0) / 100; // Convert from cents to euros
      
      const finalAmount = Math.max(0, basePrice + brokenNailsCost - advanceBalance);

      res.json({ 
        success: true, 
        calculation: {
          basePrice,
          brokenNails: preCheck?.brokenNails || 0,
          brokenNailsCost,
          advanceBalance,
          finalAmount,
          service: appointment.service,
          clientName: client.fullName
        }
      });
    } catch (error) {
      console.error('Error calculating final amount:', error);
      res.status(500).json({ success: false, message: 'Errore nel calcolo importo finale' });
    }
  });

  // Manual trigger for sending pre-check requests
  app.post("/api/admin/send-pre-checks", async (req, res) => {
    try {
      console.log("📋 Manual trigger for pre-check requests activated");
      
      // Import notification functions
      const notifications = await import('./notifications');
      
      // Get tomorrow's appointments and send pre-check requests
      const appointments = await storage.getTomorrowAppointmentsForPreCheck();
      let successCount = 0;
      let failureCount = 0;
      
      for (const appointment of appointments) {
        const reminder = {
          id: appointment.id,
          clientName: appointment.clientName,
          phoneNumber: appointment.clientPhone || '',
          appointmentDate: appointment.appointmentDate.toLocaleDateString('it-IT'),
          appointmentTime: appointment.appointmentTime
        };
        
        try {
          const success = await notifications.sendPreCheckRequest(reminder);
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(`Error sending pre-check to ${appointment.clientName}:`, error);
          failureCount++;
        }
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      res.json({
        success: true,
        message: `Pre-check requests sent`,
        details: {
          total: appointments.length,
          successful: successCount,
          failed: failureCount
        }
      });
    } catch (error) {
      console.error("Error sending pre-check requests:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send pre-check requests"
      });
    }
  });

  // Get unprocessed client responses (for admin dashboard)
  app.get("/api/admin/client-responses/unprocessed", async (req, res) => {
    try {
      const responses = await storage.getUnprocessedClientResponses();
      
      // Enrich with client and appointment info
      const enrichedResponses = await Promise.all(
        responses.map(async (response) => {
          const client = await storage.getClient(response.clientId);
          const appointment = await storage.getAppointment(response.appointmentId);
          
          return {
            ...response,
            clientName: client?.fullName || 'Unknown',
            appointmentDate: appointment?.appointmentDate,
            appointmentTime: appointment?.appointmentTime,
            service: appointment?.service
          };
        })
      );

      res.json({
        success: true,
        responses: enrichedResponses
      });
    } catch (error) {
      console.error('Error getting unprocessed responses:', error);
      res.status(500).json({ success: false, message: 'Errore nel recupero risposte' });
    }
  });

  // Process a client response (convert to pre-check)
  app.post("/api/admin/process-response/:responseId", async (req, res) => {
    try {
      const responseId = parseInt(req.params.responseId);
      const { brokenNails, notes } = req.body;

      // Get the response
      const responses = await storage.getUnprocessedClientResponses();
      const response = responses.find(r => r.id === responseId);
      
      if (!response) {
        return res.status(404).json({ success: false, message: 'Risposta non trovata' });
      }

      // Create or update pre-appointment check
      let preCheck = await storage.getPreAppointmentCheckByAppointment(response.appointmentId);
      
      if (preCheck) {
        // Update existing
        await storage.completePreAppointmentCheck(preCheck.id, brokenNails, notes || '');
      } else {
        // Create new
        await storage.createPreAppointmentCheck({
          appointmentId: response.appointmentId,
          clientId: response.clientId,
          brokenNails,
          notes: notes || '',
          additionalCost: brokenNails * 200, // 2€ per unghia in centesimi
          completed: true
        });
      }

      // Mark response as processed
      await storage.markClientResponseAsProcessed(responseId);

      res.json({
        success: true,
        message: 'Risposta processata con successo'
      });
    } catch (error) {
      console.error('Error processing response:', error);
      res.status(500).json({ success: false, message: 'Errore nel processamento risposta' });
    }
  });

  // Create demo appointment for testing
  app.post('/api/admin/create-demo-appointment', async (req, res) => {
    try {
      // Check if demo appointment already exists
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const allAppointments = await storage.getAllAppointments();
      const existingAppointments = allAppointments.filter(apt => 
        apt.appointmentDate instanceof Date ? 
          apt.appointmentDate.toISOString().split('T')[0] === tomorrowStr :
          apt.appointmentDate.toString().split('T')[0] === tomorrowStr
      );
      if (existingAppointments.length > 0) {
        return res.json({ 
          success: true, 
          message: 'Demo appointment already exists',
          appointment: existingAppointments[0] 
        });
      }

      // Create demo client if not exists
      const clients = await storage.getAllClients();
      let demoClient = clients.find(c => c.uniqueCode === 'DEMO001');
      
      if (!demoClient) {
        demoClient = await storage.createClient({
          uniqueCode: 'DEMO001',
          fullName: 'Cliente Demo',
          phoneNumber: '+39123456789'
        });
      }

      // Create demo appointment for tomorrow
      const appointment = await storage.createAppointment({
        clientId: demoClient.id,
        appointmentDate: new Date(tomorrowStr),
        appointmentTime: '14:00',
        service: 'Manicure Gel',
        monthYear: new Date(tomorrowStr).toISOString().slice(0, 7) // YYYY-MM format
      });

      res.json({ 
        success: true, 
        appointment, 
        client: demoClient,
        message: 'Demo appointment created successfully'
      });
    } catch (error) {
      console.error('Error creating demo appointment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Errore nella creazione appuntamento demo' 
      });
    }
  });

  // Simulate client response (for testing)
  app.post("/api/admin/simulate-client-response", async (req, res) => {
    try {
      const { appointmentId, clientId, responseMessage, brokenNailsCount } = req.body;

      // Get client phone for simulation
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ success: false, message: 'Cliente non trovato' });
      }

      // Create simulated response
      const response = await storage.createClientResponse({
        appointmentId,
        clientId,
        responseMessage,
        brokenNailsCount,
        responseType: 'pre_check_response',
        processed: false,
        phoneNumber: client.phoneNumber
      });

      res.json({
        success: true,
        response,
        message: 'Risposta simulata creata con successo'
      });
    } catch (error) {
      console.error('Error simulating client response:', error);
      res.status(500).json({ success: false, message: 'Errore nella simulazione risposta' });
    }
  });






}

const app = express();
registerRoutes(app);

export default app;
