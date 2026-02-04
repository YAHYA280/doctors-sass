import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { supportTickets, ticketReplies, users } from "@/lib/db/schema";
import { eq, desc, count, and, or, ilike } from "drizzle-orm";
import { paginationSchema, ticketReplySchema } from "@/lib/validators";

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
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
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

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(supportTickets.subject, `%${search}%`),
          ilike(supportTickets.message, `%${search}%`)
        )
      );
    }
    if (params.status) {
      conditions.push(eq(supportTickets.status, params.status as any));
    }
    if (params.priority) {
      conditions.push(eq(supportTickets.priority, params.priority as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(supportTickets)
      .where(whereClause);

    // Get tickets with user info
    const tickets = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        message: supportTickets.message,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        resolvedAt: supportTickets.resolvedAt,
        user: {
          id: users.id,
          email: users.email,
        },
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(whereClause)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
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
    const { ticketId, status, priority, assignedTo } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === "resolved" || status === "closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update ticket" },
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
    const { ticketId, message } = body;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const validation = ticketReplySchema.safeParse({ message });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reply data" },
        { status: 400 }
      );
    }

    // Create reply
    const [newReply] = await db
      .insert(ticketReplies)
      .values({
        ticketId,
        userId: session.user.id,
        message: validation.data.message,
        isStaff: true,
      })
      .returning();

    // Update ticket status to in_progress if it was open
    await db
      .update(supportTickets)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supportTickets.id, ticketId),
          eq(supportTickets.status, "open")
        )
      );

    return NextResponse.json({
      success: true,
      data: newReply,
    });
  } catch (error) {
    console.error("Reply to ticket error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reply to ticket" },
      { status: 500 }
    );
  }
}
