import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      doctorId?: string;
      doctorSlug?: string;
      subscriptionPlan?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    role: string;
    doctorId?: string;
    doctorSlug?: string;
    subscriptionPlan?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    role: string;
    doctorId?: string;
    doctorSlug?: string;
    subscriptionPlan?: string;
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Stats types
export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalAppointments: number;
  openTickets: number;
  userGrowth: number;
  revenueGrowth: number;
}

export interface DoctorStats {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  patientGrowth: number;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  subscriptions: number;
}

export interface UserGrowthData {
  date: string;
  total: number;
  new: number;
}

// Calendar types
export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  appointmentId?: string;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
  isBlocked: boolean;
  blockReason?: string;
}

// Notification types
export interface NotificationData {
  appointmentId?: string;
  patientName?: string;
  doctorName?: string;
  date?: string;
  time?: string;
  action?: string;
  url?: string;
}

// WhatsApp types
export interface WhatsAppMessage {
  to: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  message?: string;
}

// Form Builder types
export interface FormFieldDragItem {
  id: string;
  type: string;
  index: number;
}

export interface ConditionalRule {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: string | number;
  action: "show" | "hide" | "require";
}

// Subscription types
export interface SubscriptionInfo {
  plan: "free_trial" | "premium" | "advanced";
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  daysRemaining?: number;
}

// Appointment with relations
export interface AppointmentWithDetails {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes?: string;
  reason?: string;
  patient: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
  };
  clinic?: {
    id: string;
    name: string;
    address?: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    specialty?: string;
  };
}

// Support Ticket with details
export interface TicketWithDetails {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: Date;
  user: {
    id: string;
    email: string;
  };
  assignee?: {
    id: string;
    email: string;
  };
  replies: {
    id: string;
    message: string;
    isStaff: boolean;
    createdAt: Date;
    user: {
      email: string;
    };
  }[];
}

// Booking page data
export interface DoctorPublicProfile {
  slug: string;
  fullName: string;
  specialty?: string;
  bio?: string;
  profileImage?: string;
  clinicName?: string;
  address?: string;
  brandColor: string;
  welcomeMessage?: string;
  clinics: {
    id: string;
    name: string;
    address?: string;
  }[];
}

// Analytics types
export interface AnalyticsOverview {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  patients: {
    total: number;
    new: number;
    returning: number;
  };
  revenue?: {
    total: number;
    growth: number;
  };
}

export interface AppointmentTrend {
  period: string;
  appointments: number;
  completed: number;
  cancelled: number;
}

// Team member types
export interface TeamMemberWithUser {
  id: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  user: {
    id: string;
    email: string;
  };
}
