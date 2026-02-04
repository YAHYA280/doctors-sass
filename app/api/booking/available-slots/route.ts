import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE_SERVER, MOCK_DOCTOR, MOCK_AVAILABILITY, MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { getTimeSlots } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorSlug = searchParams.get("doctorSlug");
    const date = searchParams.get("date");
    const clinicId = searchParams.get("clinicId");

    if (!doctorSlug || !date) {
      return NextResponse.json(
        { success: false, error: "Doctor slug and date are required" },
        { status: 400 }
      );
    }

    // Mock mode - return mock available slots
    if (IS_MOCK_MODE_SERVER) {
      if (doctorSlug !== MOCK_DOCTOR.slug) {
        return NextResponse.json(
          { success: false, error: "Doctor not found" },
          { status: 404 }
        );
      }

      // Get day of week (0-6, Sunday-Saturday)
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      // Find availability for this day
      const dayAvailability = MOCK_AVAILABILITY.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isAvailable
      );

      if (!dayAvailability) {
        return NextResponse.json({
          success: true,
          data: {
            date,
            slots: [],
            isAvailable: false,
          },
        });
      }

      // Generate all possible time slots
      const allSlots = getTimeSlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        dayAvailability.slotDuration || 30
      );

      // Check which slots are booked in mock data
      const bookedSlots = MOCK_APPOINTMENTS
        .filter((apt) => apt.appointmentDate === date && apt.status !== "cancelled")
        .map((apt) => apt.timeSlot);

      // Check if slot is in the past
      const now = new Date();

      const availableSlots = allSlots.map((slot) => {
        const slotDateTime = new Date(`${date}T${slot}`);
        const isPast = slotDateTime <= now;
        const isBooked = bookedSlots.includes(slot);

        return {
          time: slot,
          isAvailable: !isBooked && !isPast,
          isBlocked: false,
          isBooked,
          isPast,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          date,
          slots: availableSlots,
          isAvailable: availableSlots.some((s) => s.isAvailable),
        },
      });
    }

    // Real mode - query database
    const { db } = await import("@/lib/db");
    const { doctors, availability, blockedSlots, appointments } = await import("@/lib/db/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // Get doctor
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.slug, doctorSlug),
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Get day of week (0-6, Sunday-Saturday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Get availability for this day
    const conditions = [
      eq(availability.doctorId, doctor.id),
      eq(availability.dayOfWeek, dayOfWeek),
      eq(availability.isAvailable, true),
    ];

    if (clinicId) {
      conditions.push(eq(availability.clinicId, clinicId));
    }

    const dayAvailability = await db.query.availability.findFirst({
      where: and(...conditions),
    });

    if (!dayAvailability) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          slots: [],
          isAvailable: false,
        },
      });
    }

    // Generate all possible time slots
    const allSlots = getTimeSlots(
      dayAvailability.startTime,
      dayAvailability.endTime,
      dayAvailability.slotDuration || 30
    );

    // Get blocked slots for this date
    const blockedSlotsForDate = await db.query.blockedSlots.findMany({
      where: and(
        eq(blockedSlots.doctorId, doctor.id),
        eq(blockedSlots.date, date)
      ),
    });

    // Get existing appointments for this date
    const existingAppointments = await db
      .select({
        timeSlot: appointments.timeSlot,
        endTime: appointments.endTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          eq(appointments.appointmentDate, date),
          sql`${appointments.status} NOT IN ('cancelled')`
        )
      );

    // Filter available slots
    const availableSlots = allSlots.map((slot) => {
      // Check if slot is blocked
      const isBlocked = blockedSlotsForDate.some((blocked) => {
        if (blocked.isAllDay) return true;
        const slotMinutes = parseInt(slot.split(":")[0]) * 60 + parseInt(slot.split(":")[1]);
        const blockStartMinutes = parseInt(blocked.startTime.split(":")[0]) * 60 + parseInt(blocked.startTime.split(":")[1]);
        const blockEndMinutes = parseInt(blocked.endTime.split(":")[0]) * 60 + parseInt(blocked.endTime.split(":")[1]);
        return slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes;
      });

      // Check if slot is already booked
      const isBooked = existingAppointments.some(
        (apt) => apt.timeSlot === slot
      );

      // Check if slot is in the past
      const now = new Date();
      const slotDateTime = new Date(`${date}T${slot}`);
      const isPast = slotDateTime <= now;

      return {
        time: slot,
        isAvailable: !isBlocked && !isBooked && !isPast,
        isBlocked,
        isBooked,
        isPast,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        slots: availableSlots,
        isAvailable: availableSlots.some((s) => s.isAvailable),
      },
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
