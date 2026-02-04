import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE_SERVER, MOCK_PATIENTS } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE_SERVER) {
      let filteredPatients = [...MOCK_PATIENTS];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPatients = filteredPatients.filter(
          (p) =>
            p.fullName.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower) ||
            p.phone.includes(search)
        );
      }

      // Sort by created date descending
      filteredPatients.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = filteredPatients.length;
      const paginatedPatients = filteredPatients.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginatedPatients,
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
    const { patients } = await import("@/lib/db/schema");
    const { eq, desc, and, ilike, or, count } = await import("drizzle-orm");
    const { paginationSchema } = await import("@/lib/validators");

    const params = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
    };

    const validation = paginationSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { page: validPage, limit: validLimit, search: validSearch } = validation.data;
    const offset = (validPage - 1) * validLimit;

    const conditions = [eq(patients.createdByDoctorId, session.user.doctorId)];
    if (validSearch) {
      conditions.push(
        or(
          ilike(patients.fullName, `%${validSearch}%`),
          ilike(patients.email, `%${validSearch}%`),
          ilike(patients.phone, `%${validSearch}%`)
        )!
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(patients)
      .where(and(...conditions));

    // Get patients
    const patientList = await db.query.patients.findMany({
      where: and(...conditions),
      orderBy: [desc(patients.createdAt)],
      limit: validLimit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: patientList,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
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

    // Mock mode - just return success with the new patient
    if (IS_MOCK_MODE_SERVER) {
      const newPatient = {
        id: `patient-${Date.now()}`,
        ...body,
        createdByDoctorId: session.user.doctorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: newPatient,
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { patients, doctors } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { patientSchema } = await import("@/lib/validators");
    const { canAddPatient } = await import("@/constants/plans");

    const validation = patientSchema.safeParse(body);

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

    // Check patient limit based on subscription
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, session.user.doctorId),
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    if (!canAddPatient(doctor.subscriptionPlan, doctor.patientCountThisMonth || 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient limit reached for your subscription plan. Please upgrade to add more patients.",
        },
        { status: 403 }
      );
    }

    // Create patient
    const [newPatient] = await db
      .insert(patients)
      .values({
        ...validation.data,
        createdByDoctorId: session.user.doctorId,
      })
      .returning();

    // Increment patient count
    await db
      .update(doctors)
      .set({
        patientCountThisMonth: (doctor.patientCountThisMonth || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, session.user.doctorId));

    return NextResponse.json({
      success: true,
      data: newPatient,
    });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create patient" },
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
    const { patientId, ...updateData } = body;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - return updated patient
    if (IS_MOCK_MODE_SERVER) {
      const existingPatient = MOCK_PATIENTS.find((p) => p.id === patientId);
      if (!existingPatient) {
        return NextResponse.json(
          { success: false, error: "Patient not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...existingPatient,
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { patients } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { patientSchema } = await import("@/lib/validators");

    const validation = patientSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update data" },
        { status: 400 }
      );
    }

    // Verify the patient belongs to this doctor
    const existingPatient = await db.query.patients.findFirst({
      where: and(
        eq(patients.id, patientId),
        eq(patients.createdByDoctorId, session.user.doctorId)
      ),
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const [updatedPatient] = await db
      .update(patients)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, patientId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedPatient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update patient" },
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
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - just return success
    if (IS_MOCK_MODE_SERVER) {
      return NextResponse.json({
        success: true,
        message: "Patient deleted successfully",
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { patients } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    await db
      .delete(patients)
      .where(
        and(
          eq(patients.id, patientId),
          eq(patients.createdByDoctorId, session.user.doctorId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
