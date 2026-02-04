import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE_SERVER, MOCK_AVAILABILITY, MOCK_BLOCKED_SLOTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE_SERVER) {
      return NextResponse.json({
        success: true,
        data: {
          availability: MOCK_AVAILABILITY,
          blockedSlots: MOCK_BLOCKED_SLOTS,
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
    const { availability, blockedSlots } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    const conditions = [eq(availability.doctorId, session.user.doctorId)];
    if (clinicId) {
      conditions.push(eq(availability.clinicId, clinicId));
    }

    const availabilityList = await db.query.availability.findMany({
      where: and(...conditions),
      orderBy: (availability, { asc }) => [asc(availability.dayOfWeek)],
    });

    const blockedSlotsList = await db.query.blockedSlots.findMany({
      where: eq(blockedSlots.doctorId, session.user.doctorId),
      orderBy: (blockedSlots, { asc }) => [asc(blockedSlots.date)],
    });

    return NextResponse.json({
      success: true,
      data: {
        availability: availabilityList,
        blockedSlots: blockedSlotsList,
      },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    // Mock mode - return success with mock data
    if (IS_MOCK_MODE_SERVER) {
      if (type === "availability") {
        const newAvailability = {
          id: `av-${Date.now()}`,
          doctorId: session.user.doctorId,
          ...body.data,
          createdAt: new Date(),
        };
        return NextResponse.json({
          success: true,
          data: newAvailability,
        });
      } else if (type === "blocked") {
        const newBlockedSlot = {
          id: `block-${Date.now()}`,
          doctorId: session.user.doctorId,
          ...body.data,
          createdAt: new Date(),
        };
        return NextResponse.json({
          success: true,
          data: newBlockedSlot,
        });
      }
      return NextResponse.json(
        { success: false, error: "Invalid type" },
        { status: 400 }
      );
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { availability, blockedSlots, doctors } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { availabilitySchema, blockedSlotSchema } = await import("@/lib/validators");
    const { triggerAvailabilityUpdated } = await import("@/services/pusher");
    const { getTimeSlots } = await import("@/lib/utils");

    if (type === "availability") {
      const validation = availabilitySchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Invalid availability data" },
          { status: 400 }
        );
      }

      // Check if availability already exists for this day
      const existingAvailability = await db.query.availability.findFirst({
        where: and(
          eq(availability.doctorId, session.user.doctorId),
          eq(availability.dayOfWeek, validation.data.dayOfWeek),
          validation.data.clinicId
            ? eq(availability.clinicId, validation.data.clinicId)
            : undefined
        ),
      });

      if (existingAvailability) {
        // Update existing
        const [updated] = await db
          .update(availability)
          .set({
            ...validation.data,
            updatedAt: new Date(),
          })
          .where(eq(availability.id, existingAvailability.id))
          .returning();

        return NextResponse.json({
          success: true,
          data: updated,
        });
      }

      // Create new
      const [newAvailability] = await db
        .insert(availability)
        .values({
          doctorId: session.user.doctorId,
          ...validation.data,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newAvailability,
      });
    } else if (type === "blocked") {
      const validation = blockedSlotSchema.safeParse(body.data);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Invalid blocked slot data" },
          { status: 400 }
        );
      }

      const [newBlockedSlot] = await db
        .insert(blockedSlots)
        .values({
          doctorId: session.user.doctorId,
          ...validation.data,
        })
        .returning();

      // Trigger real-time update
      const doctor = await db.query.doctors.findFirst({
        where: eq(doctors.id, session.user.doctorId),
      });

      if (doctor) {
        const slots = getTimeSlots(
          validation.data.startTime,
          validation.data.endTime,
          30
        ).map((time) => ({ time, isAvailable: false }));

        await triggerAvailabilityUpdated(doctor.slug, {
          date: validation.data.date,
          slots,
        });
      }

      return NextResponse.json({
        success: true,
        data: newBlockedSlot,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create availability error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: "ID and type are required" },
        { status: 400 }
      );
    }

    // Mock mode - return success
    if (IS_MOCK_MODE_SERVER) {
      return NextResponse.json({
        success: true,
        message: "Deleted successfully",
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { availability, blockedSlots } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    if (type === "availability") {
      await db
        .delete(availability)
        .where(
          and(
            eq(availability.id, id),
            eq(availability.doctorId, session.user.doctorId)
          )
        );
    } else if (type === "blocked") {
      await db
        .delete(blockedSlots)
        .where(
          and(
            eq(blockedSlots.id, id),
            eq(blockedSlots.doctorId, session.user.doctorId)
          )
        );
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete availability error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}
