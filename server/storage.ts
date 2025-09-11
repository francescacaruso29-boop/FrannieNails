import { 
  clients, appointments, photos, likes, comments, messages, appointmentSwapRequests, preAppointmentChecks, clientResponses, accessCodes, inventory, adminNotifications, dailyEarnings,
  type Client, type InsertClient, type Appointment, type InsertAppointment, 
  type Photo, type InsertPhoto, type Like, type InsertLike,
  type Comment, type InsertComment, type Message, type InsertMessage,
  type AppointmentSwapRequest, type InsertAppointmentSwapRequest,
  type PreAppointmentCheck, type InsertPreAppointmentCheck,
  type ClientResponse, type InsertClientResponse,
  type AccessCode, type InsertAccessCode,
  type Inventory, type InsertInventory,
  type AdminNotification, type InsertAdminNotification,
  type DailyEarnings, type InsertDailyEarnings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lte, or, ilike, sql, gte } from "drizzle-orm";

export interface IStorage {
  getClient(id: number): Promise<Client | undefined>;
  getClientByUniqueCode(uniqueCode: string): Promise<Client | undefined>;
  getClientByPersonalCode(personalCode: string): Promise<Client | undefined>;
  getClientByPhoneNumber(phoneNumber: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  
  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getClientAppointmentsForMonth(clientId: number, monthYear: string): Promise<Appointment[]>;
  hasClientBookedThisMonth(clientId: number, monthYear: string): Promise<boolean>;
  canClientBookAppointment(clientId: number, requestedDate: string): Promise<{ canBook: boolean; reason?: string }>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<void>;
  isTimeSlotTaken(date: string, time: string): Promise<boolean>;
  getClientAppointments(clientId: number): Promise<Appointment[]>;
  getClientPhotos(clientId: number): Promise<Photo[]>;
  
  // Photo methods
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getApprovedPhotos(): Promise<(Photo & { clientName: string })[]>;
  getPendingPhotos(): Promise<Photo[]>;
  approvePhoto(photoId: number): Promise<Photo>;
  rejectPhoto(photoId: number): Promise<Photo>;
  
  // Like methods
  toggleLike(photoId: number, clientId: number): Promise<{ liked: boolean; count: number }>;
  getPhotoLikes(photoId: number): Promise<number>;
  hasClientLiked(photoId: number, clientId: number): Promise<boolean>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getPhotoComments(photoId: number): Promise<(Comment & { clientName: string })[]>;
  deleteComment(commentId: number, clientId: number): Promise<void>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(clientId?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  
  // Appointment Swap Request methods
  createSwapRequest(swapRequest: InsertAppointmentSwapRequest): Promise<AppointmentSwapRequest>;
  getSwapRequestsForClient(clientId: number): Promise<AppointmentSwapRequest[]>;
  getAllSwapRequests(): Promise<AppointmentSwapRequest[]>;
  respondToSwapRequest(requestId: number, response: 'accepted' | 'rejected'): Promise<AppointmentSwapRequest>;
  getSwapRequestById(requestId: number): Promise<AppointmentSwapRequest | undefined>;
  getAppointmentsByClientAndDate(clientId: number, date: string): Promise<Appointment[]>;
  
  // Pre-Appointment Check methods
  createPreAppointmentCheck(check: InsertPreAppointmentCheck): Promise<PreAppointmentCheck>;
  getPreAppointmentCheckByAppointment(appointmentId: number): Promise<PreAppointmentCheck | undefined>;
  completePreAppointmentCheck(checkId: number, brokenNails: number, notes?: string): Promise<PreAppointmentCheck>;
  getTomorrowAppointmentsForPreCheck(): Promise<(Appointment & { clientName: string; hasCheck: boolean })[]>;
  
  // Access Code methods
  createAccessCode(accessCode: InsertAccessCode): Promise<AccessCode>;
  getAllAccessCodes(): Promise<AccessCode[]>;
  markAccessCodeAsUsed(uniqueCode: string, clientId: number): Promise<AccessCode>;
  deleteAccessCode(id: number): Promise<void>;
  getAccessCodeByUniqueCode(uniqueCode: string): Promise<AccessCode | undefined>;
  
  // Inventory methods
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  getAllInventory(): Promise<Inventory[]>;
  getInventoryByCategory(category: string): Promise<Inventory[]>;
  updateInventoryItem(id: number, updates: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventoryItem(id: number): Promise<void>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  getLowStockItems(): Promise<Inventory[]>;
  searchInventory(query: string): Promise<Inventory[]>;
  
  // Admin Notification methods
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getUnreadAdminNotifications(): Promise<AdminNotification[]>;
  getAllAdminNotifications(): Promise<AdminNotification[]>;
  markAdminNotificationAsRead(notificationId: number): Promise<AdminNotification>;

  // Client Response methods
  createClientResponse(response: InsertClientResponse): Promise<ClientResponse>;
  getUnprocessedClientResponses(): Promise<ClientResponse[]>;
  getClientResponsesByAppointment(appointmentId: number): Promise<ClientResponse[]>;
  markClientResponseAsProcessed(responseId: number): Promise<ClientResponse>;

  // Earnings methods
  getEarningsData(year: string, month?: string): Promise<{
    monthlyData: Array<{
      month: string;
      totalEarnings: number;
      appointmentCount: number;
      averagePrice: number;
    }>;
    serviceStats: Array<{
      service: string;
      count: number;
      totalEarnings: number;
      averagePrice: number;
    }>;
    totalEarnings: number;
    totalAppointments: number;
    averageMonthlyEarnings: number;
    topService: string;
  }>;


  // Daily earnings methods
  createDailyEarnings(earnings: InsertDailyEarnings): Promise<DailyEarnings>;
  getDailyEarnings(date: string): Promise<DailyEarnings | undefined>;
  updateDailyEarnings(date: string, amount: number, notes?: string): Promise<DailyEarnings>;
  getAllDailyEarnings(): Promise<DailyEarnings[]>;
  getDailyEarningsForMonth(year: string, month: string): Promise<DailyEarnings[]>;

}

export class DatabaseStorage implements IStorage {
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByUniqueCode(uniqueCode: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.uniqueCode, uniqueCode));
    return client || undefined;
  }

  async getClientByPersonalCode(personalCode: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.personalCode, personalCode));
    return client || undefined;
  }

  async getClientByPhoneNumber(phoneNumber: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.phoneNumber, phoneNumber));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getClientAppointmentsForMonth(clientId: number, monthYear: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.clientId, clientId),
        eq(appointments.monthYear, monthYear)
      ));
  }

  async hasClientBookedThisMonth(clientId: number, monthYear: string): Promise<boolean> {
    // Monthly limit removed - clients can book unlimited appointments
    return false;
  }

  async canClientBookAppointment(clientId: number, requestedDate: string): Promise<{ canBook: boolean; reason?: string }> {
    // Monthly limits and day restrictions removed - clients can book unlimited appointments
    // Only basic validation remains
    return { canBook: true };
  }

  // Photo methods
  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values(insertPhoto)
      .returning();
    return photo;
  }

  async getApprovedPhotos(): Promise<(Photo & { clientName: string })[]> {
    const result = await db
      .select({
        id: photos.id,
        clientId: photos.clientId,
        imageUrl: photos.imageUrl,
        description: photos.description,
        nailStyle: photos.nailStyle,
        status: photos.status,
        uploadedAt: photos.uploadedAt,
        approvedAt: photos.approvedAt,
        clientName: clients.fullName,
      })
      .from(photos)
      .innerJoin(clients, eq(photos.clientId, clients.id))
      .where(eq(photos.status, "approved"))
      .orderBy(desc(photos.approvedAt));
    
    return result;
  }

  async getPendingPhotos(): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.status, "pending")).orderBy(desc(photos.uploadedAt));
  }

  async approvePhoto(photoId: number): Promise<Photo> {
    const [photo] = await db
      .update(photos)
      .set({ 
        status: "approved",
        approvedAt: new Date()
      })
      .where(eq(photos.id, photoId))
      .returning();
    return photo;
  }

  async rejectPhoto(photoId: number): Promise<Photo> {
    const [photo] = await db
      .update(photos)
      .set({ status: "rejected" })
      .where(eq(photos.id, photoId))
      .returning();
    return photo;
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    return await db.select().from(appointments)
      .where(and(
        eq(appointments.appointmentDate, startOfDay),
      ));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async isTimeSlotTaken(date: string, time: string): Promise<boolean> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const existingAppointments = await db.select().from(appointments)
      .where(and(
        eq(appointments.appointmentDate, startOfDay),
        eq(appointments.appointmentTime, time)
      ));
    
    return existingAppointments.length > 0;
  }

  // Like methods
  async toggleLike(photoId: number, clientId: number): Promise<{ liked: boolean; count: number }> {
    // Check if already liked
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.photoId, photoId), eq(likes.clientId, clientId)));

    if (existingLike.length > 0) {
      // Remove like
      await db
        .delete(likes)
        .where(and(eq(likes.photoId, photoId), eq(likes.clientId, clientId)));
    } else {
      // Add like
      await db.insert(likes).values({ photoId, clientId });
    }

    // Get updated count
    const count = await this.getPhotoLikes(photoId);
    return { liked: existingLike.length === 0, count };
  }

  async getPhotoLikes(photoId: number): Promise<number> {
    const result = await db
      .select()
      .from(likes)
      .where(eq(likes.photoId, photoId));
    
    return result.length;
  }

  async hasClientLiked(photoId: number, clientId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.photoId, photoId), eq(likes.clientId, clientId)));
    
    return result.length > 0;
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getPhotoComments(photoId: number): Promise<(Comment & { clientName: string })[]> {
    const result = await db
      .select({
        id: comments.id,
        photoId: comments.photoId,
        clientId: comments.clientId,
        content: comments.content,
        createdAt: comments.createdAt,
        clientName: clients.fullName,
      })
      .from(comments)
      .innerJoin(clients, eq(comments.clientId, clients.id))
      .where(eq(comments.photoId, photoId))
      .orderBy(desc(comments.createdAt));
    
    return result;
  }

  async deleteComment(commentId: number, clientId: number): Promise<void> {
    await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.clientId, clientId)));
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessages(clientId?: number): Promise<Message[]> {
    if (clientId) {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.clientId, clientId))
        .orderBy(messages.timestamp);
    } else {
      return await db
        .select()
        .from(messages)
        .orderBy(messages.timestamp);
    }
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
  }

  // Appointment Swap Request methods
  async createSwapRequest(insertSwapRequest: InsertAppointmentSwapRequest): Promise<AppointmentSwapRequest> {
    const [swapRequest] = await db.insert(appointmentSwapRequests).values(insertSwapRequest).returning();
    return swapRequest;
  }

  async getSwapRequestsForClient(clientId: number): Promise<AppointmentSwapRequest[]> {
    return db.select().from(appointmentSwapRequests)
      .where(eq(appointmentSwapRequests.targetClientId, clientId))
      .orderBy(desc(appointmentSwapRequests.createdAt));
  }

  async getAllSwapRequests(): Promise<AppointmentSwapRequest[]> {
    return db.select().from(appointmentSwapRequests)
      .orderBy(desc(appointmentSwapRequests.createdAt));
  }

  async respondToSwapRequest(requestId: number, response: 'accepted' | 'rejected'): Promise<AppointmentSwapRequest> {
    const [swapRequest] = await db.update(appointmentSwapRequests)
      .set({ 
        status: response, 
        respondedAt: new Date() 
      })
      .where(eq(appointmentSwapRequests.id, requestId))
      .returning();
    
    // If accepted, perform the actual appointment swap
    if (response === 'accepted') {
      await this.performAppointmentSwap(requestId);
    }
    
    return swapRequest;
  }

  async performAppointmentSwap(requestId: number): Promise<void> {
    // Get the swap request details
    const swapRequest = await this.getSwapRequestById(requestId);
    if (!swapRequest) {
      throw new Error('Swap request not found');
    }

    // Get the specific appointments to be swapped
    const requesterAppointment = await db.select()
      .from(appointments)
      .where(eq(appointments.id, swapRequest.requesterAppointmentId))
      .limit(1);
    
    const targetAppointment = swapRequest.targetAppointmentId 
      ? await db.select()
          .from(appointments)
          .where(eq(appointments.id, swapRequest.targetAppointmentId))
          .limit(1)
      : [];

    if (requesterAppointment.length === 0 || targetAppointment.length === 0) {
      throw new Error('One or both appointments not found');
    }

    const requesterApt = requesterAppointment[0];
    const targetApt = targetAppointment[0];

    // Swap the appointment times and details
    await db.transaction(async (tx) => {
      // Update requester's appointment with target's time
      await tx
        .update(appointments)
        .set({
          appointmentTime: targetApt.appointmentTime,
          service: targetApt.service
        })
        .where(eq(appointments.id, requesterApt.id));

      // Update target's appointment with requester's time  
      await tx
        .update(appointments)
        .set({
          appointmentTime: requesterApt.appointmentTime,
          service: requesterApt.service
        })
        .where(eq(appointments.id, targetApt.id));
    });
  }

  async getSwapRequestById(requestId: number): Promise<AppointmentSwapRequest | undefined> {
    const [swapRequest] = await db.select().from(appointmentSwapRequests)
      .where(eq(appointmentSwapRequests.id, requestId));
    return swapRequest;
  }

  async getAppointmentsByClientAndDate(clientId: number, date: string): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(and(
        eq(appointments.clientId, clientId),
        eq(appointments.appointmentDate, new Date(date))
      ));
  }

  async createPreAppointmentCheck(insertCheck: InsertPreAppointmentCheck): Promise<PreAppointmentCheck> {
    const [preCheck] = await db.insert(preAppointmentChecks)
      .values({
        ...insertCheck,
        additionalCost: insertCheck.brokenNails * 200, // 2€ = 200 centesimi per unghia rotta
      })
      .returning();
    return preCheck;
  }

  async getPreAppointmentCheckByAppointment(appointmentId: number): Promise<PreAppointmentCheck | undefined> {
    const [check] = await db.select().from(preAppointmentChecks)
      .where(eq(preAppointmentChecks.appointmentId, appointmentId));
    return check;
  }

  async completePreAppointmentCheck(checkId: number, brokenNails: number, notes?: string): Promise<PreAppointmentCheck> {
    const [updatedCheck] = await db.update(preAppointmentChecks)
      .set({
        brokenNails,
        additionalCost: brokenNails * 200, // 2€ = 200 centesimi per unghia rotta
        notes,
        completed: true,
        completedAt: new Date(),
      })
      .where(eq(preAppointmentChecks.id, checkId))
      .returning();
    return updatedCheck;
  }

  async getTomorrowAppointmentsForPreCheck(): Promise<(Appointment & { clientName: string; hasCheck: boolean })[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointmentsWithClients = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        service: appointments.service,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        createdAt: appointments.appointmentDate,
        clientName: clients.fullName,
        hasCheck: preAppointmentChecks.id,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(preAppointmentChecks, eq(appointments.id, preAppointmentChecks.appointmentId))
      .where(eq(appointments.appointmentDate, new Date(tomorrowStr)));

    return appointmentsWithClients.map(apt => ({
      id: apt.id,
      clientId: apt.clientId,
      service: apt.service,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      monthYear: new Date(apt.appointmentDate).toISOString().slice(0, 7),
      clientName: apt.clientName || 'Cliente Sconosciuto',
      hasCheck: apt.hasCheck !== null,
    }));
  }

  // Access Code methods
  async createAccessCode(insertAccessCode: InsertAccessCode): Promise<AccessCode> {
    const [accessCode] = await db
      .insert(accessCodes)
      .values(insertAccessCode)
      .returning();
    return accessCode;
  }

  async getAllAccessCodes(): Promise<AccessCode[]> {
    return await db
      .select()
      .from(accessCodes)
      .orderBy(desc(accessCodes.createdAt));
  }

  async markAccessCodeAsUsed(uniqueCode: string, clientId: number): Promise<AccessCode> {
    const [accessCode] = await db
      .update(accessCodes)
      .set({ 
        isUsed: true, 
        usedAt: new Date(),
        usedByClientId: clientId 
      })
      .where(eq(accessCodes.uniqueCode, uniqueCode))
      .returning();
    return accessCode;
  }

  async deleteAccessCode(id: number): Promise<void> {
    await db
      .delete(accessCodes)
      .where(eq(accessCodes.id, id));
  }

  async getAccessCodeByUniqueCode(uniqueCode: string): Promise<AccessCode | undefined> {
    const [accessCode] = await db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.uniqueCode, uniqueCode));
    return accessCode || undefined;
  }

  // Inventory methods
  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [inventoryItem] = await db
      .insert(inventory)
      .values(item)
      .returning();
    return inventoryItem;
  }

  async getAllInventory(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.isActive, true))
      .orderBy(inventory.category, inventory.name);
  }

  async getInventoryByCategory(category: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.category, category), eq(inventory.isActive, true)))
      .orderBy(inventory.name);
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventory>): Promise<Inventory> {
    const [inventoryItem] = await db
      .update(inventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return inventoryItem;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db
      .update(inventory)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inventory.id, id));
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    const [inventoryItem] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
    return inventoryItem || undefined;
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.isActive, true),
        lte(inventory.quantity, inventory.minQuantity)
      ))
      .orderBy(inventory.category, inventory.name);
  }

  async searchInventory(query: string): Promise<Inventory[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.isActive, true),
        or(
          ilike(inventory.name, searchTerm),
          ilike(inventory.brand, searchTerm),
          ilike(inventory.color, searchTerm)
        )
      ))
      .orderBy(inventory.name);
  }
  async getClientAppointments(clientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getClientPhotos(clientId: number): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.clientId, clientId))
      .orderBy(desc(photos.uploadedAt));
  }

  // Admin Notification methods
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [adminNotification] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();
    return adminNotification;
  }

  // Client Response methods
  async createClientResponse(response: InsertClientResponse): Promise<ClientResponse> {
    const [clientResponse] = await db
      .insert(clientResponses)
      .values(response)
      .returning();
    return clientResponse;
  }

  async getUnprocessedClientResponses(): Promise<ClientResponse[]> {
    return await db
      .select()
      .from(clientResponses)
      .where(eq(clientResponses.processed, false))
      .orderBy(desc(clientResponses.receivedAt));
  }

  async getClientResponsesByAppointment(appointmentId: number): Promise<ClientResponse[]> {
    return await db
      .select()
      .from(clientResponses)
      .where(eq(clientResponses.appointmentId, appointmentId))
      .orderBy(desc(clientResponses.receivedAt));
  }

  async markClientResponseAsProcessed(responseId: number): Promise<ClientResponse> {
    const [updatedResponse] = await db
      .update(clientResponses)
      .set({ 
        processed: true, 
        processedAt: new Date() 
      })
      .where(eq(clientResponses.id, responseId))
      .returning();
    return updatedResponse;
  }

  async getUnreadAdminNotifications(): Promise<AdminNotification[]> {
    return await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.read, false))
      .orderBy(desc(adminNotifications.createdAt));
  }

  async getAllAdminNotifications(): Promise<AdminNotification[]> {
    return await db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt));
  }

  async markAdminNotificationAsRead(notificationId: number): Promise<AdminNotification> {
    const [adminNotification] = await db
      .update(adminNotifications)
      .set({ read: true })
      .where(eq(adminNotifications.id, notificationId))
      .returning();
    return adminNotification;
  }

  async getEarningsData(year: string, month?: string): Promise<{
    monthlyData: Array<{
      month: string;
      totalEarnings: number;
      appointmentCount: number;
      averagePrice: number;
    }>;
    serviceStats: Array<{
      service: string;
      count: number;
      totalEarnings: number;
      averagePrice: number;
    }>;
    totalEarnings: number;
    totalAppointments: number;
    averageMonthlyEarnings: number;
    topService: string;
  }> {
    try {
      // Filter for year and optionally month
      let query = db.select().from(appointments);
      
      if (month) {
        const monthYear = `${year}-${month.padStart(2, '0')}`;
        query = query.where(eq(appointments.monthYear, monthYear));
      } else {
        query = query.where(ilike(appointments.monthYear, `${year}-%`));
      }
      
      const appointmentData = await query;
      
      // Calculate monthly data
      const monthlyMap = new Map<string, { count: number; totalEarnings: number }>();
      
      appointmentData.forEach(apt => {
        const existing = monthlyMap.get(apt.monthYear) || { count: 0, totalEarnings: 0 };
        monthlyMap.set(apt.monthYear, {
          count: existing.count + 1,
          totalEarnings: existing.totalEarnings + (apt.price || 0)
        });
      });
      
      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          totalEarnings: data.totalEarnings,
          appointmentCount: data.count,
          averagePrice: data.count > 0 ? Math.round(data.totalEarnings / data.count) : 0
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Calculate service statistics
      const serviceMap = new Map<string, { count: number; totalEarnings: number }>();
      
      appointmentData.forEach(apt => {
        const existing = serviceMap.get(apt.service) || { count: 0, totalEarnings: 0 };
        serviceMap.set(apt.service, {
          count: existing.count + 1,
          totalEarnings: existing.totalEarnings + (apt.price || 0)
        });
      });
      
      const serviceStats = Array.from(serviceMap.entries())
        .map(([service, data]) => ({
          service,
          count: data.count,
          totalEarnings: data.totalEarnings,
          averagePrice: data.count > 0 ? Math.round(data.totalEarnings / data.count) : 0
        }))
        .sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      // Calculate totals
      const totalEarnings = appointmentData.reduce((sum, apt) => sum + (apt.price || 0), 0);
      const totalAppointments = appointmentData.length;
      const averageMonthlyEarnings = monthlyData.length > 0 
        ? Math.round(totalEarnings / monthlyData.length) 
        : 0;
      const topService = serviceStats.length > 0 ? serviceStats[0].service : 'N/A';
      
      return {
        monthlyData,
        serviceStats,
        totalEarnings,
        totalAppointments,
        averageMonthlyEarnings,
        topService
      };
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      return {
        monthlyData: [],
        serviceStats: [],
        totalEarnings: 0,
        totalAppointments: 0,
        averageMonthlyEarnings: 0,
        topService: 'N/A'
      };
    }
  }


  async createDailyEarnings(earnings: InsertDailyEarnings): Promise<DailyEarnings> {
    const [newEarnings] = await db.insert(dailyEarnings).values(earnings).returning();
    return newEarnings;
  }

  async getDailyEarnings(date: string): Promise<DailyEarnings | undefined> {
    const earnings = await db.select()
      .from(dailyEarnings)
      .where(eq(dailyEarnings.date, date))
      .limit(1);
    return earnings[0];
  }

  async updateDailyEarnings(date: string, amount: number, notes?: string): Promise<DailyEarnings> {
    const existing = await this.getDailyEarnings(date);
    
    if (existing) {
      const [updated] = await db.update(dailyEarnings)
        .set({ amount, notes, createdAt: new Date() })
        .where(eq(dailyEarnings.date, date))
        .returning();
      return updated;
    } else {
      return this.createDailyEarnings({ date, amount, notes });
    }
  }

  async getAllDailyEarnings(): Promise<DailyEarnings[]> {
    return db.select().from(dailyEarnings).orderBy(desc(dailyEarnings.date));
  }

  async getDailyEarningsForMonth(year: string, month: string): Promise<DailyEarnings[]> {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    return db.select()
      .from(dailyEarnings)
      .where(and(
        gte(dailyEarnings.date, startDate),
        lte(dailyEarnings.date, endDate)
      ))
      .orderBy(desc(dailyEarnings.date));
  }







}

