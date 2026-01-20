// Mock data for UI testing without database connection

export const MOCK_USERS = {
  doctor: {
    id: "doc-001",
    email: "doctor@demo.com",
    password: "Demo123!",
    role: "doctor",
    isActive: true,
  },
  admin: {
    id: "admin-001",
    email: "admin@demo.com",
    password: "Admin123!",
    role: "admin",
    isActive: true,
  },
};

export const MOCK_DOCTOR = {
  id: "doc-001",
  userId: "doc-001",
  fullName: "Dr. Sarah Johnson",
  email: "doctor@demo.com",
  specialty: "General Practitioner",
  phone: "+1 (555) 123-4567",
  bio: "Board-certified physician with over 15 years of experience in family medicine. Passionate about preventive care and patient education.",
  profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  clinicName: "Johnson Family Practice",
  address: "123 Medical Center Dr, Suite 100, New York, NY 10001",
  slug: "dr-sarah-johnson",
  subscriptionPlan: "premium",
  subscriptionStatus: "active",
  brandColor: "#0A6847",
  trialEndsAt: "2026-01-27T00:00:00.000Z", // Fixed date string to avoid hydration issues
  createdAt: "2024-01-15T00:00:00.000Z",
};

export const MOCK_PATIENTS = [
  {
    id: "pat-001",
    fullName: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 234-5678",
    dateOfBirth: "1985-03-15",
    gender: "male",
    medicalHistory: { allergies: ["Penicillin"], conditions: ["Hypertension"] },
    createdAt: "2024-06-01T00:00:00.000Z",
    lastVisit: "2024-12-15T00:00:00.000Z",
  },
  {
    id: "pat-002",
    fullName: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 345-6789",
    dateOfBirth: "1990-07-22",
    gender: "female",
    medicalHistory: { allergies: [], conditions: ["Asthma"] },
    createdAt: "2024-05-15T00:00:00.000Z",
    lastVisit: "2024-12-10T00:00:00.000Z",
  },
  {
    id: "pat-003",
    fullName: "Michael Brown",
    email: "michael.brown@email.com",
    phone: "+1 (555) 456-7890",
    dateOfBirth: "1978-11-08",
    gender: "male",
    medicalHistory: { allergies: ["Sulfa drugs"], conditions: ["Diabetes Type 2"] },
    createdAt: "2024-04-20T00:00:00.000Z",
    lastVisit: "2024-12-18T00:00:00.000Z",
  },
  {
    id: "pat-004",
    fullName: "Jessica Wilson",
    email: "jessica.wilson@email.com",
    phone: "+1 (555) 567-8901",
    dateOfBirth: "1995-02-28",
    gender: "female",
    medicalHistory: { allergies: [], conditions: [] },
    createdAt: "2024-07-10T00:00:00.000Z",
    lastVisit: "2024-12-20T00:00:00.000Z",
  },
  {
    id: "pat-005",
    fullName: "Robert Martinez",
    email: "robert.martinez@email.com",
    phone: "+1 (555) 678-9012",
    dateOfBirth: "1982-09-12",
    gender: "male",
    medicalHistory: { allergies: ["Aspirin"], conditions: ["High Cholesterol"] },
    createdAt: "2024-03-05T00:00:00.000Z",
    lastVisit: "2024-11-30T00:00:00.000Z",
  },
  {
    id: "pat-006",
    fullName: "Amanda Taylor",
    email: "amanda.taylor@email.com",
    phone: "+1 (555) 789-0123",
    dateOfBirth: "1988-06-05",
    gender: "female",
    medicalHistory: { allergies: [], conditions: ["Migraine"] },
    createdAt: "2024-08-15T00:00:00.000Z",
    lastVisit: "2024-12-22T00:00:00.000Z",
  },
];

