import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE_SERVER, MOCK_APPOINTMENTS, MOCK_PATIENTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Mock mode - return next upcoming appointment from mock data
    if (IS_MOCK_MODE_SERVER) {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // Filter for upcoming appointments (confirmed or pending, date >= today)
      const upcomingAppointments = MOCK_APPOINTMENTS
        .filter((apt) => {
          // Must be confirmed or pending
          if (apt.status !== "confirmed" && apt.status !== "pending") {
            return false;
          }
          // Must be today or in the future
          if (apt.appointmentDate < today) {
            return false;
          }
          // If today, must be in the future time-wise
          if (apt.appointmentDate === today && apt.timeSlot < currentTime) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by date first, then by time
          const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
          if (dateCompare !== 0) return dateCompare;
          return a.timeSlot.localeCompare(b.timeSlot);
        });

      if (upcomingAppointments.length === 0) {
        return NextResponse.json({
          success: true,
          data: null,
          message: "No upcoming appointments",
        });
      }

      const nextApt = upcomingAppointments[0];
      const patient = MOCK_PATIENTS.find((p) => p.id === nextApt.patientId);

      return NextResponse.json({
        success: true,
        data: {
          id: nextApt.id,
          appointmentDate: nextApt.appointmentDate,
          timeSlot: nextApt.timeSlot,
          duration: nextApt.duration,
          status: nextApt.status,
          reason: nextApt.reason,
          notes: nextApt.notes,
          patient: {
            id: nextApt.patientId,
            fullName: nextApt.patientName,
            email: nextApt.patientEmail,
            phone: nextApt.patientPhone,
            gender: patient?.gender,
            dateOfBirth: patient?.dateOfBirth,
            medicalHistory: patient?.medicalHistory,
          },
        },
      });
    }

    // Real mode - check session
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { appointments, patients } = await import("@/lib/db/schema");
    const { eq, and, gte, or, asc, sql } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Query for the next upcoming appointment
    // - Status is 'confirmed' or 'pending'
    // - Date is >= today
    // - If date is today, time must be >= current time
    const nextAppointment = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        duration: appointments.duration,
        status: appointments.status,
        reason: appointments.reason,
        notes: appointments.notes,
        patient: {
          id: patients.id,
          fullName: patients.fullName,
          email: patients.email,
          phone: patients.phone,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          medicalHistory: patients.medicalHistory,
        },
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          eq(appointments.doctorId, session.user.doctorId),
          or(
            eq(appointments.status, "confirmed"),
            eq(appointments.status, "pending")
          ),
          or(
            // Future dates
            sql`${appointments.appointmentDate} > ${today}`,
            // Or today with future time
            and(
              sql`${appointments.appointmentDate} = ${today}`,
              sql`${appointments.timeSlot} >= ${currentTime}`
            )
          )
        )
      )
      .orderBy(asc(appointments.appointmentDate), asc(appointments.timeSlot))
      .limit(1);

    if (nextAppointment.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No upcoming appointments",
      });
    }

    return NextResponse.json({
      success: true,
      data: nextAppointment[0],
    });
  } catch (error) {
    console.error("Get next appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch next appointment" },
      { status: 500 }
    );
  }
}