class MemStorage implements IStorage {
  private clients: Map<number, Client> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private photos: Map<number, Photo> = new Map();
  private swapRequests: Map<number, AppointmentSwapRequest> = new Map();
  private adminNotifications: Map<number, AdminNotification> = new Map();
  private dailyEarnings: Map<number, DailyEarnings> = new Map();
  private nextId = 1;

  constructor() {
    // Inizializza clienti di test per demo
    this.initializeTestData();
  }

  private initializeTestData() {
    // Cliente 1 - Maria Rossi
    const maria: Client = {
      id: 1,
      uniqueCode: 'MARIA2024',
      personalCode: 'M123',
      fullName: 'Maria Rossi',
      phoneNumber: '+39 333 1234567',
      creditBalance: 0,
      advanceBalance: 0
    };
    this.clients.set(1, maria);

    // Cliente 2 - Giulia Bianchi  
    const giulia: Client = {
      id: 2,
      uniqueCode: 'GIULIA2024',
      personalCode: 'G456',
      fullName: 'Giulia Bianchi',
      phoneNumber: '+39 333 7654321',
      creditBalance: 0,
      advanceBalance: 0
    };
    this.clients.set(2, giulia);

    // Cliente 3 - Sara Verdi
    const sara: Client = {
      id: 3,
      uniqueCode: 'SARA2024',
      personalCode: 'S789',
      fullName: 'Sara Verdi',
      phoneNumber: '+39 333 9876543',
      creditBalance: 0,
      advanceBalance: 0
    };
    this.clients.set(3, sara);

    // Appuntamenti di test per gli scambi
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointment1: Appointment = {
      id: 1,
      clientId: 1,
      appointmentDate: tomorrow,
      appointmentTime: '10:00',
      service: 'Manicure Classica',
      monthYear: `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}`
    };
    this.appointments.set(1, appointment1);

    const appointment2: Appointment = {
      id: 2,
      clientId: 2,
      appointmentDate: nextWeek,
      appointmentTime: '14:00',
      service: 'Nail Art Decorata',
      monthYear: `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}`
    };
    this.appointments.set(2, appointment2);

    const appointment3: Appointment = {
      id: 3,
      clientId: 1,
      appointmentDate: nextWeek,
      appointmentTime: '16:00',
      service: 'Pedicure Spa',
      monthYear: `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}`
    };
    this.appointments.set(3, appointment3);

    // Foto di esempio in attesa di approvazione
    const photo1: Photo = {
      id: 1,
      clientId: 1,
      imageUrl: '/api/placeholder/400/400',
      description: 'Nail art rosa con glitter dorato',
      nailStyle: 'Nail Art Decorata',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 giorno fa
      approvedAt: null
    };
    this.photos.set(1, photo1);

    const photo2: Photo = {
      id: 2,
      clientId: 2,
      imageUrl: '/api/placeholder/400/400',
      description: 'Manicure francese con decorazioni floreali',
      nailStyle: 'Manicure Francese',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 ore fa
      approvedAt: null
    };
    this.photos.set(2, photo2);

    const photo3: Photo = {
      id: 3,
      clientId: 1,
      imageUrl: '/api/placeholder/400/400',
      description: 'Gel semipermanente rosso corallo',
      nailStyle: 'Gel Semipermanente',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 ore fa
      approvedAt: null
    };
    this.photos.set(3, photo3);

    const photo4: Photo = {
      id: 4,
      clientId: 2,
      imageUrl: '/api/placeholder/400/400',
      description: 'Ricostruzione con nail art geometrica',
      nailStyle: 'Ricostruzione',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore fa
      approvedAt: null
    };
    this.photos.set(4, photo4);

    const photo5: Photo = {
      id: 5,
      clientId: 1,
      imageUrl: '/api/placeholder/400/400',
      description: 'French con brillantini per le feste',
      nailStyle: 'Nail Art Speciale',
      status: 'approved',
      uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 giorni fa
      approvedAt: new Date(Date.now() - 36 * 60 * 60 * 1000) // approvata 1.5 giorni fa
    };
    this.photos.set(5, photo5);

    const photo6: Photo = {
      id: 6,
      clientId: 3,
      imageUrl: '/api/placeholder/400/400',
      description: 'Baby boomer con decorazioni delicate',
      nailStyle: 'Baby Boomer',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore fa
      approvedAt: null
    };
    this.photos.set(6, photo6);

    const photo7: Photo = {
      id: 7,
      clientId: 3,
      imageUrl: '/api/placeholder/400/400',
      description: 'Pedicure estiva con smalto corallo',
      nailStyle: 'Pedicure',
      status: 'pending',
      uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 ora fa
      approvedAt: null
    };
    this.photos.set(7, photo7);

    // Richieste di scambio di demo (cliente-cliente)
    const swapRequest1: AppointmentSwapRequest = {
      id: 1,
      requesterClientId: 1,
      requesterAppointmentId: 1,
      targetClientId: 2,
      targetAppointmentId: 2,
      requestMessage: 'Ciao Giulia! Potresti scambiare con me? Il tuo orario mi va molto meglio quella settimana. Grazie mille! 💅',
      requestType: 'client_swap',
      newSlotInfo: null,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore fa
      respondedAt: null
    };
    this.swapRequests.set(1, swapRequest1);

    const swapRequest2: AppointmentSwapRequest = {
      id: 2,
      requesterClientId: 2,
      requesterAppointmentId: 2,
      targetClientId: 1,
      targetAppointmentId: 3,
      requestMessage: 'Maria, scambiamo? Il pomeriggio mi andrebbe perfetto per questioni di lavoro!',
      requestType: 'client_swap',
      newSlotInfo: null,
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 ora fa
      respondedAt: null
    };
    this.swapRequests.set(2, swapRequest2);

    const swapRequest3: AppointmentSwapRequest = {
      id: 3,
      requesterClientId: 1,
      requesterAppointmentId: 3,
      targetClientId: 2,
      targetAppointmentId: 2,
      requestMessage: null,
      requestType: 'client_swap',
      newSlotInfo: null,
      status: 'accepted',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 ore fa
      respondedAt: new Date(Date.now() - 23 * 60 * 60 * 1000) // 23 ore fa
    };
    this.swapRequests.set(3, swapRequest3);

    // Richiesta di spostamento admin (esempio: admin sposta Maria in uno slot libero)
    const adminMoveRequest: AppointmentSwapRequest = {
      id: 4,
      requesterClientId: 1, // Maria viene spostata
      requesterAppointmentId: 1, // Il suo appuntamento attuale
      targetClientId: null, // Null per slot libero
      targetAppointmentId: null, // Null per slot libero
      requestMessage: 'Imprevisto familiare - devo spostare il tuo appuntamento in uno slot libero',
      requestType: 'admin_move',
      newSlotInfo: JSON.stringify({ 
        date: '2025-08-26', 
        time: '15:00', 
        service: 'Manicure Classica' 
      }),
      status: 'accepted',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ore fa
      respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 ore fa
    };
    this.swapRequests.set(4, adminMoveRequest);

    // Notifiche admin di demo
    const notification1: AdminNotification = {
      id: 1,
      type: 'swap_response',
      title: 'Richiesta Accettata',
      message: 'Maria Rossi ha accettato lo spostamento del suo appuntamento',
      relatedId: 4, // ID della richiesta di spostamento
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    };
    this.adminNotifications.set(1, notification1);

    // Notifica di accettazione scambio da Giulia Bianchi
    const notification2: AdminNotification = {
      id: 2,
      type: 'swap_accepted',
      title: 'Scambio Accettato ✅',
      message: 'Giulia Bianchi ha ACCETTATO la richiesta di scambio! Maria Rossi ora ha l\'appuntamento del 24/08 alle 14:00 (Nail Art), Giulia quello del 18/08 alle 10:00 (Manicure).',
      relatedId: 5, // ID della richiesta di scambio
      read: false,
      createdAt: new Date() // Appena creata
    };
    this.adminNotifications.set(2, notification2);

    this.nextId = 8; // Imposta il prossimo ID (7 foto + 1)
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByUniqueCode(uniqueCode: string): Promise<Client | undefined> {
    for (const client of Array.from(this.clients.values())) {
      if (client.uniqueCode === uniqueCode) return client;
    }
    return undefined;
  }

  async getClientByPersonalCode(personalCode: string): Promise<Client | undefined> {
    for (const client of Array.from(this.clients.values())) {
      if (client.personalCode === personalCode) return client;
    }
    return undefined;
  }

  async getClientByPhoneNumber(phoneNumber: string): Promise<Client | undefined> {
    for (const client of Array.from(this.clients.values())) {
      if (client.phoneNumber === phoneNumber) return client;
    }
    return undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const client: Client = {
      id: this.nextId++,
      ...insertClient,
      personalCode: insertClient.personalCode ?? null,
      creditBalance: insertClient.creditBalance ?? 0,
      advanceBalance: insertClient.advanceBalance ?? 0
    };
    this.clients.set(client.id, client);
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
    const client = this.clients.get(id);
    if (!client) throw new Error('Client not found');
    const updatedClient = { ...client, ...updates };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const appointment: Appointment = {
      id: this.nextId++,
      ...insertAppointment
    };
    this.appointments.set(appointment.id, appointment);
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getClientAppointments(clientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => apt.clientId === clientId);
  }

  async getClientAppointmentsForMonth(clientId: number, monthYear: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(apt => 
      apt.clientId === clientId && apt.monthYear === monthYear
    );
  }

  async hasClientBookedThisMonth(clientId: number, monthYear: string): Promise<boolean> {
    return false; // Monthly limits removed
  }

  async canClientBookAppointment(clientId: number, requestedDate: string): Promise<{ canBook: boolean; reason?: string }> {
    return { canBook: true }; // All restrictions removed
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const targetDate = new Date(date).toDateString();
    return Array.from(this.appointments.values()).filter(apt => 
      apt.appointmentDate.toDateString() === targetDate
    );
  }

  async deleteAppointment(id: number): Promise<void> {
    this.appointments.delete(id);
  }

  async isTimeSlotTaken(date: string, time: string): Promise<boolean> {
    const targetDate = new Date(date).toDateString();
    return Array.from(this.appointments.values()).some(apt => 
      apt.appointmentDate.toDateString() === targetDate && apt.appointmentTime === time
    );
  }

  async getClientPhotos(clientId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(p => p.clientId === clientId);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const photo: Photo = {
      id: this.nextId++,
      ...insertPhoto,
      description: insertPhoto.description ?? null,
      nailStyle: insertPhoto.nailStyle ?? null,
      status: insertPhoto.status ?? 'pending',
      uploadedAt: new Date(),
      approvedAt: null
    };
    this.photos.set(photo.id, photo);
    return photo;
  }

  async getApprovedPhotos(): Promise<(Photo & { clientName: string })[]> {
    return Array.from(this.photos.values())
      .filter(p => p.status === 'approved')
      .map(p => ({ ...p, clientName: p.nailStyle || 'Cliente Sconosciuto' }));
  }

  async getPendingPhotos(): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(p => p.status === 'pending');
  }