// Use fixed dates for mock appointments to avoid hydration issues
export const MOCK_APPOINTMENTS = [
  {
    id: "apt-001",
    patientId: "pat-001",
    patientName: "John Smith",
    patientEmail: "john.smith@email.com",
    patientPhone: "+1 (555) 234-5678",
    appointmentDate: "2026-01-20",
    timeSlot: "09:00",
    duration: 30,
    status: "confirmed",
    reason: "Annual checkup",
    notes: "",
    createdAt: "2024-12-18T00:00:00.000Z",
  },
  {
    id: "apt-002",
    patientId: "pat-002",
    patientName: "Emily Davis",
    patientEmail: "emily.davis@email.com",
    patientPhone: "+1 (555) 345-6789",
    appointmentDate: "2026-01-20",
    timeSlot: "10:00",
    duration: 30,
    status: "confirmed",
    reason: "Asthma follow-up",
    notes: "Bring inhaler for review",
    createdAt: "2024-12-17T00:00:00.000Z",
  },
  {
    id: "apt-003",
    patientId: "pat-003",
    patientName: "Michael Brown",
    patientEmail: "michael.brown@email.com",
    patientPhone: "+1 (555) 456-7890",
    appointmentDate: "2026-01-20",
    timeSlot: "11:30",
    duration: 45,
    status: "pending",
    reason: "Diabetes management consultation",
    notes: "",
    createdAt: "2024-12-19T00:00:00.000Z",
  },
  {
    id: "apt-004",
    patientId: "pat-004",
    patientName: "Jessica Wilson",
    patientEmail: "jessica.wilson@email.com",
    patientPhone: "+1 (555) 567-8901",
    appointmentDate: "2026-01-21",
    timeSlot: "09:30",
    duration: 30,
    status: "confirmed",
    reason: "General consultation",
    notes: "",
    createdAt: "2024-12-20T00:00:00.000Z",
  },
  {
    id: "apt-005",
    patientId: "pat-005",
    patientName: "Robert Martinez",
    patientEmail: "robert.martinez@email.com",
    patientPhone: "+1 (555) 678-9012",
    appointmentDate: "2026-01-21",
    timeSlot: "14:00",
    duration: 30,
    status: "confirmed",
    reason: "Cholesterol review",
    notes: "Bring recent lab results",
    createdAt: "2024-12-19T00:00:00.000Z",
  },
  {
    id: "apt-006",
    patientId: "pat-006",
    patientName: "Amanda Taylor",
    patientEmail: "amanda.taylor@email.com",
    patientPhone: "+1 (555) 789-0123",
    appointmentDate: "2026-01-19",
    timeSlot: "15:00",
    duration: 30,
    status: "completed",
    reason: "Migraine treatment follow-up",
    notes: "Prescribed new medication",
    createdAt: "2024-12-15T00:00:00.000Z",
  },
  {
    id: "apt-007",
    patientId: "pat-001",
    patientName: "John Smith",
    patientEmail: "john.smith@email.com",
    patientPhone: "+1 (555) 234-5678",
    appointmentDate: "2026-01-17",
    timeSlot: "10:30",
    duration: 30,
    status: "completed",
    reason: "Blood pressure check",
    notes: "BP stable, continue current medication",
    createdAt: "2024-12-10T00:00:00.000Z",
  },
  {
    id: "apt-008",
    patientId: "pat-002",
    patientName: "Emily Davis",
    patientEmail: "emily.davis@email.com",
    patientPhone: "+1 (555) 345-6789",
    appointmentDate: "2026-01-15",
    timeSlot: "11:00",
    duration: 30,
    status: "cancelled",
    reason: "Routine checkup",
    notes: "Patient cancelled - rescheduled",
    createdAt: "2024-12-08T00:00:00.000Z",
  },
];

export const MOCK_AVAILABILITY = [
  { id: "av-001", dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30, isAvailable: true },
  { id: "av-002", dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDuration: 30, isAvailable: true },
  { id: "av-003", dayOfWeek: 3, startTime: "09:00", endTime: "13:00", slotDuration: 30, isAvailable: true },
  { id: "av-004", dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDuration: 30, isAvailable: true },
  { id: "av-005", dayOfWeek: 5, startTime: "09:00", endTime: "15:00", slotDuration: 30, isAvailable: true },
];

export const MOCK_TEAM_MEMBERS = [
  {
    id: "tm-001",
    email: "nurse.jane@clinic.com",
    role: "staff",
    status: "active",
    invitedAt: "2024-10-01T00:00:00.000Z",
    joinedAt: "2024-10-02T00:00:00.000Z",
    user: { id: "user-002", email: "nurse.jane@clinic.com" },
  },
  {
    id: "tm-002",
    email: "receptionist@clinic.com",
    role: "viewer",
    status: "active",
    invitedAt: "2024-11-15T00:00:00.000Z",
    joinedAt: "2024-11-16T00:00:00.000Z",
    user: { id: "user-003", email: "receptionist@clinic.com" },
  },
  {
    id: "tm-003",
    email: "assistant@clinic.com",
    role: "staff",
    status: "pending",
    invitedAt: "2024-12-20T00:00:00.000Z",
    joinedAt: null,
    user: null,
  },
];

