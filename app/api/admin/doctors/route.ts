import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { doctors, users, subscriptions, appointments, patients } from "@/lib/db/schema";
import { eq, desc, ilike, count, sql } from "drizzle-orm";
import { paginationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
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

    const { page, limit, search } = validation.data;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = undefined;
    if (search) {
      whereClause = ilike(doctors.fullName, `%${search}%`);
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(doctors)
      .where(whereClause);

    // Get doctors with user info
    const allDoctors = await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        slug: doctors.slug,
        fullName: doctors.fullName,
        specialty: doctors.specialty,
        phone: doctors.phone,
        clinicName: doctors.clinicName,
        subscriptionPlan: doctors.subscriptionPlan,
        isActive: doctors.isActive,
        createdAt: doctors.createdAt,
        userEmail: users.email,
        userIsActive: users.isActive,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(whereClause)
      .orderBy(desc(doctors.createdAt))
      .limit(limit)
      .offset(offset);

    // Get appointment and patient counts per doctor
    const doctorIds = allDoctors.map((d) => d.id);

    const formattedDoctors = await Promise.all(
      allDoctors.map(async (doc) => {
        const [appointmentCount] = await db
          .select({ count: count() })
          .from(appointments)
          .where(eq(appointments.doctorId, doc.id));

        const [patientCount] = await db
          .select({ count: count() })
          .from(patients)
          .where(eq(patients.createdByDoctorId, doc.id));

        return {
          id: doc.id,
          slug: doc.slug,
          fullName: doc.fullName,
          specialty: doc.specialty,
          phone: doc.phone,
          clinicName: doc.clinicName,
          subscriptionPlan: doc.subscriptionPlan,
          isActive: doc.isActive,
          createdAt: doc.createdAt,
          email: doc.userEmail,
          appointmentCount: appointmentCount?.count || 0,
          patientCount: patientCount?.count || 0,
        };
      })
    );

    // Get stats
    const [statsResult] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${doctors.isActive} = true)`,
        inactive: sql<number>`count(*) filter (where ${doctors.isActive} = false)`,
      })
      .from(doctors);

    const planCounts = await db
      .select({
        plan: doctors.subscriptionPlan,
        count: count(),
      })
      .from(doctors)
      .groupBy(doctors.subscriptionPlan);

    return NextResponse.json({
      success: true,
      data: formattedDoctors,
      stats: {
        total: statsResult?.total || 0,
        active: statsResult?.active || 0,
        inactive: statsResult?.inactive || 0,
        planBreakdown: planCounts,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
