import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, doctors, appointments, subscriptions, supportTickets } from "@/lib/db/schema";
import { count, eq, gte, and, sql } from "drizzle-orm";
import { getMonthlyRevenue, getRevenueByMonth } from "@/services/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get total users
    const [{ totalUsers }] = await db
      .select({ totalUsers: count() })
      .from(users);

    // Get total doctors
    const [{ totalDoctors }] = await db
      .select({ totalDoctors: count() })
      .from(doctors);

    // Get active subscriptions
    const [{ activeSubscriptions }] = await db
      .select({ activeSubscriptions: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    // Get new users this month
    const [{ newUsersThisMonth }] = await db
      .select({ newUsersThisMonth: count() })
      .from(users)
      .where(gte(users.createdAt, startOfMonth));

    // Get new users last month
    const [{ newUsersLastMonth }] = await db
      .select({ newUsersLastMonth: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, startOfLastMonth),
          sql`${users.createdAt} < ${startOfMonth}`
        )
      );

    // Calculate user growth percentage
    const userGrowth =
      newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : 100;

    // Get total appointments
    const [{ totalAppointments }] = await db
      .select({ totalAppointments: count() })
      .from(appointments);

    // Get open support tickets
    const [{ openTickets }] = await db
      .select({ openTickets: count() })
      .from(supportTickets)
      .where(eq(supportTickets.status, "open"));

    // Get subscription breakdown
    const subscriptionBreakdown = await db
      .select({
        plan: doctors.subscriptionPlan,
        count: count(),
      })
      .from(doctors)
      .groupBy(doctors.subscriptionPlan);

    // Get monthly revenue
    let monthlyRevenue = 0;
    let revenueHistory: { month: string; revenue: number }[] = [];

    try {
      monthlyRevenue = await getMonthlyRevenue();
      revenueHistory = await getRevenueByMonth(6);
    } catch (error) {
      console.log("Stripe not configured, skipping revenue data");
    }

    // Get user registration trends (last 7 days)
    const userTrends = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Get appointment status breakdown
    const appointmentStats = await db
      .select({
        status: appointments.status,
        count: count(),
      })
      .from(appointments)
      .groupBy(appointments.status);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDoctors,
          activeSubscriptions,
          monthlyRevenue,
          totalAppointments,
          openTickets,
          userGrowth,
        },
        subscriptionBreakdown,
        revenueHistory,
        userTrends,
        appointmentStats,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