export const MOCK_FORM_TEMPLATES = [
  {
    id: "form-001",
    name: "Patient Intake Form",
    description: "Standard intake form for new patients",
    isDefault: true,
    fields: [
      { id: "f1", type: "text", label: "Full Name", required: true },
      { id: "f2", type: "email", label: "Email Address", required: true },
      { id: "f3", type: "phone", label: "Phone Number", required: true },
      { id: "f4", type: "date", label: "Date of Birth", required: true },
      { id: "f5", type: "select", label: "Gender", required: true, options: ["Male", "Female", "Other"] },
      { id: "f6", type: "textarea", label: "Reason for Visit", required: true },
      { id: "f7", type: "textarea", label: "Current Medications", required: false },
      { id: "f8", type: "textarea", label: "Known Allergies", required: false },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
  },
  {
    id: "form-002",
    name: "Follow-up Visit Form",
    description: "Quick form for returning patients",
    isDefault: false,
    fields: [
      { id: "f1", type: "text", label: "Full Name", required: true },
      { id: "f2", type: "textarea", label: "Reason for Visit", required: true },
      { id: "f3", type: "textarea", label: "Updates Since Last Visit", required: false },
    ],
    createdAt: "2024-08-15T00:00:00.000Z",
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-001",
    type: "appointment",
    title: "New Appointment",
    message: "John Smith booked an appointment for today at 9:00 AM",
    isRead: false,
    createdAt: "2026-01-20T08:00:00.000Z",
  },
  {
    id: "notif-002",
    type: "reminder",
    title: "Upcoming Appointment",
    message: "You have 3 appointments scheduled for today",
    isRead: false,
    createdAt: "2026-01-20T06:00:00.000Z",
  },
  {
    id: "notif-003",
    type: "system",
    title: "Trial Reminder",
    message: "Your free trial ends in 7 days. Upgrade to continue using all features.",
    isRead: true,
    createdAt: "2026-01-19T10:00:00.000Z",
  },
];

// Admin mock data
export const MOCK_ADMIN_USERS = [
  {
    id: "user-001",
    email: "doctor@demo.com",
    role: "doctor",
    isActive: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    doctor: MOCK_DOCTOR,
  },
  {
    id: "user-002",
    email: "dr.mike@example.com",
    role: "doctor",
    isActive: true,
    createdAt: "2024-02-20T00:00:00.000Z",
    doctor: {
      fullName: "Dr. Michael Chen",
      specialty: "Pediatrics",
      subscriptionPlan: "advanced",
      subscriptionStatus: "active",
    },
  },
  {
    id: "user-003",
    email: "dr.lisa@example.com",
    role: "doctor",
    isActive: true,
    createdAt: "2024-03-10T00:00:00.000Z",
    doctor: {
      fullName: "Dr. Lisa Anderson",
      specialty: "Dermatology",
      subscriptionPlan: "free_trial",
      subscriptionStatus: "trialing",
    },
  },
  {
    id: "user-004",
    email: "dr.james@example.com",
    role: "doctor",
    isActive: false,
    createdAt: "2024-04-05T00:00:00.000Z",
    doctor: {
      fullName: "Dr. James Wilson",
      specialty: "Cardiology",
      subscriptionPlan: "premium",
      subscriptionStatus: "cancelled",
    },
  },
];

export const MOCK_ADMIN_ANALYTICS = {
  totalUsers: 156,
  activeUsers: 142,
  totalDoctors: 89,
  totalAppointments: 4523,
  monthlyRevenue: 8750,
  revenueGrowth: 12.5,
  userGrowth: 8.3,
  appointmentGrowth: 15.2,
  subscriptionBreakdown: {
    free_trial: 23,
    premium: 45,
    advanced: 21,
  },
  revenueByMonth: [
    { month: "Jul", revenue: 5200 },
    { month: "Aug", revenue: 5800 },
    { month: "Sep", revenue: 6100 },
    { month: "Oct", revenue: 6900 },
    { month: "Nov", revenue: 7500 },
    { month: "Dec", revenue: 8750 },
  ],
  usersByMonth: [
    { month: "Jul", users: 98 },
    { month: "Aug", users: 112 },
    { month: "Sep", users: 125 },
    { month: "Oct", users: 138 },
    { month: "Nov", users: 149 },
    { month: "Dec", users: 156 },
  ],
};

export const MOCK_SUPPORT_TICKETS = [
  {
    id: "ticket-001",
    userId: "user-002",
    userEmail: "dr.mike@example.com",
    subject: "Cannot access calendar feature",
    description: "I upgraded to premium but still cannot see the calendar integration option.",
    status: "open",
    priority: "high",
    createdAt: "2026-01-20T08:00:00.000Z",
    replies: [],
  },
  {
    id: "ticket-002",
    userId: "user-003",
    userEmail: "dr.lisa@example.com",
    subject: "Billing question",
    description: "I need a copy of my last invoice for tax purposes.",
    status: "in_progress",
    priority: "medium",
    createdAt: "2026-01-19T10:00:00.000Z",
    replies: [
      {
        id: "reply-001",
        message: "Hi Dr. Anderson, I've attached your invoice to this reply. Let me know if you need anything else!",
        isStaff: true,
        createdAt: "2026-01-19T18:00:00.000Z",
      },
    ],
  },
  {
    id: "ticket-003",
    userId: "user-001",
    userEmail: "doctor@demo.com",
    subject: "Feature request: SMS reminders",
    description: "Would be great to have SMS reminders in addition to WhatsApp.",
    status: "resolved",
    priority: "low",
    createdAt: "2026-01-15T10:00:00.000Z",
    replies: [
      {
        id: "reply-002",
        message: "Thank you for the suggestion! We've added this to our roadmap.",
        isStaff: true,
        createdAt: "2026-01-16T10:00:00.000Z",
      },
    ],
  },
];

export const MOCK_BLOCKED_SLOTS = [
  {
    id: "block-001",
    date: "2026-01-21",
    startTime: "12:00",
    endTime: "14:00",
    reason: "Lunch break",
    createdAt: "2024-12-01T00:00:00.000Z",
  },
];

// Dashboard analytics (aliased as MOCK_ANALYTICS for backward compatibility)
export const MOCK_DOCTOR_ANALYTICS = {
  overview: {
    totalAppointments: 127,
    completedAppointments: 98,
    cancelledAppointments: 12,
    noShowAppointments: 5,
    totalPatients: 45,
    newPatientsThisMonth: 8,
    averageAppointmentsPerDay: 4.2,
    completionRate: 85.2,
  },
  trends: {
    appointmentsByMonth: [
      { month: "Jul", count: 18 },
      { month: "Aug", count: 22 },
      { month: "Sep", count: 19 },
      { month: "Oct", count: 25 },
      { month: "Nov", count: 21 },
      { month: "Dec", count: 22 },
    ],
    appointmentsByDay: [
      { day: "Monday", count: 28 },
      { day: "Tuesday", count: 32 },
      { day: "Wednesday", count: 18 },
      { day: "Thursday", count: 30 },
      { day: "Friday", count: 19 },
    ],
    appointmentsByStatus: [
      { status: "completed", count: 98 },
      { status: "confirmed", count: 12 },
      { status: "pending", count: 5 },
      { status: "cancelled", count: 12 },
    ],
  },
  topMetrics: {
    busiestDay: "Tuesday",
    busiestTime: "10:00",
    averageWaitTime: 8,
    returningPatientRate: 67.5,
  },
};

// Alias for backward compatibility
export const MOCK_ANALYTICS = MOCK_DOCTOR_ANALYTICS;

// Check if mock mode is enabled
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || !process.env.DATABASE_URL;

// Mock data getter with type safety
export function getMockData<T>(key: string): T | null {
  const dataMap: Record<string, any> = {
    doctor: MOCK_DOCTOR,
    patients: MOCK_PATIENTS,
    appointments: MOCK_APPOINTMENTS,
    availability: MOCK_AVAILABILITY,
    teamMembers: MOCK_TEAM_MEMBERS,
    formTemplates: MOCK_FORM_TEMPLATES,
    notifications: MOCK_NOTIFICATIONS,
    doctorAnalytics: MOCK_DOCTOR_ANALYTICS,
    adminUsers: MOCK_ADMIN_USERS,
    adminAnalytics: MOCK_ADMIN_ANALYTICS,
    supportTickets: MOCK_SUPPORT_TICKETS,
  };
  return dataMap[key] || null;
}
