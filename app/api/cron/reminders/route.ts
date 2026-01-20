import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, doctors } from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { sendAppointmentReminder } from "@/services/whatsapp";
import { sendAppointmentReminderEmail } from "@/services/email";
import { formatDate, formatTime } from "@/lib/utils";
import { canUseWhatsApp } from "@/constants/plans";

// This endpoint should be called by a cron service (e.g., Vercel Cron)
// Schedule: Every hour
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Get date strings
    const today = now.toISOString().split("T")[0];
    const tomorrow = in24Hours.toISOString().split("T")[0];

    // Find appointments needing 24-hour reminder
    const appointments24h = await db
      .select({
        appointment: appointments,
        patient: patients,
        doctor: doctors,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(
        and(
          eq(appointments.appointmentDate, tomorrow),
          eq(appointments.reminderSent24h, false),
          sql`${appointments.status} NOT IN ('cancelled', 'completed')`
        )
      );

    // Find appointments needing 1-hour reminder
    const currentHour = now.getHours().toString().padStart(2, "0");
    const nextHour = (now.getHours() + 1).toString().padStart(2, "0");
    const timeRangeStart = `${nextHour}:00`;
    const timeRangeEnd = `${nextHour}:59`;

    const appointments1h = await db
      .select({
        appointment: appointments,
        patient: patients,
        doctor: doctors,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(
        and(
          eq(appointments.appointmentDate, today),
          eq(appointments.reminderSent1h, false),
          gte(appointments.timeSlot, timeRangeStart),
          lte(appointments.timeSlot, timeRangeEnd),
          sql`${appointments.status} NOT IN ('cancelled', 'completed')`
        )
      );

    let sent24h = 0;
    let sent1h = 0;

    // Send 24-hour reminders
    for (const { appointment, patient, doctor } of appointments24h) {
      const reminderData = {
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        date: formatDate(appointment.appointmentDate),
        time: formatTime(appointment.timeSlot),
        hoursUntil: 24,
      };

      // Send WhatsApp if enabled
      if (patient.whatsappNumber && canUseWhatsApp(doctor.subscriptionPlan)) {
        await sendAppointmentReminder(patient.whatsappNumber, reminderData);
      }

      // Send email if available
      if (patient.email) {
        await sendAppointmentReminderEmail(patient.email, reminderData);
      }

      // Mark as sent
      await db
        .update(appointments)
        .set({ reminderSent24h: true })
        .where(eq(appointments.id, appointment.id));

      sent24h++;
    }

    // Send 1-hour reminders
    for (const { appointment, patient, doctor } of appointments1h) {
      const reminderData = {
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        date: formatDate(appointment.appointmentDate),
        time: formatTime(appointment.timeSlot),
        hoursUntil: 1,
      };

      // Send WhatsApp if enabled
      if (patient.whatsappNumber && canUseWhatsApp(doctor.subscriptionPlan)) {
        await sendAppointmentReminder(patient.whatsappNumber, reminderData);
      }

      // Send email if available
      if (patient.email) {
        await sendAppointmentReminderEmail(patient.email, reminderData);
      }

      // Mark as sent
      await db
        .update(appointments)
        .set({ reminderSent1h: true })
        .where(eq(appointments.id, appointment.id));

      sent1h++;
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent24h} 24-hour reminders and ${sent1h} 1-hour reminders`,
      data: {
        reminders24h: sent24h,
        reminders1h: sent1h,
      },
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
