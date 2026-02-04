import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, doctors, availability, blockedSlots } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { sendAppointmentCancellation } from "@/services/whatsapp";
import { sendEmail } from "@/services/email";
import { triggerSlotCancelled } from "@/services/pusher";

export const dynamic = "force-dynamic";

const MODIFY_WINDOW_HOURS = 8;

// GET - Fetch appointment details by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find appointment by edit token
    const [appointment] = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        doctor: {
          fullName: doctors.fullName,
          specialty: doctors.specialty,
          clinicName: doctors.clinicName,
          address: doctors.address,
          phone: doctors.phone,
          brandColor: doctors.brandColor,
          slug: doctors.slug,
        },
        patient: {
          fullName: patients.fullName,
          email: patients.email,
          phone: patients.phone,
        },
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.editToken, token));

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Calculate if appointment can be modified
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.timeSlot}`);
    const modifyDeadline = new Date(appointment.createdAt);
    modifyDeadline.setHours(modifyDeadline.getHours() + MODIFY_WINDOW_HOURS);

    const canModify = new Date() < modifyDeadline && appointmentDateTime > new Date();

    // Get available slots for rescheduling if allowed
    let availableSlots: { date: string; slots: string[] }[] = [];

    if (canModify) {
      // Get doctor's availability for next 14 days
      const doctorResult = await db
        .select()
        .from(doctors)
        .where(eq(doctors.slug, appointment.doctor.slug));

      if (doctorResult.length > 0) {
        const doctorId = doctorResult[0].id;

        const doctorAvailability = await db
          .select()
          .from(availability)
          .where(and(eq(availability.doctorId, doctorId), eq(availability.isAvailable, true)));

        const blocked = await db
          .select()
          .from(blockedSlots)
          .where(eq(blockedSlots.doctorId, doctorId));

        const existingAppointments = await db
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.doctorId, doctorId),
              ne(appointments.status, "cancelled"),
              ne(appointments.id, appointment.id)
            )
          );

        // Generate available slots for next 14 days
        for (let i = 1; i <= 14; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const dayOfWeek = date.getDay();

          const dayAvailability = doctorAvailability.filter(
            (a) => a.dayOfWeek === dayOfWeek
          );

          if (dayAvailability.length === 0) continue;

          const dayBlocked = blocked.filter((b) => b.date === dateStr);
          const dayAppointments = existingAppointments.filter(
            (a) => a.appointmentDate === dateStr
          );

          const slots: string[] = [];

          for (const avail of dayAvailability) {
            const startHour = parseInt(avail.startTime.split(":")[0]);
            const startMin = parseInt(avail.startTime.split(":")[1]);
            const endHour = parseInt(avail.endTime.split(":")[0]);
            const endMin = parseInt(avail.endTime.split(":")[1]);
            const duration = avail.slotDuration || 30;

            let currentHour = startHour;
            let currentMin = startMin;

            while (
              currentHour < endHour ||
              (currentHour === endHour && currentMin < endMin)
            ) {
              const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;

              const isBlocked = dayBlocked.some(
                (b) => b.startTime <= timeStr && b.endTime > timeStr
              );
              const isBooked = dayAppointments.some((a) => a.timeSlot === timeStr);

              if (!isBlocked && !isBooked) {
                slots.push(timeStr);
              }

              currentMin += duration;
              if (currentMin >= 60) {
                currentHour += Math.floor(currentMin / 60);
                currentMin = currentMin % 60;
              }
            }
          }

          if (slots.length > 0) {
            availableSlots.push({ date: dateStr, slots });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        // Map to expected field names for frontend compatibility
        date: appointment.appointmentDate,
        time: appointment.timeSlot,
        canModify,
        modifyDeadline: modifyDeadline.toISOString(),
        availableSlots,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH - Reschedule appointment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newDate, newTime } = body;

    if (!token || !newDate || !newTime) {
      return NextResponse.json(
        { success: false, error: "Token, new date, and new time are required" },
        { status: 400 }
      );
    }

    // Find appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.editToken, token));

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if can modify
    const modifyDeadline = new Date(appointment.createdAt);
    modifyDeadline.setHours(modifyDeadline.getHours() + MODIFY_WINDOW_HOURS);

    if (new Date() > modifyDeadline) {
      return NextResponse.json(
        { success: false, error: "Modification window has expired" },
        { status: 403 }
      );
    }

    // Check if slot is available
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, appointment.doctorId),
          eq(appointments.appointmentDate, newDate),
          eq(appointments.timeSlot, newTime),
          ne(appointments.status, "cancelled"),
          ne(appointments.id, appointment.id)
        )
      );

    if (existingAppointment.length > 0) {
      return NextResponse.json(
        { success: false, error: "This slot is no longer available" },
        { status: 400 }
      );
    }

    const oldDate = appointment.appointmentDate;
    const oldTime = appointment.timeSlot;

    // Update appointment
    const [updated] = await db
      .update(appointments)
      .set({
        appointmentDate: newDate,
        timeSlot: newTime,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id))
      .returning();

    // Get doctor and patient info
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, appointment.doctorId));

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, appointment.patientId));

    // Trigger real-time update
    if (doctor) {
      await triggerSlotCancelled(doctor.slug, { date: oldDate, timeSlot: oldTime });
    }

    // Send notification email
    if (patient?.email) {
      await sendEmail({
        to: patient.email,
        subject: "Appointment Rescheduled",
        html: `
          <h2>Your appointment has been rescheduled</h2>
          <p>Dear ${patient.fullName},</p>
          <p>Your appointment with Dr. ${doctor?.fullName} has been rescheduled.</p>
          <p><strong>New Date:</strong> ${new Date(newDate).toLocaleDateString()}</p>
          <p><strong>New Time:</strong> ${newTime}</p>
          <p>If you need to make any changes, please use your appointment management link.</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Appointment rescheduled successfully",
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reschedule appointment" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel appointment
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.editToken, token));

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if can modify
    const modifyDeadline = new Date(appointment.createdAt);
    modifyDeadline.setHours(modifyDeadline.getHours() + MODIFY_WINDOW_HOURS);

    if (new Date() > modifyDeadline) {
      return NextResponse.json(
        { success: false, error: "Modification window has expired" },
        { status: 403 }
      );
    }

    // Update appointment status
    const [updated] = await db
      .update(appointments)
      .set({
        status: "cancelled",
        cancelReason: reason || "Cancelled by patient",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id))
      .returning();

    // Get doctor and patient info
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, appointment.doctorId));

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, appointment.patientId));

    // Trigger real-time update
    if (doctor) {
      await triggerSlotCancelled(doctor.slug, { date: appointment.appointmentDate, timeSlot: appointment.timeSlot });
    }

    // Send notifications
    if (patient) {
      // Send WhatsApp if available
      if (patient.phone) {
        await sendAppointmentCancellation(patient.phone, {
          patientName: patient.fullName,
          doctorName: doctor?.fullName || "Doctor",
          date: appointment.appointmentDate,
          time: appointment.timeSlot,
        });
      }

      // Send email
      if (patient.email) {
        await sendEmail({
          to: patient.email,
          subject: "Appointment Cancelled",
          html: `
            <h2>Your appointment has been cancelled</h2>
            <p>Dear ${patient.fullName},</p>
            <p>Your appointment with Dr. ${doctor?.fullName} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.timeSlot} has been cancelled.</p>
            <p>If you need to book a new appointment, please visit the booking page.</p>
          `,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