  async approvePhoto(photoId: number): Promise<Photo> {
    const photo = this.photos.get(photoId);
    if (!photo) throw new Error('Photo not found');
    const updatedPhoto = { ...photo, status: 'approved' as const, approvedAt: new Date() };
    this.photos.set(photoId, updatedPhoto);
    return updatedPhoto;
  }

  async rejectPhoto(photoId: number): Promise<Photo> {
    const photo = this.photos.get(photoId);
    if (!photo) throw new Error('Photo not found');
    const updatedPhoto = { ...photo, status: 'rejected' as const };
    this.photos.set(photoId, updatedPhoto);
    return updatedPhoto;
  }


  async toggleLike(): Promise<{ liked: boolean; count: number }> { return { liked: true, count: 1 }; }
  async getPhotoLikes(): Promise<number> { return 0; }
  async hasClientLiked(): Promise<boolean> { return false; }
  async createComment(): Promise<Comment> { throw new Error('Not implemented'); }
  async getPhotoComments(): Promise<(Comment & { clientName: string })[]> { return []; }
  async deleteComment(): Promise<void> {}
  async createMessage(): Promise<Message> { throw new Error('Not implemented'); }
  async getMessages(): Promise<Message[]> { return []; }
  async markMessageAsRead(): Promise<void> {}
  async createSwapRequest(insertSwapRequest: InsertAppointmentSwapRequest): Promise<AppointmentSwapRequest> {
    const swapRequest: AppointmentSwapRequest = {
      id: this.nextId++,
      ...insertSwapRequest,
      status: insertSwapRequest.status ?? 'pending',
      requestType: insertSwapRequest.requestType ?? 'client_swap',
      targetClientId: insertSwapRequest.targetClientId ?? null,
      targetAppointmentId: insertSwapRequest.targetAppointmentId ?? null,
      requestMessage: insertSwapRequest.requestMessage ?? null,
      newSlotInfo: insertSwapRequest.newSlotInfo ?? null,
      createdAt: new Date(),
      respondedAt: null
    };
    this.swapRequests.set(swapRequest.id, swapRequest);
    return swapRequest;
  }

