import { z } from "zod";

// Auth validators
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  specialty: z.string().optional(),
});

// Doctor profile validators
export const doctorProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  specialty: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  phone: z.string().optional(),
  clinicName: z.string().optional(),
  address: z.string().optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  welcomeMessage: z.string().max(200, "Welcome message must be less than 200 characters").optional(),
});

// Clinic validators
export const clinicSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  workingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    isOpen: z.boolean(),
  })).optional(),
});

// Availability validators
export const availabilitySchema = z.object({
  clinicId: z.string().uuid().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  slotDuration: z.number().min(15).max(120).default(30),
  isAvailable: z.boolean().default(true),
});

export const blockedSlotSchema = z.object({
  clinicId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  reason: z.string().optional(),
  isAllDay: z.boolean().default(false),
});

// Patient validators
export const patientSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

// Appointment validators
export const appointmentSchema = z.object({
  clinicId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  duration: z.number().min(15).max(120).default(30),
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  cancelReason: z.string().optional(),
});

// Booking validators (public)
export const bookingSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().min(10, "WhatsApp number is required for notifications"),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  reason: z.string().min(5, "Please describe your reason for visit"),
  formData: z.record(z.any()).optional(),
});

// Form template validators
export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "textarea", "select", "checkbox", "radio", "date", "file", "email", "phone", "number"]),
  label: z.string().min(1, "Field label is required"),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  conditionalLogic: z.object({
    showIf: z.object({
      fieldId: z.string(),
      operator: z.enum(["equals", "notEquals", "contains"]),
      value: z.string(),
    }),
  }).optional(),
  order: z.number(),
});

export const formTemplateSchema = z.object({
  formName: z.string().min(2, "Form name must be at least 2 characters"),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, "At least one field is required"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

// Support ticket validators
export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const ticketReplySchema = z.object({
  message: z.string().min(5, "Reply must be at least 5 characters"),
});

// Admin validators
export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["admin", "doctor", "patient"]).optional(),
  isActive: z.boolean().optional(),
});

export const bulkOperationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["activate", "deactivate", "delete"]),
});

// Subscription validators
export const subscriptionUpdateSchema = z.object({
  plan: z.enum(["free_trial", "premium", "advanced"]),
});

// Notification preferences
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  whatsappNotifications: z.boolean(),
  appointmentReminders: z.boolean(),
  marketingEmails: z.boolean(),
});

// Search and filter validators
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
export type ClinicInput = z.infer<typeof clinicSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type BlockedSlotInput = z.infer<typeof blockedSlotSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;
export type FormTemplateInput = z.infer<typeof formTemplateSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
