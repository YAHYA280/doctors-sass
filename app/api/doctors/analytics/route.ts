import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE_SERVER, MOCK_ANALYTICS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE_SERVER) {
      return NextResponse.json({ success: true, data: MOCK_ANALYTICS });
    }

    // Real mode - check session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { appointments, patients } = await import("@/lib/db/schema");
    const { eq, and, gte, sql, count } = await import("drizzle-orm");

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overview stats
    const [appointmentStats] = await db
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')`,
        cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')`,
        pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending')`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      );

    // Get patient stats
    const [patientStats] = await db
      .select({
        total: count(),
        newThisMonth: sql<number>`count(*) filter (where ${patients.createdAt} >= ${startDate})`,
      })
      .from(patients)
      .where(eq(patients.createdByDoctorId, doctorId));

    // Calculate completion rate
    const totalNonPending = (appointmentStats?.completed || 0) +
                           (appointmentStats?.cancelled || 0);
    const completionRate = totalNonPending > 0
      ? ((appointmentStats?.completed || 0) / totalNonPending) * 100
      : 0;

    // Get appointments by day of week
    const appointmentsByDay = await db
      .select({
        day: sql<string>`to_char(${appointments.appointmentDate}::date, 'Day')`,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      )
      .groupBy(sql`to_char(${appointments.appointmentDate}::date, 'Day')`)
      .orderBy(sql`min(extract(dow from ${appointments.appointmentDate}::date))`);

    // Get appointments by status
    const appointmentsByStatus = await db
      .select({
        status: appointments.status,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      )
      .groupBy(appointments.status);

    // Get appointments by month
    const appointmentsByMonth = await db
      .select({
        month: sql<string>`to_char(${appointments.appointmentDate}::date, 'Mon')`,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      )
      .groupBy(sql`to_char(${appointments.appointmentDate}::date, 'Mon'), extract(month from ${appointments.appointmentDate}::date)`)
      .orderBy(sql`extract(month from ${appointments.appointmentDate}::date)`);

    // Get busiest time
    const [busiestTime] = await db
      .select({
        time: appointments.timeSlot,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      )
      .groupBy(appointments.timeSlot)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    // Get busiest day
    const [busiestDay] = await db
      .select({
        day: sql<string>`to_char(${appointments.appointmentDate}::date, 'Day')`,
        count: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          gte(appointments.appointmentDate, startDate.toISOString().split("T")[0])
        )
      )
      .groupBy(sql`to_char(${appointments.appointmentDate}::date, 'Day')`)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    // Calculate returning patient rate
    const returningPatients = await db
      .select({
        patientId: appointments.patientId,
        visitCount: count(),
      })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .groupBy(appointments.patientId)
      .having(sql`count(*) > 1`);

    const returningPatientRate = (patientStats?.total || 0) > 0
      ? (returningPatients.length / (patientStats?.total || 1)) * 100
      : 0;

    const analytics = {
      overview: {
        totalAppointments: appointmentStats?.total || 0,
        completedAppointments: appointmentStats?.completed || 0,
        cancelledAppointments: appointmentStats?.cancelled || 0,
        pendingAppointments: appointmentStats?.pending || 0,
        totalPatients: patientStats?.total || 0,
        newPatientsThisMonth: patientStats?.newThisMonth || 0,
        averageAppointmentsPerDay: days > 0 ? (appointmentStats?.total || 0) / days : 0,
        completionRate,
      },
      trends: {
        appointmentsByMonth: appointmentsByMonth.map((m) => ({
          month: m.month.trim(),
          count: m.count,
        })),
        appointmentsByDay: appointmentsByDay.map((d) => ({
          day: d.day.trim(),
          count: d.count,
        })),
        appointmentsByStatus: appointmentsByStatus.map((s) => ({
          status: s.status,
          count: s.count,
        })),
      },
      topMetrics: {
        busiestDay: busiestDay?.day?.trim() || "N/A",
        busiestTime: busiestTime?.time || "N/A",
        averageWaitTime: 0,
        returningPatientRate,
      },
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