  async getSwapRequestsForClient(clientId: number): Promise<AppointmentSwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(req => 
      req.requesterClientId === clientId || req.targetClientId === clientId
    );
  }

  async getAllSwapRequests(): Promise<AppointmentSwapRequest[]> {
    const swapRequests = Array.from(this.swapRequests.values());
    
    // Populate with client and appointment details
    return swapRequests.map(swap => {
      const requesterClient = this.clients.get(swap.requesterClientId);
      const targetClient = swap.targetClientId ? this.clients.get(swap.targetClientId) : null;
      const requesterAppointment = this.appointments.get(swap.requesterAppointmentId);
      const targetAppointment = swap.targetAppointmentId ? this.appointments.get(swap.targetAppointmentId) : null;
      
      return {
        ...swap,
        requesterClient: requesterClient ? {
          id: requesterClient.id,
          fullName: requesterClient.fullName
        } : null,
        targetClient: targetClient ? {
          id: targetClient.id,
          fullName: targetClient.fullName
        } : null,
        requesterAppointment: requesterAppointment ? {
          id: requesterAppointment.id,
          service: requesterAppointment.service,
          date: requesterAppointment.appointmentDate.toLocaleDateString('it-IT'),
          time: requesterAppointment.appointmentTime
        } : null,
        targetAppointment: targetAppointment ? {
          id: targetAppointment.id,
          service: targetAppointment.service,
          date: targetAppointment.appointmentDate.toLocaleDateString('it-IT'),
          time: targetAppointment.appointmentTime
        } : null
      };
    });
  }

  async respondToSwapRequest(requestId: number, response: 'accepted' | 'rejected'): Promise<AppointmentSwapRequest> {
    const swapRequest = this.swapRequests.get(requestId);
    if (!swapRequest) throw new Error('Swap request not found');
    
    swapRequest.status = response;
    swapRequest.respondedAt = new Date();
    
    if (response === 'accepted') {
      // Perform the actual swap logic - swap the clients between appointments
      const requesterApt = this.appointments.get(swapRequest.requesterAppointmentId);
      const targetApt = swapRequest.targetAppointmentId ? this.appointments.get(swapRequest.targetAppointmentId) : null;
      
      if (requesterApt && targetApt) {
        // Scambia i clientId degli appuntamenti
        const tempClientId = requesterApt.clientId;
        requesterApt.clientId = targetApt.clientId;
        targetApt.clientId = tempClientId;
        
        // Aggiorna gli appuntamenti nella mappa
        this.appointments.set(swapRequest.requesterAppointmentId, requesterApt);
        if (swapRequest.targetAppointmentId) {
          this.appointments.set(swapRequest.targetAppointmentId, targetApt);
        }
        
        console.log(`Scambio completato: Cliente ${targetApt.clientId} ora ha l'appuntamento del ${requesterApt.appointmentDate.toLocaleDateString('it-IT')} alle ${requesterApt.appointmentTime}`);
        console.log(`Scambio completato: Cliente ${requesterApt.clientId} ora ha l'appuntamento del ${targetApt.appointmentDate.toLocaleDateString('it-IT')} alle ${targetApt.appointmentTime}`);
      }
    }
    
    return swapRequest;
  }

  async getSwapRequestById(requestId: number): Promise<AppointmentSwapRequest | undefined> {
    return this.swapRequests.get(requestId);
  }

  async getAppointmentsByClientAndDate(clientId: number, date: string): Promise<Appointment[]> {
    const targetDate = new Date(date).toDateString();
    return Array.from(this.appointments.values()).filter(apt => 
      apt.clientId === clientId && apt.appointmentDate.toDateString() === targetDate
    );
  }
  async createPreAppointmentCheck(): Promise<PreAppointmentCheck> { throw new Error('Not implemented'); }
  async getPreAppointmentCheckByAppointment(): Promise<PreAppointmentCheck | undefined> { return undefined; }
  async completePreAppointmentCheck(): Promise<PreAppointmentCheck> { throw new Error('Not implemented'); }
  async getTomorrowAppointmentsForPreCheck(): Promise<(Appointment & { clientName: string; hasCheck: boolean })[]> { return []; }
  async createAccessCode(): Promise<AccessCode> { throw new Error('Not implemented'); }
  async getAllAccessCodes(): Promise<AccessCode[]> { return []; }
  async markAccessCodeAsUsed(): Promise<AccessCode> { throw new Error('Not implemented'); }
  async deleteAccessCode(): Promise<void> {}
  async getAccessCodeByUniqueCode(): Promise<AccessCode | undefined> { return undefined; }
  async createInventoryItem(): Promise<Inventory> { throw new Error('Not implemented'); }
  async getAllInventory(): Promise<Inventory[]> { return []; }
  async getInventoryByCategory(): Promise<Inventory[]> { return []; }
  async updateInventoryItem(): Promise<Inventory> { throw new Error('Not implemented'); }
  async deleteInventoryItem(): Promise<void> {}
  async getInventoryItem(): Promise<Inventory | undefined> { return undefined; }
  async getLowStockItems(): Promise<Inventory[]> { return []; }
  async searchInventory(): Promise<Inventory[]> { return []; }

  // Admin Notification methods
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const newNotification: AdminNotification = {
      ...notification,
      id: this.nextId++,
      read: notification.read ?? false,
      relatedId: notification.relatedId ?? null,
      createdAt: new Date()
    };
    this.adminNotifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getUnreadAdminNotifications(): Promise<AdminNotification[]> {
    return Array.from(this.adminNotifications.values())
      .filter(n => !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllAdminNotifications(): Promise<AdminNotification[]> {
    return Array.from(this.adminNotifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAdminNotificationAsRead(notificationId: number): Promise<AdminNotification> {
    const notification = this.adminNotifications.get(notificationId);
    if (!notification) throw new Error('Notification not found');
    
    notification.read = true;
    this.adminNotifications.set(notificationId, notification);
    return notification;
  }

  // Client Response methods (MemStorage)
  private clientResponses = new Map<number, ClientResponse>();

  async createClientResponse(response: InsertClientResponse): Promise<ClientResponse> {
    const newResponse: ClientResponse = {
      ...response,
      id: this.nextId++,
      processed: false,
      processedAt: null,
      receivedAt: new Date()
    };
    this.clientResponses.set(newResponse.id, newResponse);
    return newResponse;
  }

  async getUnprocessedClientResponses(): Promise<ClientResponse[]> {
    return Array.from(this.clientResponses.values())
      .filter(r => !r.processed)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  }

  async getClientResponsesByAppointment(appointmentId: number): Promise<ClientResponse[]> {
    return Array.from(this.clientResponses.values())
      .filter(r => r.appointmentId === appointmentId)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  }

  async markClientResponseAsProcessed(responseId: number): Promise<ClientResponse> {
    const response = this.clientResponses.get(responseId);
    if (!response) throw new Error('Response not found');
    
    response.processed = true;
    response.processedAt = new Date();
    this.clientResponses.set(responseId, response);
    return response;
  }

  async getEarningsData(year: string, month?: string): Promise<{
    monthlyData: Array<{ month: string; totalEarnings: number; appointmentCount: number; averagePrice: number; }>;
    serviceStats: Array<{ service: string; count: number; totalEarnings: number; averagePrice: number; }>;
    totalEarnings: number; totalAppointments: number; averageMonthlyEarnings: number; topService: string;
  }> {
    // Demo implementation for MemStorage
    return {
      monthlyData: [],
      serviceStats: [],
      totalEarnings: 0,
      totalAppointments: 0,
      averageMonthlyEarnings: 0,
      topService: 'N/A'
    };
  }


  async createDailyEarnings(earnings: InsertDailyEarnings): Promise<DailyEarnings> {
    const id = Math.max(0, ...Array.from(this.dailyEarnings.keys())) + 1;
    const newEarnings: DailyEarnings = {
      id,
      ...earnings,
      createdAt: new Date()
    };
    this.dailyEarnings.set(id, newEarnings);
    return newEarnings;
  }

  async getDailyEarnings(date: string): Promise<DailyEarnings | undefined> {
    return Array.from(this.dailyEarnings.values()).find(e => e.date === date);
  }

  async updateDailyEarnings(date: string, amount: number, notes?: string): Promise<DailyEarnings> {
    const existing = await this.getDailyEarnings(date);
    
    if (existing) {
      existing.amount = amount;
      if (notes !== undefined) existing.notes = notes;
      existing.createdAt = new Date();
      this.dailyEarnings.set(existing.id, existing);
      return existing;
    } else {
      return this.createDailyEarnings({ date, amount, notes });
    }
  }

  async getAllDailyEarnings(): Promise<DailyEarnings[]> {
    return Array.from(this.dailyEarnings.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getDailyEarningsForMonth(year: string, month: string): Promise<DailyEarnings[]> {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    return Array.from(this.dailyEarnings.values())
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }







}

// Create storage instances
const memStorage = new MemStorage();
const databaseStorage = new DatabaseStorage();

// Funzione per testare la connessione database
async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false;
    await databaseStorage.getAllClients();
    return true;
  } catch (error) {
    console.log('🔄 DATABASE NOT AVAILABLE - Using in-memory storage with test data');
    return false;
  }
}

// Use database storage now that database is connected
export const storage = databaseStorage;
export { db };
