import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, lte, or, ilike, sql } from "drizzle-orm";
import { clients, appointments, photos, likes, comments, messages, appointmentSwapRequests, preAppointmentChecks, accessCodes, inventory } from "@shared/schema";
import express from 'express';

const app = express.Router();

export { app as routes };

// Comprehensive Admin Notification System
app.get('/api/admin/notifications', async (req, res) => {
  try {
    console.log('Fetching all admin notifications...');
    
    // Get recent swap requests
    const recentSwapRequests = await db.select({
      id: appointmentSwapRequests.id,
      type: sql<string>`'swap_request'`,
      message: sql<string>`CONCAT('Nuova richiesta scambio da ', req_client.full_name, ' per ', target_client.full_name)`,
      timestamp: appointmentSwapRequests.createdAt,
      clientId: appointmentSwapRequests.requesterClientId,
      status: appointmentSwapRequests.status
    })
    .from(appointmentSwapRequests)
    .leftJoin(clients, eq(appointmentSwapRequests.requesterClientId, clients.id))
    .leftJoin(clients.as('req_client'), eq(appointmentSwapRequests.requesterClientId, clients.id))
    .leftJoin(clients.as('target_client'), eq(appointmentSwapRequests.targetClientId, clients.id))
    .orderBy(desc(appointmentSwapRequests.createdAt))
    .limit(10);

    // Get recent appointments
    const recentAppointments = await db.select({
      id: appointments.id,
      type: sql<string>`'appointment'`,
      message: sql<string>`CONCAT(clients.full_name, ' ha prenotato per il ', appointments.appointment_date)`,
      timestamp: appointments.appointmentDate,
      clientId: appointments.clientId,
      status: sql<string>`'booked'`
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(sql`appointments.appointment_date >= CURRENT_DATE - INTERVAL '7 days'`)
    .orderBy(desc(appointments.appointmentDate))
    .limit(10);

    // Get recent photos uploaded
    const recentPhotos = await db.select({
      id: photos.id,
      type: sql<string>`'photo_upload'`,
      message: sql<string>`CONCAT(clients.full_name, ' ha caricato una nuova foto')`,
      timestamp: photos.uploadedAt,
      clientId: photos.clientId,
      status: photos.approved
    })
    .from(photos)
    .leftJoin(clients, eq(photos.clientId, clients.id))
    .where(sql`photos.uploaded_at >= CURRENT_DATE - INTERVAL '7 days'`)
    .orderBy(desc(photos.uploadedAt))
    .limit(10);

    // Get recent messages
    const recentMessages = await db.select({
      id: messages.id,
      type: sql<string>`'message'`,
      message: sql<string>`CONCAT('Nuovo messaggio da ', clients.full_name)`,
      timestamp: messages.timestamp,
      clientId: messages.clientId,
      status: sql<string>`CASE WHEN messages.read THEN 'read' ELSE 'unread' END`
    })
    .from(messages)
    .leftJoin(clients, eq(messages.clientId, clients.id))
    .where(eq(messages.sender, 'client'))
    .orderBy(desc(messages.timestamp))
    .limit(10);

    // Combine all notifications
    const allNotifications = [
      ...recentSwapRequests,
      ...recentAppointments,
      ...recentPhotos,
      ...recentMessages
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 20);

    console.log(`Found ${allNotifications.length} notifications for admin`);
    res.json({ success: true, notifications: allNotifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero delle notifiche' });
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
    const client = await storage.getClientByCode(code);
    
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

// All other existing routes continue...