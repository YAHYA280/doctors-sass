import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, patients, appointments, formSubmissions, formTemplates } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { bookingSchema } from "@/lib/validators";
import { withRateLimit } from "@/lib/rate-limit";
import { formatDate, formatTime, addMinutesToTime } from "@/lib/utils";
import { sendAppointmentConfirmation, sendDoctorBookingAlert } from "@/services/whatsapp";
import { sendAppointmentConfirmationEmail } from "@/services/email";
import { triggerSlotBooked, triggerNewAppointment } from "@/services/pusher";
import { canAddPatient, canUseWhatsApp } from "@/constants/plans";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for booking
    const rateLimitResponse = await withRateLimit(request, "booking");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { doctorSlug, clinicId, formData, ...bookingData } = body;

    if (!doctorSlug) {
      return NextResponse.json(
        { success: false, error: "Doctor slug is required" },
        { status: 400 }
      );
    }

    // Validate booking data
    const validation = bookingSchema.safeParse(bookingData);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Get doctor
    const doctor = await db.query.doctors.findFirst({
      where: and(
        eq(doctors.slug, doctorSlug),
        eq(doctors.isActive, true)
      ),
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found or booking unavailable" },
        { status: 404 }
      );
    }

    // Check subscription validity
    const now = new Date();
    if (doctor.subscriptionEnd && new Date(doctor.subscriptionEnd) < now) {
      return NextResponse.json(
        { success: false, error: "This booking page is currently unavailable" },
        { status: 403 }
      );
    }

    // Check patient limit
    if (!canAddPatient(doctor.subscriptionPlan, doctor.patientCountThisMonth || 0)) {
      return NextResponse.json(
        { success: false, error: "This doctor cannot accept new patients at this time" },
        { status: 403 }
      );
    }

    // Check if slot is available
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.doctorId, doctor.id),
        eq(appointments.appointmentDate, validation.data.appointmentDate),
        eq(appointments.timeSlot, validation.data.timeSlot),
        sql`${appointments.status} NOT IN ('cancelled')`
      ),
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available" },
        { status: 400 }
      );
    }

    // Create or find patient
    let patient = await db.query.patients.findFirst({
      where: and(
        eq(patients.whatsappNumber, validation.data.whatsappNumber),
        eq(patients.createdByDoctorId, doctor.id)
      ),
    });

    const editToken = uuidv4();
    const editTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (!patient) {
      // Create new patient
      [patient] = await db
        .insert(patients)
        .values({
          fullName: validation.data.fullName,
          email: validation.data.email || null,
          phone: validation.data.phone || null,
          whatsappNumber: validation.data.whatsappNumber,
          createdByDoctorId: doctor.id,
          editToken,
          editTokenExpiry,
        })
        .returning();

      // Increment patient count
      await db
        .update(doctors)
        .set({
          patientCountThisMonth: (doctor.patientCountThisMonth || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, doctor.id));
    } else {
      // Update existing patient with new edit token
      await db
        .update(patients)
        .set({
          editToken,
          editTokenExpiry,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, patient.id));
    }

    // Create appointment
    const appointmentEditToken = uuidv4();
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        doctorId: doctor.id,
        clinicId: clinicId || null,
        patientId: patient.id,
        appointmentDate: validation.data.appointmentDate,
        timeSlot: validation.data.timeSlot,
        endTime: addMinutesToTime(validation.data.timeSlot, 30),
        duration: 30,
        status: "pending",
        reason: validation.data.reason,
        editToken: appointmentEditToken,
      })
      .returning();

    // Save form submission if form data provided
    if (formData) {
      const defaultForm = await db.query.formTemplates.findFirst({
        where: and(
          eq(formTemplates.doctorId, doctor.id),
          eq(formTemplates.isDefault, true)
        ),
      });

      if (defaultForm) {
        await db.insert(formSubmissions).values({
          formTemplateId: defaultForm.id,
          appointmentId: newAppointment.id,
          patientId: patient.id,
          data: formData,
        });
      }
    }

    // Generate edit link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const editLink = `${appUrl}/appointment/manage/${appointmentEditToken}`;

    // Send notifications
    const notificationData = {
      patientName: validation.data.fullName,
      doctorName: doctor.fullName,
      clinicName: doctor.clinicName || undefined,
      date: formatDate(validation.data.appointmentDate),
      time: formatTime(validation.data.timeSlot),
      editLink,
    };

    // Send WhatsApp confirmation to patient (if plan allows)
    if (canUseWhatsApp(doctor.subscriptionPlan)) {
      await sendAppointmentConfirmation(validation.data.whatsappNumber, notificationData);

      // Send WhatsApp alert to doctor
      if (doctor.phone) {
        await sendDoctorBookingAlert(doctor.phone, {
          patientName: validation.data.fullName,
          patientPhone: validation.data.whatsappNumber,
          date: notificationData.date,
          time: notificationData.time,
          reason: validation.data.reason,
        });
      }
    }

    // Send email confirmation if email provided
    if (validation.data.email) {
      await sendAppointmentConfirmationEmail(validation.data.email, notificationData);
    }

    // Trigger real-time updates
    await triggerSlotBooked(doctorSlug, {
      date: validation.data.appointmentDate,
      timeSlot: validation.data.timeSlot,
      patientName: validation.data.fullName,
    });

    await triggerNewAppointment(doctor.id, {
      appointmentId: newAppointment.id,
      patientName: validation.data.fullName,
      date: notificationData.date,
      time: notificationData.time,
      reason: validation.data.reason,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: newAppointment.id,
        editLink,
        message: "Appointment booked successfully! You will receive a confirmation shortly.",
      },
    });
  } catch (error) {
    console.error("Submit booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
