import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE, MOCK_APPOINTMENTS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE) {
      let filteredAppointments = [...MOCK_APPOINTMENTS];

      // Apply filters
      if (status) {
        filteredAppointments = filteredAppointments.filter(a => a.status === status);
      }
      if (startDate) {
        filteredAppointments = filteredAppointments.filter(a => a.appointmentDate >= startDate);
      }
      if (endDate) {
        filteredAppointments = filteredAppointments.filter(a => a.appointmentDate <= endDate);
      }

      // Sort by date and time descending
      filteredAppointments.sort((a, b) => {
        const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
        if (dateCompare !== 0) return dateCompare;
        return b.timeSlot.localeCompare(a.timeSlot);
      });

      const total = filteredAppointments.length;
      const paginatedAppointments = filteredAppointments.slice((page - 1) * limit, page * limit);

      // Transform to expected format
      const appointmentList = paginatedAppointments.map(apt => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        timeSlot: apt.timeSlot,
        endTime: calculateEndTime(apt.timeSlot, apt.duration),
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
        reason: apt.reason,
        createdAt: apt.createdAt,
        patient: {
          id: apt.patientId,
          fullName: apt.patientName,
          email: apt.patientEmail,
          phone: apt.patientPhone,
          whatsappNumber: apt.patientPhone,
        },
        clinic: {
          id: "clinic-001",
          name: "Johnson Family Practice",
          address: "123 Medical Center Dr",
        },
      }));

      return NextResponse.json({
        success: true,
        data: appointmentList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
    const { appointments, patients, clinics } = await import("@/lib/db/schema");
    const { eq, desc, and, gte, lte, count } = await import("drizzle-orm");

    const offset = (page - 1) * limit;
    const conditions = [eq(appointments.doctorId, session.user.doctorId)];

    if (status) {
      conditions.push(eq(appointments.status, status as any));
    }
    if (startDate) {
      conditions.push(gte(appointments.appointmentDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(appointments.appointmentDate, endDate));
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(appointments)
      .where(and(...conditions));

    const appointmentList = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        endTime: appointments.endTime,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        reason: appointments.reason,
        createdAt: appointments.createdAt,
        patient: {
          id: patients.id,
          fullName: patients.fullName,
          email: patients.email,
          phone: patients.phone,
          whatsappNumber: patients.whatsappNumber,
        },
        clinic: {
          id: clinics.id,
          name: clinics.name,
          address: clinics.address,
        },
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(clinics, eq(appointments.clinicId, clinics.id))
      .where(and(...conditions))
      .orderBy(desc(appointments.appointmentDate), desc(appointments.timeSlot))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: appointmentList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, ...updateData } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - bypass session check and return success
    if (IS_MOCK_MODE) {
      const appointment = MOCK_APPOINTMENTS.find(a => a.id === appointmentId);
      if (!appointment) {
        return NextResponse.json(
          { success: false, error: "Appointment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...appointment,
          ...updateData,
          updatedAt: new Date(),
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
    const { appointments, doctors } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { appointmentStatusSchema } = await import("@/lib/validators");
    const { formatDate, formatTime } = await import("@/lib/utils");
    const { sendAppointmentStatusUpdate, sendAppointmentCancellation } = await import("@/services/whatsapp");
    const { triggerAppointmentUpdated, triggerSlotCancelled } = await import("@/services/pusher");
    const { canUseWhatsApp } = await import("@/constants/plans");

    const validation = appointmentStatusSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update data" },
        { status: 400 }
      );
    }

    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.doctorId, session.user.doctorId)
      ),
      with: {
        patient: true,
        doctor: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, session.user.doctorId),
    });

    if (doctor && canUseWhatsApp(doctor.subscriptionPlan)) {
      const patient = existingAppointment.patient;

      if (patient.whatsappNumber) {
        if (validation.data.status === "cancelled") {
          await sendAppointmentCancellation(patient.whatsappNumber, {
            patientName: patient.fullName,
            doctorName: doctor.fullName,
            date: formatDate(existingAppointment.appointmentDate),
            time: formatTime(existingAppointment.timeSlot),
          });

          await triggerSlotCancelled(doctor.slug, {
            date: existingAppointment.appointmentDate,
            timeSlot: existingAppointment.timeSlot,
          });
        } else {
          await sendAppointmentStatusUpdate(patient.whatsappNumber, {
            patientName: patient.fullName,
            status: validation.data.status,
            date: formatDate(existingAppointment.appointmentDate),
            time: formatTime(existingAppointment.timeSlot),
          });
        }
      }
    }

    await triggerAppointmentUpdated(session.user.doctorId, {
      appointmentId,
      status: validation.data.status,
      patientName: existingAppointment.patient.fullName,
    });

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mock mode - bypass session check
    if (IS_MOCK_MODE) {
      const newAppointment = {
        id: `apt-${Date.now()}`,
        doctorId: "doc-001",
        ...body,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: newAppointment,
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
    const { appointments } = await import("@/lib/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");
    const { appointmentSchema } = await import("@/lib/validators");

    const validation = appointmentSchema.safeParse(body);
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

    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.doctorId, session.user.doctorId),
        eq(appointments.appointmentDate, validation.data.appointmentDate),
        eq(appointments.timeSlot, validation.data.timeSlot),
        sql`${appointments.status} NOT IN ('cancelled')`
      ),
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        doctorId: session.user.doctorId,
        ...validation.data,
        status: "confirmed",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newAppointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

// Helper function
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}
