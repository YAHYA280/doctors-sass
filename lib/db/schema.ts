import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
  jsonb,
  pgEnum,
  time,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "doctor", "patient"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free_trial", "premium", "advanced"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "cancelled", "completed"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "past_due", "trialing"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const notificationTypeEnum = pgEnum("notification_type", ["appointment", "subscription", "system", "reminder"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("doctor"),
  emailVerified: timestamp("email_verified"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 100 }),
  bio: text("bio"),
  profileImage: text("profile_image"),
  phone: varchar("phone", { length: 20 }),
  clinicName: varchar("clinic_name", { length: 255 }),
  address: text("address"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("free_trial").notNull(),
  subscriptionStart: timestamp("subscription_start").defaultNow(),
  subscriptionEnd: timestamp("subscription_end"),
  trialUsed: boolean("trial_used").default(false),
  patientCountThisMonth: integer("patient_count_this_month").default(0),
  monthlyResetDate: date("monthly_reset_date"),
  isActive: boolean("is_active").default(true),
  brandColor: varchar("brand_color", { length: 7 }).default("#0A6847"),
  welcomeMessage: text("welcome_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clinics table
export const clinics = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  workingHours: jsonb("working_hours").$type<{
    [key: string]: { open: string; close: string; isOpen: boolean };
  }>(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patients table
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 20 }),
  medicalHistory: jsonb("medical_history").$type<{
    conditions?: string[];
    allergies?: string[];
    medications?: string[];
    notes?: string;
  }>(),
  createdByDoctorId: uuid("created_by_doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  editToken: uuid("edit_token").defaultRandom(),
  editTokenExpiry: timestamp("edit_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }).notNull(),
  appointmentDate: date("appointment_date").notNull(),
  timeSlot: time("time_slot").notNull(),
  endTime: time("end_time"),
  duration: integer("duration").default(30), // minutes
  status: appointmentStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  reason: text("reason"),
  cancelReason: text("cancel_reason"),
  editToken: uuid("edit_token").defaultRandom(),
  reminderSent24h: boolean("reminder_sent_24h").default(false),
  reminderSent1h: boolean("reminder_sent_1h").default(false),
  whatsappConfirmationSent: boolean("whatsapp_confirmation_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Form templates table
export const formTemplates = pgTable("form_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  formName: varchar("form_name", { length: 255 }).notNull(),
  description: text("description"),
  fields: jsonb("fields").$type<FormField[]>().notNull(),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Form field type
export type FormField = {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date" | "file" | "email" | "phone" | "number";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf: {
      fieldId: string;
      operator: "equals" | "notEquals" | "contains";
      value: string;
    };
  };
  order: number;
};

// Form submissions table
export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formTemplateId: uuid("form_template_id").references(() => formTemplates.id, { onDelete: "set null" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, any>>().notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Availability table
export const availability = pgTable("availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, Sunday-Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotDuration: integer("slot_duration").default(30), // minutes
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blocked slots table
export const blockedSlots = pgTable("blocked_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  clinicId: uuid("clinic_id").references(() => clinics.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  reason: text("reason"),
  isAllDay: boolean("is_all_day").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<Record<string, any>>(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull().unique(),
  plan: subscriptionPlanEnum("plan").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  status: subscriptionStatusEnum("status").default("trialing").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ticket replies table
export const ticketReplies = pgTable("ticket_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  isStaff: boolean("is_staff").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team members table (for Premium+ doctors)
export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("staff"), // 'admin', 'staff', 'viewer'
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'active', 'inactive'
  permissions: jsonb("permissions").$type<string[]>().default([]),
  inviteToken: uuid("invite_token"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  joinedAt: timestamp("joined_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit log for compliance
export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
  clinics: many(clinics),
  appointments: many(appointments),
  patients: many(patients),
  formTemplates: many(formTemplates),
  availability: many(availability),
  blockedSlots: many(blockedSlots),
  subscription: one(subscriptions, {
    fields: [doctors.id],
    references: [subscriptions.doctorId],
  }),
  teamMembers: many(teamMembers),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [clinics.doctorId],
    references: [doctors.id],
  }),
  appointments: many(appointments),
  availability: many(availability),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  createdByDoctor: one(doctors, {
    fields: [patients.createdByDoctorId],
    references: [doctors.id],
  }),
  appointments: many(appointments),
  formSubmissions: many(formSubmissions),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  formSubmissions: many(formSubmissions),
}));

export const formTemplatesRelations = relations(formTemplates, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [formTemplates.doctorId],
    references: [doctors.id],
  }),
  submissions: many(formSubmissions),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  formTemplate: one(formTemplates, {
    fields: [formSubmissions.formTemplateId],
    references: [formTemplates.id],
  }),
  appointment: one(appointments, {
    fields: [formSubmissions.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [formSubmissions.patientId],
    references: [patients.id],
  }),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  doctor: one(doctors, {
    fields: [availability.doctorId],
    references: [doctors.id],
  }),
  clinic: one(clinics, {
    fields: [availability.clinicId],
    references: [clinics.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  doctor: one(doctors, {
    fields: [subscriptions.doctorId],
    references: [doctors.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  replies: many(ticketReplies),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketReplies.ticketId],
    references: [supportTickets.id],
  }),
  user: one(users, {
    fields: [ticketReplies.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type FormTemplate = typeof formTemplates.$inferSelect;
export type NewFormTemplate = typeof formTemplates.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
export type NewBlockedSlot = typeof blockedSlots.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type NewTicketReply = typeof ticketReplies.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
