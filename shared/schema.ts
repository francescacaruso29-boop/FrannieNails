import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  uniqueCode: text("unique_code").notNull().unique(), // Codice univoco generato dall'admin
  personalCode: text("personal_code"), // Opzionale ora
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  creditBalance: integer("credit_balance").default(0).notNull(), // Soldi che avanzano alla cliente
  advanceBalance: integer("advance_balance").default(0).notNull(), // Soldi che la cliente ha anticipato
  isActive: boolean("is_active").default(true).notNull(), // Cliente attiva o disattivata
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  service: text("service").notNull(),
  price: integer("price").default(0).notNull(), // Prezzo in centesimi (es: 3500 = €35.00)
  monthYear: text("month_year").notNull(), // Format: "2025-01" for easy monthly checks
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  nailStyle: text("nail_style"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photos.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photos.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  text: text("text").notNull(),
  sender: text("sender").notNull(), // 'client' or 'frannie'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").default(false).notNull(),
});

export const appointmentSwapRequests = pgTable("appointment_swap_requests", {
  id: serial("id").primaryKey(),
  requesterClientId: integer("requester_client_id").notNull().references(() => clients.id),
  requesterAppointmentId: integer("requester_appointment_id").notNull().references(() => appointments.id),
  targetClientId: integer("target_client_id").references(() => clients.id), // Null per i riposizionamenti admin
  targetAppointmentId: integer("target_appointment_id").references(() => appointments.id), // Null per slot liberi
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  requestMessage: text("request_message"),
  requestType: text("request_type").notNull().default("client_swap"), // client_swap, admin_move
  newSlotInfo: text("new_slot_info"), // Info slot libero per admin_move (JSON)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

// Notifiche per admin quando clienti rispondono a richieste di spostamento
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // swap_response, appointment_booked, message_received, daily_earnings, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID della richiesta/appuntamento/messaggio correlato
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const preAppointmentChecks = pgTable("pre_appointment_checks", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  brokenNails: integer("broken_nails").default(0).notNull(), // Numero di unghie rotte
  additionalCost: integer("additional_cost").default(0).notNull(), // Costo aggiuntivo in centesimi
  notes: text("notes"), // Note aggiuntive sulla condizione delle unghie
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const clientResponses = pgTable("client_responses", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  responseMessage: text("response_message").notNull(), // "2", "3 unghie rotte", etc.
  brokenNailsCount: integer("broken_nails_count"), // parsed number
  responseType: text("response_type").notNull(), // 'pre_check_response', 'general_message'
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processed_at"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  phoneNumber: text("phone_number").notNull()
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
}).extend({
  uniqueCode: z.string().min(1, "Il codice è obbligatorio"),
  personalCode: z.string().optional().nullable(),
  fullName: z.string().min(2, "Nome e cognome sono obbligatori"),
  phoneNumber: z.string().min(8, "Numero di telefono non valido").max(15, "Numero di telefono troppo lungo"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true,
  approvedAt: true,
}).extend({
  description: z.string().optional(),
  nailStyle: z.string().optional(),
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Il commento non può essere vuoto"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSwapRequestSchema = createInsertSchema(appointmentSwapRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
}).extend({
  requestMessage: z.string().optional(),
});

export const insertPreAppointmentCheckSchema = createInsertSchema(preAppointmentChecks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  brokenNails: z.number().min(0, "Il numero di unghie rotte non può essere negativo").max(10, "Numero massimo di unghie rotte: 10"),
  notes: z.string().optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAppointmentSwapRequest = z.infer<typeof insertAppointmentSwapRequestSchema>;
export type AppointmentSwapRequest = typeof appointmentSwapRequests.$inferSelect;
export type InsertPreAppointmentCheck = z.infer<typeof insertPreAppointmentCheckSchema>;
export type PreAppointmentCheck = typeof preAppointmentChecks.$inferSelect;

export const insertClientResponseSchema = createInsertSchema(clientResponses).omit({
  id: true,
  receivedAt: true,
  processedAt: true,
});

export type InsertClientResponse = z.infer<typeof insertClientResponseSchema>;
export type ClientResponse = typeof clientResponses.$inferSelect;

// Access Codes table for tracking generated codes
export const accessCodes = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  uniqueCode: text("unique_code").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  usedByClientId: integer("used_by_client_id").references(() => clients.id),
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
});

export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;

// Inventory table for salon products management
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome del prodotto
  category: text("category").notNull(), // Categoria (smalti, strumenti, materiali, etc.)
  brand: text("brand"), // Marca del prodotto
  color: text("color"), // Colore (per smalti)
  quantity: integer("quantity").notNull().default(0), // Quantità disponibile
  minQuantity: integer("min_quantity").notNull().default(5), // Soglia minima per allerta
  price: integer("price").notNull().default(0), // Prezzo in centesimi
  supplier: text("supplier"), // Fornitore
  barcode: text("barcode"), // Codice a barre
  expiryDate: timestamp("expiry_date"), // Data di scadenza
  location: text("location"), // Posizione nel salone
  notes: text("notes"), // Note aggiuntive
  isActive: boolean("is_active").default(true).notNull(), // Prodotto attivo/disattivo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Il nome del prodotto è obbligatorio"),
  category: z.string().min(1, "La categoria è obbligatoria"),
  quantity: z.number().min(0, "La quantità non può essere negativa"),
  minQuantity: z.number().min(0, "La quantità minima non può essere negativa"),
  price: z.number().min(0, "Il prezzo non può essere negativo"),
  brand: z.string().optional(),
  color: z.string().optional(),
  supplier: z.string().optional(),
  barcode: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;

// Daily earnings table for tracking daily income
export const dailyEarnings = pgTable("daily_earnings", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // Format: "2025-01-15"
  amount: integer("amount").notNull(), // Guadagno in centesimi (es: 12500 = €125.00)
  notes: text("notes"), // Note opzionali per la giornata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDailyEarningsSchema = createInsertSchema(dailyEarnings).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.number().min(0, "Il guadagno non può essere negativo"),
  notes: z.string().optional(),
});

export type InsertDailyEarnings = z.infer<typeof insertDailyEarningsSchema>;
export type DailyEarnings = typeof dailyEarnings.$inferSelect;
