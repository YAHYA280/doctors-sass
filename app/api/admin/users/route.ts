import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, doctors } from "@/lib/db/schema";
import { paginationSchema, userUpdateSchema, bulkOperationSchema } from "@/lib/validators";
import { eq, desc, ilike, or, count, and, sql } from "drizzle-orm";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

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
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validation = paginationSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { page, limit, search, sortBy, sortOrder } = validation.data;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(users.email, `%${search}%`)
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    // Get users with doctor info
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        doctor: {
          id: doctors.id,
          fullName: doctors.fullName,
          slug: doctors.slug,
          subscriptionPlan: doctors.subscriptionPlan,
        },
      })
      .from(users)
      .leftJoin(doctors, eq(users.id, doctors.userId))
      .where(whereClause)
      .orderBy(sortOrder === "desc" ? desc(users.createdAt) : users.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
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
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const validation = userUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update data" },
        { status: 400 }
      );
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = bulkOperationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid bulk operation data" },
        { status: 400 }
      );
    }

    const { userIds, action } = validation.data;

    // Prevent admin from performing bulk actions on themselves
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Cannot perform bulk actions on your own account" },
        { status: 400 }
      );
    }

    switch (action) {
      case "activate":
        await db
          .update(users)
          .set({ isActive: true, updatedAt: new Date() })
          .where(sql`${users.id} IN ${userIds}`);
        break;

      case "deactivate":
        await db
          .update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(sql`${users.id} IN ${userIds}`);
        break;

      case "delete":
        await db.delete(users).where(sql`${users.id} IN ${userIds}`);
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed for ${userIds.length} users`,
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
