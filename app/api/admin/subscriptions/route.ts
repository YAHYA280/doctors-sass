import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subscriptions, doctors, users } from "@/lib/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
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

    const { page, limit } = validation.data;
    const offset = (page - 1) * limit;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(subscriptions);

    // Get stats
    const [statsResult] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')`,
        trialing: sql<number>`count(*) filter (where ${subscriptions.status} = 'trialing')`,
        cancelled: sql<number>`count(*) filter (where ${subscriptions.status} = 'cancelled')`,
      })
      .from(subscriptions);

    // Get subscriptions with doctor info
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        doctorId: subscriptions.doctorId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        createdAt: subscriptions.createdAt,
        doctorFullName: doctors.fullName,
        doctorSlug: doctors.slug,
        doctorDbId: doctors.id,
        userEmail: users.email,
      })
      .from(subscriptions)
      .innerJoin(doctors, eq(subscriptions.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform data to match frontend expected shape: doctor.user.email
    const formattedSubscriptions = allSubscriptions.map((sub) => ({
      id: sub.id,
      doctorId: sub.doctorId,
      plan: sub.plan,
      status: sub.status,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      createdAt: sub.createdAt,
      doctor: {
        id: sub.doctorDbId,
        fullName: sub.doctorFullName,
        slug: sub.doctorSlug,
        user: {
          email: sub.userEmail,
        },
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedSubscriptions,
      stats: {
        total: statsResult?.total || 0,
        active: statsResult?.active || 0,
        trialing: statsResult?.trialing || 0,
        cancelled: statsResult?.cancelled || 0,
        mrr: 0, // Would need Stripe integration for real MRR
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscriptionId, plan, status } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;

    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    if (!updatedSubscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Also update the doctor's subscription plan
    if (plan) {
      await db
        .update(doctors)
        .set({ subscriptionPlan: plan, updatedAt: new Date() })
        .where(eq(doctors.id, updatedSubscription.doctorId));
    }

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
