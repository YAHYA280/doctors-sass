import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE, MOCK_DOCTOR } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Return mock data if in mock mode
    if (IS_MOCK_MODE) {
      const now = new Date();
      const trialEnd = new Date(MOCK_DOCTOR.trialEndsAt);
      const diff = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

      return NextResponse.json({
        success: true,
        data: {
          ...MOCK_DOCTOR,
          daysRemaining,
          user: {
            email: MOCK_DOCTOR.email,
            createdAt: MOCK_DOCTOR.createdAt,
          },
          clinics: [{
            id: "clinic-001",
            name: MOCK_DOCTOR.clinicName,
            address: MOCK_DOCTOR.address,
            phone: MOCK_DOCTOR.phone,
            isMain: true,
          }],
          subscription: {
            plan: MOCK_DOCTOR.subscriptionPlan,
            status: MOCK_DOCTOR.subscriptionStatus,
          },
        },
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { doctors } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, session.user.doctorId),
      with: {
        user: {
          columns: {
            email: true,
            createdAt: true,
          },
        },
        clinics: true,
        subscription: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    let daysRemaining = null;
    if (doctor.subscriptionEnd) {
      const now = new Date();
      const end = new Date(doctor.subscriptionEnd);
      const diff = end.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...doctor,
        daysRemaining,
      },
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Mock mode - just return the updated data
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        success: true,
        data: {
          ...MOCK_DOCTOR,
          ...body,
          updatedAt: new Date(),
        },
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { doctors } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { doctorProfileSchema } = await import("@/lib/validators");

    const validation = doctorProfileSchema.safeParse(body);
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

    const [updatedDoctor] = await db
      .update(doctors)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, session.user.doctorId))
      .returning();

    if (!updatedDoctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
