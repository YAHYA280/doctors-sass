import * as fs from "fs";
import * as path from "path";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

// Load environment variables from .env or .env.local
function loadEnv() {
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            let value = valueParts.join("=");
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      }
      console.log(`Loaded environment from ${file}`);
      break;
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Helper to get date string
function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

// Helper to add minutes to time
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

async function seed() {
  console.log("Starting database seed...\n");

  try {
    // ============================================
    // 1. CREATE ADMIN USER
    // ============================================
    console.log("1. Creating admin user...");
    const adminPasswordHash = await hash("Admin123!", 12);

    let adminUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "admin@medibook.com"),
    });

    if (!adminUser) {
      [adminUser] = await db
        .insert(schema.users)
        .values({
          email: "admin@medibook.com",
          passwordHash: adminPasswordHash,
          role: "admin",
          isActive: true,
          emailVerified: new Date(),
        })
        .returning();
      console.log(`   ✓ Admin created: ${adminUser.email}`);
    } else {
      console.log(`   → Admin already exists: ${adminUser.email}`);
    }

    // ============================================
    // 2. CREATE DOCTOR USER
    // ============================================
    console.log("\n2. Creating doctor user...");
    const doctorPasswordHash = await hash("Demo123!", 12);

    let doctorUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "doctor@demo.com"),
    });

    if (!doctorUser) {
      [doctorUser] = await db
        .insert(schema.users)
        .values({
          email: "doctor@demo.com",
          passwordHash: doctorPasswordHash,
          role: "doctor",
          isActive: true,
          emailVerified: new Date(),
        })
        .returning();
      console.log(`   ✓ Doctor user created: ${doctorUser.email}`);
    } else {
      console.log(`   → Doctor user already exists: ${doctorUser.email}`);
    }

    // ============================================
    // 3. CREATE DOCTOR PROFILE
    // ============================================
    console.log("\n3. Creating doctor profile...");
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    let doctor = await db.query.doctors.findFirst({
      where: eq(schema.doctors.userId, doctorUser.id),
    });

    if (!doctor) {
      [doctor] = await db
        .insert(schema.doctors)
        .values({
          userId: doctorUser.id,
          slug: "sarah-johnson",
          fullName: "Sarah Johnson",
          specialty: "General Practitioner",
          bio: "Board-certified physician with over 15 years of experience in family medicine. Passionate about preventive care and patient education.",
          phone: "+1 (555) 123-4567",
          clinicName: "Johnson Family Practice",
          address: "123 Medical Center Dr, Suite 100, New York, NY 10001",
          subscriptionPlan: "premium",
          subscriptionStart: new Date(),
          subscriptionEnd: trialEnd,
          trialUsed: false,
          patientCountThisMonth: 0,
          brandColor: "#0A6847",
          welcomeMessage: "Welcome to Johnson Family Practice! We're committed to providing personalized healthcare for you and your family.",
          isActive: true,
        })
        .returning();
      console.log(`   ✓ Doctor profile created: Dr. ${doctor.fullName}`);
    } else {
      // Update slug and fullName if they have old format
      const updates: any = {};
      if (doctor.slug === "dr-sarah-johnson") {
        updates.slug = "sarah-johnson";
      }
      if (doctor.fullName?.startsWith("Dr. ")) {
        updates.fullName = doctor.fullName.replace("Dr. ", "");
      }

      if (Object.keys(updates).length > 0) {
        [doctor] = await db
          .update(schema.doctors)
          .set(updates)
          .where(eq(schema.doctors.id, doctor.id))
          .returning();
        console.log(`   ✓ Doctor profile updated: ${doctor.fullName} (slug: ${doctor.slug})`);
      } else {
        console.log(`   → Doctor profile already exists: Dr. ${doctor.fullName}`);
      }
    }

    // ============================================
    // 4. CREATE CLINIC
    // ============================================
    console.log("\n4. Creating clinic...");
    let clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.doctorId, doctor.id),
    });

    if (!clinic) {
      [clinic] = await db
        .insert(schema.clinics)
        .values({
          doctorId: doctor.id,
          name: "Johnson Family Practice",
          address: "123 Medical Center Dr, Suite 100, New York, NY 10001",
          phone: "+1 (555) 123-4567",
          workingHours: {
            monday: { open: "09:00", close: "17:00", isOpen: true },
            tuesday: { open: "09:00", close: "17:00", isOpen: true },
            wednesday: { open: "09:00", close: "13:00", isOpen: true },
            thursday: { open: "09:00", close: "17:00", isOpen: true },
            friday: { open: "09:00", close: "15:00", isOpen: true },
            saturday: { open: "00:00", close: "00:00", isOpen: false },
            sunday: { open: "00:00", close: "00:00", isOpen: false },
          },
          isDefault: true,
          isActive: true,
        })
        .returning();
      console.log(`   ✓ Clinic created: ${clinic.name}`);
    } else {
      console.log(`   → Clinic already exists: ${clinic.name}`);
    }

    // ============================================
    // 5. CREATE AVAILABILITY
    // ============================================
    console.log("\n5. Creating availability schedule...");
    const existingAvailability = await db.query.availability.findFirst({
      where: eq(schema.availability.doctorId, doctor.id),
    });

    if (!existingAvailability) {
      const availabilityData = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
        { dayOfWeek: 3, startTime: "09:00", endTime: "13:00", slotDuration: 30 },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
        { dayOfWeek: 5, startTime: "09:00", endTime: "15:00", slotDuration: 30 },
      ];

      for (const avail of availabilityData) {
        await db.insert(schema.availability).values({
          doctorId: doctor.id,
          clinicId: clinic.id,
          ...avail,
          isAvailable: true,
        });
      }
      console.log("   ✓ Availability created for Monday-Friday");
    } else {
      console.log("   → Availability already exists");
    }

    // ============================================
    // 6. CREATE SUBSCRIPTION
    // ============================================
    console.log("\n6. Creating subscription...");
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.doctorId, doctor.id),
    });

    if (!existingSubscription) {
      await db.insert(schema.subscriptions).values({
        doctorId: doctor.id,
        plan: "premium",
        status: "trialing",
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
      });
      console.log(`   ✓ Subscription created: Premium trial`);
    } else {
      console.log("   → Subscription already exists");
    }

    // ============================================
    // 7. CREATE SAMPLE PATIENTS
    // ============================================
    console.log("\n7. Creating sample patients...");

    const samplePatients = [
      {
        fullName: "John Smith",
        email: "john.smith@email.com",
        phone: "+1 (555) 234-5678",
        whatsappNumber: "+15552345678",
        dateOfBirth: "1985-03-15",
        gender: "male",
        medicalHistory: {
          conditions: ["Hypertension", "Type 2 Diabetes"],
          allergies: ["Penicillin"],
          medications: ["Metformin 500mg", "Lisinopril 10mg"],
          notes: "Regular checkups every 3 months for diabetes management",
        },
      },
      {
        fullName: "Emily Davis",
        email: "emily.davis@email.com",
        phone: "+1 (555) 345-6789",
        whatsappNumber: "+15553456789",
        dateOfBirth: "1990-07-22",
        gender: "female",
        medicalHistory: {
          conditions: ["Asthma"],
          allergies: [],
          medications: ["Albuterol inhaler"],
          notes: "Mild persistent asthma, well-controlled",
        },
      },
      {
        fullName: "Michael Brown",
        email: "michael.brown@email.com",
        phone: "+1 (555) 456-7890",
        whatsappNumber: "+15554567890",
        dateOfBirth: "1978-11-08",
        gender: "male",
        medicalHistory: {
          conditions: ["High Cholesterol", "Anxiety"],
          allergies: ["Sulfa drugs"],
          medications: ["Atorvastatin 20mg", "Sertraline 50mg"],
          notes: "Cholesterol well-managed with medication",
        },
      },
      {
        fullName: "Jessica Wilson",
        email: "jessica.wilson@email.com",
        phone: "+1 (555) 567-8901",
        whatsappNumber: "+15555678901",
        dateOfBirth: "1995-02-28",
        gender: "female",
        medicalHistory: {
          conditions: [],
          allergies: ["Latex"],
          medications: [],
          notes: "Healthy, annual wellness visits",
        },
      },
      {
        fullName: "Robert Martinez",
        email: "robert.martinez@email.com",
        phone: "+1 (555) 678-9012",
        whatsappNumber: "+15556789012",
        dateOfBirth: "1982-09-12",
        gender: "male",
        medicalHistory: {
          conditions: ["Chronic Back Pain", "Insomnia"],
          allergies: ["Aspirin", "Ibuprofen"],
          medications: ["Cyclobenzaprine 10mg", "Melatonin 5mg"],
          notes: "Physical therapy recommended",
        },
      },
      {
        fullName: "Amanda Taylor",
        email: "amanda.taylor@email.com",
        phone: "+1 (555) 789-0123",
        whatsappNumber: "+15557890123",
        dateOfBirth: "1988-06-05",
        gender: "female",
        medicalHistory: {
          conditions: ["Migraine"],
          allergies: [],
          medications: ["Sumatriptan 50mg PRN"],
          notes: "Migraines triggered by stress and lack of sleep",
        },
      },
    ];

    const createdPatients: any[] = [];

    for (const patientData of samplePatients) {
      let patient = await db.query.patients.findFirst({
        where: eq(schema.patients.email, patientData.email!),
      });

      if (!patient) {
        [patient] = await db
          .insert(schema.patients)
          .values({
            ...patientData,
            createdByDoctorId: doctor.id,
          })
          .returning();
        console.log(`   ✓ Patient created: ${patient.fullName}`);
      } else {
        console.log(`   → Patient exists: ${patient.fullName}`);
      }
      createdPatients.push(patient);
    }

    // Update patient count
    await db
      .update(schema.doctors)
      .set({ patientCountThisMonth: createdPatients.length })
      .where(eq(schema.doctors.id, doctor.id));

    // ============================================
    // 8. CREATE SAMPLE APPOINTMENTS
    // ============================================
    console.log("\n8. Creating sample appointments...");

    // Check if we should refresh appointments (delete and recreate)
    const refreshAppointments = process.argv.includes("--refresh");
    if (refreshAppointments) {
      console.log("   Refreshing appointments...");
      await db.delete(schema.appointments).where(eq(schema.appointments.doctorId, doctor.id));
    }

    const today = getDateString(0);
    const tomorrow = getDateString(1);
    const dayAfter = getDateString(2);
    const nextWeek = getDateString(7);

    const sampleAppointments = [
      // TODAY - Upcoming appointments
      {
        patientIndex: 0, // John Smith
        appointmentDate: today,
        timeSlot: "10:00",
        status: "confirmed" as const,
        reason: "Diabetes follow-up and blood pressure check",
        notes: "Review latest HbA1c results",
      },
      {
        patientIndex: 1, // Emily Davis
        appointmentDate: today,
        timeSlot: "11:00",
        status: "confirmed" as const,
        reason: "Asthma medication review",
        notes: "Patient reports increased symptoms",
      },
      {
        patientIndex: 2, // Michael Brown
        appointmentDate: today,
        timeSlot: "14:00",
        status: "pending" as const,
        reason: "Anxiety management consultation",
        notes: "Discuss therapy options",
      },
      // TOMORROW
      {
        patientIndex: 3, // Jessica Wilson
        appointmentDate: tomorrow,
        timeSlot: "09:30",
        status: "confirmed" as const,
        reason: "Annual wellness examination",
        notes: "Due for routine blood work",
      },
      {
        patientIndex: 4, // Robert Martinez
        appointmentDate: tomorrow,
        timeSlot: "11:00",
        status: "confirmed" as const,
        reason: "Back pain follow-up",
        notes: "Evaluate progress from physical therapy",
      },
      // DAY AFTER TOMORROW
      {
        patientIndex: 5, // Amanda Taylor
        appointmentDate: dayAfter,
        timeSlot: "10:30",
        status: "confirmed" as const,
        reason: "Migraine treatment evaluation",
        notes: "Review headache diary",
      },
      {
        patientIndex: 0, // John Smith (another visit)
        appointmentDate: dayAfter,
        timeSlot: "15:00",
        status: "pending" as const,
        reason: "Lab results discussion",
        notes: "Fasting glucose and lipid panel",
      },
      // NEXT WEEK
      {
        patientIndex: 1, // Emily Davis
        appointmentDate: nextWeek,
        timeSlot: "09:00",
        status: "confirmed" as const,
        reason: "Respiratory function test",
        notes: "Spirometry scheduled",
      },
      // PAST APPOINTMENTS (for history)
      {
        patientIndex: 2, // Michael Brown
        appointmentDate: getDateString(-3),
        timeSlot: "10:00",
        status: "completed" as const,
        reason: "Cholesterol medication adjustment",
        notes: "Increased Atorvastatin to 40mg",
      },
      {
        patientIndex: 4, // Robert Martinez
        appointmentDate: getDateString(-7),
        timeSlot: "14:30",
        status: "completed" as const,
        reason: "Initial back pain consultation",
        notes: "Referred to physical therapy",
      },
      {
        patientIndex: 5, // Amanda Taylor
        appointmentDate: getDateString(-5),
        timeSlot: "11:00",
        status: "cancelled" as const,
        reason: "Migraine follow-up",
        notes: "Patient rescheduled",
      },
    ];

    for (const aptData of sampleAppointments) {
      const patient = createdPatients[aptData.patientIndex];

      // Check if appointment already exists (skip check if refreshing)
      if (!refreshAppointments) {
        const existingApt = await db.query.appointments.findFirst({
          where: eq(schema.appointments.patientId, patient.id),
        });

        // Skip if this patient already has appointments (to avoid duplicates on re-run)
        if (existingApt && aptData.patientIndex === 0) {
          console.log("   → Appointments already exist, skipping... (use --refresh to recreate)");
          break;
        }
      }

      await db.insert(schema.appointments).values({
        doctorId: doctor.id,
        clinicId: clinic.id,
        patientId: patient.id,
        appointmentDate: aptData.appointmentDate,
        timeSlot: aptData.timeSlot,
        endTime: addMinutes(aptData.timeSlot, 30),
        duration: 30,
        status: aptData.status,
        reason: aptData.reason,
        notes: aptData.notes,
      });
      console.log(`   ✓ Appointment: ${patient.fullName} on ${aptData.appointmentDate} at ${aptData.timeSlot}`);
    }

    // ============================================
    // DONE!
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("  SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("\nLogin credentials:");
    console.log("  Doctor: doctor@demo.com / Demo123!");
    console.log("  Admin:  admin@medibook.com / Admin123!");
    console.log("\nBooking page:");
    console.log("  http://localhost:3000/dr/sarah-johnson");
    console.log("\nSample data created:");
    console.log(`  - ${createdPatients.length} patients with medical history`);
    console.log("  - Multiple appointments (past, today, upcoming)");
    console.log("");

  } catch (error) {
    console.error("\nSeed error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
